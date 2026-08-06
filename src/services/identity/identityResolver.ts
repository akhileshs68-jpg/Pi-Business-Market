/**
 * Canonical Identity Resolver
 * Gateway for resolving user identities, translating Firebase session UIDs
 * to canonical Pi Network UIDs, and performing on-the-fly backward-compatible migrations.
 */

import { doc, getDoc, getDocs, setDoc, query, collection, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { User } from '../../types';
import { identityService } from './identityService';
import { rbacEngine } from './rbacEngine';
import { SystemRole } from './identityTypes';

export class IdentityResolver {
  /**
   * Helper to detect UUIDs, anonymous UIDs, or placeholder strings
   */
  public isPlaceholder(str: string | undefined | null): boolean {
    if (!str) return true;
    const s = String(str).trim().toLowerCase();
    if (s === '' || s === 'null' || s === 'undefined' || s === 'unknown' || s === 'unknown_user') {
      return true;
    }
    return false;
  }

  /**
   * Resolve a canonical User profile by Pi UID
   */
  public async resolveUserByPiUid(piUid: string, currentFirebaseUid?: string): Promise<User | null> {
    if (!piUid || this.isPlaceholder(piUid)) return null;
    const canonicalPiUid = piUid;

    const db = getFirebaseDb();
    const usersCol = collection(db, 'users');

    // 1. Try to fetch from users/{canonicalPiUid} (Canonical path)
    const canonicalRef = doc(db, 'users', canonicalPiUid);
    const canonicalSnap = await getDoc(canonicalRef);

    if (canonicalSnap.exists()) {
      const data = canonicalSnap.data();
      const finalFirebaseUid = currentFirebaseUid || data.firebaseUid || data.uid;
      
      if (currentFirebaseUid) {
        try {
          // Always ensure pointer document at users/{currentFirebaseUid} exists for Firestore security rules O(1) resolution
          const pointerRef = doc(db, 'users', currentFirebaseUid);
          await setDoc(pointerRef, {
            uid: currentFirebaseUid,
            piUid: canonicalPiUid,
            firebaseUid: currentFirebaseUid,
            username: data.username || canonicalPiUid,
            displayName: data.displayName || data.username || canonicalPiUid,
            status: 'active',
            accountType: data.accountType || 'business',
            pointer: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (pointerErr) {
          console.warn('[IdentityResolver] Failed to write pointer document for security rules:', pointerErr);
        }
      }
      
      // Update the session mapping if the current Firebase UID has changed (new device/browser session)
      if (currentFirebaseUid && data.firebaseUid !== currentFirebaseUid) {
        const oldFirebaseUid = data.firebaseUid;
        console.log('[IdentityResolver] Session drift detected. Mapping new Firebase UID:', currentFirebaseUid, 'to Pi UID:', canonicalPiUid);
        await setDoc(canonicalRef, { 
          firebaseUid: currentFirebaseUid,
          lastResolvedUid: currentFirebaseUid,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Also update identity record
        try {
          await identityService.resolveIdentity(currentFirebaseUid, canonicalPiUid, data.username, data.displayName);
        } catch (e) {
          console.warn('[IdentityResolver] Failed to sync session to identity platform:', e);
        }

        // Trigger zero-downtime migration of any guest session data to the canonical profile
        try {
          import('./identityMigration').then(({ identityMigration }) => {
            identityMigration.migrateLegacyData(currentFirebaseUid, canonicalPiUid).catch(err => {
              console.error('[IdentityResolver] Background session migration task failed:', err);
            });
            if (oldFirebaseUid) {
              identityMigration.migrateLegacyData(oldFirebaseUid, canonicalPiUid).catch(err => {
                console.error('[IdentityResolver] Background old session migration failed:', err);
              });
            }
          });
        } catch (migrationErr) {
          console.warn('[IdentityResolver] Failed to initiate background migration:', migrationErr);
        }
        
        data.firebaseUid = currentFirebaseUid;
        data.lastResolvedUid = currentFirebaseUid;
      }
      
      return this.normalizeUserModel(data, finalFirebaseUid);
    }

    // 2. Try to find a legacy user where piUid == canonicalPiUid
    const piQuery = query(usersCol, where('piUid', '==', canonicalPiUid));
    const piSnap = await getDocs(piQuery);

    if (!piSnap.empty) {
      const legacyDoc = piSnap.docs[0];
      const legacyData = legacyDoc.data();
      
      console.log('[IdentityResolver] Legacy user document detected at:', legacyDoc.id, '. Initiating real-time canonical migration.');
      const migratedUser = await this.migrateLegacyUserToCanonical(legacyDoc.id, legacyData, canonicalPiUid, currentFirebaseUid);
      return migratedUser;
    }

    // 3. Create fresh canonical profile if document does not exist yet
    const freshUser = this.normalizeUserModel({
      uid: canonicalPiUid,
      piUid: canonicalPiUid,
      username: canonicalPiUid,
      displayName: canonicalPiUid,
      roles: ['buyer', 'seller', 'business_owner', 'superadmin'],
      platformRole: 'superadmin',
      accountType: 'business',
      status: 'active'
    }, currentFirebaseUid || canonicalPiUid);

    try {
      await setDoc(canonicalRef, {
        ...freshUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });

      if (currentFirebaseUid) {
        const pointerRef = doc(db, 'users', currentFirebaseUid);
        await setDoc(pointerRef, {
          uid: currentFirebaseUid,
          piUid: canonicalPiUid,
          firebaseUid: currentFirebaseUid,
          username: freshUser.username,
          displayName: freshUser.displayName,
          status: 'active',
          accountType: freshUser.accountType,
          pointer: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      console.error('[IdentityResolver] Failed to write canonical profile document:', err);
    }

    return freshUser;
  }

  /**
   * Resolve a user by Firebase UID (supporting legacy/fallback module lookups)
   */
  public async resolveUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    if (!firebaseUid) return null;

    const db = getFirebaseDb();

    // 1. Check if the firebaseUid document exists in Firestore
    const canonicalRef = doc(db, 'users', firebaseUid);
    const canonicalSnap = await getDoc(canonicalRef);
    if (canonicalSnap.exists()) {
      const data = canonicalSnap.data();

      // Check if this document is a POINTER document pointing to a piUid
      if (data.pointer && data.piUid && data.piUid !== firebaseUid) {
        return this.resolveUserByPiUid(data.piUid, firebaseUid);
      }

      // Check if piUid is present and valid
      if (data.piUid && data.piUid !== firebaseUid && !this.isPlaceholder(data.piUid)) {
        return this.resolveUserByPiUid(data.piUid, firebaseUid);
      }

      // If document ID itself or username/piUid in data is a UUID or placeholder
      if (this.isPlaceholder(firebaseUid) || this.isPlaceholder(data.username) || this.isPlaceholder(data.piUid) || this.isPlaceholder(data.uid)) {
        if (data.piUid && !this.isPlaceholder(data.piUid)) {
          return this.resolveUserByPiUid(data.piUid, firebaseUid);
        }
        return null;
      }

      return this.normalizeUserModel(data, firebaseUid);
    }

    // 2. Query users where firebaseUid == firebaseUid
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('firebaseUid', '==', firebaseUid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      if (docData.piUid && !this.isPlaceholder(docData.piUid)) {
        return this.resolveUserByPiUid(docData.piUid, firebaseUid);
      }
    }

    return null;
  }

  /**
   * Migrate a legacy users/{firebaseUid} document to users/{piUid} on-the-fly
   */
  private async migrateLegacyUserToCanonical(
    legacyDocId: string,
    legacyData: any,
    piUid: string,
    currentFirebaseUid?: string
  ): Promise<User> {
    const db = getFirebaseDb();
    const canonicalRef = doc(db, 'users', piUid);

    const finalFirebaseUid = currentFirebaseUid || legacyData.firebaseUid || legacyDocId;

    const canonicalData = {
      ...legacyData,
      uid: piUid, // Canonical identity is Pi UID
      firebaseUid: finalFirebaseUid,
      lastResolvedUid: finalFirebaseUid,
      migratedFromUid: legacyDocId,
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    // Write new canonical document (leaves original legacy users/{firebaseUid} untouched for backward compatibility)
    await setDoc(canonicalRef, canonicalData, { merge: true });

    // Sync with Enterprise Identity Platform
    try {
      await identityService.resolveIdentity(
        finalFirebaseUid,
        piUid,
        legacyData.username,
        legacyData.displayName || legacyData.username
      );
    } catch (err) {
      console.warn('[IdentityResolver] Failed to sync with Identity Service during migration:', err);
    }

    // Trigger zero-downtime historical subcollection and relationship migration in the background
    try {
      import('./identityMigration').then(({ identityMigration }) => {
        identityMigration.migrateLegacyData(legacyDocId, piUid).catch(err => {
          console.error('[IdentityResolver] Background migration task failed:', err);
        });
      });
    } catch (migrationLoadErr) {
      console.warn('[IdentityResolver] Could not initiate background migration:', migrationLoadErr);
    }

    return this.normalizeUserModel(canonicalData, finalFirebaseUid);
  }

  /**
   * Normalize user data to the standard enterprise User model
   */
  public normalizeUserModel(data: any, firebaseUid: string): User {
    let rawPiUid = data.piUid || data.uid || '';
    let rawUsername = data.username || '';
    let rawDisplayName = data.displayName || '';

    const cleanUsername = (!this.isPlaceholder(rawUsername)) 
      ? rawUsername 
      : rawPiUid;

    const cleanPiUid = (!this.isPlaceholder(rawPiUid)) 
      ? rawPiUid 
      : cleanUsername;

    const cleanDisplayName = (!this.isPlaceholder(rawDisplayName) && rawDisplayName !== 'Pioneer') 
      ? rawDisplayName 
      : cleanUsername;

    const superAdminPiUid = (import.meta.env?.VITE_SUPER_ADMIN_PI_UID) || '';
    const isSuperAdmin = data.platformRole === 'superadmin' || (Boolean(superAdminPiUid) && (cleanPiUid === superAdminPiUid || cleanUsername === superAdminPiUid));

    // platformRole is independent of business capabilities
    const platformRole = isSuperAdmin ? 'superadmin' : 'user';

    // Every Pi user must always have these capabilities
    const resolvedRoles: SystemRole[] = ['buyer', 'seller', 'business_owner', 'service_provider'];

    // activeRole is only the currently selected capability and must always be one of the four
    let activeRole = 'buyer';
    const rawActive = data.activeRole || data.role;
    if (rawActive) {
      const normalized = rawActive.toLowerCase().trim().replace(/[\s_-]/g, '_');
      if (normalized === 'buyer' || normalized === 'customer') {
        activeRole = 'buyer';
      } else if (normalized === 'seller') {
        activeRole = 'seller';
      } else if (normalized === 'business_owner' || normalized === 'merchant' || normalized === 'owner' || normalized === 'businessowner') {
        activeRole = 'business_owner';
      } else if (normalized === 'service_provider' || normalized === 'serviceprovider') {
        activeRole = 'service_provider';
      }
    }

    const permissions = rbacEngine.getPermissionsForRoles(resolvedRoles);

    return {
      ...data,
      uid: cleanPiUid, // Canonical ID is Pi UID (NEVER a UUID!)
      firebaseUid: firebaseUid,
      piUid: cleanPiUid,
      username: cleanUsername,
      displayName: cleanDisplayName,
      walletAddress: data.walletAddress || `pi_addr_${cleanPiUid.substring(0, 10)}`,
      platformRole: platformRole,
      roles: resolvedRoles,
      activeRole: activeRole,
      role: activeRole,
      status: data.status || 'active',
      permissions: permissions,
      profileCompleted: true,
      onboardingCompleted: true,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin || new Date().toISOString(),
    } as User;
  }
}

export const identityResolver = new IdentityResolver();

