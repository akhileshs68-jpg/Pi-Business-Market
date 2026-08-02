import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { PaymentRecord, PaymentMethodId, PaymentStatusType } from '../types/payment';
import { piPaymentService } from './piPaymentService';
import { orderService } from './orderService';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.error('Error getting auth token:', err);
  }
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
  }): Promise<string> {
    const db = getFirebaseDb();
    
    if (data.orderId) {
      const q = query(collection(db, 'payments'), where('orderId', '==', data.orderId), where('status', '==', 'Pending'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
    }
    
    const paymentId = `PAY_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const paymentRef = doc(db, 'payments', paymentId);
    
    const record = {
      paymentId,
      transactionId: '',
      userId: data.userId,
      sellerId: data.sellerId,
      businessId: data.businessId,
      storeId: data.storeId,
      orderId: data.orderId || '',
      productIds: data.productIds,
      currency: data.currency || 'BMP',
      amount: data.amount,
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
      
      await updateDoc(paymentRef, updates);

      const headers = await getAuthHeaders();
      await fetch('/api/payments/status', {
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
    const db = getFirebaseDb();
    const q = query(collection(db, 'payments'), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async getCustomerPayments(customerId: string): Promise<any[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'payments'), where('userId', '==', customerId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    await piPaymentService.createPayment({ amount, memo, metadata }, {
      onReadyForServerApproval: async (piPaymentId: string) => {
        try {
          const res = await fetch('/api/payments/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: piPaymentId, metadata })
          });
          if (!res.ok) throw new Error('Server approval failed');
          // Server handles Processing state
        } catch (err: any) {
          console.error(err);
        }
      },
      onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch('/api/payments/complete', {
            method: 'POST',
            headers,
            body: JSON.stringify({ paymentId: piPaymentId, txid, metadata })
          });
          if (!res.ok) throw new Error('Verification Failed');
          
          // Server handles Completed state
          onSuccess(txid);
          
          // Note: The backend / webhook should ideally update the order status
          // But for immediate UI feedback we can also update the order if we have it
          if (metadata.orderId) {
            // Server handles order Paid state
          }
        } catch (err: any) {
          console.error(err);
          await this.updateTransactionStatus(paymentId, 'Failed');
          onError('Verification Failed');
        }
      },
      onCancel: async (piPaymentId: string) => {
        await this.updateTransactionStatus(paymentId, 'Cancelled');
        onError('Payment cancelled by user');
      },
      onError: async (error: Error, piPaymentId: string) => {
        await this.updateTransactionStatus(paymentId, 'Failed');
        onError(error.message);
      }
    });
  }
};

// Backward compatibility methods for existing code
(paymentService as any).createPaymentIntent = async function(params: any) {
  // Map old params to new system if possible
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
  return; 
};
// More backward compatibility
(paymentService as any).getBusinessPayments = async function(businessId: string): Promise<any[]> {
  return [];
};
(paymentService as any).getCustomerPayments = async function(customerId: string): Promise<any[]> {
  return [];
};

(paymentService as any).getBusinessPayments = async function(businessId: string): Promise<any[]> {
  return [];
};
(paymentService as any).getCustomerPayments = async function(customerId: string): Promise<any[]> {
  return [];
};
