import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { PaymentRecord, PaymentMethodId, PaymentStatusType } from '../types/payment';
import { piPaymentService } from './piPaymentService';
import { orderService } from './orderService';

export const paymentService = {
  
  async createTransaction(data: {
    buyerId: string;
    businessId: string;
    orderId?: string;
    bookingId?: string;
    currency: string;
    paymentMethod: PaymentMethodId;
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
      ...data,
      status: 'Pending' as PaymentStatusType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(paymentRef, record);
    return paymentId;
  },

  async updateTransactionStatus(paymentId: string, status: PaymentStatusType, txid?: string): Promise<void> {
    try {
      await fetch('/api/payments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: paymentId, status, txid })
      });
    } catch(err) {
      console.error('Failed to update status', err);
    }
  },
  async getBusinessPayments(businessId: string): Promise<any[]> {
    return [];
  },
  async getCustomerPayments(customerId: string): Promise<any[]> {
    return [];
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
          const res = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: piPaymentId, txid, metadata })
          });
          if (!res.ok) throw new Error('Server completion failed');
          
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
          onError(err.message || 'Payment completion failed');
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
    buyerId: params.payerUid,
    businessId: params.payeeUid,
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
