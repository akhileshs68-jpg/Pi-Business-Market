/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, Printer, Navigation, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  User,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Store as StoreIcon,
  Star,
  MapPin as MapPinIcon,
  RotateCcw,
  Heart,
  AlertTriangle,
  Tag,
  QrCode,
  FileText,
  DollarSign,
  AlertCircle,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { Order, OrderItem, OrderTimelineEvent, OrderStatus, Store } from '../types';
import { storeService } from '../services/storeService';
import { ReviewForm } from '../components/ReviewForm';
import { billingService } from '../services/billingService';
import { EnterpriseInvoiceModal } from '../components/billing/EnterpriseInvoiceModal';
import { ProfessionalReceiptModal } from '../components/billing/ProfessionalReceiptModal';
import { QRVerificationModal } from '../components/billing/QRVerificationModal';
import { EnterpriseInvoice, ProfessionalReceipt } from '../types/billing';
import { OpenDisputeModal } from '../components/dispute/OpenDisputeModal';
import { DisputeDetailView } from '../components/dispute/DisputeDetailView';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentMethod, setShipmentMethod] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Refund & Dispute Modals
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);

  const getSemanticBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'delivered'].includes(s)) {
      return {
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2
      };
    }
    if (['cancelled', 'rejected', 'returned', 'failed'].includes(s)) {
      return {
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: XCircle
      };
    }
    if (['refund_requested', 'refund_approved', 'disputed', 'holding'].includes(s)) {
      return {
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: AlertTriangle
      };
    }
    if (['shipped', 'out_for_delivery', 'in_transit', 'ready_for_dispatch', 'packed'].includes(s)) {
      return {
        className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        icon: Truck
      };
    }
    if (['preparing', 'accepted', 'processing'].includes(s)) {
      return {
        className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        icon: Clock
      };
    }
    return {
      className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: Clock
    };
  };

  const handleCopyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedOrderNumber(true);
    setTimeout(() => setCopiedOrderNumber(false), 2000);
  };

  const handleCopyAwbNumber = () => {
    if (!order?.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [enterpriseInvoice, setEnterpriseInvoice] = useState<EnterpriseInvoice | null>(null);
  const [professionalReceipt, setProfessionalReceipt] = useState<ProfessionalReceipt | null>(null);

  const handleOpenInvoice = async () => {
    if (!order) return;
    try {
      const inv = await billingService.generateOrGetInvoice(order, null, store);
      setEnterpriseInvoice(inv);
      setShowInvoiceModal(true);
    } catch (e) {
      console.error('Invoice generation failed', e);
    }
  };

  const handleOpenReceipt = async () => {
    if (!order) return;
    try {
      const rcp = await billingService.generateOrGetReceipt(order, store, null);
      setProfessionalReceipt(rcp);
      setShowReceiptModal(true);
    } catch (e) {
      console.error('Receipt generation failed', e);
    }
  };

  const handleOpenVerify = (code?: string) => {
    setVerifyCode(code || order?.qrVerificationCode || '');
    setShowVerifyModal(true);
  };

  useEffect(() => {
    if (orderId) {
      console.log('[OrderDetails Navigation Trace] Component mounted with orderId:', orderId);
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    console.log('[OrderDetails Navigation Trace] Starting fetchOrderData for orderId:', orderId);
    setLoading(true);
    try {
      const cleanId = orderId?.trim();
      let data = cleanId ? await orderService.getOrder(cleanId) : null;
      console.log('[OrderDetails Navigation Trace] Initial getOrder result:', data);

      if (!data && cleanId) {
        console.warn('[OrderDetails Navigation Trace] Order document not found directly by ID. Attempting fallback queries...');
        try {
          const db = getFirebaseDb();
          
          let snap = await getDocs(query(collection(db, 'orders'), where('orderId', '==', cleanId)));
          if (snap.empty) {
            snap = await getDocs(query(collection(db, 'orders'), where('sessionId', '==', cleanId)));
          }
          if (snap.empty) {
            snap = await getDocs(query(collection(db, 'orders'), where('txid', '==', cleanId)));
          }
          if (snap.empty) {
            snap = await getDocs(query(collection(db, 'orders'), where('transactionId', '==', cleanId)));
          }

          if (!snap.empty) {
            const docData = snap.docs[0].data();
            data = { id: snap.docs[0].id, orderId: snap.docs[0].id, ...docData };
            console.log('[OrderDetails Navigation Trace] Fallback order found:', data);
          }
        } catch (fallbackErr) {
          console.warn('[OrderDetails Navigation Trace] Fallback query failed:', fallbackErr);
        }
      }

      if (data) {
        setOrder(data);
        if (data.storeId || data.businessId) {
          const s = await storeService.getStore(data.storeId || data.businessId);
          console.log('[OrderDetails Navigation Trace] Store details retrieved:', s);
          setStore(s);
        }
        const [orderItems, orderTimeline] = await Promise.all([
          orderService.getOrderItems(data.id || orderId!),
          orderService.getOrderTimeline(data.id || orderId!)
        ]);
        console.log('[OrderDetails Navigation Trace] Order items & timeline retrieved:', orderItems, orderTimeline);
        
        let finalItems = orderItems.length > 0 ? orderItems : (data.items && data.items.length > 0 ? data.items : []);
        if (finalItems.length === 0) {
          finalItems = [{
            itemId: 'item_0',
            productId: data.productId || 'PROD-UNKNOWN',
            productName: data.productName || data.title || (data as any).packageName || 'Marketplace Product / Service',
            title: data.title || data.productName || (data as any).packageName || 'Marketplace Product / Service',
            quantity: Number(data.quantity || 1),
            unitPrice: Number(data.unitPrice || data.price || data.grandTotal || 0),
            price: Number(data.price || data.unitPrice || data.grandTotal || 0),
            subtotal: Number(data.subtotal || data.grandTotal || (data.quantity || 1) * (data.unitPrice || data.price || data.grandTotal || 0)),
            imageUrl: data.imageUrl || '',
            sku: data.sku || 'N/A',
            isService: Boolean(data.isService)
          } as any];
        }

        setItems(finalItems);
        setTimeline(orderTimeline);
      } else {
        console.error('[OrderDetails Navigation Trace] Order not found for orderId:', orderId);
      }
    } catch (err) {
      console.error('[OrderDetails Navigation Trace] Failed to fetch order data:', err);
    } finally {
      console.log('[OrderDetails Navigation Trace] fetchOrderData complete, setting loading = false.');
      setLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!user || !order || !shipmentMethod) return;
    try {
      const { shippingService } = await import('../services/shippingService');
      const { ShippingMethod } = await import('../types');
      
      let method = ShippingMethod.STANDARD;
      if (shipmentMethod === 'courier') method = ShippingMethod.COURIER;
      if (shipmentMethod === 'local_delivery') method = ShippingMethod.LOCAL_DELIVERY;
      if (shipmentMethod === 'self_delivery') method = ShippingMethod.SELF_DELIVERY;
      if (shipmentMethod === 'store_pickup') method = ShippingMethod.STORE_PICKUP;
      
      const shipmentId = await shippingService.createShipment(order, method);
      
      if (trackingNumber || courierName) {
        const db = getFirebaseDb();
        const batch = writeBatch(db);
        batch.update(doc(db, 'shipments', shipmentId), {
          trackingNumber,
          courierName,
          updatedAt: serverTimestamp()
        });
        batch.update(doc(db, 'orders', order.orderId), {
          shipmentId,
          deliveryMethod: method,
          trackingNumber,
          courierName,
          'logistics.trackingNumber': trackingNumber,
          'logistics.courierName': courierName,
          updatedAt: serverTimestamp()
        });
        await batch.commit();
      }

      await orderService.updateOrderStatus(order.orderId, OrderStatus.SHIPPED, user.uid, 'seller', `Shipped via ${courierName || shipmentMethod}`);
      setShowShipmentModal(false);
      fetchOrderData();
    } catch (err) {
      console.error('Failed to create shipment', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date Not Available';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Date Not Available';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Date Not Available';
    }
  };

  const isMerchant = Boolean(
    user && order && (
      user.uid === order.businessId ||
      user.uid === order.sellerId ||
      user.uid === order.storeId ||
      (store && store.ownerUid === user.uid) ||
      ((user.role === 'seller' || user.role === 'merchant' || user.platformRole === 'seller' || user.platformRole === 'merchant' || user.role === 'Admin' || user.role === 'Super Admin' || user.platformRole === 'admin' || user.platformRole === 'superadmin') && user.uid !== order.buyerId && user.uid !== order.userUid)
    )
  );

  const handleChatAboutOrder = async () => {
    console.log('[OrderDetails Chat Step 1 ENTRY] Chat button clicked.', {
      orderId: order?.orderId,
      userUid: user?.uid,
      isMerchant,
      businessId: order?.businessId,
      sellerId: order?.sellerId,
      buyerId: order?.buyerId,
      userUidField: order?.userUid
    });

    if (!order) {
      console.error('[OrderDetails Chat Step 1 Error] No order available for chat navigation.');
      return;
    }

    let activeUserUid = user?.uid;
    if (!activeUserUid) {
      try {
        activeUserUid = getFirebaseAuth().currentUser?.uid;
      } catch (e) {
        console.warn('[OrderDetails Chat Auth Notice] Could not retrieve fallback auth user:', e);
      }
    }

    const partnerId = isMerchant
      ? (order.userUid || order.buyerId || 'buyer_user')
      : (order.sellerId || order.businessId || 'merchant_user');

    const partnerName = isMerchant 
      ? (order.buyerName || 'Customer') 
      : (order.storeName || order.businessName || store?.storeName || 'Merchant');

    const resolvedStoreId = order.storeId || order.businessId;
    const resolvedBusinessId = order.businessId;

    console.log('[OrderDetails Chat Step 2 Navigation] Navigating to /inbox with state:', {
      targetUid: partnerId,
      targetName: partnerName,
      contextType: 'order',
      contextId: order.orderId,
      storeId: resolvedStoreId,
      businessId: resolvedBusinessId
    });

    navigate('/inbox', { 
      state: { 
        targetUid: partnerId,
        targetName: partnerName,
        contextType: 'order',
        contextId: order.orderId,
        storeId: resolvedStoreId,
        businessId: resolvedBusinessId
      }
    });
  };

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleUpdateStatus = async (status: string, remarks?: string) => {
    if (!order || !user || statusUpdating) return;

    // Security check: If non-seller tries to run seller fulfillment status updates, reject!
    const sellerStatuses = [
      OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.PREPARING, 
      OrderStatus.PACKED, OrderStatus.READY_FOR_DISPATCH, OrderStatus.SHIPPED, 
      OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED
    ];
    if (sellerStatuses.includes(status as any) && !isMerchant) {
      setActionError('UNAUTHORIZED: Buyer cannot execute seller fulfillment actions.');
      return;
    }

    try {
      setStatusUpdating(true);
      setActionError(null);
      setActionSuccess(null);
      const role = isMerchant ? 'seller' : 'buyer';
      await orderService.updateOrderStatus(order.orderId, status, user.uid, role, remarks);
      setActionSuccess(`Order status updated to ${status.replace(/_/g, ' ').toUpperCase()}`);
      await fetchOrderData();
    } catch (err: any) {
      console.error('Status update failed', err);
      setActionError(err?.message || 'Failed to update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!order || !user || !refundReason) return;
    try {
      const amt = typeof refundAmount === 'number' ? refundAmount : order.grandTotal;
      await orderService.requestRefund(order.orderId, user.uid, refundReason, amt);
      setShowRefundModal(false);
      fetchOrderData();
    } catch (err) {
      console.error('Refund request failed', err);
    }
  };

  const handleApproveRefund = async () => {
    if (!order || !user) return;
    try {
      await orderService.approveRefund(order.orderId, user.uid);
      fetchOrderData();
    } catch (err) {
      console.error('Approve refund failed', err);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!order || !user) return;
    try {
      await orderService.releaseEscrow(order.orderId, user.uid);
      fetchOrderData();
    } catch (err) {
      console.error('Release escrow failed', err);
    }
  };

  const handleRaiseDispute = async () => {
    console.log('[OrderDetails Dispute Step 1 ENTRY] handleRaiseDispute function triggered.');
    console.log('[OrderDetails Dispute Step 2 Context Audit]', {
      order,
      orderIdFromParams: orderId,
      orderObjOrderId: order?.orderId,
      user,
      userUid: user?.uid,
      disputeReason
    });

    // Resolve order ID
    const targetOrderId = order?.orderId || orderId;
    if (!targetOrderId) {
      console.error('[OrderDetails Dispute Step 2 Error] No valid order ID resolved.');
      setDisputeError('Unable to identify order reference for dispute submission.');
      return;
    }

    // Resolve active user UID with fallback to Firebase auth if context user is temporarily null
    let activeUserUid = user?.uid;
    if (!activeUserUid) {
      try {
        activeUserUid = getFirebaseAuth().currentUser?.uid;
        console.log('[OrderDetails Dispute Step 3 Auth Fallback] Retrieved activeUserUid from Firebase auth:', activeUserUid);
      } catch (e) {
        console.warn('[OrderDetails Dispute Step 3 Auth Fallback Notice] Failed to fetch fallback auth user:', e);
      }
    }

    const resolvedUserUid: string = activeUserUid || order?.buyerId || order?.userUid || '';

    const trimmedReason = (disputeReason || '').trim();
    if (!trimmedReason) {
      console.error('[OrderDetails Dispute Step 4 Validation Error] Empty dispute reason provided.');
      setDisputeError('Please specify details describing your dispute case.');
      return;
    }

    console.log('[OrderDetails Dispute Step 5 API Submission] Calling orderService.raiseDispute...', {
      targetOrderId,
      resolvedUserUid,
      trimmedReason
    });

    setIsDisputing(true);
    setDisputeError(null);

    try {
      await orderService.raiseDispute(targetOrderId, resolvedUserUid, trimmedReason);
      console.log('[OrderDetails Dispute Step 6 SUCCESS] Dispute case successfully created and saved.');
      
      const nowIso = new Date().toISOString();
      const newDisputeLog = {
        timestamp: nowIso,
        message: `Buyer opened dispute case: ${trimmedReason}`,
        actorUid: resolvedUserUid,
        role: 'buyer',
        status: OrderStatus.DISPUTED
      };

      // Update local state immediately for instant feedback
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: OrderStatus.DISPUTED,
        disputeReason: trimmedReason,
        disputeStatus: 'opened',
        disputedAt: nowIso,
        activityLogs: [...(prev.activityLogs || []), newDisputeLog]
      } : prev);

      setShowDisputeModal(false);
      setDisputeReason('');
      
      // Re-fetch order data to refresh timeline
      await fetchOrderData();
    } catch (err: any) {
      console.error('[OrderDetails Dispute Step 6 CATCH BLOCK] Dispute process failed:', err);
      setDisputeError(err?.message || 'Failed to open dispute. Please check your connection and try again.');
    } finally {
      setIsDisputing(false);
    }
  };

  const handleCopyQr = () => {
    if (!order?.qrVerificationCode) return;
    navigator.clipboard.writeText(order.qrVerificationCode);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Retrieving Order Ledger...</p>
      </div>
    );
  }

  if (!order) {
    console.warn('[OrderDetails Navigation Trace] Rendering fallback view because order object is null/empty.');
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-200">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">Order Ledger Record</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          Order reference <span className="font-mono font-bold text-white">{orderId}</span> is confirmed on-chain. Order details are synchronizing with the ledger database.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              console.log('[OrderDetails Navigation Trace] User clicked Retry Fetch Order Data.');
              fetchOrderData();
            }}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            Retry Loading
          </button>
          <button
            onClick={() => {
              console.log('[OrderDetails Navigation Trace] User clicked Return to Market. Navigating to /discovery');
              navigate('/discovery');
              console.log('[OrderDetails Navigation Trace] navigate(/discovery) called.');
            }}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isBuyer = Boolean(user && order && (user.uid === order.buyerId || user.uid === order.userUid));
  const isAdmin = Boolean(user && (user.role === 'Admin' || user.role === 'Super Admin' || user.platformRole === 'admin' || user.platformRole === 'superadmin'));
  const isAuthorized = isBuyer || isMerchant || isAdmin;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-4 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          You are not authorized to view this order. Order details are private to the buyer and seller.
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          View My Orders
        </button>
      </div>
    );
  }

  const currentStatusClean = (order.orderStatus || 'pending_payment').toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Feedback Banners */}
        {actionError && (
          <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white font-bold text-[10px] uppercase">Dismiss</button>
          </div>
        )}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold text-[10px] uppercase">Dismiss</button>
          </div>
        )}        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors min-h-[44px] px-2 -ml-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Back to History</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight truncate">
                Order #{order.orderNumber}
              </h1>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                aria-label={`Copy order number ${order.orderNumber}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-violet-300 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none -my-2"
              >
                {copiedOrderNumber ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              {(() => {
                const badge = getSemanticBadge(order.orderStatus);
                const BadgeIcon = badge.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border shrink-0 ${badge.className}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-400 font-medium">Placed on {formatDate(order.createdAt)}</p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {isMerchant ? (
              <>
                {['paid', 'payment_verified', 'new_order', 'pending_payment'].includes(currentStatusClean) && (
                  <>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(OrderStatus.ACCEPTED, 'Order accepted by merchant')} 
                      className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                    >
                      {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      ACCEPT ORDER
                    </button>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(OrderStatus.REJECTED, 'Order rejected by merchant')} 
                      className="min-h-[44px] px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                    >
                      {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      REJECT ORDER
                    </button>
                  </>
                )}
                {currentStatusClean === 'accepted' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(OrderStatus.PREPARING, 'Items are being prepared')} 
                    className="min-h-[44px] px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    START PREPARING
                  </button>
                )}
                {currentStatusClean === 'preparing' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(OrderStatus.PACKED, 'Order packed and sealed')} 
                    className="min-h-[44px] px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    MARK PACKED
                  </button>
                )}
                {currentStatusClean === 'packed' && (
                  <>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(OrderStatus.READY_FOR_DISPATCH, 'Order ready for dispatch')} 
                      className="min-h-[44px] px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                    >
                      {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      READY FOR DISPATCH
                    </button>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => setShowShipmentModal(true)} 
                      className="min-h-[44px] px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <Truck className="w-4 h-4" /> DISPATCH / SHIP
                    </button>
                  </>
                )}
                {currentStatusClean === 'ready_for_dispatch' && (
                  <>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(OrderStatus.SHIPPED, 'Order shipped via carrier')} 
                      className="min-h-[44px] px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                    >
                      {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      MARK SHIPPED
                    </button>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => setShowShipmentModal(true)} 
                      className="min-h-[44px] px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <Truck className="w-4 h-4" /> COURIER DISPATCH
                    </button>
                  </>
                )}
                {currentStatusClean === 'shipped' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(OrderStatus.OUT_FOR_DELIVERY, 'Out for local delivery')} 
                    className="min-h-[44px] px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                  >
                    {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    MARK OUT FOR DELIVERY
                  </button>
                )}
                {currentStatusClean === 'out_for_delivery' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(OrderStatus.DELIVERED, 'Package delivered to recipient')} 
                    className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                  >
                    {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    MARK DELIVERED
                  </button>
                )}
                {currentStatusClean === 'refund_requested' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={handleApproveRefund} 
                    className="min-h-[44px] px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                  >
                    Approve Refund
                  </button>
                )}
                {order.escrowStatus === 'holding' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={handleReleaseEscrow} 
                    className="min-h-[44px] px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    Release Escrow
                  </button>
                )}
              </>
            ) : (
              <>
                {currentStatusClean === 'delivered' && (
                  <>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(OrderStatus.COMPLETED, 'Order confirmed & completed by buyer')} 
                      className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                    >
                      Confirm Receipt
                    </button>
                    <button 
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => setShowRefundModal(true)} 
                      className="min-h-[44px] px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      Request Refund
                    </button>
                  </>
                )}
                {['pending_payment', 'payment_verified', 'paid', 'new_order', 'accepted'].includes(currentStatusClean) && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(OrderStatus.CANCELLED, 'Cancelled by customer')} 
                    className="min-h-[44px] px-4 py-2.5 bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                  >
                    Cancel Order
                  </button>
                )}
                {currentStatusClean === 'completed' && (
                  <button 
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => setShowRefundModal(true)} 
                    className="min-h-[44px] px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                  >
                    Request Refund / Return
                  </button>
                )}
                <button 
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => setShowDisputeModal(true)} 
                  className="min-h-[44px] px-3.5 py-2.5 bg-rose-950/40 border border-rose-800/50 text-rose-300 hover:bg-rose-900/60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Open Dispute
                </button>
              </>
            )}

            <button 
              type="button"
              onClick={handleChatAboutOrder} 
              className="min-h-[44px] px-3.5 py-2.5 bg-violet-600/15 border border-violet-500/30 hover:bg-violet-600/25 text-violet-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
            <button 
              type="button"
              onClick={handleOpenInvoice} 
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            >
              <Printer className="w-3.5 h-3.5" /> Invoice
            </button>
            <button 
              type="button"
              onClick={handleOpenReceipt} 
              className="min-h-[44px] px-3.5 py-2.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              <FileText className="w-3.5 h-3.5" /> Receipt
            </button>
            <button 
              type="button"
              onClick={() => handleOpenVerify()} 
              className="min-h-[44px] px-3.5 py-2.5 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600 hover:text-white text-violet-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <QrCode className="w-3.5 h-3.5" /> Verify QR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            {/* QR Verification Card */}
            {order.qrVerificationCode && (
              <section className="bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-slate-900/80 border border-violet-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider block mb-1">
                      Store Pickup & Delivery Verification Token
                    </span>
                    <p className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider break-all">
                      {order.qrVerificationCode}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Present code to merchant or delivery courier to verify receipt.
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleCopyQr}
                  aria-label="Copy QR Verification Token"
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                >
                  {copiedQr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedQr ? 'Copied' : 'Copy Token'}</span>
                </button>
              </section>
            )}

            {/* Products List */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-7">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Package className="w-5 h-5 text-violet-400" /> 
                Order Products & Services ({items.length})
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.itemId || item.productId} className="space-y-4 bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {(item as any).imageUrl ? (
                          <img src={(item as any).imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-white uppercase truncate mb-1">
                          {item.productName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            SKU: {item.sku || 'N/A'}
                          </span>
                          {item.variantId && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                              Variant: {item.variantId}
                            </span>
                          )}
                          {item.isService && (
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                              Service
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-end justify-between mt-3 pt-3 border-t border-slate-850">
                           <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Price</p>
                             <p className="text-xs sm:text-sm font-bold text-white">{item.unitPrice.toFixed(2)} Pi</p>
                           </div>
                           <div className="text-center px-4">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Qty</p>
                             <p className="text-xs sm:text-sm font-bold text-white">x{item.quantity}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subtotal</p>
                             <p className="text-sm sm:text-base font-black text-violet-300">{item.subtotal.toFixed(2)} Pi</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {!isMerchant && (
                      <div className="pt-3 border-t border-slate-800/60 flex flex-wrap gap-2">
                         <button 
                           type="button"
                           onClick={() => navigate(`/product/${item.productId}`)} 
                           className="flex-1 min-w-[120px] min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                         >
                           <ExternalLink className="w-3.5 h-3.5" /> View Product
                         </button>
                         <button 
                           type="button"
                           onClick={() => navigate(`/product/${item.productId}`)} 
                           className="flex-1 min-w-[120px] min-h-[44px] px-3 py-2 bg-violet-600/10 text-violet-300 border border-violet-500/20 hover:bg-violet-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                         >
                           <RotateCcw className="w-3.5 h-3.5" /> Buy Again
                         </button>
                         
                        {(order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.DELIVERED) && reviewingItemId !== item.itemId && (
                          <button 
                            type="button"
                            onClick={() => setReviewingItemId(item.itemId)}
                            className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-emerald-600/10 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                          >
                            Review Item
                          </button>
                        )}
                      </div>
                    )}
                    {reviewingItemId === item.itemId && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <ReviewForm 
                          entityId={item.productId}
                          entityType="product"
                          businessId={order.businessId}
                          orderId={order.orderId}
                          onCancel={() => setReviewingItemId(null)}
                          onSuccess={() => setReviewingItemId(null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Price Breakdown */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-7">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-5 flex items-center gap-3">
                <Tag className="w-5 h-5 text-emerald-400" /> Financial Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-400">
                  <span>Product Subtotal</span>
                  <span className="text-white font-bold">{(order.subtotal || 0).toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-400">
                  <span>Shipping Fee</span>
                  <span className="text-white font-bold">+{(order.shipping || 0).toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-medium text-emerald-400">
                  <span>Discount Applied</span>
                  <span className="font-bold">-{(order.discount || 0).toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-400 border-b border-slate-800/80 pb-3">
                  <span>Tax (Estimated)</span>
                  <span className="text-white font-bold">+{(order.tax || 0).toFixed(2)} Pi</span>
                </div>
                
                <div className="pt-2 flex justify-between items-end border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Grand Total</span>
                    <span className="text-2xl sm:text-3xl font-black text-violet-300">
                      {(order.grandTotal || 0).toFixed(2)} <span className="text-sm font-bold text-slate-400">Pi</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Paid via {order.paymentStatus || 'Verified'}
                    </span>
                  </div>
                </div>

                {order.bmpRewardsEarned ? (
                  <div className="pt-2 flex justify-between text-xs font-bold text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <span>BMP Loyalty Tokens Earned</span>
                    <span>+{order.bmpRewardsEarned.toFixed(2)} BMP</span>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Seller Information */}
            {store && !isMerchant && (
              <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-7">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-5 flex items-center gap-3">
                  <StoreIcon className="w-5 h-5 text-amber-400" /> Merchant Information
                </h2>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                   <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                     {store.logoUrl ? (
                       <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" />
                     ) : (
                       <StoreIcon className="w-7 h-7 text-slate-600" />
                     )}
                   </div>
                   
                   <div className="flex-1 text-center sm:text-left space-y-1.5">
                     <div className="flex items-center justify-center sm:justify-start gap-2">
                       <h3 className="text-base sm:text-lg font-black text-white uppercase">{store.storeName}</h3>
                       {store.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                     </div>
                     <p className="text-xs font-medium text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                       <User className="w-3.5 h-3.5" /> Verified Partner Merchant
                     </p>
                     
                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 uppercase bg-amber-400/10 px-2 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-amber-400" /> {store.rating || 'New'} ({store.reviewCount || 0} reviews)
                        </span>
                        {(store.city || store.country) && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                            <MapPinIcon className="w-3 h-3" /> {store.city} {store.country}
                          </span>
                        )}
                     </div>
                   </div>
                   
                   <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                     <button 
                       type="button"
                       onClick={() => navigate(`/store/${store.storeId}`)} 
                       className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
                     >
                       Visit Store
                     </button>
                     <button 
                       type="button"
                       onClick={handleChatAboutOrder} 
                       className="flex-1 min-h-[44px] px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                     >
                       Chat
                     </button>
                   </div>
                </div>
              </section>
            )}

            {/* Shipping & Delivery Address + Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Truck className="w-4 h-4 text-violet-400" /> Shipping & Delivery
                  </h3>
                </div>
                {order.shippingAddress ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800/60 pb-3">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Recipient</p>
                      <p className="text-xs font-bold text-slate-200">{order.shippingAddress.fullName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{order.shippingAddress.phone || 'N/A'}</p>
                    </div>
                    
                    <div className="pb-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Delivery Address</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {order.shippingAddress.street}<br/>
                        {order.shippingAddress.city}, {order.shippingAddress.state}<br/>
                        ZIP: {order.shippingAddress.postalCode}
                      </p>
                    </div>

                    {(order.trackingNumber || order.shipmentId || order.courierName) && (
                      <div className="pt-3 border-t border-slate-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Courier</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded">
                            {order.courierName || 'Logistics Partner'}
                          </span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Air Waybill (AWB) Tracking ID</p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-amber-300 tracking-wider break-all">
                              {order.trackingNumber || 'AWB-PENDING'}
                            </span>
                            {order.trackingNumber && (
                              <button
                                type="button"
                                onClick={handleCopyAwbNumber}
                                aria-label={`Copy AWB tracking number ${order.trackingNumber}`}
                                className="min-h-[44px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none shrink-0"
                              >
                                {copiedAwb ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 text-[10px]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[10px]">Copy AWB</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {order.shipmentId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/shipment/${order.shipmentId}`)}
                            className="w-full min-h-[44px] py-2.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-200 border border-violet-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-violet-400"
                          >
                            <Truck className="w-4 h-4" /> Live Tracking Status
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">Digital Delivery / In-Person Service</p>
                )}
              </section>

              <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Payment & Escrow
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Method</span>
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pi Network / BMP
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Verified</span>
                    <span className="text-xs font-bold text-emerald-300 uppercase">Verified On-Chain</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Escrow Protection</span>
                    <span className="text-xs font-bold text-amber-300 uppercase">{order.escrowStatus || 'Active (Holding)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">TX Hash</span>
                    <span className="text-xs font-mono text-violet-300 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/40 truncate max-w-[140px]">
                      {order.paymentTxId || 'PI_TX_' + order.orderId.substring(0, 8)}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Order Timeline & Audit */}
          <div className="lg:col-span-1 space-y-6 sm:space-y-8">
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Navigation className="w-5 h-5 text-violet-400" /> Order Lifecycle
              </h2>
              
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {[
                  { label: 'Order Placed', status: 'completed', time: order.createdAt },
                  { label: 'Payment Verified', status: 'completed', time: order.paymentVerifiedAt || order.createdAt },
                  { label: 'Seller Accepted', status: order.acceptedAt ? 'completed' : (currentStatusClean === 'accepted' ? 'current' : 'pending'), time: order.acceptedAt },
                  { label: 'Preparing Items', status: order.preparingAt ? 'completed' : (currentStatusClean === 'preparing' ? 'current' : 'pending'), time: order.preparingAt },
                  { label: 'Packed & Sealed', status: order.packedAt ? 'completed' : (currentStatusClean === 'packed' ? 'current' : 'pending'), time: order.packedAt },
                  { label: 'Ready For Dispatch', status: order.readyForDispatchAt ? 'completed' : (currentStatusClean === 'ready_for_dispatch' ? 'current' : 'pending'), time: order.readyForDispatchAt },
                  { label: 'Shipped', status: order.shippedAt ? 'completed' : (currentStatusClean === 'shipped' ? 'current' : 'pending'), time: order.shippedAt },
                  { label: 'Out for Delivery', status: order.outForDeliveryAt ? 'completed' : (currentStatusClean === 'out_for_delivery' ? 'current' : 'pending'), time: order.outForDeliveryAt },
                  { label: 'Delivered', status: order.deliveredAt ? 'completed' : (currentStatusClean === 'delivered' ? 'current' : 'pending'), time: order.deliveredAt },
                  { label: 'Completed', status: order.completedAt ? 'completed' : (currentStatusClean === 'completed' ? 'current' : 'pending'), time: order.completedAt }
                ].map((step, i) => (
                  <div key={i} className="relative pl-9">
                    <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                      step.status === 'completed' 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                        : step.status === 'current' 
                        ? 'bg-violet-600 border-violet-400 text-white shadow-md shadow-violet-600/40 ring-4 ring-violet-500/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}>
                      {step.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      {step.status === 'current' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-tight ${
                        step.status === 'completed' ? 'text-slate-200' :
                        step.status === 'current' ? 'text-violet-300 font-black' :
                        'text-slate-500'
                      }`}>
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                          {formatDate(step.time)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Audit Log / Activity */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-violet-400" /> Activity Log
              </h2>
              
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {(order.activityLogs || []).map((log, i) => (
                  <div key={i} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                    <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-0.5">
                      {formatDate(log.timestamp)}
                    </p>
                    <p className="text-xs font-medium text-slate-300">{log.message}</p>
                  </div>
                ))}
                {(!order.activityLogs || order.activityLogs.length === 0) && timeline.map((event, i) => (
                  <div key={i} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                    <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-0.5">
                      {formatDate(event.createdAt)}
                    </p>
                    <p className="text-xs font-medium text-slate-300">{event.message}</p>
                  </div>
                ))}
                {(!order.activityLogs || order.activityLogs.length === 0) && timeline.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No activity recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Shipment Creation Modal */}
        {showShipmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6">
                Create Shipment & Dispatch
              </h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Delivery Method
                  </label>
                  <select 
                    value={shipmentMethod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShipmentMethod(val);
                      if (val === 'courier') {
                        if (!courierName) setCourierName('TEST COURIER (Simulated Integration)');
                        if (!trackingNumber) setTrackingNumber(`TEST-AWB-PI-${Math.random().toString(36).substring(2,8).toUpperCase()}`);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs font-medium text-white focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20"
                  >
                    <option value="">Select Method</option>
                    <option value="store_pickup">Store Pickup</option>
                    <option value="self_delivery">Self Delivery</option>
                    <option value="local_delivery">Local Delivery</option>
                    <option value="courier">Courier Partner (Test Courier)</option>
                  </select>
                </div>
                
                {shipmentMethod === 'courier' && (
                  <>
                    <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider block">
                        Test Courier Adapter Active
                      </span>
                      <p className="text-xs text-slate-300">
                        Simulated Air Waybill (AWB) generation for Pi Network Testnet fulfillment workflow.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Courier Partner Name
                      </label>
                      <input 
                        type="text" 
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="TEST COURIER (Simulated Integration)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs font-medium text-white focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Air Waybill / Tracking ID
                      </label>
                      <input 
                        type="text" 
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="TEST-AWB-PI-XXXXXX"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs font-medium text-white focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowShipmentModal(false)}
                  className="flex-1 min-h-[44px] px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleCreateShipment}
                  disabled={!shipmentMethod}
                  className="flex-1 min-h-[44px] px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-violet-600/20 transition-all focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Request Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-2xl">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" /> Request Return / Refund
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Reason for Refund
                  </label>
                  <textarea 
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Describe issue with product or order delivery..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-white focus:outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Requested Amount (Pi)
                  </label>
                  <input 
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder={`Max: ${order.grandTotal} Pi`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs font-medium text-white focus:outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowRefundModal(false)} 
                  className="flex-1 min-h-[44px] px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleRequestRefund} 
                  disabled={!refundReason} 
                  className="flex-1 min-h-[44px] px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open Dispute Modal */}
        {showDisputeModal && order && (
          <OpenDisputeModal
            isOpen={showDisputeModal}
            onClose={() => setShowDisputeModal(false)}
            order={order}
            currentUserUid={user?.uid || 'user'}
            onDisputeCreated={(createdDisputeId) => {
              setShowDisputeModal(false);
              setOrder(prev => prev ? ({ ...prev, disputeId: createdDisputeId, disputeStatus: 'opened', orderStatus: OrderStatus.DISPUTED }) : prev);
            }}
          />
        )}

        {/* Existing Dispute Case Detailed View */}
        {order?.disputeId && (
          <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Active Dispute Arbitration
            </h3>
            <DisputeDetailView
              disputeId={order.disputeId}
              currentUserUid={user?.uid || ''}
              currentUserRole={isMerchant ? 'SELLER' : 'BUYER'}
            />
          </div>
        )}

        {/* Enterprise Invoice Modal */}
        {showInvoiceModal && enterpriseInvoice && (
          <EnterpriseInvoiceModal 
            invoice={enterpriseInvoice} 
            onClose={() => setShowInvoiceModal(false)} 
            onVerifyQr={(code) => {
              setShowInvoiceModal(false);
              handleOpenVerify(code);
            }}
          />
        )}

        {/* Professional Receipt Modal */}
        {showReceiptModal && professionalReceipt && (
          <ProfessionalReceiptModal 
            receipt={professionalReceipt} 
            onClose={() => setShowReceiptModal(false)} 
            onVerifyQr={(code) => {
              setShowReceiptModal(false);
              handleOpenVerify(code);
            }}
          />
        )}

        {/* QR Verification Modal */}
        {showVerifyModal && (
          <QRVerificationModal 
            initialCode={verifyCode} 
            onClose={() => setShowVerifyModal(false)} 
          />
        )}

      </div>
    </div>
  );
};

export default OrderDetails;
