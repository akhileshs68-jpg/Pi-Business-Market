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
  addDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  Order, 
  Shipment, 
  ShipmentStatus, 
  ShippingMethod, 
  ShipmentPackage, 
  TrackingEvent,
  Carrier,
  FulfillmentStatus,
  OrderStatus
} from '../types';
import { orderService } from './orderService';
import { notificationService } from './notificationService';

export const shippingService = {
  /**
   * CREATE SHIPMENT
   * Triggered when a merchant starts fulfilling an order
   */
  async createShipment(order: Order, method: ShippingMethod): Promise<string> {
    const db = getFirebaseDb();
    const shipmentId = `SHIP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const shipment: Shipment = {
      shipmentId,
      orderId: order.orderId,
      businessId: order.businessId,
      storeId: order.storeId,
      shippingMethod: method,
      status: ShipmentStatus.PENDING,
      shippingAddress: order.shippingAddress!, // Should exist if physical
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const batch = writeBatch(db);

    // 1. Create Shipment Doc
    batch.set(doc(db, 'shipments', shipmentId), {
      ...shipment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Add Initial Tracking Event
    const eventRef = doc(collection(db, 'trackingEvents'));
    batch.set(eventRef, {
      eventId: eventRef.id,
      shipmentId,
      status: ShipmentStatus.PENDING,
      location: 'Warehouse',
      description: 'Shipment created and awaiting fulfillment.',
      eventTime: serverTimestamp(),
      createdBy: order.businessId
    });

    // 3. Update Order Fulfillment Status
    await orderService.updateFulfillmentStatus(
      order.orderId, 
      FulfillmentStatus.PACKED, 
      order.businessId, 
      'Logistics Engine'
    );
    
    // Also update order with shipmentId
    batch.update(doc(db, 'orders', order.orderId), {
      shipmentId: shipmentId,
      deliveryMethod: method,
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    // Notify Customer of Shipment
    try {
      await notificationService.notify(
        order.userUid,
        'shipment_update',
        'Order Shipped!',
        `Your order #${order.orderNumber} has been shipped via ${method}. Tracking: ${shipmentId}`,
        { entityType: 'shipment', entityId: shipmentId, priority: 'medium', linkTo: `/account/orders/${order.orderId}` }
      );
    } catch (notifErr) {
      console.error('Shipment notification failed', notifErr);
    }

    return shipmentId;
  },

  /**
   * UPDATE SHIPMENT STATUS
   */
  async updateShipmentStatus(
    shipmentId: string, 
    newStatus: ShipmentStatus, 
    actorUid: string,
    location: string,
    description?: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    // 1. Update Shipment
    batch.update(doc(db, 'shipments', shipmentId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // 2. Add Tracking Event
    const eventRef = doc(collection(db, 'trackingEvents'));
    batch.set(eventRef, {
      eventId: eventRef.id,
      shipmentId,
      status: newStatus,
      location,
      description: description || `Shipment status updated to ${newStatus.replace('_', ' ')}`,
      eventTime: serverTimestamp(),
      createdBy: actorUid
    });

    // 3. Map Shipment Status to Order Status
    const snap = await getDoc(doc(db, 'shipments', shipmentId));
    if (snap.exists()) {
      const shipment = snap.data();
      let orderStatusToSet = null;
      let fulfillmentStatusToSet = null;

      switch (newStatus) {
        case ShipmentStatus.PICKED_UP:
        case ShipmentStatus.IN_TRANSIT:
        case ShipmentStatus.HUB_PROCESSING:
          orderStatusToSet = OrderStatus.SHIPPED;
          break;
        case ShipmentStatus.OUT_FOR_DELIVERY:
          orderStatusToSet = OrderStatus.OUT_FOR_DELIVERY;
          break;
        case ShipmentStatus.DELIVERED:
          orderStatusToSet = OrderStatus.DELIVERED;
          fulfillmentStatusToSet = FulfillmentStatus.DELIVERED;
          break;
        case ShipmentStatus.RETURNED:
        case ShipmentStatus.DELIVERY_FAILED:
          orderStatusToSet = OrderStatus.RETURNED;
          break;
      }

      if (orderStatusToSet) {
        try {
          await orderService.updateOrderStatus(shipment.orderId, orderStatusToSet, actorUid, 'Logistics Engine', `Shipment status updated to ${newStatus}`);
        } catch (e) {
          console.error('Failed to update order status from shipment', e);
        }
      }
      
      if (fulfillmentStatusToSet) {
        try {
          await orderService.updateFulfillmentStatus(shipment.orderId, fulfillmentStatusToSet, actorUid, 'Logistics Engine');
        } catch (e) {
          console.error('Failed to update fulfillment status from shipment', e);
        }
      }
    }

    await batch.commit();
  },

  /**
   * RETRIEVAL
   */
  async getShipment(shipmentId: string): Promise<Shipment | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'shipments', shipmentId));
    if (!snap.exists()) return null;
    return this.mapDocToShipment(snap);
  },

  async getOrderShipments(orderId: string): Promise<Shipment[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'shipments'), where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToShipment(doc));
  },

  async getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'trackingEvents'), 
      where('shipmentId', '==', shipmentId)
    );
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => this.mapDocToTrackingEvent(doc));
    return events.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
  },

  async getBusinessShipments(businessId: string): Promise<Shipment[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'shipments'), 
      where('businessId', '==', businessId)
    );
    const snapshot = await getDocs(q);
    const shipments = snapshot.docs.map(doc => this.mapDocToShipment(doc));
    return shipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * PACKAGE MANAGEMENT
   */
  async addPackage(pkg: Partial<ShipmentPackage>): Promise<string> {
    const db = getFirebaseDb();
    const packageId = `PKG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    await setDoc(doc(db, 'packages', packageId), {
      ...pkg,
      packageId,
      createdAt: serverTimestamp()
    });
    return packageId;
  },

  async getShipmentPackages(shipmentId: string): Promise<ShipmentPackage[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'packages'), where('shipmentId', '==', shipmentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ShipmentPackage);
  },

  /**
   * HELPERS
   */
  mapDocToShipment(doc: any): Shipment {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      estimatedDelivery: data.estimatedDelivery instanceof Timestamp ? data.estimatedDelivery.toDate().toISOString() : data.estimatedDelivery,
      actualDelivery: data.actualDelivery instanceof Timestamp ? data.actualDelivery.toDate().toISOString() : data.actualDelivery,
    } as Shipment;
  },

  mapDocToTrackingEvent(doc: any): TrackingEvent {
    const data = doc.data();
    return {
      ...data,
      eventTime: data.eventTime instanceof Timestamp ? data.eventTime.toDate().toISOString() : data.eventTime,
    } as TrackingEvent;
  }
};
