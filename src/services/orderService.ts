import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';

export const orderService = {
  async createOrder(orderData: any): Promise<string> {
    const db = getFirebaseDb();
    const itemRef = doc(collection(db, 'orders'));
    const id = itemRef.id;
    
    await setDoc(itemRef, {
      ...orderData,
      id,
      type: 'order',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  },

  async updateOrderStatus(id: string, status: string, ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'orders', id);
    await updateDoc(itemRef, {
      orderStatus: status,
      updatedAt: serverTimestamp(),
    });
  },

  async getOrdersBySeller(sellerId: string, ...args: any[]): Promise<any> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  async getOrdersByBuyer(buyerId: string): Promise<any> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },
  
  // Backward compatibility
  async getStoreOrders(storeId: string) {
    return this.getOrdersBySeller(storeId);
  },
  async getOrderById(id: string): Promise<any> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'orders', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as any : null;
  },
  async getOrderItems(orderId: string) {
    return [];
  },
  async updateLogisticsDetails(orderId: string, details: any, ...args: any[]) {
    return this.updateOrderStatus(orderId, 'Shipped');
  },
  async getBusinessOrders(businessId: string): Promise<any> {
    return this.getOrdersBySeller(businessId);
  },
  async createFromSession(session: any, items: any[]) {
    const db = getFirebaseDb();
    
    // Check if order already exists for this session
    const q = query(collection(db, 'orders'), where('sessionId', '==', session.sessionId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      // return the first matching order id
      return snap.docs[0].id;
    }

    const orderData = { 
      session, 
      items, 
      sessionId: session.sessionId,
      orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      businessId: session.storeId || session.businessId || 'UNKNOWN',
      buyerId: session.userId || session.userUid || 'UNKNOWN',
      grandTotal: session.total || 0,
      orderStatus: 'PENDING_PAYMENT'
    };
    return this.createOrder(orderData);
  },
  async getOrder(orderId: string): Promise<any> {
    return this.getOrderById(orderId);
  },
  async getCustomerOrders(customerId: string): Promise<any> {
    return this.getOrdersByBuyer(customerId);
  },
  async getOrderTimeline(orderId: string) {
    return [];
  },
  async updatePaymentStatus(orderId: string, status: string, method?: string, ...args: any[]) {
    return this.updateOrderStatus(orderId, status);
  },
  async updateFulfillmentStatus(orderId: string, status: string, data?: any, note?: string, ...args: any[]) {
    return this.updateOrderStatus(orderId, status);
  }
};
