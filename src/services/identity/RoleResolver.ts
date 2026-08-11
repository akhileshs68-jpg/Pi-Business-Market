import { User } from '../../types';

export const ROLE_HIERARCHY = [
  'superadmin',
  'super_admin',
  'platform_admin',
  'business_owner',
  'service_provider',
  'seller',
  'buyer'
];

export function normalizeRole(roleStr: string | undefined | null): string {
  if (!roleStr) return '';
  const normalized = roleStr.toLowerCase().replace(/[\s_-]/g, '_');
  if (normalized === 'superadmin' || normalized === 'super_admin') return 'superadmin';
  if (normalized === 'admin' || normalized === 'platformadmin' || normalized === 'platform_admin') return 'platform_admin';
  if (normalized === 'business_owner' || normalized === 'businessowner' || normalized === 'owner' || normalized === 'merchant') return 'business_owner';
  if (normalized === 'seller') return 'seller';
  if (normalized === 'buyer' || normalized === 'customer') return 'buyer';
  if (normalized === 'service_provider' || normalized === 'serviceprovider') return 'service_provider';
  return normalized;
}

export class RoleResolver {
  constructor(private user: User | null) {}

  getResolvedRoles(): Set<string> {
    const rolesSet = new Set<string>();
    if (!this.user) return rolesSet;
    
    // Every Pi user must always have these capabilities
    rolesSet.add('buyer');
    rolesSet.add('seller');
    rolesSet.add('business_owner');
    rolesSet.add('service_provider');

    if (this.user.platformRole) {
      rolesSet.add(normalizeRole(this.user.platformRole));
    }

    return rolesSet;
  }

  getCanonicalRole(): string {
    if (!this.user) return 'buyer';
    
    // Active role represents currently selected capability and must be one of:
    // buyer, seller, business_owner, service_provider
    if (this.user.activeRole) {
      const normalizedActive = normalizeRole(this.user.activeRole);
      if (['buyer', 'seller', 'business_owner', 'service_provider'].includes(normalizedActive)) {
        return normalizedActive;
      }
    }

    return 'buyer';
  }

  isSuperAdmin(): boolean {
    if (!this.user) return false;
    const superAdminPiUid = (typeof window !== 'undefined' && (window as any).__SUPER_ADMIN_PI_UID__) || (import.meta.env?.VITE_SUPER_ADMIN_PI_UID) || '';
    const isDevMock = (this.user.piUid === 'dev_pioneer_mock' || this.user.uid === 'dev_pioneer_mock' || this.user.username === 'dev_pioneer_mock') && (
      (import.meta as any).env?.VITE_ENABLE_DEV_MOCK === 'true' ||
      (typeof window !== 'undefined' && localStorage.getItem('DEV_MOCK_AUTH_ENABLED') === 'true') ||
      Boolean((import.meta as any).env?.DEV)
    );
    return (
      this.user.platformRole === 'superadmin' ||
      this.user.roles?.includes('superadmin') ||
      isDevMock ||
      (Boolean(superAdminPiUid) && (this.user.piUid === superAdminPiUid || this.user.uid === superAdminPiUid || this.user.username === superAdminPiUid))
    );
  }

  isPlatformAdmin(): boolean {
    return this.isSuperAdmin();
  }

  isBusinessOwner(): boolean {
    return true;
  }

  isSeller(): boolean {
    return true;
  }

  isServiceProvider(): boolean {
    return true;
  }

  isBuyer(): boolean {
    return true;
  }

  isCustomer(): boolean {
    return true;
  }
}

