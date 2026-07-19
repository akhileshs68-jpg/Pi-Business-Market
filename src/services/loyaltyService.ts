/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc,
  writeBatch,
  Timestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  LoyaltyAccount, 
  LoyaltyTransaction, 
  LoyaltyTier 
} from '../types';

const POINTS_PER_PI = 10; // Base earning rate

export const loyaltyService = {
  /**
   * GET OR CREATE ACCOUNT
   */
  async getOrCreateAccount(customerId: string, businessId: string): Promise<LoyaltyAccount> {
    const db = getFirebaseDb();
    const accountId = `LOY_${customerId}`;
    const accountRef = doc(db, 'loyaltyAccounts', accountId);
    
    const snap = await getDoc(accountRef);
    if (snap.exists()) return snap.data() as LoyaltyAccount;

    const newAccount: LoyaltyAccount = {
      accountId,
      customerId,
      businessId,
      pointsBalance: 0,
      tier: 'bronze',
      lifetimePoints: 0
    };

    await setDoc(accountRef, newAccount);
    return newAccount;
  },

  /**
   * EARN POINTS
   */
  async earnPoints(
    customerId: string, 
    businessId: string, 
    amountPi: number, 
    orderId: string
  ): Promise<number> {
    const db = getFirebaseDb();
    const points = Math.floor(amountPi * POINTS_PER_PI);
    const accountId = `LOY_${customerId}`;
    const transactionId = `LTRX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

    await runTransaction(db, async (transaction) => {
      const accountRef = doc(db, 'loyaltyAccounts', accountId);
      const accSnap = await transaction.get(accountRef);
      
      let currentPoints = 0;
      let lifetime = 0;

      if (!accSnap.exists()) {
        transaction.set(accountRef, {
          accountId,
          customerId,
          businessId,
          pointsBalance: points,
          tier: 'bronze',
          lifetimePoints: points,
          lastEarnedAt: serverTimestamp()
        });
        lifetime = points;
      } else {
        const data = accSnap.data() as LoyaltyAccount;
        currentPoints = data.pointsBalance + points;
        lifetime = data.lifetimePoints + points;
        
        const newTier = this.calculateTier(lifetime);

        transaction.update(accountRef, {
          pointsBalance: increment(points),
          lifetimePoints: increment(points),
          tier: newTier,
          lastEarnedAt: serverTimestamp()
        });
      }

      // Record transaction
      const trxRef = doc(db, 'loyaltyTransactions', transactionId);
      transaction.set(trxRef, {
        transactionId,
        accountId,
        type: 'earn',
        points,
        referenceType: 'order',
        referenceId: orderId,
        createdAt: serverTimestamp()
      });
    });

    return points;
  },

  /**
   * REDEEM POINTS
   */
  async redeemPoints(
    customerId: string, 
    businessId: string, 
    points: number, 
    description: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const accountId = `LOY_${customerId}`;
    const transactionId = `LTRX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

    await runTransaction(db, async (transaction) => {
      const accountRef = doc(db, 'loyaltyAccounts', accountId);
      const accSnap = await transaction.get(accountRef);

      if (!accSnap.exists()) throw new Error('Loyalty account not found');
      const data = accSnap.data() as LoyaltyAccount;
      
      if (data.pointsBalance < points) throw new Error('Insufficient points');

      transaction.update(accountRef, {
        pointsBalance: increment(-points),
        lastRedeemedAt: serverTimestamp()
      });

      const trxRef = doc(db, 'loyaltyTransactions', transactionId);
      transaction.set(trxRef, {
        transactionId,
        accountId,
        type: 'redeem',
        points,
        referenceType: 'redemption',
        referenceId: description,
        createdAt: serverTimestamp()
      });
    });
  },

  /**
   * RETRIEVAL
   */
  async getTransactions(accountId: string): Promise<LoyaltyTransaction[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'loyaltyTransactions'),
      where('accountId', '==', accountId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToTransaction(doc));
  },

  /**
   * HELPERS
   */
  calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= 50000) return 'diamond';
    if (lifetimePoints >= 20000) return 'platinum';
    if (lifetimePoints >= 10000) return 'gold';
    if (lifetimePoints >= 5000) return 'silver';
    return 'bronze';
  },

  mapDocToTransaction(doc: any): LoyaltyTransaction {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    } as LoyaltyTransaction;
  }
};
