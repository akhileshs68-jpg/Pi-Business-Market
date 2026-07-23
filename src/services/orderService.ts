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
  Timestamp,
  addDoc,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  Order, 
  OrderItem, 
  OrderTimelineEvent, 
  OrderStatus, 
  PaymentStatus, 
  FulfillmentStatus,
  OrderDraft,
  CheckoutSession
} from '../types';

import { inventoryService } from './inventoryService';
import { crmService } from './crmService';
import { loyaltyService } from './loyaltyService';
import { notificationService } from './notificationService';
import { businessService } from './businessService';
import { analyticsService } from './analyticsService';
import { auditService } from './auditService';

export const orderService = {
  /**
   * ORDER CREATION
   */
  async createFromSession(session: CheckoutSession, items: OrderItem[]): Promise<string> {
    const db = getFirebaseDb();
    const orderId = `ORD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const orderNumber = `PI-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    
    // In a real app, we would get businessId from the items or cart
    const businessId = 'PI-CORP-001';

    const order: Order = {
      orderId,
      orderNumber,
      checkoutSessionId: session.sessionId,
      userUid: session.userUid,
      businessId,
      currency: session.currency,
      subtotal: session.subtotal,
      discount: session.discount,
      tax: session.tax,
      shipping: session.shipping,
      grandTotal: session.grandTotal,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING_PAYMENT,
      fulfillmentStatus: FulfillmentStatus.PENDING,
      billingAddress: session.billingAddress,
      shippingAddress: session.shippingAddress,
      customerNotes: session.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const batch = writeBatch(db);

    // 1. Create Order Doc
    batch.set(doc(db, 'orders', orderId), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Create Order Items & Reserve Inventory
    for (const item of items) {
      const itemRef = doc(collection(db, 'orderItems'));
      batch.set(itemRef, {
        ...item,
        orderId,
        itemId: itemRef.id
      });

      // Reserve Inventory
      try {
        const invs = await inventoryService.getInventoryForVariant(item.variantId || item.productId);
        if (invs.length > 0) {
          await inventoryService.adjustStock({
            inventoryId: invs[0].inventoryId,
            type: 'reservation' as any,
            quantity: item.quantity,
            userId: session.userUid,
            reason: `Reservation for order ${orderNumber}`,
            referenceType: 'order',
            referenceId: orderId
          });
        }
      } catch (err) {
        console.warn(`Inventory reservation failed for ${item.productName}`, err);
      }
    }

    // 3. Create Initial Timeline Event
    const timelineRef = doc(collection(db, 'orderTimeline'));
    batch.set(timelineRef, {
      eventId: timelineRef.id,
      orderId,
      status: OrderStatus.CONFIRMED,
      type: 'status_change',
      message: 'Order placed successfully and inventory reserved.',
      actorUid: session.userUid,
      actorName: 'Customer',
      createdAt: serverTimestamp()
    });

    await batch.commit();

    // ANALYTICS
    try {
      await analyticsService.trackEvent({
        eventType: 'order_placed',
        entityType: 'order',
        entityId: orderId,
        businessId: businessId,
        userUid: session.userUid,
        metadata: { total: order.grandTotal, items: items.length }
      });
    } catch (err) {
      console.error('Order analytics failed', err);
    }

    // Trigger Notification to Business Owner
    try {
      const business = await businessService.getBusiness(businessId);
      if (business) {
        await notificationService.notify(
          business.ownerUid,
          'order_update',
          'New Order Received',
          `You have a new order #${orderNumber} for ${order.grandTotal} ${order.currency}.`,
          { entityType: 'order', entityId: orderId, priority: 'high', linkTo: `/dashboard/orders/${orderId}` }
        );
      }
    } catch (notifErr) {
      console.error('Order notification failed', notifErr);
    }

    return orderId;
  },

  /**
   * ORDER RETRIEVAL
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    return this.mapDocToOrder(snap);
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'orderItems'), where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as OrderItem);
  },

  async getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'orderTimeline'), 
      where('orderId', '==', orderId)
    );
    const snapshot = await getDocs(q);
    const timeline = snapshot.docs.map(doc => this.mapDocToTimelineEvent(doc));
    return timeline.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async getBusinessOrders(businessId: string): Promise<Order[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'orders'), 
      where('businessId', '==', businessId)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => this.mapDocToOrder(doc));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCustomerOrders(userUid: string): Promise<Order[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'orders'), 
      where('userUid', '==', userUid)
    );
    const snapshot = await getDocs(q);
    const orders2 = snapshot.docs.map(doc => this.mapDocToOrder(doc));
    return orders2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    actorUid: string, 
    actorName: string,
    message?: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    // If cancelled, release inventory
    if (newStatus === OrderStatus.CANCELLED) {
      const items = await this.getOrderItems(orderId);
      const order = await this.getOrder(orderId);
      for (const item of items) {
        try {
          const invs = await inventoryService.getInventoryForVariant(item.variantId || item.productId);
          if (invs.length > 0) {
            await inventoryService.adjustStock({
              inventoryId: invs[0].inventoryId,
              type: 'release-reservation' as any,
              quantity: item.quantity,
              userId: actorUid,
              reason: `Order cancelled: ${orderId}`,
              referenceType: 'order',
              referenceId: orderId
            });
          }
        } catch (err) {
          console.error('Failed to release inventory', err);
        }
      }
    }

    batch.update(doc(db, 'orders', orderId), {
      orderStatus: newStatus,
      updatedAt: serverTimestamp()
    });

    const timelineRef = doc(collection(db, 'orderTimeline'));
    batch.set(timelineRef, {
      eventId: timelineRef.id,
      orderId,
      status: newStatus,
      type: 'status_change',
      message: message || `Order status updated to ${newStatus.replace('_', ' ')}`,
      actorUid,
      actorName,
      createdAt: serverTimestamp()
    });

    await batch.commit();

    // Notify Customer of Status Change
    try {
      const order = await this.getOrder(orderId);
      if (order) {
        await notificationService.notify(
          order.userUid,
          'order_update',
          `Order ${newStatus.replace('_', ' ')}`,
          `Your order #${order.orderNumber} is now ${newStatus.replace('_', ' ')}.`,
          { entityType: 'order', entityId: orderId, priority: 'medium', linkTo: `/account/orders/${orderId}` }
        );
      }
    } catch (notifErr) {
      console.error('Status change notification failed', notifErr);
    }

    // CRM & Loyalty Integration
    try {
      const order = await this.getOrder(orderId);
      if (order) {
        const customer = await crmService.getOrCreateCustomer(
          order.userUid, 
          order.businessId, 
          order.shippingAddress?.fullName || 'Customer', 
          order.shippingAddress?.email || ''
        );
        
        if (newStatus === OrderStatus.CONFIRMED) {
          await crmService.recordActivity(
            customer.customerId,
            order.businessId,
            'payment_completed',
            'Payment Confirmed',
            `Payment for Order #${orderId.slice(0, 8)} was successfully confirmed.`,
            orderId,
            0,
            order.grandTotal
          );
          
          const points = await loyaltyService.earnPoints(customer.customerId, order.businessId, order.grandTotal, orderId);
          
          await crmService.recordActivity(
            customer.customerId,
            order.businessId,
            'loyalty_earned',
            'Loyalty Points Earned',
            `You earned ${points} loyalty points for Order #${orderId.slice(0, 8)}.`,
            orderId,
            points
          );
        } else if (newStatus === OrderStatus.COMPLETED) {
          await crmService.recordActivity(
            customer.customerId,
            order.businessId,
            'shipment_delivered',
            'Order Completed',
            `Order #${orderId.slice(0, 8)} has been delivered and completed.`,
            orderId
          );
        }
      }
    } catch (crmErr) {
      console.error('CRM/Loyalty tracking failed', crmErr);
    }
  },

  async updatePaymentStatus(
    orderId: string, 
    newStatus: PaymentStatus, 
    actorUid: string, 
    actorName: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    batch.update(doc(db, 'orders', orderId), {
      paymentStatus: newStatus,
      updatedAt: serverTimestamp()
    });

    const timelineRef = doc(collection(db, 'orderTimeline'));
    batch.set(timelineRef, {
      eventId: timelineRef.id,
      orderId,
      status: newStatus,
      type: 'payment',
      message: `Payment status updated to ${newStatus}`,
      actorUid,
      actorName,
      createdAt: serverTimestamp()
    });

    await batch.commit();
  },

  async updateFulfillmentStatus(
    orderId: string, 
    newStatus: FulfillmentStatus, 
    actorUid: string, 
    actorName: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    batch.update(doc(db, 'orders', orderId), {
      fulfillmentStatus: newStatus,
      updatedAt: serverTimestamp()
    });

    const timelineRef = doc(collection(db, 'orderTimeline'));
    batch.set(timelineRef, {
      eventId: timelineRef.id,
      orderId,
      status: newStatus,
      type: 'fulfillment',
      message: `Fulfillment status updated to ${newStatus}`,
      actorUid,
      actorName,
      createdAt: serverTimestamp()
    });

    await batch.commit();
  },

  /**
   * HELPERS
   */
  mapDocToOrder(doc: any): Order {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
    } as Order;
  },

  mapDocToTimelineEvent(doc: any): OrderTimelineEvent {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    } as OrderTimelineEvent;
  }
};
