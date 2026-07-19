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
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  Order, 
  PaymentIntent, 
  Payment, 
  PaymentIntentStatus, 
  PaymentStatus, 
  PaymentReceipt,
  Refund
} from '../types';
import { ledgerService } from './ledgerService';
import { orderService } from './orderService';
import { analyticsService } from './analyticsService';
import { auditService } from './auditService';
import { withRetry } from '../lib/retry';

export const paymentService = {
  /**
   * CREATE PAYMENT INTENT
   * First step in the payment flow
   */
  async createPaymentIntent(order: Order): Promise<PaymentIntent> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const paymentIntentId = `PII_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      
      const intent: PaymentIntent = {
        paymentIntentId,
        orderId: order.orderId,
        customerUid: order.userUid,
        businessId: order.businessId,
        storeId: order.storeId,
        currency: order.currency,
        amount: order.grandTotal,
        status: PaymentIntentStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'paymentIntents', paymentIntentId), {
        ...intent,
        createdAt: serverTimestamp()
      });

      return intent;
    });
  },

  /**
   * VERIFY PI PAYMENT (MOCK BACKEND VERIFICATION)
   * In a real app, this would be a server-side cloud function that calls Pi API
   */
  async verifyAndProcessPayment(
    paymentIntentId: string, 
    piTransactionId: string,
    actorUid: string
  ): Promise<Payment> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      
      // 1. Fetch Intent
      const intentSnap = await getDoc(doc(db, 'paymentIntents', paymentIntentId));
      if (!intentSnap.exists()) throw new Error('Payment intent not found');
      const intent = intentSnap.data() as PaymentIntent;

      // 2. Mock Server-Side Verification with Pi Network API
      // const verification = await piNetworkApi.verifyTransaction(piTransactionId);
      const isVerified = true; // Simulated success

      const paymentId = `PAY_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      
      const payment: Payment = {
        paymentId,
        paymentIntentId,
        piTransactionId,
        orderId: intent.orderId,
        payerUid: intent.customerUid,
        payeeBusinessId: intent.businessId,
        amount: intent.amount,
        currency: intent.currency,
        provider: 'pi_network',
        verificationStatus: isVerified ? 'verified' : 'failed',
        paymentStatus: isVerified ? PaymentStatus.PAID : PaymentStatus.FAILED,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const batch = writeBatch(db);

      // 3. Save Payment Record
      batch.set(doc(db, 'payments', paymentId), {
        ...payment,
        paidAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // 4. Update Intent Status
      batch.update(doc(db, 'paymentIntents', paymentIntentId), {
        status: PaymentIntentStatus.COMPLETED,
        updatedAt: serverTimestamp()
      });

      // 5. Update Order Status
      await orderService.updatePaymentStatus(intent.orderId, PaymentStatus.PAID, actorUid, 'System');
      
      // 6. Record in Ledger
      await ledgerService.recordPayment(payment);

      // 7. Generate Receipt
      const receiptId = `RCPT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const receiptNumber = `PI-INV-${Date.now().toString().slice(-6)}`;
      
      batch.set(doc(db, 'paymentReceipts', receiptId), {
        receiptId,
        paymentId,
        orderId: intent.orderId,
        receiptNumber,
        issuedAt: serverTimestamp()
      });

      await batch.commit();

      // ANALYTICS & AUDIT
      try {
        await analyticsService.trackEvent({
          eventType: 'payment_success',
          entityType: 'order',
          entityId: intent.orderId,
          businessId: intent.businessId,
          userUid: intent.customerUid,
          metadata: { 
            amount: intent.amount, 
            currency: intent.currency,
            piTransactionId
          }
        });

        await auditService.logAction(
          actorUid,
          'System', 
          'PAYMENT_VERIFIED',
          'order',
          intent.orderId,
          `Payment of ${intent.amount} ${intent.currency} verified for order ${intent.orderId}`
        );
      } catch (err) {
        console.error('Post-payment analytics/audit failed', err);
      }

      return payment;
    });
  },

  /**
   * RETRIEVAL
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'payments', paymentId));
    if (!snap.exists()) return null;
    return this.mapDocToPayment(snap);
  },

  async getOrderPayment(orderId: string): Promise<Payment | null> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'payments'), where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToPayment(snapshot.docs[0]);
  },

  async getBusinessPayments(businessId: string): Promise<Payment[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'payments'), 
      where('payeeBusinessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToPayment(doc));
  },

  /**
   * HELPERS
   */
  mapDocToPayment(doc: any): Payment {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      paidAt: data.paidAt instanceof Timestamp ? data.paidAt.toDate().toISOString() : data.paidAt,
    } as Payment;
  }
};
