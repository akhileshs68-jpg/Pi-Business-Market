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
      
      // Update the session mapping if the current Firebase UID has changed (new device/browser session)
      if (currentFirebaseUid && data.firebaseUid !== currentFirebaseUid) {
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

    return this.normalizeUserModel(canonicalData, finalFirebaseUid);
  }

  /**
   * Normalize user data to the standard enterprise User model
   */
  public normalizeUserModel(data: any, firebaseUid: string): User {
    const piUid = data.piUid || data.uid;
    const isOwner = data.username === 'pi_pioneer_88' || data.roles?.includes('superadmin') || data.roles?.includes('super_admin');

    // Retrieve SUPER_ADMIN_PI_UID configuration
    const superAdminPiUid = (import.meta.env?.VITE_SUPER_ADMIN_PI_UID) || 'mock_pi_uid_123';
    const isSuperAdmin = piUid === superAdminPiUid || isOwner;

    // Supported multi-roles
    const resolvedRoles: SystemRole[] = isSuperAdmin
      ? ['superadmin', 'buyer', 'seller', 'business_owner', 'merchant', 'service_provider']
      : (data.roles || ['buyer']);

    const platformRole = isSuperAdmin ? 'superadmin' : (resolvedRoles[0] || 'buyer');
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
