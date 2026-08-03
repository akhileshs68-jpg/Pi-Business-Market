/**
 * Enterprise Checkout Engine - Types & Specifications
 * Pi Business Market
 */

import { Address, OrderItem, PaymentStatus, OrderStatus } from '../../types';

export interface SavedCheckoutAddress extends Address {
  addressId?: string;
  isDefault?: boolean;
  type?: 'shipping' | 'billing' | 'both' | 'pickup_point';
  pickupPointName?: string;
}

export type EnterprisePaymentMethodId =
  | 'pi_testnet'
  | 'bmp_rewards'
  | 'bmp_token'
  | 'pi_mainnet'
  | 'escrow'
  | 'split'
  | 'credits'
  | 'gift';

export interface EnterprisePaymentMethodConfig {
  id: EnterprisePaymentMethodId;
  name: string;
  description: string;
  enabled: boolean;
  isFutureFeature?: boolean;
  iconName: string;
}

export interface PiTestnetVerificationResult {
  verified: boolean;
  paymentId: string;
  transactionId: string;
  walletAddress?: string;
  amountVerified: number;
  timestamp: string;
  errorMessage?: string;
  orderId?: string;
}

export interface OrderSummaryBreakdown {
  productSubtotal: number;
  serviceSubtotal: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  tax: number;
  grandTotal: number;
  bmpRewardsEstimate: number;
  piTestnetAmount: number;
  itemsByMerchant: {
    merchantId: string;
    merchantName: string;
    storeName: string;
    items: OrderItem[];
    subtotal: number;
  }[];
}

export interface MerchantSettlementQueueRecord {
  settlementId: string;
  orderId: string;
  businessId: string;
  storeId?: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'HOLD' | 'SETTLED' | 'CANCELLED';
  createdAt: string;
  releaseEligibleAt: string;
}
