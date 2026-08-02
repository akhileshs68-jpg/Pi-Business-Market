/**
 * Master Wallet Service
 * Single source of truth for user Web3 & Marketplace Wallet Balances.
 * Keeps Pi Testnet Wallet, BMP Reward Wallet, BMP Token Wallet, and Business Wallet
 * synchronized and isolated.
 */

import { WalletAccount } from './blockchainTypes';
import { piTestnetProvider } from './providers/PiTestnetProvider';
import { bmpRewardProvider } from './providers/BmpRewardProvider';
import { getFirebaseDb } from '../../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export class MasterWalletService {
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
      bmpTokenBalance: 0, // Token balance mapped 1:1 in migration phase
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
   * Keep master wallet document synchronized
   */
  public async syncMasterWalletDoc(userId: string): Promise<WalletAccount> {
    const wallet = await this.getMasterWallet(userId);
    const db = getFirebaseDb();
    const ref = doc(db, 'master_wallets', userId);

    await setDoc(ref, {
      ...wallet,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return wallet;
  }
}

export const masterWalletService = new MasterWalletService();
