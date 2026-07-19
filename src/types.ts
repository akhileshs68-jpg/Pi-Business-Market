/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// USER & WALLET DOMAIN
// ==========================================

export interface User {
  uid: string;
  username: string; // Pi Network username (e.g., 'pi_pioneer')
  displayName: string;
  walletAddress: string; // Pi wallet public key
  createdAt: string;
  isMerchant: boolean;
  storeId?: string; // Associated store ID if merchant
  profileId?: string; // Associated PioneerProfile ID (services/professional/business)
  roles: ('user' | 'merchant' | 'admin' | 'pioneer_provider')[];
  ratingCount: number;
  averageRating: number;
}

export interface PiSession {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// ==========================================
// STORE DOMAIN (SaaS Storefront Builder)
// ==========================================

export interface StoreAnalytics {
  totalRevenuePi: number;
  views: number;
  ordersCount: number;
  conversionRate: number; // percentage
  salesHistory: { date: string; amount: number; orders: number }[];
}

export interface Store {
  id: string;
  ownerUid: string;
  name: string;
  slug: string; // URL-friendly slug
  description: string;
  logoUrl: string;
  bannerUrl: string;
  category: string;
  createdAt: string;
  verified: boolean; // Pi verification checkmark
  rating: number;
  reviewCount: number;
  piWalletAddress: string; // Destination wallet for sales
  phone?: string;
  email?: string;
  socials?: {
    telegram?: string;
    whatsapp?: string;
    twitter?: string;
  };
  featured: boolean;
  analytics: StoreAnalytics;
  customTheme?: {
    primaryColor: string;
    bannerText: string;
  };
}

// ==========================================
// PRODUCT CATALOG DOMAIN
// ==========================================

export type ProductCategory =
  | 'electronics'
  | 'fashion'
  | 'digital_services'
  | 'home_living'
  | 'food_delivery'
  | 'health_beauty'
  | 'books_education'
  | 'others';

export interface ProductAttribute {
  name: string; // e.g., 'Size', 'Color'
  options: string[]; // e.g., ['M', 'L', 'XL']
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  pricePi: number; // Pricing in Pi cryptocurrency
  category: ProductCategory;
  imageUrls: string[];
  stock: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attributes: ProductAttribute[];
  isDigital: boolean; // Virtual assets vs physical delivery
  downloadUrl?: string; // For digital products
  status: 'active' | 'draft' | 'archived';
  views: number;
  salesCount: number;
  averageRating: number;
  reviewCount: number;
  aiOptimized?: boolean; // Tracking if merchant used AI optimizer
  boostedWithAds?: boolean; // Multi-tiered ad campaign tag
}

// ==========================================
// CART & ORDERING DOMAIN
// ==========================================

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAttributes: Record<string, string>; // e.g., { 'Size': 'M' }
}

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID_VERIFYING = 'paid_verifying',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  buyerUid: string;
  buyerUsername: string;
  items: {
    productId: string;
    title: string;
    pricePi: number;
    quantity: number;
    imageUrl: string;
    selectedAttributes: Record<string, string>;
  }[];
  totalPi: number;
  status: OrderStatus;
  shippingAddress?: ShippingAddress; // optional for digital assets
  createdAt: string;
  updatedAt: string;
  blockchainTxId?: string; // Real or simulated Pi Tx Hash
  notes?: string;
  isDigital: boolean;
}

// ==========================================
// REVIEWS & NOTIFICATIONS DOMAIN
// ==========================================

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  storeId: string;
  buyerUid: string;
  buyerUsername: string;
  rating: number; // 1-5 scale
  comment: string;
  createdAt: string;
  merchantResponse?: string;
}

export type NotificationType =
  | 'order_placed'
  | 'payment_received'
  | 'order_shipped'
  | 'new_review'
  | 'system_announcement'
  | 'ads_milestone';

export interface Notification {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  linkTo?: string; // Actionable route inside app
}

// ==========================================
// ADVERTISING CAMPAIGN DOMAIN
// ==========================================

export interface AdCampaign {
  id: string;
  storeId: string;
  productId?: string;
  budgetPi: number;
  spentPi: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
}

// ==========================================
// PI SUPER APP: MULTIPLE ACCOUNT TYPES & SERVICES
// ==========================================

export type PioneerCategory =
  | 'product_seller'
  | 'store_owner'
  | 'business_owner'
  | 'service_provider'
  | 'technician'
  | 'electrician'
  | 'plumber'
  | 'carpenter'
  | 'mechanic'
  | 'mobile_repair'
  | 'repair_appliances' // TV/Fridge/AC/Washing Machine Repair
  | 'freelancer'
  | 'teacher_tutor'
  | 'consultant'
  | 'delivery_partner'
  | 'skilled_worker'
  | 'labour'
  | 'house_cleaning'
  | 'job_provider'
  | 'job_seeker';

export type ProfilePageType =
  | 'store'
  | 'business'
  | 'professional'
  | 'service'
  | 'worker'
  | 'organisation'
  | 'ngo'
  | 'startup'
  | 'creator';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ProfileAnalytics {
  views: number;
  interactions: number;
  rating: number;
  revenuePi?: number;
}

