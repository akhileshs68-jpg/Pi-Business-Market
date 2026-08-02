import { User } from '../../types';

export const ROLE_HIERARCHY = [
  'super_admin',
  'superadmin',
  'platform_admin',
  'business_owner',
  'seller',
  'buyer',
  'customer'
];

export function normalizeRole(roleStr: string | undefined | null): string {
  if (!roleStr) return '';
  const normalized = roleStr.toLowerCase().replace(/[\s_-]/g, '');
  if (normalized === 'superadmin' || normalized === 'super_admin') return 'super_admin';
  if (normalized === 'admin' || normalized === 'platformadmin' || normalized === 'platform_admin') return 'platform_admin';
  if (normalized === 'businessowner' || normalized === 'owner' || normalized === 'business_owner') return 'business_owner';
  if (normalized === 'seller' || normalized === 'merchant') return 'seller';
  if (normalized === 'buyer') return 'buyer';
  if (normalized === 'customer') return 'customer';
  return normalized;
}

export class RoleResolver {
  constructor(private user: User | null) {}

  getResolvedRoles(): Set<string> {
    const rolesSet = new Set<string>();
    if (!this.user) return rolesSet;
    
    if (this.user.role) rolesSet.add(normalizeRole(this.user.role));
    if ((this.user as any).activeRole) rolesSet.add(normalizeRole((this.user as any).activeRole));
    if (this.user.platformRole) rolesSet.add(normalizeRole(this.user.platformRole));
    if (this.user.businessRole) rolesSet.add(normalizeRole(this.user.businessRole));
    
    if (Array.isArray((this.user as any).roles)) {
      (this.user as any).roles.forEach((r: any) => rolesSet.add(normalizeRole(r)));
    }

    return rolesSet;
  }

  getCanonicalRole(): string {
    if (!this.user) return 'buyer';
    const rolesSet = this.getResolvedRoles();
    
    for (const role of ROLE_HIERARCHY) {
      if (rolesSet.has(role)) {
        return role;
      }
    }
    
    if (rolesSet.size > 0) {
      return Array.from(rolesSet)[0];
    }
    return 'buyer';
  }

  isSuperAdmin(): boolean {
    if (!this.user) return false;
    const canonical = this.getCanonicalRole();
    const rolesSet = this.getResolvedRoles();
    return (
      canonical === 'super_admin' ||
      rolesSet.has('super_admin') ||
      rolesSet.has('superadmin') ||
      this.user.role === 'Super Admin' ||
      this.user.platformRole === 'superadmin'
    );
  }

  isPlatformAdmin(): boolean {
    if (this.isSuperAdmin()) return true;
    const canonical = this.getCanonicalRole();
    return canonical === 'platform_admin' || this.getResolvedRoles().has('platform_admin');
  }

  isBusinessOwner(): boolean {
    if (this.isSuperAdmin()) return true;
    const canonical = this.getCanonicalRole();
    const roles = this.getResolvedRoles();
    return canonical === 'business_owner' || roles.has('business_owner') || roles.has('owner');
  }

  isSeller(): boolean {
    if (this.isSuperAdmin() || this.isBusinessOwner()) return true;
    const canonical = this.getCanonicalRole();
    const roles = this.getResolvedRoles();
    return canonical === 'seller' || roles.has('seller') || roles.has('merchant');
  }

  isBuyer(): boolean {
    return true;
  }

  isCustomer(): boolean {
    return true;
  }
}
