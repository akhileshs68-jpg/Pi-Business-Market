import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { PaymentRecord, PaymentMethodId, PaymentStatusType } from '../types/payment';
import { piPaymentService } from './piPaymentService';
import { orderService } from './orderService';
import { EnterpriseCheckoutEngine } from '../core/checkout/enterpriseCheckoutEngine';
import { getAbsoluteUrl } from '../utils/urlUtils';

async function getAuthHeaders(): Promise<Record<string, string>> {
  console.log('[DEBUG_TRACE] [getAuthHeaders] ENTER (paymentService)');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const auth = getFirebaseAuth();
    if (auth) {
      if (!auth.currentUser) {
        console.log('[DEBUG_TRACE] [getAuthHeaders] No active currentUser (paymentService). Triggering signInAnonymously()...');
        try {
          const { signInAnonymously } = await import('firebase/auth');
          const cred = await signInAnonymously(auth);
          console.log('[DEBUG_TRACE] [getAuthHeaders] signInAnonymously succeeded (paymentService). UID:', cred?.user?.uid);
        } catch (signInErr) {
          console.error('[DEBUG_TRACE] [getAuthHeaders] signInAnonymously error (paymentService):', signInErr);
        }
      }

      if (auth.currentUser) {
        console.log('[DEBUG_TRACE] [getAuthHeaders] Firebase currentUser found (paymentService). UID:', auth.currentUser.uid);
        console.log('[DEBUG_TRACE] [getAuthHeaders] Token acquisition step: calling auth.currentUser.getIdToken(true)...');
        const token = await auth.currentUser.getIdToken(true).catch((tokenErr) => {
          console.error('[DEBUG_TRACE] [getAuthHeaders] getIdToken() failed (paymentService):', tokenErr);
          return null;
        });
        if (token) {
          console.log('[DEBUG_TRACE] [getAuthHeaders] Firebase token successfully acquired (paymentService) (len:', token.length, ')');
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('[DEBUG_TRACE] [getAuthHeaders] getIdToken() returned null or empty string (paymentService)');
        }
      } else {
        console.warn('[DEBUG_TRACE] [getAuthHeaders] Still no active Firebase currentUser after auth attempt (paymentService)');
      }
    } else {
      console.warn('[DEBUG_TRACE] [getAuthHeaders] getFirebaseAuth() returned null (paymentService)');
    }
  } catch (err) {
    console.error('[DEBUG_TRACE] [getAuthHeaders] Error retrieving Firebase token (paymentService):', err);
  }
  console.log('[DEBUG_TRACE] [getAuthHeaders] EXIT (paymentService). Has Authorization header:', !!headers['Authorization']);
  return headers;
}

