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
   * Resolve a canonical User profile by Pi UID
   */
  public async resolveUserByPiUid(piUid: string, currentFirebaseUid?: string): Promise<User | null> {
    if (!piUid) return null;

    const db = getFirebaseDb();
    const usersCol = collection(db, 'users');

    // 1. Try to fetch from users/{piUid} (Canonical path)
    const canonicalRef = doc(db, 'users', piUid);
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
            piUid: piUid,
            firebaseUid: currentFirebaseUid,
            username: data.username,
            displayName: data.displayName || data.username,
            status: 'active',
            accountType: data.accountType || 'individual',
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
        console.log('[IdentityResolver] Session drift detected. Mapping new Firebase UID:', currentFirebaseUid, 'to Pi UID:', piUid);
        await setDoc(canonicalRef, { 
          firebaseUid: currentFirebaseUid,
          lastResolvedUid: currentFirebaseUid,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Also update identity record
        try {
          await identityService.resolveIdentity(currentFirebaseUid, piUid, data.username, data.displayName);
        } catch (e) {
          console.warn('[IdentityResolver] Failed to sync session to identity platform:', e);
        }

        // Trigger zero-downtime migration of any guest session data to the canonical profile
        try {
          import('./identityMigration').then(({ identityMigration }) => {
            identityMigration.migrateLegacyData(currentFirebaseUid, piUid).catch(err => {
              console.error('[IdentityResolver] Background session migration task failed:', err);
            });
            if (oldFirebaseUid) {
              identityMigration.migrateLegacyData(oldFirebaseUid, piUid).catch(err => {
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

    // 2. Try to find a legacy user where piUid == piUid (e.g. users/{firebaseUid})
    const piQuery = query(usersCol, where('piUid', '==', piUid));
    const piSnap = await getDocs(piQuery);

    if (!piSnap.empty) {
      const legacyDoc = piSnap.docs[0];
      const legacyData = legacyDoc.data();
      
      console.log('[IdentityResolver] Legacy user document detected at:', legacyDoc.id, '. Initiating real-time canonical migration.');
      const migratedUser = await this.migrateLegacyUserToCanonical(legacyDoc.id, legacyData, piUid, currentFirebaseUid);
      return migratedUser;
    }

    return null;
  }

  /**
   * Resolve a user by Firebase UID (supporting legacy/fallback module lookups)
   */
  public async resolveUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    if (!firebaseUid) return null;

    const db = getFirebaseDb();

    // 1. Check if the firebaseUid is actually a piUid and a canonical document exists
    const canonicalRef = doc(db, 'users', firebaseUid);
    const canonicalSnap = await getDoc(canonicalRef);
    if (canonicalSnap.exists()) {
      const data = canonicalSnap.data();
      return this.normalizeUserModel(data, firebaseUid);
    }

    // 2. Otherwise, look for legacy users/{firebaseUid}
    const legacyRef = doc(db, 'users', firebaseUid);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const legacyData = legacySnap.data();
      const piUid = legacyData.piUid;
      if (piUid) {
        return this.resolveUserByPiUid(piUid, firebaseUid);
      } else {
        return this.normalizeUserModel(legacyData, firebaseUid);
      }
    }

    // 3. Fallback: query users where firebaseUid == firebaseUid
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('firebaseUid', '==', firebaseUid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      const piUid = docData.piUid;
      if (piUid) {
        return this.resolveUserByPiUid(piUid, firebaseUid);
      }
      return this.normalizeUserModel(docData, firebaseUid);
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
    const piUid = data.piUid || data.uid;
    const isOwner = data.username === 'pi_pioneer_88' || data.roles?.includes('superadmin') || data.roles?.includes('super_admin') || data.platformRole === 'superadmin';

    // Retrieve SUPER_ADMIN_PI_UID configuration
    const superAdminPiUid = (import.meta.env?.VITE_SUPER_ADMIN_PI_UID) || 'akhileshs68';
    const isSuperAdmin = piUid === 'akhileshs68' || piUid === superAdminPiUid || isOwner;

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
      uid: piUid, // Canonical ID is Pi UID
      firebaseUid: firebaseUid,
      piUid: piUid,
      username: data.username || `user_${piUid.substring(0, 6)}`,
      displayName: data.displayName || data.username || 'Pi Pioneer',
      walletAddress: data.walletAddress || `pi_addr_${piUid.substring(0, 10)}`,
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
