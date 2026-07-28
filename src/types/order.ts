export interface OrderBookingBase {
  id: string;
  type: 'order' | 'booking';
  buyerId: string;
  sellerId: string;
  businessId: string;
  
  items: any[];
  price: number;
  currency: string;
  discount?: number;
  tax?: number;
  grandTotal: number;

  createdAt: string;
  updatedAt: string;
}

export interface UniversalOrder extends OrderBookingBase {
  type: 'order';
  quantity: number;
  shippingCost?: number;
  paymentStatus: string;
  orderStatus: string;
}

export interface UniversalBooking extends OrderBookingBase {
  type: 'booking';
  providerId?: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  duration?: string;
  bookingStatus: string;
  notes?: string;
}

export type UniversalOrderBooking = UniversalOrder | UniversalBooking;
