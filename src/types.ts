/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// USER & WALLET DOMAIN
// ==========================================

export type UserRole =
  | 'Buyer'
  | 'Seller'
  | 'Business Owner'
  | 'Service Provider'
  | 'Employer'
  | 'Job Seeker'
  | 'Admin'
  | 'Super Admin';

export type AccountStatus = 'active' | 'suspended' | 'pending_verification';

export interface User {
  uid: string;           // Firebase UID
  piUid: string;         // Pi Network unique ID
  username: string;      // Pi Network username (e.g., 'pi_pioneer')
  displayName: string;
  walletAddress: string; // Pi wallet public key
  role: UserRole;
  accountType: 'individual' | 'business' | 'enterprise';
  verified: boolean;     // Pi verification checkmark
  kycVerified: boolean;
  createdAt: string;     // ISO string
  updatedAt: string;     // ISO string
  lastLogin: string;     // ISO string
  status: AccountStatus;
  photoUrl?: string;
  
  // Backward compatibility fields
  email?: string;
  ratingCount?: number;
  averageRating?: number;
}

export interface PiSession {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// ==========================================
// PRODUCT DOMAIN (Enterprise Management)
// ==========================================

export type ProductType = 
  | 'physical' 
  | 'digital' 
  | 'service' 
  | 'subscription' 
  | 'rental' 
  | 'downloadable';

export type ProductStatus = 'draft' | 'pending' | 'published' | 'archived' | 'deleted';
export type VisibilityStatus = 'public' | 'hidden' | 'password_protected';
export type StockStatus = 'in_stock' | 'out_of_stock' | 'on_backorder' | 'discontinued';

export interface ProductInventory {
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  unlimited: boolean;
  sku: string;
  barcode?: string;
}

export interface ProductPricing {
  regularPrice: number;
  salePrice?: number;
  comparePrice?: number;
  currency: string;
  taxClass: string;
}

export interface ProductSEO {
  title: string;
  description: string;
  slug: string;
}

export interface Product {
  productId: string;
  storeId: string;
  businessId: string;
  ownerUid: string;
  
  // Basic Information
  sku: string;
  barcode?: string;
  productName: string;
  productSlug: string;
  shortDescription: string;
  description: string;
  brand: string;
  type: ProductType;
  
  // Categorization
  category: string;
  subCategory: string;
  tags: string[];
  
  // Pricing
  price: number;
  comparePrice?: number;
  currency: string;
  taxClass: string;
  
  // Inventory
  stock: number;
  stockStatus: StockStatus;
  minOrderQty: number;
  maxOrderQty: number;
  
  // Logistics
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Flags & Status
  featured: boolean;
  status: ProductStatus;
  visibility: VisibilityStatus;
  
  // SEO
  seoTitle: string;
  seoDescription: string;
  
