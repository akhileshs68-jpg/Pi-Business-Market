/**
 * Master Wallet Service
 * Single source of truth for user Web3 & Marketplace Wallet Balances.
 * Keeps Pi Testnet Wallet, BMP Reward Wallet, BMP Token Wallet, and Business Wallet
 * synchronized and isolated.
 */

import { WalletAccount, MasterLedgerEntry, AssetType } from './blockchainTypes';
import { piTestnetProvider } from './providers/PiTestnetProvider';
import { bmpRewardProvider } from './providers/BmpRewardProvider';
import { getFirebaseDb } from '../../firebase/config';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export class MasterWalletService {
  /**
   * Calculate customer loyalty tier based on lifetime earned BMP
   */
  public getLoyaltyTier(lifetimeBmp: number): LoyaltyTier {
    if (lifetimeBmp >= 10000) return 'DIAMOND';
    if (lifetimeBmp >= 5000) return 'PLATINUM';
    if (lifetimeBmp >= 2000) return 'GOLD';
    if (lifetimeBmp >= 500) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Get unified Master Wallet Account
   */
  public async getMasterWallet(userId: string): Promise<WalletAccount> {
    const db = getFirebaseDb();
    
    // 1. Fetch Pi Testnet balance
    const piBalance = await piTestnetProvider.getBalance(userId);

    // 2. Fetch BMP Reward Ledger balance
    const bmpRewardBalance = await bmpRewardProvider.getBalance(userId);

    // 3. Fetch Business Settlement balance if seller
    let businessBalance = 0;
    try {
      const bizWalletRef = doc(db, 'wallets', `${userId}_business`);
      const bizSnap = await getDoc(bizWalletRef);
      if (bizSnap.exists()) {
        businessBalance = bizSnap.data().balance || 0;
      }
    } catch (e) {
      // Ignore if not a seller
    }

    // 4. Fetch Lifetime Earned BMP
    let lifetimeEarned = bmpRewardBalance;
    try {
      const gRef = doc(db, 'user_gamification', userId);
      const gSnap = await getDoc(gRef);
      if (gSnap.exists()) {
        lifetimeEarned = gSnap.data().lifetimeBmp ?? bmpRewardBalance;
      }
    } catch (e) {
      // Fallback
    }

    const wallet: WalletAccount = {
      userId,
      address: `pi_addr_${userId.substring(0, 10)}`,
      piTestnetBalance: piBalance,
      bmpRewardBalance: bmpRewardBalance,
      bmpTokenBalance: 0, // Token balance mapped 1:1 in migration phase (feature flag controlled)
      merchantWalletBalance: businessBalance,
      businessWalletBalance: businessBalance,
      treasuryWalletBalance: 50000.0, // System treasury reserve
      escrowWalletBalance: 0.0, // Escrow locked funds
      settlementWalletBalance: businessBalance,
      businessSettlementBalance: businessBalance,
      lifetimeEarnedBmp: lifetimeEarned,
      nonce: 1,
      updatedAt: new Date().toISOString()
    };

    return wallet;
  }

  /**
   * Record immutable ledger entry for every transaction
   */
  public async recordLedgerEntry(entry: Omit<MasterLedgerEntry, 'entryId' | 'timestamp'>): Promise<string> {
    const db = getFirebaseDb();
    const entryId = `mled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEntry: MasterLedgerEntry = {
      ...entry,
      entryId,
      timestamp: new Date().toISOString()
    };

    try {
      const ledgerRef = collection(db, 'master_ledger');
      await addDoc(ledgerRef, {
        ...fullEntry,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Failed to record master ledger entry:', e);
    }

    return entryId;
  }

  /**
   * Keep master wallet document synchronized
   */
  public async syncMasterWalletDoc(userId: string): Promise<WalletAccount> {
    const wallet = await this.getMasterWallet(userId);
    const db = getFirebaseDb();
    const ref = doc(db, 'master_wallets', userId);

    await setDoc(ref, {
      ...wallet,
      loyaltyTier: this.getLoyaltyTier(wallet.lifetimeEarnedBmp),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return wallet;
  }
}

export const masterWalletService = new MasterWalletService();

