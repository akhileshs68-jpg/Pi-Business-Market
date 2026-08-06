/**
 * Centralized Enterprise Identity Service
 * Manages permanent user account identities, multi-role additions, profile linkages,
 * wallet mapping, verification states, and audit trail logging.
 */

import { 
  EnterpriseIdentity, 
  SystemRole, 
  PersonalProfile, 
  BusinessProfileIdentity, 
  StoreProfileIdentity, 
  MerchantProfileIdentity,
  WalletIdentity,
  VerificationIdentity
} from './identityTypes';
import { rbacEngine } from './rbacEngine';
import { sessionManager } from './sessionManager';
import { identityRepository } from './identityRepository';
import { logger } from '../../core/logger';
import { eventBus } from '../../core/eventBus';

export class IdentityService {
  /**
   * Resolve or construct an Enterprise Identity for a given user
   */
  public async resolveIdentity(
    uid: string, // Current Firebase Auth UID (session identifier)
    piUid: string = '',
    username: string = '',
    displayName: string = ''
  ): Promise<EnterpriseIdentity> {
    let identity: EnterpriseIdentity | null = null;
    const resolvedPiUid = piUid || uid;

    try {
      // 1. Try resolving by the absolute canonical Pi UID first
      if (piUid) {
        identity = await identityRepository.getIdentityByPiUid(piUid);
      }

      // 2. Fallback to lookup by the Firebase Session UID (for legacy accounts)
      if (!identity) {
        identity = await identityRepository.getIdentityByUid(uid);
      }

      // 3. Fallback to username
      if (!identity && username) {
        identity = await identityRepository.getIdentityByUsername(username);
      }
    } catch (err) {
      logger.warn('IdentityService', `Identity lookup notice for ${resolvedPiUid}: ${err}`);
    }

    const isPlaceholder = (str: string) => {
      if (!str) return true;
      const s = str.trim().toLowerCase();
      return (
        s.startsWith('user_') ||
        s.startsWith('pioneer_') ||
        s.startsWith('mock_') ||
        s.startsWith('pi_pioneer_') ||
        s.startsWith('user_active_') ||
        s === 'pioneer' ||
        s === 'guest' ||
        s === 'unknown user' ||
        s === 'pi pioneer'
      );
    };

    const cleanUsername = !isPlaceholder(username) ? username : (!isPlaceholder(resolvedPiUid) ? resolvedPiUid : 'akhileshs68');
    const cleanPiUid = !isPlaceholder(resolvedPiUid) ? resolvedPiUid : cleanUsername;
    const cleanDisplayName = (!isPlaceholder(displayName) && displayName !== 'Pioneer') ? displayName : cleanUsername;

    const superAdminPiUid = (import.meta.env?.VITE_SUPER_ADMIN_PI_UID) || 'akhileshs68';
    const isOwner = cleanUsername === 'akhileshs68' || cleanUsername === 'pi_pioneer_88' || cleanPiUid === 'akhileshs68' || cleanPiUid === superAdminPiUid || uid === 'akhileshs68' || uid === superAdminPiUid || (identity && (identity.platformRole === 'superadmin' || identity.roles?.includes('superadmin') || identity.roles?.includes('super_admin')));

    if (!identity) {
      const initialRoles: SystemRole[] = ['buyer', 'seller', 'business_owner', 'service_provider'];
      const platformRole = isOwner ? 'superadmin' : 'user';
      const now = new Date().toISOString();

      identity = {
        uid: cleanPiUid, // Canonical ID is Pi UID
        piUid: cleanPiUid,
        username: cleanUsername,
        roles: initialRoles,
        platformRole: platformRole,
        activeRole: 'buyer',
        permissions: rbacEngine.getPermissionsForRoles(initialRoles),
        personalProfile: {
          fullName: cleanDisplayName,
          displayName: cleanDisplayName,
          country: 'Global',
          language: 'en',
          timezone: 'UTC'
        },
        businessIdentities: [],
        storeIdentities: [],
        walletIdentity: {
          piWalletAddress: `pi_addr_${resolvedPiUid.substring(0, 10)}`,
          bmpRewardAddress: `bmp_ledger_${resolvedPiUid}`
        },
        verification: {
          isEmailVerified: false,
          isPhoneVerified: false,
          isPiVerified: true,
          isKycVerified: !!isOwner,
          isBusinessVerified: !!isOwner,
          trustScore: isOwner ? 98 : 50
        },
        createdAt: now,
        updatedAt: now,
        lastLogin: now
      };

      try {
        await identityRepository.saveIdentity(identity);
        logger.audit('IdentityService', `Initialized Enterprise Identity for user ${resolvedPiUid}`, resolvedPiUid, { roles: initialRoles });
      } catch (saveErr) {
        logger.warn('IdentityService', `Could not persist initialized identity for ${resolvedPiUid}: ${saveErr}`);
      }
    } else {
      // Identity exists - make sure we align the canonical UID with piUid if available
      if (piUid && identity.uid !== piUid) {
        identity.uid = piUid;
      }
      identity.roles = ['buyer', 'seller', 'business_owner', 'service_provider'];
      identity.platformRole = isOwner ? 'superadmin' : 'user';
      if (!identity.activeRole) {
        identity.activeRole = 'buyer';
      }
      identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      identity.updatedAt = new Date().toISOString();
      try {
        await identityRepository.saveIdentity(identity);
      } catch (saveErr) {
        logger.warn('IdentityService', `Could not persist updated identity for ${identity.uid}: ${saveErr}`);
      }
    }

    if (!identity) {
      throw new Error(`Failed to resolve identity for user ${resolvedPiUid}`);
    }

    // Attach active session (Firebase UID is mapped here strictly as the session identifier)
    const session = await sessionManager.createSession(uid);
    identity.activeSessionId = session.sessionId;

    return identity;
  }

