/**
 * Role-Based Access Control (RBAC) Engine
 * Manages system roles, granular permissions, and dynamic permission resolution.
 */

import { SystemRole, Permission } from './identityTypes';

const ROLE_PERMISSIONS_MAP: Record<SystemRole, Permission[]> = {
  superadmin: [
    'manage:platform_settings',
    'manage:users',
    'manage:businesses',
    'manage:stores',
    'manage:products',
    'manage:orders',
    'manage:services',
    'manage:jobs',
    'view:analytics',
    'manage:finance',
    'manage:inventory',
    'manage:marketing',
    'manage:roles',
    'create:listings',
    'process:checkout',
    'earn:rewards',
    'withdraw:funds',
    'moderate:content'
  ],
  platform_admin: [
    'manage:users',
    'manage:businesses',
    'manage:stores',
    'manage:products',
    'manage:orders',
    'manage:services',
    'manage:jobs',
    'view:analytics',
    'manage:inventory',
    'moderate:content'
  ],
  moderator: [
    'manage:users',
    'moderate:content',
    'view:analytics'
  ],
  merchant: [
    'manage:businesses',
    'manage:stores',
    'manage:products',
    'manage:orders',
    'view:analytics',
    'manage:finance',
    'manage:inventory',
    'manage:marketing',
    'create:listings',
    'process:checkout',
    'earn:rewards',
    'withdraw:funds'
  ],
  business_owner: [
    'manage:businesses',
    'manage:stores',
    'manage:products',
    'manage:orders',
    'manage:services',
    'manage:jobs',
    'view:analytics',
    'manage:finance',
    'manage:inventory',
    'manage:marketing',
    'create:listings',
    'process:checkout',
    'earn:rewards'
  ],
  seller: [
    'manage:stores',
    'manage:products',
    'manage:orders',
    'view:analytics',
    'manage:inventory',
    'create:listings',
    'process:checkout',
    'earn:rewards'
  ],
  service_provider: [
    'manage:services',
    'manage:orders',
    'view:analytics',
    'create:listings',
    'process:checkout',
    'earn:rewards'
  ],
  buyer: [
    'process:checkout',
    'earn:rewards',
    'create:listings'
  ],
  customer: [
    'process:checkout',
    'earn:rewards'
  ]
};

export class RbacEngine {
  /**
   * Resolve all unique permissions for a set of assigned user roles
   */
  public getPermissionsForRoles(roles: SystemRole[]): Permission[] {
    const permissionSet = new Set<Permission>();
    roles.forEach(role => {
      const perms = ROLE_PERMISSIONS_MAP[role] || [];
      perms.forEach(p => permissionSet.add(p));
    });
    return Array.from(permissionSet);
  }

  /**
   * Check if user with given roles has a specific permission
   */
  public hasPermission(roles: SystemRole[], permission: Permission): boolean {
    if (roles.includes('superadmin')) return true;
    const permissions = this.getPermissionsForRoles(roles);
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasRole(userRoles: SystemRole[], targetRoles: SystemRole[]): boolean {
    if (userRoles.includes('superadmin')) return true;
    return targetRoles.some(r => userRoles.includes(r));
  }
}

export const rbacEngine = new RbacEngine();
