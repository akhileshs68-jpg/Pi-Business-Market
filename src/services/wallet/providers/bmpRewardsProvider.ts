import { collection, doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../../firebase/config';
import { WalletProvider, WalletTransaction } from '../walletTypes';

export const bmpRewardsProvider: WalletProvider = {
  id: 'bmp_rewards',
  name: 'BMP Rewards',

  async getBalance(userId: string): Promise<number> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'wallets', `${userId}_bmp_rewards`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().balance || 0;
    }
    return 0;
  },

  async credit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${userId}_bmp_rewards`);
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
    const walletRef = doc(db, 'wallets', `${userId}_bmp_rewards`);
    const txRef = doc(collection(db, 'wallet_transactions'));

    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      const balanceBefore = walletDoc.exists() ? walletDoc.data().balance || 0 : 0;
      
      if (balanceBefore < amount) {
        throw new Error('Insufficient BMP Rewards balance');
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