  // Media
  mainImage?: string;
  imageUrls: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
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

export interface LegacyProductAttribute {
  name: string; // e.g., 'Size', 'Color'
  options: string[]; // e.g., ['M', 'L', 'XL']
}

// Old Product interface removed to avoid conflict with Enterprise Product Engine.
// Use 'Product' from the Enterprise Management section.

// ==========================================
// CART & ORDERING DOMAIN (OMS)
// ==========================================

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_DISPATCH = 'ready_for_dispatch',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum FulfillmentStatus {
  PENDING = 'pending',
  PACKED = 'packed',
  READY = 'ready',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  RETURNED = 'returned'
}

export interface OrderTimelineEvent {
  eventId: string;
  orderId: string;
  status: string; // Can be OrderStatus, PaymentStatus, or FulfillmentStatus
  type: 'status_change' | 'payment' | 'fulfillment' | 'note' | 'system';
  message: string;
  actorUid: string;
  actorName: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface OrderItem {
  itemId: string;
  orderId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  discount: number;
  status: string;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  checkoutSessionId?: string;
  draftId?: string;
  userUid: string;
  businessId: string;
  storeId?: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  billingAddress?: Address;
  shippingAddress?: Address;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
  blockchainTxId?: string;
}

// ==========================================
// MESSAGING & NOTIFICATION DOMAIN
// ==========================================

export type ConversationType = 'direct' | 'group' | 'business_customer' | 'system' | 'support';
export type ConversationStatus = 'active' | 'archived' | 'deleted' | 'blocked';
export type MessageType = 'text' | 'image' | 'document' | 'system' | 'voice_placeholder';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';

export interface Conversation {
  conversationId: string;
  type: ConversationType;
  participants: string[]; // Array of user UIDs
  businessId?: string;
  storeId?: string;
  relatedEntityType?: SearchEntityType | 'order' | 'job_application';
  relatedEntityId?: string;
  lastMessage?: {
    content: string;
    senderUid: string;
    createdAt: string;
  };
  lastActivity: string;
  status: ConversationStatus;
  unreadCounts: Record<string, number>; // UID -> count
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderUid: string;
  messageType: MessageType;
  content: string;
  attachments?: string[]; // Array of mediaAsset IDs
  status: MessageStatus;
  edited: boolean;
  deleted: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type EnterpriseNotificationType =
  | 'order_update'
  | 'payment_update'
  | 'shipment_update'
  | 'review_reply'
  | 'loyalty_reward'
  | 'system_alert'
  | 'business_announcement'
  | 'job_update'
  | 'message_new';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  notificationId: string;
  recipientUid: string;
  type: EnterpriseNotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  priority: NotificationPriority;
  status: 'unread' | 'read' | 'dismissed';
  readAt?: string;
  createdAt: string;
  linkTo?: string; // App route
}

export interface NotificationPreference {
  preferenceId: string;
  userUid: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  mutedTypes: EnterpriseNotificationType[];
  updatedAt: string;
}

export interface DeliveryReceipt {
  receiptId: string;
  messageId: string;
  recipientUid: string;
  status: 'delivered' | 'read';
  timestamp: string;
}

// ==========================================
// ANALYTICS, BI & OBSERVABILITY DOMAIN
// ==========================================

export type AnalyticsEventType = 
  | 'page_view' 
  | 'product_view' 
  | 'search_performed' 
  | 'cart_add' 
  | 'order_placed' 
  | 'payment_success' 
  | 'payment_failure'
  | 'shipment_dispatched'
  | 'inventory_low'
  | 'user_signup'
  | 'business_created'
  | 'api_error';

export interface AnalyticsEvent {
  eventId: string;
  eventType: AnalyticsEventType;
  entityType?: string;
  entityId?: string;
  businessId?: string;
  storeId?: string;
  userUid?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BusinessMetrics {
  metricId: string; // businessId_YYYY-MM-DD
  businessId: string;
  date: string;
  revenue: number;
  orderCount: number;
  productViews: number;
  customerCount: number;
  avgOrderValue: number;
  conversionRate: number;
  lowStockItems: number;
  inventoryValue: number;
  topProducts: Array<{ id: string; name: string; sales: number }>;
  updatedAt: string;
}

export interface SystemMetrics {
  metricId: string; // YYYY-MM-DD
  date: string;
  dau: number;
  mau: number;
  totalRevenue: number;
  totalOrders: number;
  paymentSuccessRate: number;
  activeBusinesses: number;
  searchVolume: number;
  apiErrorCount: number;
  avgFulfillmentTime: number; // in hours
  updatedAt: string;
}

export interface AuditLog {
  logId: string;
  actorUid: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  before?: any;
  after?: any;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

// ==========================================
// BUSINESS IDENTITY & ONBOARDING DOMAIN
// ==========================================

export type BusinessType = 
  | 'Individual' | 'Freelancer' | 'Startup' | 'Sole Proprietorship' | 'Partnership' 
  | 'LLP' | 'Private Limited' | 'Public Limited' | 'NGO' | 'Trust' | 'Society' 
  | 'Government' | 'Educational Institute' | 'School' | 'College' | 'University' 
  | 'Hospital' | 'Clinic' | 'Pharmacy' | 'Restaurant' | 'Hotel' | 'Manufacturer' 
  | 'Wholesaler' | 'Distributor' | 'Retailer' | 'Service Provider' | 'Digital Agency' 
  | 'IT Company' | 'Finance Company' | 'Agriculture' | 'Construction' | 'Transport' 
  | 'Logistics' | 'Real Estate' | 'Tourism' | 'Entertainment' | 'Other';

export type BusinessRole = 
  | 'Owner' | 'Super Admin' | 'Business Admin' | 'Manager' | 'Finance' | 'Sales' 
  | 'Inventory' | 'Warehouse' | 'Support' | 'HR' | 'Marketing' | 'Employee' | 'Viewer';

export type VerificationStatus = 'Pending' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended' | 'Verified';
export type BusinessStatus = 'active' | 'inactive' | 'suspended' | 'archived' | 'deleted';

export interface Business {
  id: string;
  ownerUid: string;
  businessName: string;
  legalName: string;
  displayName: string;
  businessType: BusinessType;
  industry: string;
  category: string;
  subcategory?: string;
  description: string;
  logoUrl?: string;
  logoPublicId?: string;
  coverImageUrl?: string;
  coverPublicId?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  taxNumber?: string;
  walletAddress?: string;
  country: string;
  state: string;
  district?: string;
  city: string;
  postalCode: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  currency: string;
  language: string;
  verificationStatus: VerificationStatus;
  kycStatus: string;
  businessStatus: BusinessStatus;
  rating: number;
  reviewCount: number;
  followers: number;
  employeeCount: number;
  storeCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface BusinessMember {
  memberId: string;
  businessId: string;
  userUid: string;
  role: BusinessRole;
  permissions: string[];
  title?: string;
  department?: string;
  status: 'active' | 'suspended' | 'invited';
  joinedAt: string;
  updatedAt: string;
}

export interface BusinessInvitation {
  invitationId: string;
  businessId: string;
  email?: string;
  phone?: string;
  piUsername?: string;
  role: BusinessRole;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface BusinessDocument {
  documentId: string;
  businessId: string;
  type: 'GST' | 'PAN' | 'TradeLicense' | 'Registration' | 'IdentityProof' | 'AddressProof' | 'Tax' | 'Other';
  name: string;
  url: string;
  version: number;
  status: 'valid' | 'expired' | 'under_review' | 'rejected';
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
}

export interface BusinessCategory {
  categoryId: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface BusinessAuditLog {
  logId: string;
  businessId: string;
  actorUid: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface BusinessSettings {
  businessId: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
    publicProfile: boolean;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

// ==========================================
// ADMINISTRATION & GOVERNANCE DOMAIN
// ==========================================

export interface PlatformSettings {
  settingId: string;
  currency: string;
  defaultLanguage: string;
  marketplaceFeePercentage: number;
  minWithdrawalLimit: number;
  registrationPolicy: 'open' | 'invite_only' | 'restricted';
  businessVerificationRequired: boolean;
  maxStoragePerBusinessMb: number;
  updatedAt: string;
}

export interface FeatureFlag {
  flagId: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetRoles: string[];
  targetBusinesses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWindow {
  windowId: string;
  title: string;
  startTime: string;
  endTime: string;
  affectedServices: string[];
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  description: string;
}

export interface SystemAnnouncement {
  announcementId: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  audience: 'all' | 'merchants' | 'customers';
  publishAt: string;
  expireAt: string;
  createdAt: string;
}

export interface SecurityPolicy {
  policyId: string;
  name: string;
  description: string;
  rules: Record<string, any>;
  lastUpdated: string;
  updatedBy: string;
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
// BUSINESS PROFILE ENGINE (PHASE 2)
// ==========================================

export type BusinessProfileType =
  | 'Store'
  | 'Company'
  | 'Service'
  | 'Professional'
  | 'Organization'
  | 'Creator'
  | 'Manufacturer'
  | 'Supplier'
  | 'Startup'
  | 'Freelancer';

export type BusinessProfileStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface BusinessProfile {
  businessId: string;
  ownerUid: string;
  businessName: string;
  businessSlug: string; // Unique URL-friendly slug
  businessType: BusinessProfileType;
  businessCategory: string;
  description: string;
  country: string;
  state: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  logoPublicId?: string;
  coverImageUrl?: string;
  coverPublicId?: string;
  verified: boolean;
  featured: boolean;
  status: BusinessProfileStatus;
  rating: number;
  followers: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// STORE MANAGEMENT ENGINE (PHASE 3)
// ==========================================

export type StoreType = 
  | 'Physical Store' 
  | 'Online Store' 
  | 'Hybrid Store' 
  | 'Service Center' 
  | 'Restaurant' 
  | 'Hotel' 
  | 'Wholesale' 
  | 'Retail';

export type StoreStatus = 'active' | 'archived' | 'deleted' | 'pending';

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Store {
  storeId: string;
  businessId: string;
  ownerUid: string;
  storeName: string;
  storeSlug: string;
  storeType: StoreType;
  storeCategory: string;
  description: string;
  logoUrl?: string;
  logoPublicId?: string;
  coverImageUrl?: string;
  coverPublicId?: string;
  email: string;
  phone: string;
  website?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: OpeningHours[];
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  verified: boolean;
  featured: boolean;
  status: StoreStatus;
  followers: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
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
// ENTERPRISE MEDIA & ASSET DOMAIN
// ==========================================

export type MediaModule = 
  | 'users' 
  | 'businesses' 
  | 'stores' 
  | 'products' 
  | 'services' 
  | 'jobs' 
  | 'documents' 
  | 'temporary';

export type MediaStatus = 'active' | 'archived' | 'deleted';
export type MediaVisibility = 'public' | 'private';

export interface MediaAsset {
  mediaId: string;
  ownerUid: string;
  businessId?: string;
  storeId?: string;
  module: MediaModule;
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  status: MediaStatus;
  visibility: MediaVisibility;
  uploadedAt: string;
  updatedAt: string;
}

// ==========================================
// ENTERPRISE CATALOG & CATEGORY ENGINE
// ==========================================

export type CategoryStatus = 'active' | 'archived' | 'hidden';
export type AttributeDataType = 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'color' 
  | 'size' 
  | 'weight' 
  | 'dimension' 
  | 'dropdown' 
  | 'multi-select';

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  coverImageUrl?: string;
  coverPublicId?: string;
  parentId?: string; // For nested subcategories
  level: number;     // 0 for root, 1 for sub, etc.
  sortOrder: number;
  status: CategoryStatus;
  visibility: 'public' | 'private';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeGroup {
  groupId: string;
  name: string;      // e.g., "Technical", "Physical", "Warranty"
  slug: string;
  displayOrder: number;
  status: 'active' | 'inactive';
}

export interface ProductAttribute {
  attributeId: string;
  groupId: string;   // Reference to AttributeGroup
  name: string;      // e.g., "Screen Size", "Material", "Battery Life"
  slug: string;
  dataType: AttributeDataType;
  unit?: string;     // e.g., "inches", "kg", "hours"
  options?: string[]; // For dropdown/multi-select
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  comparable: boolean;
  variantAttribute: boolean; // Can this be used to create product variants?
  displayOrder: number;
  status: 'active' | 'inactive';
}

export interface CategoryAttributeMapping {
  mappingId: string;
  categoryId: string;
  attributeId: string;
  required: boolean;
  displayOrder: number;
}

// ==========================================
// ENTERPRISE PRODUCT VARIANTS & SKU ENGINE
// ==========================================

export interface ProductVariant {
  variantId: string;
  productId: string;
  storeId: string;
  businessId: string;
  ownerUid: string;
  sku: string;
  barcode?: string;
  variantName: string;
  attributes: Record<string, string>; // { attributeSlug: value }
  price: number;
  comparePrice?: number;
  currency: string;
  stock: number;
  reservedStock: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  status: ProductStatus;
  visibility: VisibilityStatus;
  mainImage?: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VariantGroup {
  groupId: string;
  productId: string;
  name: string;      // e.g., "Color", "Size", "Storage"
  displayOrder: number;
}

export interface VariantOption {
  optionId: string;
  groupId: string;
  productId: string;
  value: string;     // e.g., "Black", "Medium", "256 GB"
  displayOrder: number;
}

// ==========================================
// ENTERPRISE INVENTORY & WAREHOUSE MANAGEMENT
// ==========================================

export type WarehouseType = 'main' | 'fulfillment' | 'returns' | 'retail' | 'virtual';
export type WarehouseStatus = 'active' | 'inactive' | 'maintenance' | 'closed';

export interface Warehouse {
  warehouseId: string;
  businessId: string;
  name: string;
  code: string; // e.g., WH-NY-001
  type: WarehouseType;
  country: string;
  state: string;
  city: string;
  address: string;
  managerUid: string;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  locationId: string;
  warehouseId: string;
  zone: string;   // e.g., "A", "B", "C"
  aisle: string;  // e.g., "01", "02"
  rack: string;   // e.g., "R1"
  bin: string;    // e.g., "B12"
  barcode?: string;
  status: 'available' | 'full' | 'restricted' | 'damaged';
}

export interface Inventory {
  inventoryId: string;
  productId: string;
  variantId: string;
  warehouseId: string;
  locationId: string;
  sku: string;
  availableStock: number;
  reservedStock: number;
  incomingStock: number;
  damagedStock: number;
  returnedStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued';
  updatedAt: string;
}

export type InventoryTransactionType = 
  | 'stock-in' 
  | 'stock-out' 
  | 'transfer' 
  | 'adjustment' 
  | 'damage' 
  | 'return' 
  | 'correction' 
  | 'reservation' 
  | 'release-reservation'
  | 'fulfill-reservation';

export interface InventoryTransaction {
  transactionId: string;
  inventoryId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceType?: 'order' | 'transfer' | 'adjustment' | 'return';
  referenceId?: string;
  performedBy: string; // userUid
  reason: string;
  timestamp: string;
}

// ==========================================
// ENTERPRISE SERVICES MARKETPLACE ENGINE
// ==========================================

export type ServicePricingType = 'fixed' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quote';
export type ServiceLocationType = 'on-site' | 'customer-location' | 'online' | 'hybrid';
export type ServiceStatus = 'draft' | 'pending' | 'published' | 'archived' | 'deleted';

export interface Service {
  serviceId: string;
  businessId: string;
  storeId: string;
  ownerUid: string;
  title: string;
  slug: string; // Unique URL-friendly slug
  description: string;
  category: string;
  subCategory: string;
  pricingType: ServicePricingType;
  basePrice: number;
  currency: string;
  duration?: number; // Estimated duration in minutes
  locationType: ServiceLocationType;
  serviceArea?: string; // e.g., "New York City", "Global"
  status: ServiceStatus;
  visibility: VisibilityStatus;
  featured: boolean;
  rating: number;
  mainImage?: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServicePackage {
  packageId: string;
  serviceId: string;
  name: string;
  description: string;
  price: number;
  duration?: number; // Minutes
  features: string[];
  status: 'active' | 'inactive';
}

export interface ServiceAvailability {
  availabilityId: string;
  serviceId?: string; // If null, applies to all services of the business
  businessId: string;
  workingDays: number[]; // 0-6 (Sun-Sat)
  workingHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  }[];
  holidayRules: {
    date: string; // YYYY-MM-DD
    name: string;
  }[];
  blackoutDates: string[]; // YYYY-MM-DD
  timezone: string;
}

// ==========================================
// ENTERPRISE RECRUITMENT & JOBS ENGINE
// ==========================================

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'freelance' | 'volunteer';
export type WorkMode = 'on-site' | 'remote' | 'hybrid';
export type JobStatus = 'draft' | 'published' | 'closed' | 'archived' | 'deleted';
export type HiringStatus = 'applied' | 'under-review' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

export interface Job {
  jobId: string;
  businessId: string;
  storeId?: string;
  ownerUid: string;
  title: string;
  slug: string;
  department: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  experienceLevel: string;
  salaryType: 'fixed' | 'range' | 'commission' | 'negotiable';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  vacancies: number;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  location: string;
  status: JobStatus;
  visibility: VisibilityStatus;
  applicationDeadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  candidateId: string;
  userUid: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }[];
  education: {
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }[];
  certifications: string[];
  languages: string[];
  portfolioLinks: string[];
  resumeMediaId?: string;
  availability: 'immediate' | '15-days' | '30-days' | '90-days';
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  applicationId: string;
  jobId: string;
  candidateId: string;
  businessId: string;
  status: HiringStatus;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SavedJob {
  savedJobId: string;
  userUid: string;
  jobId: string;
  savedAt: string;
}

// ==========================================
// ENTERPRISE UNIVERSAL SEARCH & DISCOVERY
// ==========================================

export type SearchEntityType = 'product' | 'service' | 'job' | 'business' | 'store' | 'category';

export interface SearchIndexEntry {
  documentId: string;
  entityType: SearchEntityType;
  entityId: string;
  businessId: string;
  storeId?: string;
  title: string;
  description: string;
  keywords: string[];
  categoryIds: string[];
  location?: string;
  visibility: VisibilityStatus;
  status: string;
  price?: number;
  currency?: string;
  featured: boolean;
  metadata: Record<string, any>; // Entity-specific data for snippets
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  entityType?: SearchEntityType;
  businessId?: string;
  storeId?: string;
  categoryId?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}

export interface RecentSearch {
  searchId: string;
  userUid: string;
  query: string;
  timestamp: string;
}

// ==========================================
// ENTERPRISE CART, WISHLIST & CHECKOUT
// ==========================================

export interface WishlistItem {
  wishlistId: string;
  userUid: string;
  entityType: SearchEntityType;
  entityId: string;
  createdAt: string;
}

export interface CartItem {
  itemId: string;
  cartId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: 'active' | 'out-of-stock' | 'price-changed';
}

export interface Cart {
  cartId: string;
  userUid: string;
  businessId: string; // One cart per business per user for multi-vendor prep
  storeId?: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  status: 'active' | 'converted' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CheckoutSession {
  sessionId: string;
  cartId: string;
  userUid: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  deliveryMethod?: 'shipping' | 'pickup';
  couponCodes: string[];
  notes?: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  status: 'pending' | 'completed' | 'expired';
  expiresAt: string;
}

export interface OrderDraft {
  draftId: string;
  checkoutSessionId: string;
  userUid: string;
  businessId: string;
  storeId?: string;
  lineItems: CartItem[];
  pricingSummary: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    grandTotal: number;
  };
  status: 'draft' | 'converted-to-order';
  createdAt: string;
}

// ==========================================
// PAYMENT & FINANCIAL LEDGER DOMAIN
// ==========================================

export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface PaymentIntent {
  paymentIntentId: string;
  orderId: string;
  customerUid: string;
  businessId: string;
  storeId?: string;
  currency: string;
  amount: number;
  status: PaymentIntentStatus;
  expiresAt: string;
  createdAt: string;
}

export interface Payment {
  paymentId: string;
  paymentIntentId: string;
  piTransactionId: string;
  orderId: string;
  payerUid: string;
  payeeBusinessId: string;
  amount: number;
  currency: string;
  provider: 'pi_network' | 'manual' | 'stripe' | 'upi';
  providerReference?: string;
  verificationStatus: 'unverified' | 'verified' | 'failed';
  paymentStatus: PaymentStatus;
  paidAt: string;
  createdAt: string;
}

export type LedgerEntryType = 'sale' | 'refund' | 'payout' | 'fee' | 'adjustment';

export interface LedgerEntry {
  ledgerId: string;
  paymentId?: string;
  businessId: string;
  entryType: LedgerEntryType;
  debit: number;
  credit: number;
  currency: string;
  balanceImpact: number; // e.g., +amount for sale, -amount for refund
  referenceType: 'order' | 'payout' | 'adjustment' | 'refund';
  referenceId: string;
  createdAt: string;
}

export interface PaymentReceipt {
  receiptId: string;
  paymentId: string;
  orderId: string;
  receiptNumber: string;
  issuedAt: string;
  downloadableUrl?: string;
}

export interface Refund {
  refundId: string;
  paymentId: string;
  orderId: string;
  refundAmount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  requestedAt: string;
  processedAt?: string;
}

// ==========================================
// SHIPPING & LOGISTICS DOMAIN
// ==========================================

export enum ShipmentStatus {
  PENDING = 'pending',
  PACKED = 'packed',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  PICKUP = 'pickup',
  DIGITAL = 'digital'
}

export interface Carrier {
  carrierId: string;
  name: string;
  contactNumber?: string;
  website?: string;
  trackingUrlTemplate?: string; // e.g. https://carrier.com/track/{trackingNumber}
  isActive: boolean;
}

export interface Shipment {
  shipmentId: string;
  orderId: string;
  businessId: string;
  storeId?: string;
  warehouseId?: string;
  carrierId?: string;
  trackingNumber?: string;
  shippingMethod: ShippingMethod;
  estimatedDelivery?: string;
  actualDelivery?: string;
  status: ShipmentStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentPackage {
  packageId: string;
  shipmentId: string;
  weight: number; // in kg
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  declaredValue: number;
  packageType: string; // 'box', 'envelope', 'pallet'
  status: string;
}

export interface TrackingEvent {
  eventId: string;
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  eventTime: string;
  createdBy: string; // UID of person who recorded it
}

export interface ShippingZone {
  zoneId: string;
  name: string;
  type: 'local' | 'state' | 'national' | 'international';
  regions: string[]; // List of states or country codes
}

export interface ShippingRate {
  rateId: string;
  zoneId: string;
  method: ShippingMethod;
  baseRate: number;
  perKgRate: number;
  minWeight: number;
  maxWeight: number;
  estimatedDays: number;
}

// ==========================================
// CRM, CUSTOMER 360 & LOYALTY DOMAIN
// ==========================================

export type CustomerStatus = 'active' | 'inactive' | 'blocked';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type TimelineEventType = 
  | 'order_placed' 
  | 'payment_completed' 
  | 'shipment_delivered' 
  | 'review_submitted' 
  | 'loyalty_earned' 
  | 'loyalty_redeemed';

export interface CustomerProfile {
  customerId: string;
  userUid: string;
  businessId: string;
  displayName: string;
  email: string;
  phone?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  status: CustomerStatus;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string;
  lastVisitAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTimelineEvent {
  eventId: string;
  customerId: string;
  businessId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  referenceId?: string; // Order ID, Review ID, etc.
  points?: number;
  amount?: number;
  createdAt: string;
}

export interface LoyaltyAccount {
  accountId: string;
  customerId: string;
  businessId: string;
  pointsBalance: number;
  tier: LoyaltyTier;
  lifetimePoints: number;
  lastEarnedAt?: string;
  lastRedeemedAt?: string;
}

export interface LoyaltyTransaction {
  transactionId: string;
  accountId: string;
  type: 'earn' | 'redeem' | 'adjust';
  points: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

export interface CustomerTag {
  tagId: string;
  businessId: string;
  customerId: string;
  label: string;
  color: string;
}

export interface CustomerNote {
  noteId: string;
  businessId: string;
  customerId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export type ReviewEntityType = 'product' | 'service' | 'business' | 'store' | 'employer';
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'rejected' | 'archived';

export interface Review {
  reviewId: string;
  entityType: ReviewEntityType;
  entityId: string;
  businessId: string;
  orderId?: string; // For verified purchase
  reviewerUid: string;
  reviewerName: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  mediaIds?: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  reply?: {
    comment: string;
    repliedAt: string;
    replierName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReputationScore {
  entityId: string;
  entityType: ReviewEntityType;
  overallRating: number;
  reviewCount: number;
  verifiedReviewCount: number;
  responseRate?: number; // For businesses
  trustScore: number; // 0-100 normalized
  lastUpdated: string;
}

export interface ReviewVote {
  voteId: string;
  reviewId: string;
  userUid: string;
  type: 'helpful' | 'report';
  createdAt: string;
}

export interface ReviewReport {
  reportId: string;
  reviewId: string;
  reporterUid: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}
