import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { notificationService } from './notificationService';

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
    
    // Notify Buyer and Seller
    try {
       await notificationService.notify(
         orderData.buyerId,
         'order_update',
         'Order Created',
         `Your order ${orderData.orderNumber} has been successfully placed.`,
         { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
       );
       await notificationService.notify(
         orderData.sellerId,
         'order_update',
         'New Order Received',
         `You received a new order ${orderData.orderNumber} for ${orderData.grandTotal} Pi.`,
         { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
       );
    } catch (e) {
      console.warn("Failed to send order creation notifications", e);
    }

    return id;
  },

  async updateOrderStatus(id: string, status: string, ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(itemRef);

    if (orderSnap.exists()) {
      const order = orderSnap.data();

      // If cancelling, restore stock
      if (status === 'Cancelled' && order.orderStatus !== 'Cancelled' && order.items) {
        for (const item of order.items) {
          if (item.productId) {
            const productRef = doc(db, 'products', item.productId);
            const pSnap = await getDoc(productRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              const newStock = (pData.stock || 0) + (item.quantity || 1);
              await updateDoc(productRef, { stock: newStock });
            }
          }
        }
      }
    }

    await updateDoc(itemRef, {
      orderStatus: status,
      updatedAt: serverTimestamp(),
    });

    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      try {
        await notificationService.notify(
          orderData.buyerId,
          'order_update',
          'Order Status Updated',
          `Your order ${orderData.orderNumber || ''} is now ${status}.`,
          { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
        );
      } catch (e) {
        console.warn("Failed to notify buyer of status change", e);
      }
    }
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
      sessionId: session.sessionId,
      orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      businessId: session.storeId || session.businessId || 'UNKNOWN',
      buyerId: session.userId || session.userUid || 'UNKNOWN',
      userUid: session.userId || session.userUid || 'UNKNOWN', // For UI compatibility
      sellerId: session.storeId || session.businessId || 'UNKNOWN',
      storeId: session.storeId || session.businessId || 'UNKNOWN', // For UI compatibility
      grandTotal: session.total || session.grandTotal || 0,
      subtotal: session.subtotal || 0,
      tax: session.tax || 0,
      shipping: session.shipping || 0,
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'pending',
      currency: session.currency || 'Pi',
      shippingAddress: session.shippingAddress || null,
      billingAddress: session.billingAddress || null,
      items
    };

    const id = await this.createOrder(orderData);
    
    // update orderId
    await updateDoc(doc(db, 'orders', id), { orderId: id });
    
    // Reduce stock for items
    try {
      for (const item of items) {
        if (item.productId) {
           const productRef = doc(db, 'products', item.productId);
           const pSnap = await getDoc(productRef);
           if (pSnap.exists()) {
             const pData = pSnap.data();
             const newStock = Math.max(0, (pData.stock || 0) - (item.quantity || 1));
             await updateDoc(productRef, { stock: newStock });
           }
        }
      }
    } catch(e) {
      console.warn("Could not reduce stock", e);
    }
    
    return id;
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
    await this.updateOrderStatus(orderId, status); // Backward compatibility
    
    // Also explicitly notify for Payment
    if (status === 'Paid' || status === 'Completed') {
       try {
         const order = await this.getOrderById(orderId);
         if (order) {
            await notificationService.notify(
              order.sellerId,
              'payment_update',
              'Payment Received',
              `Payment of ${order.grandTotal} Pi received for Order ${order.orderNumber}.`,
              { entityId: orderId, entityType: 'order', linkTo: `/order-details/${orderId}` }
            );
         }
       } catch (e) {
         console.warn("Could not notify payment status", e);
       }
    }
  },
  async updateFulfillmentStatus(orderId: string, status: string, data?: any, note?: string, ...args: any[]) {
    return this.updateOrderStatus(orderId, status);
  }
};
