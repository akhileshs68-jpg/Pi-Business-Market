import fs from 'fs';
let content = fs.readFileSync('src/services/paymentService.ts', 'utf8');

// Update createTransaction signature and implementation
content = content.replace(
  /async createTransaction[\s\S]*?return paymentId;\n  },/,
  `async createTransaction(data: {
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
    
    const paymentId = \`PAY_\${Math.random().toString(36).substring(2, 10).toUpperCase()}\`;
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
      currency: data.currency || 'PI_TEST',
      amount: data.amount,
      status: 'Pending',
      paymentMethod: data.paymentMethod || 'pi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(paymentRef, record);
    return paymentId;
  },`
);

// Add recordPaymentHistory and other functions if needed
content = content.replace(
  /async updateTransactionStatus[\s\S]*?async getBusinessPayments/g,
  `async updateTransactionStatus(paymentId: string, status: string, txid?: string): Promise<void> {
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
  async getBusinessPayments`
);

content = content.replace(
  /buyerId: params\.payerUid,\n\s*businessId: params\.payeeUid,/,
  "userId: params.payerUid,\n    sellerId: params.payeeUid,\n    businessId: params.payeeUid,\n    storeId: params.payeeUid,\n    productIds: [],"
);

fs.writeFileSync('src/services/paymentService.ts', content);
