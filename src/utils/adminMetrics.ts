/**
 * Pi Business Market - Canonical Admin Metrics & Data Integrity Utility
 * Provides a single, deterministic source of truth for all Admin Dashboard metrics.
 */

import { normalizeDateString } from './firestoreUtils';

export function isToday(dateVal: any): boolean {
  if (!dateVal) return false;
  const iso = normalizeDateString(dateVal);
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isThisMonth(dateVal: any): boolean {
  if (!dateVal) return false;
  const iso = normalizeDateString(dateVal);
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth()
  );
}

/**
 * Single authoritative check for whether a business/seller application is pending verification/approval
 */
export function isPendingSeller(b: any): boolean {
  if (!b) return false;
  
  const ver = String(b.verificationStatus || '').toLowerCase().trim();
  const app = String(b.approvalStatus || '').toLowerCase().trim();
  const st = String(b.status || '').toLowerCase().trim();

  // Explicitly approved, verified, rejected, or suspended are not pending
  if (ver === 'approved' || ver === 'verified' || app === 'approved' || st === 'approved' || st === 'verified') {
    return false;
  }
  if (ver === 'rejected' || app === 'rejected' || st === 'rejected' || st === 'suspended') {
    return false;
  }

  const pendingKeywords = [
    'pending', 
    'pending_verification', 
    'pending audit', 
    'submitted', 
    'under review', 
    'under_review', 
    'pending verification'
  ];
  
  return pendingKeywords.includes(ver) || pendingKeywords.includes(app) || pendingKeywords.includes(st);
}

/**
 * Single authoritative check for whether an order is paid/verified
 */
export function isPaidOrder(o: any): boolean {
  if (!o) return false;
  const payStatus = String(o.paymentStatus || '').toLowerCase();
  const orderStatus = String(o.status || '').toLowerCase();

  if (payStatus === 'paid' || payStatus === 'verified' || payStatus === 'completed' || payStatus === 'payment_verified') {
    return true;
  }

  const paidStatuses = [
    'paid', 'payment_verified', 'accepted', 'preparing', 'packed', 
    'ready_for_dispatch', 'shipped', 'in_transit', 'out_for_delivery', 
    'delivered', 'completed'
  ];

  return paidStatuses.includes(orderStatus);
}

/**
 * Single authoritative check for pending merchant settlements
 */
export function isPendingSettlement(p: any): boolean {
  if (!p) return false;
  const s = String(p.settlementStatus || '').toLowerCase();
  const st = String(p.status || '').toLowerCase();
  return s === 'pending settlement' || s === 'pending' || (st === 'pending' && s !== 'completed');
}

export interface AdminDataSources {
  users: any[];
  services: any[];
  shipments: any[];
  orders: any[];
  products: any[];
  businesses: any[];
  payments: any[];
  disputes: any[];
  support_tickets: any[];
  campaigns: any[];
  notifications: any[];
  fraudSignals: any[];
  universalApprovals: any[];
  reviews: any[];
}

