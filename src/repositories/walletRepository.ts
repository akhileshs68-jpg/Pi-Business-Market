/**
 * Domain Wallet Repository
 * Interacts with wallets, wallet_transactions, and master_wallets collections.
 */

import { BaseRepository } from './baseRepository';
import { where, orderBy, limit } from 'firebase/firestore';

export interface WalletDoc {
  id: string;
  userId: string;
  provider: string;
  balance: number;
  updatedAt: string;
}

export class WalletRepository extends BaseRepository<WalletDoc> {
  constructor() {
    super('wallets');
  }

  public async getUserWallet(userId: string, provider: string): Promise<WalletDoc | null> {
    const results = await this.findWhere(
      where('userId', '==', userId),
      where('provider', '==', provider),
      limit(1)
    );
    return results[0] || null;
  }
}

export const walletRepository = new WalletRepository();