export interface PioneerProfile {
  id: string;
  ownerUid: string;
  name: string; // Individual name or Business brand
  businessName?: string;
  category: PioneerCategory;
  pageType: ProfilePageType;
  skills: string[]; // List of products/skills (e.g. ['React', 'Wiring', 'Leak repair'])
  description: string;
  photoUrls: string[];
  videoUrls: string[];
  serviceArea: string; // Area of coverage (e.g. 'San Francisco, CA', 'Global')
  address: string;
  location: {
    lat?: number;
    lng?: number;
    addressText: string;
    city?: string;
    country?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    geoHash?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    whatsapp?: string;
    telegram?: string;
  };
  workingHours: string; // E.g., '9:00 AM - 6:00 PM'
  rating: number;
  reviewCount: number;
  portfolio: PortfolioItem[];
  piPaymentSupported: boolean;
  piWalletAddress: string;
  availabilityStatus: 'available' | 'busy' | 'offline';
  createdAt: string;
  
  // Enterprise Phase 4 Additions
  theme?: {
    primaryColor: string;
    bannerText?: string;
    templateId?: string; // assigned template (e.g., Electronics, Fashion, Freelancer, etc.)
  };
  logoUrl?: string;
  coverUrl?: string;
  gallery?: string[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
  languages?: string[];
  privacy?: 'public' | 'private';
  visibility?: 'visible' | 'hidden';
  verificationBadge?: boolean;
  customDomain?: string; // Future Custom Domain support
  followersCount?: number;
  analyticsEnterprise?: ProfileAnalytics;

  // Enterprise Phase 5 Architecture Hardening
  verificationLevel?: VerificationLevel;
  trustScore?: number;
  trustMetrics?: TrustMetrics;
  version?: number;
  versionHistory?: ProfileVersion[];
  softDeleted?: boolean;
  unifiedAnalytics?: UnifiedAnalytics;
}

// ==========================================
// ENTERPRISE ARCHITECTURE CORES (PHASE 5)
// ==========================================

export type VerificationLevel =
  | 'basic'
  | 'email_verified'
  | 'phone_verified'
  | 'pi_verified'
  | 'kyc_verified'
  | 'business_verified'
  | 'professional_verified'
  | 'official_partner'
  | 'government_verified';

export interface ProfileVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  changeSummary: string;
  snapshot: string; // JSON snapshot for rollback
}

export interface TrustMetrics {
  completedOrders: number;
  completedServices: number;
  completedJobs: number;
  successfulDeliveries: number;
  avgRating: number;
  reviewQualityScore: number; // 0 - 100
  responseTimeMinutes: number;
  cancellationRate: number; // percentage
  accountAgeDays: number;
  platformViolations: number;
  disputeHistoryCount: number;
  customerSatisfactionRate: number; // percentage
}

export interface UnifiedAnalytics {
  profileViews: number;
  productViews: number;
  serviceViews: number;
  jobViews: number;
  searchQueriesCount: number;
  clicksCount: number;
  ordersCount: number;
  bookingsCount: number;
  applicationsCount: number;
  qrScansCount: number;
  piPaymentsCount: number;
  followersCount: number;
  conversionRate: number;
  customerRetention: number;
  revenuePi: number;
}

// ==========================================
// UNIFIED LISTINGS ENGINE (PHASE 5)
// ==========================================

export type ListingType = 'physical' | 'digital' | 'service' | 'job' | 'event' | 'property' | 'vehicle' | 'rental';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'hidden'
  | 'paused'
  | 'rejected'
  | 'archived'
  | 'deleted'
  | 'expired';

export interface UnifiedListing {
  id: string;
  profileId: string;
  ownerUid: string;
  ownerName: string;
  type: ListingType;
  title: string;
  description: string;
  pricePi: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  imageUrls: string[];
  rating?: number;
  reviewCount?: number;
  
  // Enterprise Location Parameters
  location: {
    lat: number;
    lng: number;
    addressText: string;
    city: string;
    district?: string;
    state?: string;
    country: string;
    pinCode?: string;
    geoHash: string;
  };

  // Sub-domains
  productDetails?: {
    stock: number;
    isDigital: boolean;
    downloadUrl?: string;
    category: string;
  };
  serviceDetails?: {
    durationMinutes?: number;
    coverageRadiusKm?: number;
    availabilitySchedule?: string;
  };
  jobDetails?: {
    salaryType: 'hourly' | 'fixed' | 'monthly';
    locationType: 'remote' | 'on_site' | 'hybrid';
    requirements: string[];
    salaryRange?: string;
  };
}

// ==========================================
// PI SUPER APP: JOB MARKETPLACE DOMAIN
// ==========================================

export interface Job {
  id: string;
  providerUid: string;
  providerProfileId: string;
  providerName: string;
  title: string;
  description: string;
  requirements: string[];
  salaryPi: number;
  salaryType: 'hourly' | 'fixed' | 'monthly';
  locationType: 'remote' | 'on_site' | 'hybrid';
  location: string;
  category: string;
  createdAt: string;
  status: 'open' | 'closed';
  applicantCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  providerUid: string;
  applicantUid: string;
  applicantUsername: string;
  applicantName: string;
  coverLetter: string;
  piWalletAddress: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'declined';
}