export function calculateCanonicalAdminMetrics(dataSources: AdminDataSources) {
  // 1. Users
  const totalUsers = dataSources.users.length;
  const sellersList = dataSources.businesses;
  
  const sellerUids = new Set(sellersList.map(b => b.ownerUid || b.userId || b.uid).filter(Boolean));

  const sellerUsers = dataSources.users.filter(u => 
    u.role === 'seller' || 
    u.role === 'merchant' || 
    u.platformRole === 'seller' || 
    u.platformRole === 'merchant' ||
    sellerUids.has(u.id) ||
    sellerUids.has(u.uid)
  );

  const buyers = dataSources.users.filter(u => {
    const isSeller = u.role === 'seller' || u.role === 'merchant' || u.platformRole === 'seller' || sellerUids.has(u.id) || sellerUids.has(u.uid);
    const isAdmin = u.platformRole === 'superadmin' || u.platformRole === 'admin' || u.role === 'Admin' || u.role === 'Super Admin' || u.id === 'akhileshs68';
    return !isSeller && !isAdmin;
  });

  // 2. Businesses / Sellers
  const pendingSellers = dataSources.businesses.filter(b => isPendingSeller(b));
  const approvedSellers = dataSources.businesses.filter(b => {
    const st = String(b.status || '').toLowerCase();
    const ver = String(b.verificationStatus || '').toLowerCase();
    return (st === 'approved' || st === 'active' || ver === 'approved' || ver === 'verified') && !isPendingSeller(b);
  });
  const suspendedSellers = dataSources.businesses.filter(b => b.status === 'suspended' || b.verificationStatus === 'suspended' || b.active === false);

  // 3. Orders
  const totalOrders = dataSources.orders.length;
  const paidOrders = dataSources.orders.filter(o => isPaidOrder(o));
  
  const liveOrders = {
    new: dataSources.orders.filter(o => ['new', 'placed', 'new_order'].includes(String(o.status || '').toLowerCase())),
    pending: dataSources.orders.filter(o => ['pending_payment', 'pending'].includes(String(o.status || '').toLowerCase()) && !isPaidOrder(o)),
    preparing: dataSources.orders.filter(o => ['accepted', 'preparing'].includes(String(o.status || '').toLowerCase())),
    packed: dataSources.orders.filter(o => ['packed', 'ready_for_dispatch'].includes(String(o.status || '').toLowerCase())),
    shipped: dataSources.orders.filter(o => ['shipped', 'dispatched'].includes(String(o.status || '').toLowerCase())),
    inTransit: dataSources.orders.filter(o => ['in_transit'].includes(String(o.status || '').toLowerCase())),
    outForDelivery: dataSources.orders.filter(o => ['out_for_delivery'].includes(String(o.status || '').toLowerCase())),
    delivered: dataSources.orders.filter(o => ['delivered'].includes(String(o.status || '').toLowerCase())),
    completed: dataSources.orders.filter(o => ['completed'].includes(String(o.status || '').toLowerCase())),
    cancelled: dataSources.orders.filter(o => String(o.status || '').toLowerCase() === 'cancelled'),
    disputed: dataSources.orders.filter(o => String(o.status || '').toLowerCase() === 'disputed' || o.isDisputed === true),
    refundRequested: dataSources.orders.filter(o => ['refund_requested', 'refund_pending'].includes(String(o.status || '').toLowerCase())),
    refunded: dataSources.orders.filter(o => ['refund_completed', 'refund_approved', 'refunded'].includes(String(o.status || '').toLowerCase())),
  };

  // 4. Products & Services
  const totalProducts = dataSources.products.length;
  const totalServices = dataSources.services.length;

  const inventoryHealth = {
    totalProducts,
    outOfStock: dataSources.products.filter(p => Number(p.stock ?? p.stockQuantity ?? 0) === 0 || p.status === 'out-of-stock' || p.inStock === false),
    lowStock: dataSources.products.filter(p => {
      const s = Number(p.stock ?? p.stockQuantity ?? 0);
      return s > 0 && s <= 5;
    }),
    hidden: dataSources.products.filter(p => p.status === 'draft' || p.status === 'hidden' || p.isDraft === true),
    inactive: dataSources.products.filter(p => p.status === 'inactive' || p.status === 'archived' || p.isActive === false),
    pendingApproval: dataSources.products.filter(p => p.status === 'pending' || p.approvalStatus === 'pending'),
    totalServices,
    activeServices: dataSources.services.filter(s => !s.status || s.status === 'active' || s.status === 'published'),
    pendingServices: dataSources.services.filter(s => s.status === 'pending' || s.approvalStatus === 'pending'),
    suspendedServices: dataSources.services.filter(s => s.status === 'suspended'),
  };

  // 5. Payments & Settlements
  const todayPi = dataSources.payments
    .filter(p => String(p.status || '').toLowerCase() === 'completed' && String(p.currency || '').toLowerCase().includes('pi') && isToday(p.createdAt))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const todayBmp = dataSources.payments
    .filter(p => String(p.status || '').toLowerCase() === 'completed' && String(p.currency || '').toLowerCase().includes('bmp') && isToday(p.createdAt))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingSettlements = dataSources.payments.filter(p => isPendingSettlement(p));
  const failedPayments = dataSources.payments.filter(p => ['failed', 'Failed'].includes(String(p.status || '')));
  const pendingWithdrawals = dataSources.universalApprovals.filter(a => a.approvalType === 'Withdrawal Requests' && ['Pending Review', 'pending', 'Submitted', 'Under Review'].includes(String(a.status || '')));
  const refundQueue = dataSources.universalApprovals.filter(a => a.approvalType === 'Refund Requests' && ['Pending Review', 'pending', 'Submitted', 'Under Review'].includes(String(a.status || '')));

  // 6. Marketing
  const liveAds = dataSources.campaigns.filter(c => c.status === 'active').length;
  const pendingAds = dataSources.campaigns.filter(c => c.status === 'pending' || c.status === 'submitted' || c.approvalStatus === 'pending').length;

  const marketingHealth = {
    pending: dataSources.campaigns.filter(c => c.status === 'pending' || c.status === 'submitted' || c.approvalStatus === 'pending'),
    paymentVerified: dataSources.campaigns.filter(c => c.paymentStatus === 'verified' || c.status === 'verified'),
    runningCampaigns: dataSources.campaigns.filter(c => c.status === 'active'),
    scheduled: dataSources.campaigns.filter(c => c.status === 'scheduled'),
    paused: dataSources.campaigns.filter(c => c.status === 'paused'),
    rejected: dataSources.campaigns.filter(c => c.status === 'rejected'),
    endingSoon: dataSources.campaigns.filter(c => {
      if (c.status !== 'active' || !c.endDate) return false;
      const end = new Date(c.endDate);
      const diff = end.getTime() - new Date().getTime();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
    }),
    expiredCampaigns: dataSources.campaigns.filter(c => c.status === 'expired' || (c.endDate && new Date(c.endDate) < new Date())),
    featuredListings: dataSources.campaigns.filter(c => ['featured_product', 'featured_store'].includes(c.type || ''))
  };

  // 7. Customer Health
  const openDisputes = dataSources.disputes.filter(d => d.status && String(d.status).toUpperCase() !== 'RESOLVED' && String(d.status).toUpperCase() !== 'DISMISSED');
  const openTickets = dataSources.support_tickets.filter(t => !['resolved', 'closed', 'Closed', 'Resolved'].includes(String(t.status || '')));
  const unreadNotifications = dataSources.notifications.filter(n => n.status === 'unread' || n.read === false);
  const negativeReviews = dataSources.reviews.filter(r => Number(r.rating) <= 2);
  const highPriorityComplaints = [
    ...dataSources.support_tickets.filter(t => ['high', 'urgent', 'Urgent', 'High'].includes(String(t.priority || ''))),
    ...dataSources.disputes.filter(d => d.severity === 'high' || d.severity === 'critical')
  ];

  const customerHealth = {
    openDisputes,
    openTickets,
    unreadNotifications,
    negativeReviews,
    highPriorityComplaints
  };

  const businessHealth = {
    total: dataSources.businesses.length,
    new: dataSources.businesses.filter(b => b.status === 'pending' || b.status === 'new' || isToday(b.createdAt) || isThisMonth(b.createdAt)),
    approved: approvedSellers,
    rejected: dataSources.businesses.filter(b => b.status === 'rejected' || b.verificationStatus === 'rejected'),
    suspended: suspendedSellers,
    inactive: dataSources.businesses.filter(b => b.status === 'inactive'),
    pendingVerification: pendingSellers,
    noActivity: dataSources.businesses.filter(b => {
      const bId = b.businessId || b.id || b.sellerId;
      return !dataSources.orders.some(o => o.businessId === bId || o.sellerId === bId || o.storeId === bId);
    }),
  };

  return {
    overviewMetrics: {
      totalUsers,
      buyersCount: buyers.length,
      sellerUsersCount: sellerUsers.length,
      sellersCount: approvedSellers.length,
      pendingSellers: pendingSellers.length,
      approvedSellers: approvedSellers.length,
      suspendedSellers: suspendedSellers.length,
      totalProducts,
      totalServices,
      totalBusinesses: dataSources.businesses.length,
      totalOrders,
      paidOrders: paidOrders.length,
      activeShipments: dataSources.shipments.filter(s => ['in_transit', 'out_for_delivery', 'assigned', 'picked_up'].includes(s.status)).length,
      completedOrders: dataSources.orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
      liveAds,
      pendingAds,
    },
    liveOrders,
    inventoryHealth,
    businessHealth,
    paymentsSec: {
      todayPi,
      todayBmp,
      verified: dataSources.payments.filter(p => ['completed', 'verified', 'Paid'].includes(p.status)),
      pendingSettlements,
      failedPayments,
      pendingWithdrawals,
      refundQueue,
    },
    customerHealth,
    marketingHealth,
  };
}
