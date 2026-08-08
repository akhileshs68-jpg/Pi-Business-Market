import { collection, arrayUnion, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { notificationService } from './notificationService';
import { OrderStatus } from '../types';
import { getCanonicalRewardUserId } from './rewards/rewardIdentityResolver';
import { getAbsoluteUrl } from '../utils/urlUtils';

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

    // Resolve canonical Pi UIDs for buyer and seller
    const rawBuyer = sanitizedData.buyerId || sanitizedData.userUid || '';
    const rawSeller = sanitizedData.sellerId || sanitizedData.businessId || '';
    if (rawBuyer) {
      const canonicalBuyer = await getCanonicalRewardUserId(rawBuyer);
      sanitizedData.buyerId = canonicalBuyer;
      sanitizedData.userUid = canonicalBuyer;
      sanitizedData.piUid = canonicalBuyer;
    }
    if (rawSeller) {
      const canonicalSeller = await getCanonicalRewardUserId(rawSeller);
      sanitizedData.sellerId = canonicalSeller;
    }

    const nowIso = new Date().toISOString();
    const orderNumber = sanitizedData.orderNumber || 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const qrCode = `PI_QR_${id}_${Date.now()}`;

    const initialLog = {
      timestamp: nowIso,
      message: 'Order Created',
      actorUid: sanitizedData.buyerId || sanitizedData.userUid || 'SYSTEM',
      role: 'buyer',
      status: sanitizedData.orderStatus || OrderStatus.PENDING_PAYMENT
    };

    const initialHistory = {
      status: sanitizedData.orderStatus || OrderStatus.PENDING_PAYMENT,
      timestamp: nowIso,
      updatedBy: sanitizedData.buyerId || sanitizedData.userUid || 'SYSTEM',
      remarks: 'Order initiated via Pi Business Market Engine'
    };

    await setDoc(itemRef, {
      ...sanitizedData,
      id,
      orderId: id,
      orderNumber,
      qrVerificationCode: qrCode,
      receiptNumber: `RCP-${orderNumber}`,
      type: 'order',
      activityLogs: [initialLog],
      historyLog: [initialHistory],
      createdAt: sanitizedData.createdAt || nowIso,
      updatedAt: nowIso,
    });
    
    // Notify Buyer and Seller
    try {
      if (sanitizedData.buyerId || sanitizedData.userUid) {
        await notificationService.notify(
          sanitizedData.buyerId || sanitizedData.userUid,
          'order_update',
          'Order Placed Successfully',
          `Your order ${orderNumber} has been placed. Track status in My Orders.`,
          { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
        );
      }
      if (sanitizedData.sellerId || sanitizedData.businessId) {
        await notificationService.notify(
          sanitizedData.sellerId || sanitizedData.businessId,
          'order_update',
          'New Enterprise Order Received',
          `New order ${orderNumber} for ${sanitizedData.grandTotal || 0} Pi received.`,
          { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
        );
      }
    } catch (e) {
      console.warn("Failed to send order creation notifications", e);
    }

    // Trigger BMP Gamification Purchase Reward
    try {
      const { gamificationService } = await import('./gamificationService');
      await gamificationService.processOrderReward(
        sanitizedData.buyerId || sanitizedData.userUid,
        sanitizedData.sellerId || sanitizedData.businessId || 'PI-CORP-001',
        id,
        Number(sanitizedData.grandTotal || sanitizedData.totalAmount || 0)
      );
    } catch (rewardErr) {
      console.warn("Failed to process BMP purchase reward", rewardErr);
    }

    return id;
  },

  async createOrderWithId(targetOrderId: string, orderData: any): Promise<string> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'orders', targetOrderId);
    const snap = await getDoc(itemRef);
    if (snap.exists()) {
      return targetOrderId;
    }

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

    const nowIso = new Date().toISOString();
    const orderNumber = sanitizedData.orderNumber || targetOrderId;
    const qrCode = `PI_QR_${targetOrderId}_${Date.now()}`;

    const initialLog = {
      timestamp: nowIso,
      message: 'Order Verified & Created',
      actorUid: sanitizedData.buyerId || sanitizedData.userUid || 'SYSTEM',
      role: 'buyer',
      status: sanitizedData.orderStatus || OrderStatus.PENDING_PAYMENT
    };

    const initialHistory = {
      status: sanitizedData.orderStatus || OrderStatus.PENDING_PAYMENT,
      timestamp: nowIso,
      updatedBy: sanitizedData.buyerId || sanitizedData.userUid || 'SYSTEM',
      remarks: 'Order verified via Pi Business Market Engine'
    };

    await setDoc(itemRef, {
      ...sanitizedData,
      id: targetOrderId,
      orderId: targetOrderId,
      orderNumber,
      qrVerificationCode: qrCode,
      receiptNumber: `RCP-${orderNumber}`,
      type: 'order',
      activityLogs: [initialLog],
      historyLog: [initialHistory],
      createdAt: sanitizedData.createdAt || nowIso,
      updatedAt: nowIso,
    });

    return targetOrderId;
  },

  async updateOrderStatus(
    id: string, 
    status: string, 
    actorUid?: string, 
    role: string = 'system', 
    remarks?: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(itemRef);

    const nowIso = new Date().toISOString();
    let updates: any = {
      orderStatus: status,
      currentStatus: status.toLowerCase(),
      updatedAt: serverTimestamp(),
    };

    if (orderSnap.exists()) {
      const order = orderSnap.data();

      // Restock on cancel or reject or return
      const isRestockState = ['cancelled', 'rejected', 'returned'].includes(status.toLowerCase());
      const wasRestockState = ['cancelled', 'rejected', 'returned'].includes((order.orderStatus || '').toLowerCase());
      
      if (isRestockState && !wasRestockState && order.items) {
        for (const item of order.items) {
          if (item.productId) {
            try {
              const productRef = doc(db, 'products', item.productId);
              const pSnap = await getDoc(productRef);
              if (pSnap.exists()) {
                const pData = pSnap.data();
                const newStock = (pData.stock || 0) + (item.quantity || 1);
                await updateDoc(productRef, { stock: newStock });
              }
            } catch (err) {
              console.warn(`Restock failed for product ${item.productId}:`, err);
            }
          }
        }
      }

      // Handle lifecycle timestamps
      const s = status.toLowerCase();
      if (s === 'payment_verified' || s === 'paid') updates.paymentVerifiedAt = nowIso;
      if (s === 'confirmed') updates.confirmedAt = nowIso;
      if (s === 'accepted') updates.acceptedAt = nowIso;
      if (s === 'preparing') updates.preparingAt = nowIso;
      if (s === 'packed') updates.packedAt = nowIso;
      if (s === 'ready_for_dispatch' || s === 'ready_for_pickup') updates.readyForDispatchAt = nowIso;
      if (s === 'shipped') updates.shippedAt = nowIso;
      if (s === 'out_for_delivery') updates.outForDeliveryAt = nowIso;
      if (s === 'delivered') updates.deliveredAt = nowIso;
      if (s === 'completed') updates.completedAt = nowIso;
      if (s === 'cancelled') updates.cancelledAt = nowIso;
      if (s === 'refund_requested') updates.refundRequestedAt = nowIso;
      if (s === 'refund_approved') updates.refundApprovedAt = nowIso;
      if (s === 'refund_completed') updates.refundCompletedAt = nowIso;
      if (s === 'escrow_released') {
        updates.escrowStatus = 'released';
        updates.escrowReleasedAt = nowIso;
      }
      if (s === 'disputed') {
        updates.disputeStatus = 'opened';
        updates.disputedAt = nowIso;
      }

      const humanMessage = remarks || `Order status updated to ${status.replace(/_/g, ' ').toUpperCase()}`;

      updates.activityLogs = arrayUnion({
        timestamp: nowIso,
        message: humanMessage,
        actorUid: actorUid || 'SYSTEM',
        role,
        status
      });

      updates.historyLog = arrayUnion({
        status,
        timestamp: nowIso,
        updatedBy: actorUid || 'SYSTEM',
        remarks: humanMessage
      });
      
      await updateDoc(itemRef, updates);

      // Trigger Merchant Verified Sale Reward when order completes or delivers or escrow is released
      if (['completed', 'delivered', 'escrow_released'].includes(s)) {
        try {
          const { gamificationService } = await import('./gamificationService');
          const seller = order.sellerId || order.businessId;
          const buyer = order.buyerId || order.userUid;
          if (seller && buyer) {
            await gamificationService.processVerifiedSaleReward(
              seller,
              buyer,
              id,
              Number(order.grandTotal || order.totalAmount || 0)
            );
          }
        } catch (rewardErr) {
          console.warn("Failed to process BMP merchant sale reward", rewardErr);
        }
      }

      // Send notifications to buyer and seller
      try {
        const buyer = order.buyerId || order.userUid;
        const seller = order.sellerId || order.businessId;

        if (buyer) {
          await notificationService.notify(
            buyer,
            'order_update',
            `Order Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
            `Order ${order.orderNumber || ''} is now ${status.replace(/_/g, ' ')}.`,
            { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
          );
        }
        if (seller) {
          await notificationService.notify(
            seller,
            'order_update',
            `Order Updated: ${order.orderNumber || ''}`,
            `Order ${order.orderNumber || ''} changed to ${status.replace(/_/g, ' ')}.`,
            { entityId: id, entityType: 'order', linkTo: `/order-details/${id}` }
          );
        }
      } catch (e) {
        console.warn("Failed to send order status change notification", e);
      }
    } else {
      await updateDoc(itemRef, updates);
    }
  },

  async getOrdersBySeller(sellerId: string): Promise<any[]> {
    if (!sellerId) return [];
    const db = getFirebaseDb();
    const canonicalPiUid = await getCanonicalRewardUserId(sellerId);
    const targetUids = new Set<string>([sellerId, canonicalPiUid]);
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
      const q1 = query(collection(db, 'orders'), where('sellerId', '==', uid));
      const snap1 = await getDocs(q1);
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, orderId: d.id, ...d.data() }));

      const q2 = query(collection(db, 'orders'), where('businessId', '==', uid));
      const snap2 = await getDocs(q2);
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, orderId: d.id, ...d.data() }));

      const q3 = query(collection(db, 'orders'), where('piUid', '==', uid));
      const snap3 = await getDocs(q3);
      snap3.docs.forEach(d => map.set(d.id, { id: d.id, orderId: d.id, ...d.data() }));
    }
    return Array.from(map.values());
  },

  async getOrdersByBuyer(buyerId: string): Promise<any[]> {
    if (!buyerId) return [];
    const db = getFirebaseDb();
    const canonicalPiUid = await getCanonicalRewardUserId(buyerId);
    const targetUids = new Set<string>([buyerId, canonicalPiUid]);
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
      const q1 = query(collection(db, 'orders'), where('buyerId', '==', uid));
      const snap1 = await getDocs(q1);
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, orderId: d.id, ...d.data() }));

      const q2 = query(collection(db, 'orders'), where('userUid', '==', uid));
      const snap2 = await getDocs(q2);
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, orderId: d.id, ...d.data() }));

      const q3 = query(collection(db, 'orders'), where('piUid', '==', uid));
      const snap3 = await getDocs(q3);
      snap3.docs.forEach(d => map.set(d.id, { id: d.id, orderId: d.id, ...d.data() }));
    }
    return Array.from(map.values());
  },

  async getStoreOrders(storeId: string) {
    return this.getOrdersBySeller(storeId);
  },

  async getOrderById(id: string): Promise<any> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'orders', id));
    return snap.exists() ? { id: snap.id, orderId: snap.id, ...snap.data() } as any : null;
  },

  async getOrderItems(orderId: string): Promise<any[]> {
    const order = await this.getOrderById(orderId);
    return order?.items || [];
  },

  async updateLogisticsDetails(orderId: string, details: any, actorUid?: string) {
    const db = getFirebaseDb();
    const ref = doc(db, 'orders', orderId);
    await updateDoc(ref, {
      logistics: details,
      trackingNumber: details.trackingNumber,
      courierName: details.courierName,
      shippedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
    return this.updateOrderStatus(orderId, OrderStatus.SHIPPED, actorUid, 'seller', 'Shipment dispatched with carrier tracking.');
  },

  async getBusinessOrders(businessId: string): Promise<any[]> {
    return this.getOrdersBySeller(businessId);
  },

  async createFromSession(session: any, items: any[]) {
    const db = getFirebaseDb();
    
    // Check if order already exists for this session
    const q = query(collection(db, 'orders'), where('sessionId', '==', session.sessionId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id;
    }

    const orderData: any = {
      sessionId: session.sessionId,
      checkoutSessionId: session.sessionId,
      orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      businessId: session.storeId || session.businessId || 'UNKNOWN',
      buyerId: session.userId || session.userUid || 'UNKNOWN',
      userUid: session.userId || session.userUid || 'UNKNOWN',
      sellerId: session.sellerId || session.storeId || session.businessId || 'UNKNOWN',
      storeId: session.storeId || session.businessId || 'UNKNOWN',
      grandTotal: session.total || session.grandTotal || 0,
      subtotal: session.subtotal || 0,
      tax: session.tax || 0,
      shipping: session.shipping || 0,
      discount: session.discount || 0,
      orderStatus: session.orderStatus || OrderStatus.PENDING_PAYMENT,
      paymentStatus: session.paymentStatus || 'pending',
      currency: session.currency || 'Pi',
      amount: session.amount || session.total || session.grandTotal || 0,
      items
    };

    if (session.shippingAddress) orderData.shippingAddress = session.shippingAddress;
    if (session.billingAddress) orderData.billingAddress = session.billingAddress;
    if (session.paymentId) orderData.paymentId = session.paymentId;
    if (session.transactionId) orderData.transactionId = session.transactionId;

    const id = await this.createOrder(orderData);
    
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

  async getCustomerOrders(customerId: string): Promise<any[]> {
    return this.getOrdersByBuyer(customerId);
  },

  async getOrderTimeline(orderId: string): Promise<any[]> {
    const order = await this.getOrderById(orderId);
    if (!order) return [];

    const activityLogs = order.activityLogs || [];
    const historyLog = order.historyLog || [];

    // Merge logs from array fields
    const combined: any[] = [...activityLogs, ...historyLog].map((entry: any, index: number) => ({
      eventId: `EVT_${index}_${entry.timestamp || order.createdAt}`,
      orderId,
      status: entry.status || order.orderStatus,
      type: 'status_change',
      message: entry.message || entry.remarks || `Status changed to ${entry.status}`,
      actorUid: entry.actorUid || entry.updatedBy || 'SYSTEM',
      actorName: entry.role === 'buyer' ? 'Customer' : (entry.role === 'seller' ? 'Merchant' : 'System'),
      createdAt: entry.timestamp || order.createdAt
    }));

    // Attempt to read timeline subcollection records
    try {
      const db = getFirebaseDb();
      const { collection, getDocs } = await import('firebase/firestore');
      const subSnap = await getDocs(collection(db, 'orders', orderId, 'timeline'));
      subSnap.forEach((docSnap) => {
        const subData = docSnap.data();
        combined.push({
          eventId: docSnap.id,
          orderId,
          status: subData.status || 'disputed',
          type: 'timeline_event',
          message: subData.description || subData.title || 'Timeline Event',
          actorUid: subData.actorUid || 'SYSTEM',
          actorName: subData.role === 'buyer' ? 'Customer' : 'System',
          createdAt: subData.createdAt || new Date().toISOString()
        });
      });
    } catch (e) {
      // Ignore subcollection read error if rules or missing
    }

    // Deduplicate by message and sort ascending by date
    const uniqueMap = new Map<string, any>();
    combined.forEach(item => {
      const key = `${item.createdAt}_${item.message}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // Helper Lifecycle methods
  async requestRefund(orderId: string, buyerUid: string, reason: string, amount?: number): Promise<void> {
    const db = getFirebaseDb();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const refAmount = amount || order.grandTotal;
    await updateDoc(doc(db, 'orders', orderId), {
      refundReason: reason,
      refundAmount: refAmount,
      refundStatus: 'requested',
      updatedAt: serverTimestamp()
    });

    await this.updateOrderStatus(orderId, OrderStatus.REFUND_REQUESTED, buyerUid, 'buyer', `Buyer requested refund of ${refAmount} Pi: ${reason}`);
  },

  async approveRefund(orderId: string, sellerUid: string, amount?: number): Promise<void> {
    const db = getFirebaseDb();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const refAmount = amount || order.refundAmount || order.grandTotal;
    await updateDoc(doc(db, 'orders', orderId), {
      refundStatus: 'approved',
      paymentStatus: 'refunded',
      updatedAt: serverTimestamp()
    });

    await this.updateOrderStatus(orderId, OrderStatus.REFUND_APPROVED, sellerUid, 'seller', `Merchant approved refund of ${refAmount} Pi.`);
    await this.updateOrderStatus(orderId, OrderStatus.REFUND_COMPLETED, sellerUid, 'seller', `Refund of ${refAmount} Pi credited back to Buyer Wallet.`);
  },

  async releaseEscrow(orderId: string, sellerUid: string): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'orders', orderId), {
      escrowStatus: 'released',
      escrowReleasedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });

    await this.updateOrderStatus(orderId, OrderStatus.ESCROW_RELEASED, sellerUid, 'seller', 'Pi Escrow funds released to Seller Wallet.');
  },

  async raiseDispute(orderId: string, userUid: string, reason: string): Promise<void> {
    console.log('[orderService.raiseDispute Step 1 ENTRY] Initiating dispute submission...', { orderId, userUid, reason });
    if (!orderId) {
      console.error('[orderService.raiseDispute Step 1 Error] Missing orderId parameter.');
      throw new Error('Order ID is required to raise a dispute');
    }
    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      console.error('[orderService.raiseDispute Step 1 Error] Empty reason.');
      throw new Error('Dispute reason cannot be empty');
    }

    let apiSuccess = false;
    let apiErrorDetail = '';

    // Step 2: Attempt Server API Call
    try {
      console.log('[orderService.raiseDispute Step 2 API Call] Preparing fetch request to /api/orders/dispute...');
      let authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const auth = getFirebaseAuth();
        if (auth && auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          if (token) {
            authHeaders['Authorization'] = `Bearer ${token}`;
          }
        }
      } catch (authErr) {
        console.warn('[orderService.raiseDispute Step 2 Auth Notice] Notice retrieving auth token:', authErr);
      }

      const response = await fetch(getAbsoluteUrl('/api/orders/dispute'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId,
          userUid,
          reason: cleanReason
        })
      });

      console.log('[orderService.raiseDispute Step 3 API Response Received] Status:', response.status);
      const data = await response.json().catch(() => ({ success: false, error: 'Invalid server JSON response' }));
      console.log('[orderService.raiseDispute Step 3 Data Payload]', data);

      if (response.ok && data.success) {
        apiSuccess = true;
        console.log('[orderService.raiseDispute Step 4 API SUCCESS] Dispute created via backend endpoint.');
      } else {
        apiErrorDetail = data?.error || `Server returned status code ${response.status}`;
        console.warn('[orderService.raiseDispute Step 4 API Warning] Server API dispute call rejected:', apiErrorDetail);
      }
    } catch (fetchErr: any) {
      apiErrorDetail = fetchErr?.message || 'Network communication error';
      console.warn('[orderService.raiseDispute Step 4 API Exception] Fetch failed, switching to client-side Firestore update fallback:', fetchErr);
    }

    // Step 3: Fallback client-side Firestore update if API failed
    if (!apiSuccess) {
      console.log('[orderService.raiseDispute Step 5 Firestore Fallback] Executing direct client-side Firestore document update...', { apiErrorDetail });
      try {
        const db = getFirebaseDb();
        const nowIso = new Date().toISOString();

        let updated = false;
        try {
          const directRef = doc(db, 'orders', orderId);
          await updateDoc(directRef, {
            disputeReason: cleanReason,
            disputeStatus: 'opened',
            disputedAt: nowIso,
            orderStatus: 'disputed',
            status: 'disputed',
            updatedAt: serverTimestamp()
          });
          updated = true;
          console.log('[orderService.raiseDispute Step 5 Direct Doc Success] Updated orders doc by direct ID:', orderId);
        } catch (directErr) {
          console.warn('[orderService.raiseDispute Step 5 Direct Doc Warning] Direct doc ID update failed, querying collection for order reference:', directErr);
          const { collection, query, where, getDocs, updateDoc: updateSingle } = await import('firebase/firestore');
          let qSnap = await getDocs(query(collection(db, 'orders'), where('orderId', '==', orderId)));
          if (qSnap.empty) {
            qSnap = await getDocs(query(collection(db, 'orders'), where('sessionId', '==', orderId)));
          }
          if (qSnap.empty) {
            qSnap = await getDocs(query(collection(db, 'orders'), where('txid', '==', orderId)));
          }

          if (!qSnap.empty) {
            await updateSingle(qSnap.docs[0].ref, {
              disputeReason: cleanReason,
              disputeStatus: 'opened',
              disputedAt: nowIso,
              orderStatus: 'disputed',
              status: 'disputed',
              updatedAt: serverTimestamp()
            });
            updated = true;
            console.log('[orderService.raiseDispute Step 5 Query Doc Success] Updated orders doc via query match.');
          } else {
            throw new Error(`Order document not found in Firestore for reference: ${orderId}`);
          }
        }

        if (updated) {
          await this.updateOrderStatus(orderId, OrderStatus.DISPUTED, userUid, 'buyer', `Buyer opened dispute case: ${cleanReason}`);
          console.log('[orderService.raiseDispute Step 6 Firestore Fallback SUCCESS] Dispute case successfully recorded in Firestore.');
        }
      } catch (fallbackErr: any) {
        console.error('[orderService.raiseDispute Step 6 Fallback Failed]', fallbackErr);
        throw new Error(`Failed to raise dispute: ${fallbackErr.message || apiErrorDetail}`);
      }
    } else {
      // Also write status update log to local timeline history
      try {
        await this.updateOrderStatus(orderId, OrderStatus.DISPUTED, userUid, 'buyer', `Buyer opened dispute case: ${cleanReason}`);
      } catch (logErr) {
        console.warn('[orderService.raiseDispute Status Log Notice]', logErr);
      }
    }

    console.log('[orderService.raiseDispute Step 7 COMPLETE] Dispute workflow finished successfully.');
  },

  async updateFulfillmentStatus(orderId: string, status: string, actorUid?: string, role?: string) {
    return this.updateOrderStatus(orderId, status, actorUid, role || 'seller', `Fulfillment status changed to ${status}`);
  },

  async updatePaymentStatus(orderId: string, status: string, method?: string) {
    const isPaid = status.toLowerCase() === 'paid' || status.toLowerCase() === 'completed';
    const targetStatus = isPaid ? OrderStatus.PAYMENT_VERIFIED : OrderStatus.PENDING_PAYMENT;
    await this.updateOrderStatus(orderId, targetStatus, 'SYSTEM', 'system', `Payment status changed to ${status}`);
  }
};
