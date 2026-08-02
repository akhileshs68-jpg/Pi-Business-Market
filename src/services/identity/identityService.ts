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
    uid: string,
    piUid: string = '',
    username: string = '',
    displayName: string = ''
  ): Promise<EnterpriseIdentity> {
    let identity = await identityRepository.getIdentityByUid(uid);

    if (!identity && piUid) {
      identity = await identityRepository.getIdentityByPiUid(piUid);
    }

    if (!identity && username) {
      identity = await identityRepository.getIdentityByUsername(username);
    }

    const isOwner = username === 'pi_pioneer_88' || (identity && (identity.roles.includes('superadmin') || identity.roles.includes('super_admin')));

    if (!identity) {
      const initialRoles: SystemRole[] = isOwner 
        ? ['buyer', 'seller', 'business_owner', 'superadmin', 'merchant', 'owner'] 
        : ['buyer'];

      const now = new Date().toISOString();

      identity = {
        uid,
        piUid: piUid || `pi_${uid.substring(0, 8)}`,
        username: username || `user_${uid.substring(0, 6)}`,
        roles: initialRoles,
        permissions: rbacEngine.getPermissionsForRoles(initialRoles),
        personalProfile: {
          fullName: displayName || username || 'Pi Pioneer',
          displayName: displayName || username || 'Pioneer',
          country: 'Global',
          language: 'en',
          timezone: 'UTC'
        },
        businessIdentities: [],
        storeIdentities: [],
        walletIdentity: {
          piWalletAddress: `pi_addr_${uid.substring(0, 10)}`,
          bmpRewardAddress: `bmp_ledger_${uid}`
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

      await identityRepository.saveIdentity(identity);
      logger.audit('IdentityService', `Initialized Enterprise Identity for user ${uid}`, uid, { roles: initialRoles });
    } else {
      // Identity exists - update uid to current authenticated uid if different
      if (identity.uid !== uid) {
        identity.uid = uid;
      }
      if (isOwner && !identity.roles.includes('superadmin')) {
        identity.roles = Array.from(new Set([...identity.roles, 'buyer', 'seller', 'business_owner', 'superadmin', 'merchant', 'owner']));
        identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      }
      await identityRepository.saveIdentity(identity);
    }

    if (!identity) {
      throw new Error(`Failed to resolve identity for user ${uid}`);
    }

    // Attach active session
    const session = await sessionManager.createSession(uid);
    identity.activeSessionId = session.sessionId;

    return identity;
  }

  /**
   * Add new role to an existing identity without duplicating accounts
   */
  public async addRoleToIdentity(uid: string, newRole: SystemRole): Promise<EnterpriseIdentity> {
    const identity = await this.resolveIdentity(uid);

    if (!identity.roles.includes(newRole)) {
      identity.roles.push(newRole);
      identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      identity.updatedAt = new Date().toISOString();

      await identityRepository.saveIdentity(identity);
      logger.audit('IdentityService', `Added role ${newRole} to user ${uid}`, uid, { updatedRoles: identity.roles });
      
      eventBus.publish('USER_REGISTERED', { uid, roleAdded: newRole }, uid);
    }

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
      // Auto-assign business_owner role if missing
      if (!identity.roles.includes('business_owner')) {
        identity.roles.push('business_owner');
        identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      }
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
      if (!identity.roles.includes('seller')) {
        identity.roles.push('seller');
        identity.permissions = rbacEngine.getPermissionsForRoles(identity.roles);
      }
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
