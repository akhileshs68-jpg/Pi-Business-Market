export type PaymentMethodId = 'pi' | 'bmt' | 'upi' | 'bank' | 'cash' | 'card';

export interface PaymentProviderConfig {
  id: PaymentMethodId;
  name: string;
  icon: string;
  enabled: boolean;
  description?: string;
  processingFee?: number;
}

export type PaymentStatusType = 
  | 'Pending' 
  | 'Processing' 
  | 'Completed' 
  | 'Failed' 
  | 'Cancelled' 
  | 'Expired' 
  | 'Refund Requested' 
  | 'Refunded';

export interface PaymentRecord {
  paymentId: string;
  transactionId?: string;
  buyerId: string;
  businessId: string;
  orderId?: string;
  bookingId?: string;
  currency: string;
  paymentMethod: PaymentMethodId;
  amount: number;
  status: PaymentStatusType;
  createdAt: string;
  updatedAt: string;
}
