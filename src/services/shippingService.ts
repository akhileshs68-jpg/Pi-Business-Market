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

    // 3. Conditional: If Delivered, update order status to completed
    if (newStatus === ShipmentStatus.DELIVERED) {
      const snap = await getDoc(doc(db, 'shipments', shipmentId));
      const shipment = snap.data() as Shipment;
      await orderService.updateOrderStatus(shipment.orderId, OrderStatus.COMPLETED, actorUid, 'Logistics Engine', 'Shipment delivered successfully.');
      await orderService.updateFulfillmentStatus(shipment.orderId, FulfillmentStatus.DELIVERED, actorUid, 'Logistics Engine');
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
      where('shipmentId', '==', shipmentId),
      orderBy('eventTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToTrackingEvent(doc));
  },

  async getBusinessShipments(businessId: string): Promise<Shipment[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'shipments'), 
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToShipment(doc));
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
