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
import { defaultTestCourier, ShipmentBookingRequest } from './courierAdapter';

const activeShipmentCreations = new Set<string>();

export const shippingService = {
  /**
   * CALCULATE SHIPPING QUOTE
   * Dynamic weight & volumetric weight rate calculation
   */
  calculateShippingQuote(
    items: Array<{
      type?: string;
      unitPrice?: number;
      price?: number;
      quantity?: number;
      weight?: number;
      dimensions?: { length?: number; width?: number; height?: number };
    }>,
    destinationAddress?: { postalCode?: string; country?: string; city?: string },
    deliveryMethod: 'shipping' | 'pickup' = 'shipping'
  ): {
    shippingCharge: number;
    courierName: string;
    estimatedDays: string;
    expectedDeliveryDate: string;
    serviceType: string;
    totalWeightKg: number;
    volumetricWeightKg: number;
    isEstimate: boolean;
  } {
    if (deliveryMethod === 'pickup' || !items || items.length === 0) {
      return {
        shippingCharge: 0,
        courierName: 'Store Self-Pickup',
        estimatedDays: '0',
        expectedDeliveryDate: 'Ready in 1-2 hours',
        serviceType: 'In-Store Pickup',
        totalWeightKg: 0,
        volumetricWeightKg: 0,
        isEstimate: false
      };
    }

    // Filter physical items
    const physicalItems = items.filter(it => it.type !== 'digital' && it.type !== 'service');
    if (physicalItems.length === 0) {
      return {
        shippingCharge: 0,
        courierName: 'Digital Instant Delivery',
        estimatedDays: '0',
        expectedDeliveryDate: 'Instant Access',
        serviceType: 'Digital Fulfillment',
        totalWeightKg: 0,
        volumetricWeightKg: 0,
        isEstimate: false
      };
    }

    let totalWeight = 0;
    let totalVolumetricWeight = 0;
    let totalSubtotal = 0;

    physicalItems.forEach(item => {
      const qty = item.quantity || 1;
      const price = item.unitPrice ?? item.price ?? 0;
      totalSubtotal += price * qty;

      const itemWeight = (item.weight && item.weight > 0) ? item.weight : 0.5; // default 0.5kg
      totalWeight += itemWeight * qty;

      const l = item.dimensions?.length || 10;
      const w = item.dimensions?.width || 10;
      const h = item.dimensions?.height || 5;
      const vol = (l * w * h) / 5000; // standard volumetric divisor in kg
      totalVolumetricWeight += vol * qty;
    });

    const billableWeight = Math.max(totalWeight, totalVolumetricWeight);

    let baseRate = 0.50;
    if (totalSubtotal > 0 && totalSubtotal < 5) {
      baseRate = Math.min(0.50, Math.max(0.20, totalSubtotal * 0.15));
    }

    let extraWeightCharge = 0;
    if (billableWeight > 1) {
      extraWeightCharge = (billableWeight - 1) * 0.20; // 0.20 Pi per extra kg
    }

    let zoneFactor = 1.0;
    if (destinationAddress?.country && destinationAddress.country.toLowerCase() !== 'usa' && destinationAddress.country.toLowerCase() !== 'us') {
      zoneFactor = 1.4; // International zone
    }

    const calculatedCharge = parseFloat(((baseRate + extraWeightCharge) * zoneFactor).toFixed(2));

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const expectedDateStr = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      shippingCharge: calculatedCharge,
      courierName: zoneFactor > 1 ? 'Pi Global Freight Courier' : 'Pi Express Courier',
      estimatedDays: '3–5 Days',
      expectedDeliveryDate: expectedDateStr,
      serviceType: 'Standard Tracked Delivery',
      totalWeightKg: parseFloat(totalWeight.toFixed(2)),
      volumetricWeightKg: parseFloat(totalVolumetricWeight.toFixed(2)),
      isEstimate: true
    };
  },

  /**
   * CREATE SHIPMENT
   * Triggered when a merchant starts fulfilling an order
   */
  async createShipment(order: Order, method: ShippingMethod): Promise<string> {
    const lockKey = order.orderId;
    if (activeShipmentCreations.has(lockKey)) {
      console.warn(`[shippingService] Shipment creation already in progress for order: ${lockKey}`);
      if (order.shipmentId) return order.shipmentId;
    }
    
    activeShipmentCreations.add(lockKey);

    try {
      const db = getFirebaseDb();
      
      // Check if shipment already exists
      if (order.shipmentId) {
        const existingSnap = await getDoc(doc(db, 'shipments', order.shipmentId));
        if (existingSnap.exists()) {
          return order.shipmentId;
        }
      }

      const orderItems = await orderService.getOrderItems(order.orderId);
      const itemsList = orderItems.length > 0 ? orderItems : (order.items || []);
      const quote = this.calculateShippingQuote(itemsList, order.shippingAddress, method === ShippingMethod.STORE_PICKUP ? 'pickup' : 'shipping');

      // Build shipment booking request for Test Courier adapter
      const bookingRequest: ShipmentBookingRequest = {
        orderId: order.orderId,
        businessId: order.businessId,
        storeId: order.storeId,
        shippingAddress: order.shippingAddress || {
          fullName: 'Valued Customer',
          email: 'pioneer@pinetwork.app',
          phone: '+1 555-0199',
          street: '1 Pioneer Plaza',
          city: 'Pi City',
          state: 'Global',
          postalCode: '90001',
          country: 'GLOBAL'
        },
        packages: itemsList.map((it: any) => ({
          weightKg: it.weightKg || it.weight || 0.5,
          lengthCm: it.lengthCm || 10,
          widthCm: it.widthCm || 10,
          heightCm: it.heightCm || 5,
          declaredValuePi: it.subtotal || it.unitPrice || 0,
          description: it.productName || it.title || 'Marketplace Item'
        })),
        totalWeightKg: quote.totalWeightKg,
        volumetricWeightKg: quote.volumetricWeightKg
      };

      const courierResponse = await defaultTestCourier.createShipment(bookingRequest);

      const shipmentId = `SHIP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const trackingNumber = courierResponse.trackingNumber;
      const courierName = courierResponse.courierName;

      const shipment: Shipment = {
        shipmentId,
        orderId: order.orderId,
        businessId: order.businessId,
        sellerId: order.sellerId || order.businessId,
        buyerId: order.buyerId || order.userUid,
        storeId: order.storeId,
        shippingMethod: method,
        status: ShipmentStatus.PENDING,
        shippingAddress: order.shippingAddress || {
          fullName: bookingRequest.shippingAddress.fullName,
          email: bookingRequest.shippingAddress.email || 'pioneer@pinetwork.app',
          phone: bookingRequest.shippingAddress.phone || '+1 555-0199',
          street: bookingRequest.shippingAddress.street,
          city: bookingRequest.shippingAddress.city,
          state: bookingRequest.shippingAddress.state,
          postalCode: bookingRequest.shippingAddress.postalCode,
          country: bookingRequest.shippingAddress.country
        },
        trackingNumber,
        courierName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const batch = writeBatch(db);

      // 1. Create Shipment Doc
      batch.set(doc(db, 'shipments', shipmentId), {
        ...shipment,
        isSimulated: true,
        estimatedDelivery: courierResponse.estimatedDeliveryDate,
        dispatchHub: courierResponse.dispatchHub,
        labelUrl: courierResponse.labelUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Add Initial Tracking Event
      const eventRef = doc(collection(db, 'trackingEvents'));
      batch.set(eventRef, {
        eventId: eventRef.id,
        shipmentId,
        status: ShipmentStatus.PENDING,
        location: courierResponse.dispatchHub,
        description: `Package registered with ${courierName}. Air Waybill (AWB): ${trackingNumber}. Estimated delivery: ${courierResponse.estimatedDeliveryDate}`,
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
      
      // Also update order with shipmentId, tracking number and courier
      batch.update(doc(db, 'orders', order.orderId), {
        shipmentId: shipmentId,
        deliveryMethod: method,
        trackingNumber,
        courierName,
        'logistics.trackingNumber': trackingNumber,
        'logistics.courierName': courierName,
        'logistics.estimatedDelivery': courierResponse.estimatedDeliveryDate,
        'logistics.isSimulated': true,
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      // Notify Customer of Shipment
      try {
        await notificationService.notify(
          order.userUid,
          'shipment_update',
          'Shipment Registered via Test Courier',
          `Your order #${order.orderNumber || order.orderId.substring(0,8)} has been registered for delivery via ${courierName}. AWB Tracking: ${trackingNumber}`,
          { entityType: 'shipment', entityId: shipmentId, priority: 'medium', linkTo: `/order-details/${order.orderId}` }
        );
      } catch (notifErr) {
        console.error('Shipment notification failed', notifErr);
      }

      return shipmentId;
    } finally {
      activeShipmentCreations.delete(lockKey);
    }
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
