/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShipmentStatus } from '../types';

export interface CourierServiceArea {
  countryCode: string;
  regions?: string[];
  supportedPostalCodes?: string[];
  maxWeightKg: number;
  maxDimensionsCm: { length: number; width: number; height: number };
}

export interface CourierProviderProfile {
  providerId: string;
  providerName: string;
  isSimulated: boolean;
  status: 'active' | 'maintenance' | 'offline';
  serviceAreas: CourierServiceArea[];
  apiEndpoint?: string;
  apiVersion?: string;
  supportsRealtimeTracking: boolean;
  supportsWebhook: boolean;
}

export interface ShipmentBookingRequest {
  orderId: string;
  businessId: string;
  storeId?: string;
  shippingAddress: {
    fullName: string;
    email?: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  packages: Array<{
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    declaredValuePi: number;
    description: string;
  }>;
  totalWeightKg: number;
  volumetricWeightKg: number;
}

export interface ShipmentBookingResponse {
  success: boolean;
  trackingNumber: string;
  courierName: string;
  estimatedDeliveryDate: string;
  labelUrl?: string;
  airWaybillNumber: string;
  dispatchHub: string;
  message: string;
}

export interface ICourierProvider {
  profile: CourierProviderProfile;
  
  isAvailableForRoute(
    destinationCountry: string,
    weightKg: number,
    dimensions: { length: number; width: number; height: number }
  ): boolean;

  createShipment(request: ShipmentBookingRequest): Promise<ShipmentBookingResponse>;

  getTrackingStatus(trackingNumber: string): Promise<{
    status: ShipmentStatus;
    location: string;
    description: string;
    timestamp: string;
  }>;

  updateTrackingStatus(
    trackingNumber: string,
    newStatus: ShipmentStatus,
    location: string,
    description: string
  ): Promise<void>;
}

export class TestCourierAdapter implements ICourierProvider {
  profile: CourierProviderProfile = {
    providerId: 'TEST_COURIER_SIMULATOR',
    providerName: 'TEST COURIER (Simulated Integration)',
    isSimulated: true,
    status: 'active',
    supportsRealtimeTracking: true,
    supportsWebhook: true,
    serviceAreas: [
      {
        countryCode: 'GLOBAL',
        maxWeightKg: 100,
        maxDimensionsCm: { length: 200, width: 200, height: 200 }
      }
    ]
  };

  isAvailableForRoute(
    destinationCountry: string,
    weightKg: number,
    dimensions: { length: number; width: number; height: number }
  ): boolean {
    return weightKg <= 100 && dimensions.length <= 200;
  }

  async createShipment(request: ShipmentBookingRequest): Promise<ShipmentBookingResponse> {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const trackingNumber = `TEST-AWB-PI-${randomCode}`;
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const estimatedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      success: true,
      trackingNumber,
      courierName: 'TEST COURIER (Simulated Integration)',
      estimatedDeliveryDate,
      airWaybillNumber: trackingNumber,
      dispatchHub: 'Pi Testnet Logistics Hub Alpha',
      labelUrl: `/manifest/${trackingNumber}`,
      message: 'Simulated Air Waybill (AWB) generated for Pi Testnet.'
    };
  }

  async getTrackingStatus(trackingNumber: string) {
    return {
      status: ShipmentStatus.PENDING,
      location: 'Pi Testnet Logistics Hub Alpha',
      description: 'Shipment created in simulated Test Courier dispatch queue.',
      timestamp: new Date().toISOString()
    };
  }

  async updateTrackingStatus(
    trackingNumber: string,
    newStatus: ShipmentStatus,
    location: string,
    description: string
  ) {
    console.log(`[TestCourierAdapter] Status update for ${trackingNumber}: ${newStatus} at ${location} - ${description}`);
  }
}

export const mapCourierWebhookToTrackingStatus = (webhookPayload: any): {
  trackingNumber: string;
  status: ShipmentStatus;
  location: string;
  description: string;
} => {
  const statusStr = (webhookPayload?.status || webhookPayload?.event || '').toLowerCase();
  let mappedStatus = ShipmentStatus.IN_TRANSIT;
  if (statusStr.includes('pick') || statusStr.includes('accepted')) mappedStatus = ShipmentStatus.PICKED_UP;
  else if (statusStr.includes('transit') || statusStr.includes('hub')) mappedStatus = ShipmentStatus.IN_TRANSIT;
  else if (statusStr.includes('out_for_delivery') || statusStr.includes('out')) mappedStatus = ShipmentStatus.OUT_FOR_DELIVERY;
  else if (statusStr.includes('deliver')) mappedStatus = ShipmentStatus.DELIVERED;
  else if (statusStr.includes('fail') || statusStr.includes('return')) mappedStatus = ShipmentStatus.DELIVERY_FAILED;

  return {
    trackingNumber: webhookPayload?.trackingNumber || webhookPayload?.awb || 'UNKNOWN',
    status: mappedStatus,
    location: webhookPayload?.location || 'Regional Dispatch Station',
    description: webhookPayload?.description || `Courier status update: ${mappedStatus}`
  };
};

export const defaultTestCourier = new TestCourierAdapter();
