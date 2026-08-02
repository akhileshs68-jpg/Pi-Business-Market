/**
 * Enterprise Store Management System - Types & Standards
 * Pi Business Market
 */

import { Store, OpeningHours } from '../../types';

export type EnterpriseStoreType =
  | 'Retail Store'
  | 'Wholesale Store'
  | 'Manufacturer Store'
  | 'Distributor Store'
  | 'Medical Store'
  | 'Book Store'
  | 'Electronics Store'
  | 'Fashion Store'
  | 'Furniture Store'
  | 'Grocery Store'
  | 'Agriculture Store'
  | 'Restaurant'
  | 'Hotel'
  | 'Cafe'
  | 'Salon'
  | 'Gym'
  | 'Travel Agency'
  | 'Transport'
  | 'Digital Store'
  | 'Professional Office'
  | 'NGO Office'
  | 'Hospital'
  | 'Clinic'
  | 'School'
  | 'College'
  | 'Institute'
  | string;

export type StoreVerificationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Suspended'
  | 'Reverification';

export interface StoreHoliday {
  date: string; // ISO date format YYYY-MM-DD
  reason: string;
}

export interface StoreDeliverySettings {
  deliveryAvailable: boolean;
  deliveryFee: number;
  freeDeliveryMinOrder?: number;
  deliveryRadiusKm?: number;
  estimatedDeliveryTime?: string;
  expressDeliveryAvailable?: boolean;
}

export interface StorePickupSettings {
  pickupAvailable: boolean;
  pickupInstructions?: string;
  pickupHours?: string;
  curbsidePickupAvailable?: boolean;
}

export interface StoreShippingSettings {
  shippingAvailable: boolean;
  carrierName?: string;
  flatRateFee?: number;
  internationalShipping?: boolean;
}

export interface StorePaymentSettings {
  acceptsPi: boolean;
  acceptsBMP: boolean;
  piWalletAddress?: string;
  bmpWalletAddress?: string;
  escrowEnabled: boolean;
}

export interface StoreNotificationSettings {
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  reviewAlerts: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
}

export interface StoreAnalyticsMetrics {
  productViews: number;
  serviceViews: number;
  ordersCount: number;
  revenuePi: number;
  bmpRewardsDistributed: number;
  conversionRate: number;
  repeatCustomersCount: number;
  visitorsToday: number;
  topSellingProducts: string[];
  topServices: string[];
  trafficSources: { name: string; percentage: number }[];
}

export interface EnterpriseStoreConfig {
  storeType: EnterpriseStoreType;
  category: string;
  defaultDeliveryMode: 'delivery' | 'pickup' | 'shipping' | 'digital';
  requiredDocuments?: string[];
  supportsServices?: boolean;
  supportsProducts?: boolean;
}

export interface EnterpriseStoreProfile extends Store {
  storeGallery?: string[];
  verificationStatus?: StoreVerificationStatus;
  verificationNotes?: string;
  isOpen?: boolean; // Open / Closed live toggle
  vacationMode?: boolean;
  vacationMessage?: string;
  holidaySchedule?: StoreHoliday[];
  socialLinks?: Record<string, string>;
  deliverySettings?: StoreDeliverySettings;
  pickupSettings?: StorePickupSettings;
  shippingSettings?: StoreShippingSettings;
  paymentSettings?: StorePaymentSettings;
  notificationSettings?: StoreNotificationSettings;
  analytics?: StoreAnalyticsMetrics;
  featuredProducts?: string[];
  featuredServices?: string[];
  seoKeywords?: string[];
}
