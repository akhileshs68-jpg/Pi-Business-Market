import { collection, doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../../firebase/config';
import { WalletProvider, WalletTransaction } from '../walletTypes';

export const bmpRewardsProvider: WalletProvider = {
  id: 'bmp_rewards',
  name: 'BMP Rewards',

  async getBalance(userId: string): Promise<number> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${userId}_bmp_rewards`);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      return snap.data().balance || 0;
    }

    // Auto-migrate or initialize wallet document with defaults if it does not exist
    try {
      const gamificationRef = doc(db, 'user_gamification', userId);
      const gamificationSnap = await getDoc(gamificationRef);
      
      let initialBalance = 300; // Default demo balance
      let initialLifetime = 300;

      if (gamificationSnap.exists()) {
        const gData = gamificationSnap.data();
        initialBalance = gData.bmpBalance ?? gData.lifetimeBmp ?? 300;
        initialLifetime = gData.lifetimeBmp ?? initialBalance;
      }

      await runTransaction(db, async (transaction) => {
        const txRef = doc(collection(db, 'wallet_transactions'));
        transaction.set(walletRef, {
          userId,
          provider: this.id,
          balance: initialBalance,
          lifetimeEarned: initialLifetime,
          streak: 0,
          level: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        transaction.set(txRef, {
          walletId: walletRef.id,
          userId,
          provider: this.id,
          type: 'CREDIT',
          amount: initialBalance,
          balanceBefore: 0,
          balanceAfter: initialBalance,
          source: 'BALANCE_MIGRATION',
          description: 'Initial Wallet Creation & Ledger Balance Migration',
          createdAt: serverTimestamp()
        });
      });

      return initialBalance;
    } catch (err) {
      console.warn('Failed to auto-create ledger wallet doc:', err);
      return 300;
    }
  },

  async credit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${userId}_bmp_rewards`);
    const gamificationRef = doc(db, 'user_gamification', userId);
    const txRef = doc(collection(db, 'wallet_transactions'));

    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      const balanceBefore = walletDoc.exists() ? walletDoc.data().balance || 0 : 0;
      const balanceAfter = balanceBefore + amount;

      if (!walletDoc.exists()) {
        transaction.set(walletRef, {
          userId,
          provider: this.id,
          balance: balanceAfter,
          lifetimeEarned: balanceAfter,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const currentLifetime = walletDoc.data().lifetimeEarned || balanceBefore;
        transaction.update(walletRef, {
          balance: balanceAfter,
          lifetimeEarned: currentLifetime + amount,
          updatedAt: serverTimestamp()
        });
      }

      // Sync user_gamification document if it exists
      const gSnap = await transaction.get(gamificationRef);
      if (gSnap.exists()) {
        const curGData = gSnap.data();
        transaction.update(gamificationRef, {
          bmpBalance: balanceAfter,
          lifetimeBmp: (curGData.lifetimeBmp || 0) + amount,
          updatedAt: serverTimestamp()
        });
      }

      const txData: Omit<WalletTransaction, 'id' | 'createdAt'> & { createdAt: any } = {
        walletId: walletRef.id,
        userId,
        provider: this.id,
        type: 'CREDIT',
        amount,
        balanceBefore,
        balanceAfter,
        source,
        description,
        createdAt: serverTimestamp(),
      };
      if (referenceId) txData.referenceId = referenceId;

      transaction.set(txRef, txData);
    });

    return txRef.id;
  },

  async debit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${userId}_bmp_rewards`);
    const gamificationRef = doc(db, 'user_gamification', userId);
    const txRef = doc(collection(db, 'wallet_transactions'));

    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      const balanceBefore = walletDoc.exists() ? walletDoc.data().balance || 0 : 0;
      
      if (balanceBefore < amount) {
        throw new Error(`Insufficient BMP Rewards balance (Available: ${balanceBefore} BMP, Required: ${amount} BMP)`);
      }

      const balanceAfter = balanceBefore - amount;

      transaction.update(walletRef, {
        balance: balanceAfter,
        updatedAt: serverTimestamp()
      });

      // Sync user_gamification document if it exists
      const gSnap = await transaction.get(gamificationRef);
      if (gSnap.exists()) {
        transaction.update(gamificationRef, {
          bmpBalance: balanceAfter,
          updatedAt: serverTimestamp()
        });
      }

      const txData: Omit<WalletTransaction, 'id' | 'createdAt'> & { createdAt: any } = {
        walletId: walletRef.id,
        userId,
        provider: this.id,
        type: 'DEBIT',
        amount,
        balanceBefore,
        balanceAfter,
        source,
        description,
        createdAt: serverTimestamp(),
      };
      if (referenceId) txData.referenceId = referenceId;

      transaction.set(txRef, txData);
    });

    return txRef.id;
  }
};
