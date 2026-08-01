import { PaymentMethodId } from '../../types/payment';

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  provider: PaymentMethodId;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: 
    | 'DAILY_REWARD' 
    | 'LOGIN_REWARD' 
    | 'REFERRAL' 
    | 'SHARE' 
    | 'CAMPAIGN' 
    | 'CASHBACK' 
    | 'ADMIN' 
    | 'ADMIN_CREDIT'
    | 'ADMIN_DEBIT'
    | 'ADJUSTMENT'
    | 'MARKETPLACE_ORDER' 
    | 'PURCHASE'
    | 'REFUND'
    | 'MISSION_REWARD'
    | 'REVIEW_REWARD'
    | 'BALANCE_MIGRATION';
  referenceId?: string; // e.g., orderId
  description: string;
  createdAt: string;
}

export interface WalletBalance {
  userId: string;
  provider: PaymentMethodId;
  balance: number;
  updatedAt: string;
}

export interface WalletProvider {
  id: PaymentMethodId;
  name: string;
  getBalance(userId: string): Promise<number>;
  credit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string>;
  debit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string>;
}
