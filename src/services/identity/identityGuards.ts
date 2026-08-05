/**
 * Unified Identity Guards & RBAC Utilities
 * Provides type-safe guards for checking system roles, multi-roles, and platform permissions.
 */

import { User } from '../../types';
import { SystemRole, Permission } from './identityTypes';
import { rbacEngine } from './rbacEngine';

export class IdentityGuards {
  /**
   * Check if a user possesses a specific role
   */
  public static hasRole(user: User | null | undefined, role: SystemRole): boolean {
    if (!user) return false;
    const roles = (user.roles || [user.platformRole]) as SystemRole[];
    return rbacEngine.hasRole(roles, [role]);
  }

  /**
   * Check if a user possesses any of the specified roles
   */
  public static hasAnyRole(user: User | null | undefined, targetRoles: SystemRole[]): boolean {
    if (!user) return false;
    const roles = (user.roles || [user.platformRole]) as SystemRole[];
    return rbacEngine.hasRole(roles, targetRoles);
  }

  /**
   * Check if a user has a specific platform permission
   */
  public static hasPermission(user: User | null | undefined, permission: Permission): boolean {
    if (!user) return false;
    const roles = (user.roles || [user.platformRole]) as SystemRole[];
    return rbacEngine.hasPermission(roles, permission);
  }

  /**
   * Check if a user is a platform super administrator
   */
  public static isSuperAdmin(user: User | null | undefined): boolean {
    if (!user) return false;
    const roles = (user.roles || [user.platformRole]) as SystemRole[];
    return roles.includes('superadmin') || roles.includes('super_admin');
  }

  /**
   * Check if a user is an active merchant or store owner
   */
  public static isMerchant(user: User | null | undefined): boolean {
    return this.hasAnyRole(user, ['merchant', 'seller', 'business_owner']);
  }

  /**
   * Check if a user is a registered service provider
   */
  public static isServiceProvider(user: User | null | undefined): boolean {
    return this.hasRole(user, 'service_provider');
  }
}
