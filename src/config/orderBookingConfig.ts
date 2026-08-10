export const ORDER_STATUSES = [
  'Pending Payment',
  'Pending Confirmation',
  'Accepted',
  'Preparing',
  'Packed',
  'Ready for Dispatch',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Completed',
  'Cancelled',
  'Refund Requested',
  'Refunded'
];

export const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
  'Rejected',
  'Rescheduled'
];

export const ROLE_FEATURES = {
  seller: { hasOrders: true, hasBookings: false },
  manufacturer: { hasOrders: true, hasBookings: false },
  farmer: { hasOrders: true, hasBookings: false },
  company: { hasOrders: true, hasBookings: false },
  artist: { hasOrders: true, hasBookings: false },
  'service provider': { hasOrders: false, hasBookings: true },
  freelancer: { hasOrders: false, hasBookings: true },
  doctor: { hasOrders: false, hasBookings: true },
  teacher: { hasOrders: false, hasBookings: true }
};
