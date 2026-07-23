/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  LedgerEntry, 
  Payment, 
  LedgerEntryType 
} from '../types';

export const ledgerService = {
  /**
   * RECORD PAYMENT TRANSACTION
   * Creates an immutable ledger entry for a successful payment
   */
  async recordPayment(payment: Payment): Promise<string> {
    const db = getFirebaseDb();
    const ledgerId = `LEDG_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    const entry: LedgerEntry = {
      ledgerId,
      paymentId: payment.paymentId,
      businessId: payment.payeeBusinessId,
      entryType: 'sale',
      debit: 0,
      credit: payment.amount,
      currency: payment.currency,
      balanceImpact: payment.amount,
      referenceType: 'order',
      referenceId: payment.orderId,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'paymentLedger', ledgerId), {
      ...entry,
      createdAt: serverTimestamp()
    });

    return ledgerId;
  },

  /**
   * RECORD REFUND TRANSACTION
   */
  async recordRefund(payment: Payment, refundAmount: number, refundId: string): Promise<string> {
    const db = getFirebaseDb();
    const ledgerId = `LEDG_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    const entry: LedgerEntry = {
      ledgerId,
      paymentId: payment.paymentId,
      businessId: payment.payeeBusinessId,
      entryType: 'refund',
      debit: refundAmount,
      credit: 0,
      currency: payment.currency,
      balanceImpact: -refundAmount,
      referenceType: 'refund',
      referenceId: refundId,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'paymentLedger', ledgerId), {
      ...entry,
      createdAt: serverTimestamp()
    });

    return ledgerId;
  },

  /**
   * RETRIEVAL
   */
  async getBusinessLedger(businessId: string): Promise<LedgerEntry[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'paymentLedger'),
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => this.mapDocToLedger(doc));
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCustomerLedger(customerUid: string): Promise<LedgerEntry[]> {
    // Customers might want to see their own "spending ledger"
    // Implementation depends on if we store customerUid in ledger entries
    // For now, let's keep it merchant focused as per requirements
    return [];
  },

  /**
   * HELPERS
   */
  mapDocToLedger(doc: any): LedgerEntry {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    } as LedgerEntry;
  }
};
