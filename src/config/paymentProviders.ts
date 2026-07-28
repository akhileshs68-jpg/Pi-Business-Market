import { PaymentProviderConfig } from '../types/payment';

export const PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'pi',
    name: 'Pi Payment',
    icon: 'pi-network',
    enabled: true,
    description: 'Pay securely with Pi network',
    processingFee: 0,
  },
  {
    id: 'bmt',
    name: 'Business Market Token (BMT)',
    icon: 'coins',
    enabled: false,
    description: 'Pay with native BMT tokens',
    processingFee: 0,
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: 'smartphone',
    enabled: false,
    description: 'Pay via UPI apps',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: 'building',
    enabled: false,
    description: 'Direct bank transfer',
  },
  {
    id: 'cash',
    name: 'Cash on Delivery',
    icon: 'banknote',
    enabled: false,
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    icon: 'credit-card',
    enabled: false,
  }
];
