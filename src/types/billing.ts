/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded';

export interface EnterpriseInvoiceItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  isService?: boolean;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
}

export interface EnterpriseInvoice {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  transactionId: string;
  invoiceDate: string;
  status: InvoiceStatus;
  paymentStatus: string;
  piTestnetStatus: string;
  companyLogo?: string;
  businessLogo?: string;
  storeLogo?: string;
  buyer: {
    uid: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  seller: {
    businessId: string;
    storeId?: string;
    businessName: string;
    storeName?: string;
    name: string;
    address?: string;
    registrationNumber?: string;
    gstNumber?: string;
    email?: string;
  };
  items: EnterpriseInvoiceItem[];
  summary: {
    subtotal: number;
    discount: number;
    couponCode?: string;
    shippingCharge: number;
    tax: number;
    grandTotal: number;
    bmpRewardEarned: number;
  };
  qrVerificationCode: string;
  digitalSignature: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalReceipt {
  receiptId: string;
  receiptNumber: string;
  paymentId: string;
  transactionId: string;
  orderId: string;
  orderNumber: string;
  businessName: string;
  storeName?: string;
  businessLogo?: string;
  storeLogo?: string;
  buyerName: string;
  buyerUid: string;
  sellerName: string;
  sellerId: string;
  paymentMethod: string;
  paymentTime: string;
  amountPaid: number;
  bmpRewardCredited: number;
  receiptQrCode: string;
  createdAt: string;
}

export interface QRVerificationResult {
  isValid: boolean;
  type: 'invoice' | 'receipt' | 'order' | 'business' | 'store';
  code: string;
  verificationStatus: 'AUTHENTIC_VERIFIED' | 'EXPIRED' | 'INVALID';
  business?: {
    businessId: string;
    businessName: string;
    registrationNumber?: string;
    gstNumber?: string;
    logo?: string;
  };
  store?: {
    storeId: string;
    storeName: string;
    logo?: string;
  };
  orderSummary?: {
    orderNumber: string;
    grandTotal: number;
    itemCount: number;
    createdAt: string;
    items?: string[];
  };
  paymentStatus: string;
  timestamp: string;
  digitalSignature: string;
  piTransactionHash?: string;
}

export interface BillingAnalytics {
  totalInvoicesCount: number;
  totalReceiptsCount: number;
  totalInvoicedAmount: number;
  totalReceiptAmount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  bmpRewardsIssued: number;
}