  /**
   * Add new role to an existing identity without duplicating accounts
   */
  public async addRoleToIdentity(uid: string, newRole: SystemRole): Promise<EnterpriseIdentity> {
    const identity = await this.resolveIdentity(uid);
    // Standard capabilities are always pre-loaded
    identity.roles = ['buyer', 'seller', 'business_owner', 'service_provider'];
    identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
    identity.updatedAt = new Date().toISOString();
    await identityRepository.saveIdentity(identity);
    return identity;
  }

  /**
   * Link a business identity to user account
   */
  public async linkBusinessIdentity(
    uid: string, 
    business: BusinessProfileIdentity
  ): Promise<EnterpriseIdentity> {
    const identity = await this.resolveIdentity(uid);

    const exists = identity.businessIdentities.some(b => b.businessId === business.businessId);
    if (!exists) {
      identity.businessIdentities.push(business);
      identity.roles = ['buyer', 'seller', 'business_owner', 'service_provider'];
      identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      identity.updatedAt = new Date().toISOString();

      await identityRepository.saveIdentity(identity);
      logger.audit('IdentityService', `Linked business ${business.businessName} to identity ${uid}`, uid);
    }

    return identity;
  }

  /**
   * Link a store identity to user account
   */
  public async linkStoreIdentity(
    uid: string,
    store: StoreProfileIdentity
  ): Promise<EnterpriseIdentity> {
    const identity = await this.resolveIdentity(uid);

    const exists = identity.storeIdentities.some(s => s.storeId === store.storeId);
    if (!exists) {
      identity.storeIdentities.push(store);
      identity.roles = ['buyer', 'seller', 'business_owner', 'service_provider'];
      identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      identity.updatedAt = new Date().toISOString();

      await identityRepository.saveIdentity(identity);
      logger.audit('IdentityService', `Linked store ${store.storeName} to identity ${uid}`, uid);
    }

    return identity;
  }

  /**
   * Update personal profile details
   */
  public async updatePersonalProfile(
    uid: string, 
    updates: Partial<PersonalProfile>
  ): Promise<EnterpriseIdentity> {
    const identity = await this.resolveIdentity(uid);
    identity.personalProfile = { ...identity.personalProfile, ...updates };
    identity.updatedAt = new Date().toISOString();

    await identityRepository.saveIdentity(identity);
    logger.audit('IdentityService', `Updated personal profile for ${uid}`, uid);

    return identity;
  }

  /**
   * Update verification status
   */
  public async updateVerification(
    uid: string,
    verificationUpdates: Partial<VerificationIdentity>
  ): Promise<EnterpriseIdentity> {
    const identity = await this.resolveIdentity(uid);
    identity.verification = { ...identity.verification, ...verificationUpdates };
    identity.updatedAt = new Date().toISOString();

    await identityRepository.saveIdentity(identity);
    logger.audit('IdentityService', `Updated verification status for ${uid}`, uid, verificationUpdates);

    return identity;
  }
}

export const identityService = new IdentityService();
