import { collection, arrayUnion, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { notificationService } from './notificationService';

export const orderService = {
      async createOrder(orderData: any): Promise<string> {
    const db = getFirebaseDb();
    const itemRef = doc(collection(db, 'orders'));
    const id = itemRef.id;
    
    // Sanitize orderData
    const sanitizedData: any = {};
    Object.entries(orderData).forEach(([key, val]) => {
      if (val !== undefined && !Number.isNaN(val)) {
        if (key === 'items' && Array.isArray(val)) {
          sanitizedData[key] = val.map(item => {
            const cleanItem: any = {};
            Object.entries(item).forEach(([k, v]) => {
               if (v !== undefined && !Number.isNaN(v)) cleanItem[k] = v;
            });
            return cleanItem;
          });
        } else {
          sanitizedData[key] = val;
        }
      }
    });

    await setDoc(itemRef, {
      ...sanitizedData,
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

    // Trigger BMP Gamification Purchase Reward
    try {
      const { gamificationService } = await import('./gamificationService');
      await gamificationService.processOrderReward(
        orderData.buyerId,
        orderData.sellerId || orderData.businessId || 'PI-CORP-001',
        id,
        Number(orderData.grandTotal || orderData.totalAmount || 0)
      );
    } catch (rewardErr) {
      console.warn("Failed to process BMP purchase reward", rewardErr);
    }

    return id;
  },

  async updateOrderStatus(id: string, status: string, ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(itemRef);

    let updates: any = {
      orderStatus: status,
      currentStatus: status.toLowerCase(),
      updatedAt: serverTimestamp(),
    };

    if (orderSnap.exists()) {
      const order = orderSnap.data();

      // If cancelling, restore stock
      if (status === 'cancelled' && order.orderStatus !== 'Cancelled' && order.items) {
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

      // Handle timeline timestamps
      if (status === 'accepted' || status === 'processing') updates.acceptedAt = serverTimestamp();
      if (status === 'packed' || status === 'ready_for_pickup') updates.packedAt = serverTimestamp();
      if (status === 'shipped') updates.shippedAt = serverTimestamp();
      if (status === 'delivered' || status === 'completed') updates.deliveredAt = serverTimestamp();

      // Log activity
      let logMessage = `Order status updated to ${status}`;
      if (status === 'accepted') logMessage = 'Seller Accepted';
      if (status === 'packed') logMessage = 'Packed';
      if (status === 'shipped') logMessage = 'Shipped';
      if (status === 'delivered') logMessage = 'Delivered';

      updates.activityLogs = arrayUnion({
        timestamp: new Date().toISOString(),
        message: logMessage
      });
      
      await updateDoc(itemRef, updates);

      try {
        await notificationService.notify(
          order.buyerId,
          'order_update',
          'Order Status Updated',
          `Your order ${order.orderNumber || ''} is now ${status}.`,
          { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
        );
      } catch (e) {
        console.warn("Failed to notify buyer of status change", e);
      }
    } else {
      await updateDoc(itemRef, updates);
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

    const orderData: any = {
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
      orderStatus: session.orderStatus || 'PENDING_PAYMENT',
      paymentStatus: session.paymentStatus || 'pending',
      currency: session.currency || 'Pi',
      amount: session.amount || session.total || session.grandTotal || 0,
      items
    };
    if (session.shippingAddress) orderData.shippingAddress = session.shippingAddress;
    if (session.billingAddress) orderData.billingAddress = session.billingAddress;
    if (session.paymentId) orderData.paymentId = session.paymentId;
    if (session.transactionId) orderData.transactionId = session.transactionId;
    if (session.timestamp) orderData.timestamp = session.timestamp;

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
    if (status === 'Paid' || status === 'completed') {
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
