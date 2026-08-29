import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../../firebase/config';
import { WalletProvider, WalletTransaction } from '../walletTypes';
import { getCanonicalRewardUserId } from '../../rewards/rewardIdentityResolver';

export const bmpRewardsProvider: WalletProvider = {
  id: 'bmp_rewards',
  name: 'BMP Rewards',

  async getBalance(userId: string): Promise<number> {
    const canonicalUserId = await getCanonicalRewardUserId(userId);
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${canonicalUserId}_bmp_rewards`);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      return snap.data().balance || 0;
    }

    // Auto-migrate or initialize wallet document with defaults if it does not exist
    try {
      const gamificationRef = doc(db, 'user_gamification', canonicalUserId);
      const gamificationSnap = await getDoc(gamificationRef);
      
      let initialBalance = 0; // Canonical initial zero balance
      let initialLifetime = 0;

      if (gamificationSnap.exists()) {
        const gData = gamificationSnap.data();
        initialBalance = gData.bmpBalance ?? gData.lifetimeBmp ?? 0;
        initialLifetime = gData.lifetimeBmp ?? initialBalance;
      }

      await runTransaction(db, async (transaction) => {
        const txRef = doc(collection(db, 'wallet_transactions'));
        transaction.set(walletRef, {
          userId: canonicalUserId,
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
          userId: canonicalUserId,
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
      return 0;
    }
  },

  async credit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string> {
    const canonicalUserId = await getCanonicalRewardUserId(userId);
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${canonicalUserId}_bmp_rewards`);
    const gamificationRef = doc(db, 'user_gamification', canonicalUserId);
    const txRef = doc(collection(db, 'wallet_transactions'));

    await runTransaction(db, async (transaction) => {
      // PHASE 1 — ALL READS (Must be done before ANY writes)
      const walletDoc = await transaction.get(walletRef);
      const gSnap = await transaction.get(gamificationRef);

      // PHASE 2 — CALCULATIONS
      const balanceBefore = walletDoc.exists() ? walletDoc.data().balance || 0 : 0;
      const balanceAfter = balanceBefore + amount;

      // PHASE 3 — ALL WRITES
      if (!walletDoc.exists()) {
        transaction.set(walletRef, {
          userId: canonicalUserId,
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
      if (gSnap.exists()) {
        transaction.update(gamificationRef, {
          bmpBalance: balanceAfter,
          updatedAt: serverTimestamp()
        });
      }

      const txData: Omit<WalletTransaction, 'id' | 'createdAt'> & { createdAt: any } = {
        walletId: walletRef.id,
        userId: canonicalUserId,
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

      // Create Immutable Master Reward Ledger Entry atomically
      const ledgerId = `mledg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const ledgerRef = doc(db, 'master_ledger', ledgerId);
      transaction.set(ledgerRef, {
        entryId: ledgerId,
        transactionId: txRef.id,
        walletAddress: `pi_addr_${canonicalUserId.substring(0, 10)}`,
        userId: canonicalUserId,
        asset: 'BMP_REWARD',
        amount,
        beforeBalance: balanceBefore,
        afterBalance: balanceAfter,
        referenceId: referenceId || txRef.id,
        source: 'REWARD',
        status: 'CONFIRMED',
        hash: `0x_mledg_bmp_${Math.random().toString(36).substring(2, 14)}`,
        blockHeight: 18492042,
        memo: description,
        rewardId: txRef.id,
        walletId: walletRef.id,
        rewardType: source,
        credit: amount,
        debit: 0,
        auditReference: `audit_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    });

    // Sync master wallet document asynchronously without blocking to avoid circular dependency
    import('../../blockchain/masterWalletService').then(({ masterWalletService }) => {
      masterWalletService.syncMasterWalletDoc(canonicalUserId).catch(err => {
        console.warn('Asynchronous master wallet synchronization failed:', err);
      });
    }).catch(() => {});

    return txRef.id;
  },

  async debit(userId: string, amount: number, source: WalletTransaction['source'], description: string, referenceId?: string): Promise<string> {
    const canonicalUserId = await getCanonicalRewardUserId(userId);
    const db = getFirebaseDb();
    const walletRef = doc(db, 'wallets', `${canonicalUserId}_bmp_rewards`);
    const gamificationRef = doc(db, 'user_gamification', canonicalUserId);
    const txRef = doc(collection(db, 'wallet_transactions'));

    await runTransaction(db, async (transaction) => {
      // PHASE 1 — ALL READS (Must be done before ANY writes)
      const walletDoc = await transaction.get(walletRef);
      const gSnap = await transaction.get(gamificationRef);

      // PHASE 2 — CALCULATIONS
      const balanceBefore = walletDoc.exists() ? walletDoc.data().balance || 0 : 0;
      
      if (balanceBefore < amount) {
        throw new Error(`Insufficient BMP Rewards balance (Available: ${balanceBefore} BMP, Required: ${amount} BMP)`);
      }

      const balanceAfter = balanceBefore - amount;

      // PHASE 3 — ALL WRITES
      transaction.update(walletRef, {
        balance: balanceAfter,
        updatedAt: serverTimestamp()
      });

      // Sync user_gamification document if it exists
      if (gSnap.exists()) {
        transaction.update(gamificationRef, {
          bmpBalance: balanceAfter,
          updatedAt: serverTimestamp()
        });
      }

      const txData: Omit<WalletTransaction, 'id' | 'createdAt'> & { createdAt: any } = {
        walletId: walletRef.id,
        userId: canonicalUserId,
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

      // Create Immutable Master Reward Ledger Entry atomically
      const ledgerId = `mledg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const ledgerRef = doc(db, 'master_ledger', ledgerId);
      transaction.set(ledgerRef, {
        entryId: ledgerId,
        transactionId: txRef.id,
        walletAddress: `pi_addr_${canonicalUserId.substring(0, 10)}`,
        userId: canonicalUserId,
        asset: 'BMP_REWARD',
        amount: -amount,
        beforeBalance: balanceBefore,
        afterBalance: balanceAfter,
        referenceId: referenceId || txRef.id,
        source: 'REWARD',
        status: 'CONFIRMED',
        hash: `0x_mledg_bmp_${Math.random().toString(36).substring(2, 14)}`,
        blockHeight: 18492042,
        memo: description,
        rewardId: txRef.id,
        walletId: walletRef.id,
        rewardType: source,
        credit: 0,
        debit: amount,
        auditReference: `audit_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    });

    // Sync master wallet document asynchronously without blocking to avoid circular dependency
    import('../../blockchain/masterWalletService').then(({ masterWalletService }) => {
      masterWalletService.syncMasterWalletDoc(canonicalUserId).catch(err => {
        console.warn('Asynchronous master wallet synchronization failed:', err);
      });
    }).catch(() => {});

    return txRef.id;
  }
};