export const paymentService = {
  
  async createTransaction(data: {
    userId: string;
    sellerId: string;
    businessId: string;
    storeId: string;
    orderId?: string;
    productIds: string[];
    currency: string;
    paymentMethod: string;
    amount: number;
    pricingQuoteId?: string;
    pricingSnapshot?: any;
    rateUsed?: number | null;
    rateSource?: string;
    rateTimestamp?: string | null;
    piAmount?: number;
  }): Promise<string> {
    const db = getFirebaseDb();
    
    if (data.orderId) {
      const q = query(collection(db, 'payments'), where('orderId', '==', data.orderId), where('status', '==', 'Pending'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
    }

    const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
    const canonicalUser = data.userId ? await getCanonicalRewardUserId(data.userId) : '';
    const canonicalSeller = data.sellerId ? await getCanonicalRewardUserId(data.sellerId) : '';
    
    const paymentId = `PAY_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const paymentRef = doc(db, 'payments', paymentId);
    
    const record = {
      paymentId,
      transactionId: '',
      userId: canonicalUser || data.userId,
      buyerId: canonicalUser || data.userId,
      userUid: canonicalUser || data.userId,
      piUid: canonicalUser || data.userId,
      sellerId: canonicalSeller || data.sellerId,
      businessId: data.businessId,
      storeId: data.storeId,
      orderId: data.orderId || '',
      productIds: data.productIds,
      currency: data.currency || 'BMP',
      amount: data.amount,
      piAmount: data.piAmount ?? data.amount,
      pricingQuoteId: data.pricingQuoteId || data.pricingSnapshot?.quoteId,
      pricingSnapshot: data.pricingSnapshot || null,
      rateUsed: data.rateUsed ?? data.pricingSnapshot?.rateUsed ?? null,
      rateSource: data.rateSource || data.pricingSnapshot?.rateSource,
      rateTimestamp: data.rateTimestamp || data.pricingSnapshot?.rateTimestamp,
      status: 'Pending',
      paymentMethod: data.paymentMethod || 'pi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(paymentRef, record);
    return paymentId;
  },

  async updateTransactionStatus(paymentId: string, status: string, txid?: string): Promise<void> {
    const db = getFirebaseDb();
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      const updates = {
        status,
        updatedAt: new Date().toISOString(),
        ...(txid ? { transactionId: txid } : {})
      };
      
      await setDoc(paymentRef, updates, { merge: true });

      const headers = await getAuthHeaders();
      await fetch(getAbsoluteUrl('/api/payments/status'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ transactionId: paymentId, status, txid })
      });
    } catch(err) {
      console.error('Failed to update status', err);
    }
  },
  async recordPaymentHistory(paymentId: string): Promise<void> {
    try {
      const payment = await this.getTransaction(paymentId);
      if (!payment) return;
      const db = getFirebaseDb();
      const historyRef = doc(db, 'paymentHistory', paymentId);
      await setDoc(historyRef, {
        ...payment,
        recordedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to record payment history', err);
    }
  },
  async getBusinessPayments(businessId: string): Promise<any[]> {
    if (!businessId) return [];
    const db = getFirebaseDb();
    const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
    const canonicalPiUid = await getCanonicalRewardUserId(businessId);
    const targetUids = new Set<string>([businessId, canonicalPiUid]);
    try {
      const userSnap = await getDoc(doc(db, 'users', canonicalPiUid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.firebaseUid) targetUids.add(uData.firebaseUid);
        if (uData.uid) targetUids.add(uData.uid);
      }
    } catch (e) {}

    const map = new Map<string, any>();
    for (const uid of Array.from(targetUids)) {
      const q1 = query(collection(db, 'payments'), where('businessId', '==', uid));
      const snap1 = await getDocs(q1);
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));

      const q2 = query(collection(db, 'payments'), where('sellerId', '==', uid));
      const snap2 = await getDocs(q2);
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    }
    return Array.from(map.values());
  },
  async getCustomerPayments(customerId: string): Promise<any[]> {
    if (!customerId) return [];
    const db = getFirebaseDb();
    const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
    const canonicalPiUid = await getCanonicalRewardUserId(customerId);
    const targetUids = new Set<string>([customerId, canonicalPiUid]);
    try {
      const userSnap = await getDoc(doc(db, 'users', canonicalPiUid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.firebaseUid) targetUids.add(uData.firebaseUid);
        if (uData.uid) targetUids.add(uData.uid);
      }
    } catch (e) {}

    const map = new Map<string, any>();
    for (const uid of Array.from(targetUids)) {
      const q1 = query(collection(db, 'payments'), where('userId', '==', uid));
      const snap1 = await getDocs(q1);
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));

      const q2 = query(collection(db, 'payments'), where('buyerId', '==', uid));
      const snap2 = await getDocs(q2);
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));

      const q3 = query(collection(db, 'payments'), where('userUid', '==', uid));
      const snap3 = await getDocs(q3);
      snap3.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));

      const q4 = query(collection(db, 'payments'), where('piUid', '==', uid));
      const snap4 = await getDocs(q4);
      snap4.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    }
    return Array.from(map.values());
  },

  async getTransaction(paymentId: string): Promise<PaymentRecord | null> {
    const db = getFirebaseDb();
    const docSnap = await getDoc(doc(db, 'payments', paymentId));
    if (docSnap.exists()) {
      return { ...docSnap.data() } as PaymentRecord;
    }
    return null;
  },

  async processPiPayment(
    paymentId: string, 
    amount: number, 
    memo: string,
    metadata: any,
    onSuccess: (txid: string) => void,
    onError: (err: string) => void
  ) {
    console.log('[PaymentService] Delegating payment execution to EnterpriseCheckoutEngine. Payment ID:', paymentId);

    const augmentedMetadata = {
      buyerId: metadata.buyerId || metadata.buyerUid || 'guest_pioneer',
      sellerId: metadata.sellerId || 'PI-SELLER',
      businessId: metadata.businessId || 'PI-BIZ',
      storeId: metadata.storeId || 'PI-STORE',
      orderId: metadata.orderId || metadata.sessionId || paymentId,
      sessionId: metadata.sessionId || metadata.orderId || paymentId,
      ...metadata,
      internalPaymentId: paymentId
    };

    try {
      const result = await EnterpriseCheckoutEngine.executePiTestnetPayment(
        amount,
        memo,
        augmentedMetadata.sessionId,
        augmentedMetadata
      );
      if (result.verified) {
        onSuccess(result.transactionId);
      } else {
        onError(result.errorMessage || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('[PaymentService] Exception in processPiPayment delegation:', err);
      onError(err.message || 'Payment execution failed');
    }
  }
};

/* =========================================================================
 * LEGACY / BACKWARD COMPATIBILITY DELEGATION
 * ========================================================================= */
(paymentService as any).createPaymentIntent = async function(params: any) {
  const id = await this.createTransaction({
    userId: params.payerUid,
    sellerId: params.payeeUid,
    businessId: params.payeeUid,
    storeId: params.payeeUid,
    productIds: [],
    orderId: params.orderId,
    currency: params.currency || 'Pi',
    paymentMethod: 'pi',
    amount: params.amount
  });
  return id;
};
(paymentService as any).updatePaymentStatus = async function(id: string, status: string, method?: string) {
  return this.updateTransactionStatus(id, status); 
};
