import { collection, doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../../firebase/config';
import { WalletProvider, WalletTransaction } from '../walletTypes';

export const piTestnetProvider: WalletProvider = {
  id: 'pi_testnet',
  name: 'Pi Testnet Wallet',

  async getBalance(userId: string): Promise<number> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${userId}_pi_testnet`);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      return snap.data().balance || 0;
    }

    // Initialize with a default balance of 100 Pi Testnet for demo / onboarding purposes
    try {
      await runTransaction(db, async (transaction) => {
        const txRef = doc(collection(db, 'wallet_transactions'));
        transaction.set(walletRef, {
          userId,
          provider: this.id,
          balance: 100.0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        transaction.set(txRef, {
          walletId: walletRef.id,
          userId,
          provider: this.id,
          type: 'CREDIT',
          amount: 100.0,
          balanceBefore: 0,
          balanceAfter: 100.0,
          source: 'BALANCE_MIGRATION',
          description: 'Initial Wallet Creation & Testnet Balance Onboarding',
          createdAt: serverTimestamp()
        });
      });

      return 100.0;
    } catch (err) {
      console.warn('Failed to auto-create Pi Testnet wallet doc:', err);
      return 100.0;
    }
  },

  async credit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${userId}_pi_testnet`);
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.update(walletRef, {
          balance: balanceAfter,
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
    const walletRef = doc(db, 'wallets', `${userId}_pi_testnet`);
    const txRef = doc(collection(db, 'wallet_transactions'));

    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      const balanceBefore = walletDoc.exists() ? walletDoc.data().balance || 0 : 0;

      if (balanceBefore < amount) {
        throw new Error(`Insufficient Pi Testnet balance (Available: ${balanceBefore} Pi, Required: ${amount} Pi)`);
      }

      const balanceAfter = balanceBefore - amount;

      transaction.update(walletRef, {
        balance: balanceAfter,
        updatedAt: serverTimestamp()
      });

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
