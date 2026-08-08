/**
 * Enterprise Shopping Cart Engine - Types & Standards
 * Pi Business Market
 */

import { CartItem } from '../../types';

export type CartItemType =
  | 'physical'
  | 'digital'
  | 'downloadable'
  | 'subscription'
  | 'service'
  | 'rental'
  | string;

export interface ExtendedCartItem extends CartItem {
  type?: CartItemType;
  sellerName?: string;
  sellerId?: string;
  storeName?: string;
  storeId?: string;
  businessId?: string;
  businessName?: string;
  serviceDate?: string;
  serviceTime?: string;
  bookingDurationMin?: number;
  digitalDownloadUrl?: string;
  minOrderQty?: number;
  maxOrderQty?: number;
  isAvailable?: boolean;
  validationMessage?: string;
}

export interface CartSellerGroup {
  sellerId: string;
  sellerName: string;
  businessId: string;
  storeId: string;
  storeName: string;
  items: ExtendedCartItem[];
  subtotal: number;
  productSubtotal: number;
  serviceSubtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

export interface CartCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableStoreId?: string;
  applicableBusinessId?: string;
  description: string;
  expiresAt?: string;
}

export interface CartValidationIssue {
  itemId: string;
  itemName: string;
  type: 'out_of_stock' | 'store_closed' | 'price_changed' | 'max_exceeded' | 'min_not_met' | 'unavailable';
  message: string;
  suggestedQty?: number;
}

export interface CartValidationResult {
  isValid: boolean;
  issues: CartValidationIssue[];
}

export interface CartPriceSummary {
  productSubtotal: number;
  serviceSubtotal: number;
  subtotal: number;
  couponDiscount: number;
  appliedCoupon?: CartCoupon;
  shipping: number;
  tax: number;
  grandTotal: number;
  bmpRewardsEstimate: number;
  piTestnetAmount: number;
  currency: string;
  hasExchangeItems?: boolean;
  hasCommunityItems?: boolean;
  hasLegacyItems?: boolean;
  localCurrencyTotals?: Record<string, number>;
}
