/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { FraudSignal } from './types';
import { zeroTrustService } from './zeroTrustService';

export const fraudDetectionService = {
  async evaluateWalletActivity(userUid: string, amount: number, type: 'transfer' | 'reward'): Promise<void> {
    try {
      if (amount > 100000) {
        await this.generateFraudSignal({
          targetId: userUid,
          targetType: 'wallet',
          reason: `Abnormal ${type} amount detected: ${amount}`,
          confidenceScore: 0.95
        });
      }
    } catch (err) {
      console.error('FraudDetection: Wallet evaluation failed', err);
    }
  },

  async evaluateOrder(orderId: string, userUid: string, totalAmount: number): Promise<void> {
    try {
      if (totalAmount === 0 || totalAmount > 50000) {
        await this.generateFraudSignal({
          targetId: orderId,
          targetType: 'order',
          reason: `Suspicious order amount: ${totalAmount}`,
          confidenceScore: 0.75
        });
      }
    } catch (err) {
      console.error('FraudDetection: Order evaluation failed', err);
    }
  },

  async generateFraudSignal(signalData: Omit<FraudSignal, 'signalId' | 'timestamp' | 'status'>): Promise<void> {
    try {
      const db = getFirebaseDb();
      const signalId = `FRAUD_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const docRef = doc(db, 'fraudSignals', signalId);
      const signal: FraudSignal = {
        ...signalData,
        signalId,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      await setDoc(docRef, {
        ...signal,
        timestamp: serverTimestamp()
      });
      if (signal.confidenceScore > 0.8) {
        await zeroTrustService.logSecurityEvent({
          eventType: 'FRAUD_ALERT',
          severity: 'critical',
          userUid: signal.targetType === 'user' || signal.targetType === 'wallet' ? signal.targetId : undefined,
          details: signal
        });
      }
    } catch (err) {
      console.error('FraudDetection: Signal generation failed', err);
    }
  },

  async getFraudSignals(limitCount = 50): Promise<FraudSignal[]> {
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'fraudSignals'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as FraudSignal).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error(err);
      return [];
    }
  }
};
