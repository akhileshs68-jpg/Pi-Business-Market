/**
 * Pi Business Market - Enterprise Identity Platform Types
 * Standardized IAM definitions for Users, Roles, Permissions, Profiles, Sessions, and Wallet Mapping.
 */

export type SystemRole =
  | 'superadmin'
  | 'super_admin'
  | 'platform_admin'
  | 'moderator'
  | 'merchant'
  | 'business_owner'
  | 'owner'
  | 'seller'
  | 'buyer'
  | 'customer'
  | 'service_provider';

export type Permission =
  | 'manage:platform_settings'
  | 'manage:users'
  | 'manage:businesses'
  | 'manage:stores'
  | 'manage:products'
  | 'manage:orders'
  | 'manage:services'
  | 'manage:jobs'
  | 'view:analytics'
  | 'manage:finance'
  | 'manage:inventory'
  | 'manage:marketing'
  | 'manage:roles'
  | 'create:listings'
  | 'process:checkout'
  | 'earn:rewards'
  | 'withdraw:funds'
  | 'moderate:content';

export interface PersonalProfile {
  fullName: string;
  displayName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
  country: string;
  language: string;
  timezone: string;
}

export interface BusinessProfileIdentity {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessType: string;
  verificationStatus: string;
  kycStatus: string;
}

export interface StoreProfileIdentity {
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeType: string;
  verificationStatus: string;
}

export interface MerchantProfileIdentity {
  merchantId: string;
  merchantCategory: string;
  verificationLevel: string;
}

export interface WalletIdentity {
  piWalletAddress: string;
  bmpRewardAddress: string;
  bmpTokenAddress?: string;
  businessWalletAddress?: string;
  merchantWalletAddress?: string;
}

export interface VerificationIdentity {
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isPiVerified: boolean;
  isKycVerified: boolean;
  isBusinessVerified: boolean;
  trustScore: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
}

export interface SessionInfo {
  sessionId: string;
  uid: string;
  createdAt: string;
  expiresAt: string;
  device: DeviceInfo;
  status: 'active' | 'expired' | 'revoked';
}

export interface EnterpriseIdentity {
  uid: string; // Permanent Unique Key
  piUid: string;
  username: string;
  roles: SystemRole[];
  permissions: Permission[];
  personalProfile: PersonalProfile;
  businessIdentities: BusinessProfileIdentity[];
  storeIdentities: StoreProfileIdentity[];
  merchantIdentity?: MerchantProfileIdentity;
  walletIdentity: WalletIdentity;
  verification: VerificationIdentity;
  activeSessionId?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}
