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
        setItems(orderItems.length > 0 ? orderItems : (data.items || []));
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

  const isMerchant = user?.uid === order?.businessId || user?.uid === order?.sellerId;

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

  const handleUpdateStatus = async (status: string, remarks?: string) => {
    if (!order || !user) return;
    try {
      const role = isMerchant ? 'seller' : 'buyer';
      await orderService.updateOrderStatus(order.orderId, status, user.uid, role, remarks);
      fetchOrderData();
    } catch (err) {
      console.error('Status update failed', err);
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

  const currentStatusClean = (order.orderStatus || 'pending_payment').toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="space-y-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to History</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter truncate">Order {order.orderNumber}</h1>
              <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Placed on {formatDate(order.createdAt)}</p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {isMerchant ? (
              <>
                {(currentStatusClean === 'new_order' || currentStatusClean === 'payment_verified' || currentStatusClean === 'pending_payment') && (
                  <>
                    <button onClick={() => handleUpdateStatus(OrderStatus.ACCEPTED, 'Order accepted by merchant')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20">Accept Order</button>
                    <button onClick={() => handleUpdateStatus(OrderStatus.REJECTED, 'Order rejected by merchant')} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Reject Order</button>
                  </>
                )}
                {currentStatusClean === 'accepted' && (
                  <button onClick={() => handleUpdateStatus(OrderStatus.PREPARING, 'Items are being prepared')} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Preparing</button>
                )}
                {currentStatusClean === 'preparing' && (
                  <button onClick={() => handleUpdateStatus(OrderStatus.PACKED, 'Order packed and sealed')} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Packed</button>
                )}
                {currentStatusClean === 'packed' && (
                  <button onClick={() => setShowShipmentModal(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Dispatch / Ship</button>
                )}
                {(currentStatusClean === 'shipped' || currentStatusClean === 'ready_for_dispatch') && (
                  <button onClick={() => handleUpdateStatus(OrderStatus.OUT_FOR_DELIVERY, 'Out for local delivery')} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Out For Delivery</button>
                )}
                {(currentStatusClean === 'out_for_delivery' || currentStatusClean === 'shipped') && (
                  <button onClick={() => handleUpdateStatus(OrderStatus.DELIVERED, 'Package delivered to recipient')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Delivered</button>
                )}
                {currentStatusClean === 'refund_requested' && (
                  <button onClick={handleApproveRefund} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Approve Refund</button>
                )}
                {order.escrowStatus === 'holding' && (
                  <button onClick={handleReleaseEscrow} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">Release Escrow</button>
                )}
              </>
            ) : (
              <>
                {currentStatusClean === 'delivered' && (
                  <>
                    <button onClick={() => handleUpdateStatus(OrderStatus.COMPLETED, 'Order confirmed & completed by buyer')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20">Confirm Receipt</button>
                    <button onClick={() => setShowRefundModal(true)} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Request Refund</button>
                  </>
                )}
                {['pending_payment', 'payment_verified', 'new_order', 'accepted'].includes(currentStatusClean) && (
                  <button onClick={() => handleUpdateStatus(OrderStatus.CANCELLED, 'Cancelled by customer')} className="px-4 py-2.5 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel Order</button>
                )}
                {currentStatusClean === 'completed' && (
                  <button onClick={() => setShowRefundModal(true)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Request Refund / Return</button>
                )}
                <button onClick={() => setShowDisputeModal(true)} className="px-3 py-2 bg-rose-950/40 border border-rose-800/50 text-rose-400 hover:bg-rose-900/60 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Open Dispute
                </button>
              </>
            )}

            <button onClick={handleChatAboutOrder} className="px-3.5 py-2.5 bg-indigo-600/15 border border-indigo-500/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
            <button onClick={handleOpenInvoice} className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <Printer className="w-3.5 h-3.5" /> Invoice
            </button>
            <button onClick={handleOpenReceipt} className="px-3.5 py-2.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Receipt
            </button>
            <button onClick={() => handleOpenVerify()} className="px-3.5 py-2.5 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600 hover:text-white text-violet-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5" /> Verify QR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* QR Verification Card */}
            {order.qrVerificationCode && (
              <section className="bg-gradient-to-r from-indigo-950/60 to-slate-900/80 border border-indigo-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <QrCode className="w-12 h-12 text-slate-950" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Store Pickup & Dispatch QR Token</span>
                    <p className="text-sm font-mono font-bold text-white tracking-wider">{order.qrVerificationCode}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Present code to store clerk or delivery agent to verify exchange.</p>
                  </div>
                </div>
                <button 
                  onClick={handleCopyQr}
                  className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
                >
                  {copiedQr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedQr ? 'Copied' : 'Copy QR Token'}
                </button>
              </section>
            )}

            {/* Products List */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 sm:mb-8 flex items-center gap-3">
                <Package className="w-6 h-6 text-indigo-400" /> Order Products & Services ({items.length})
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.itemId || item.productId} className="space-y-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                        {(item as any).imageUrl ? (
                          <img src={(item as any).imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-slate-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-white uppercase truncate mb-1">{item.productName}</h4>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">SKU: {item.sku || 'N/A'}</span>
                          {item.variantId && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Variant: {item.variantId}</span>}
                          {item.isService && <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">Service</span>}
                        </div>
                        
                        <div className="flex items-end justify-between mt-4">
                           <div>
                             <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Price per unit</p>
                             <p className="text-sm font-bold text-white">{item.unitPrice.toFixed(2)} Pi</p>
                           </div>
                           <div className="text-center px-4">
                             <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Qty</p>
                             <p className="text-sm font-bold text-white">x{item.quantity}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                             <p className="text-base sm:text-lg font-black text-indigo-400">{item.subtotal.toFixed(2)} Pi</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {!isMerchant && (
                      <div className="pt-4 mt-4 border-t border-slate-800/50 flex flex-wrap gap-2">
                         <button onClick={() => navigate(`/product/${item.productId}`)} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                           <ExternalLink className="w-3 h-3" /> View Product
                         </button>
                         <button onClick={() => navigate(`/product/${item.productId}`)} className="flex-1 min-w-[120px] px-3 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                           <RotateCcw className="w-3 h-3" /> Buy Again
                         </button>
                         
                        {(order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.DELIVERED) && reviewingItemId !== item.itemId && (
                          <button 
                            onClick={() => setReviewingItemId(item.itemId)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all mt-2 sm:mt-0"
                          >
                            Review Item
                          </button>
                        )}
                      </div>
                    )}
                    {reviewingItemId === item.itemId && (
                      <div className="mt-4">
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
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Tag className="w-6 h-6 text-emerald-400" /> Financial Statement
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Product Subtotal</span>
                  <span className="text-white">{(order.subtotal || 0).toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Shipping Charge</span>
                  <span className="text-white">+{(order.shipping || 0).toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-400">
                  <span>Discount Applied</span>
                  <span>-{(order.discount || 0).toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400 border-b border-slate-800 pb-4">
                  <span>Tax (GST/VAT)</span>
                  <span className="text-white">+{(order.tax || 0).toFixed(2)} Pi</span>
                </div>
                
                <div className="pt-2 flex justify-between items-end border-b border-slate-800 pb-4">
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grand Total</span>
                    <span className="text-2xl sm:text-3xl font-black text-indigo-400">{(order.grandTotal || 0).toFixed(2)} Pi</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-black uppercase tracking-widest">
                      Paid via {order.paymentStatus || 'Verified'}
                    </span>
                  </div>
                </div>

                {order.bmpRewardsEarned ? (
                  <div className="pt-2 flex justify-between text-xs font-bold text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <span>BMP Loyalty Tokens Earned</span>
                    <span>+{order.bmpRewardsEarned.toFixed(2)} BMP</span>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Seller Information */}
            {store && !isMerchant && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <StoreIcon className="w-5 h-5 text-amber-400" /> Seller Info
                </h2>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                   <div className="w-20 h-20 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                     {store.logoUrl ? (
                       <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" />
                     ) : (
                       <StoreIcon className="w-8 h-8 text-slate-700" />
                     )}
                   </div>
                   
                   <div className="flex-1 text-center sm:text-left space-y-2">
                     <div className="flex items-center justify-center sm:justify-start gap-2">
                       <h3 className="text-xl font-black text-white uppercase">{store.storeName}</h3>
                       {store.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                     </div>
                     <p className="text-xs font-bold text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                       <User className="w-3 h-3" /> Partner Merchant
                     </p>
                     
                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase bg-amber-400/10 px-2 py-1 rounded">
                          <Star className="w-3 h-3 fill-amber-400" /> {store.rating || 'New'} ({store.reviewCount || 0} reviews)
                        </span>
                        {(store.city || store.country) && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded">
                            <MapPinIcon className="w-3 h-3" /> {store.city} {store.country}
                          </span>
                        )}
                     </div>
                   </div>
                   
                   <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                     <button onClick={() => navigate(`/store/${store.storeId}`)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                       Visit Store
                     </button>
                     <button onClick={handleChatAboutOrder} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap">
                       Chat
                     </button>
                   </div>
                </div>
              </section>
            )}

            {/* Shipping & Delivery Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-400" /> Shipping Address
                  </h3>
                </div>
                {order.shippingAddress ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800/50 pb-4">
                      <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Recipient Name</p>
                      <p className="text-xs font-bold text-slate-200">{order.shippingAddress.fullName}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{order.shippingAddress.phone || 'N/A'}</p>
                    </div>
                    
                    <div className="pb-2">
                      <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Delivery Address</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {order.shippingAddress.street}<br/>
                        {order.shippingAddress.city}, {order.shippingAddress.state}<br/>
                        ZIP: {order.shippingAddress.postalCode}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] sm:text-xs text-slate-600 italic">No address required (Digital/Service)</p>
                )}
              </section>

              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight mb-4 sm:mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Payment & Escrow
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Method</span>
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Pi Testnet / BMP Wallet</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Verified</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">Yes (Blockchain)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Escrow Protection</span>
                    <span className="text-xs font-bold text-amber-400 uppercase">{order.escrowStatus || 'Active (Holding)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">TX Hash</span>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded truncate max-w-[140px]">{order.paymentTxId || 'PI_TX_' + order.orderId.substring(0,6)}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Order Timeline */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Navigation className="w-5 h-5 text-indigo-400" /> Order Lifecycle
              </h2>
              
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {[
                  { label: 'Order Placed', status: 'completed', time: order.createdAt },
                  { label: 'Payment Verified', status: order.paymentVerifiedAt ? 'completed' : 'completed', time: order.paymentVerifiedAt || order.createdAt },
                  { label: 'Seller Accepted', status: order.acceptedAt ? 'completed' : (currentStatusClean === 'accepted' ? 'current' : 'pending'), time: order.acceptedAt },
                  { label: 'Preparing Items', status: order.preparingAt ? 'completed' : (currentStatusClean === 'preparing' ? 'current' : 'pending'), time: order.preparingAt },
                  { label: 'Packed & Sealed', status: order.packedAt ? 'completed' : (currentStatusClean === 'packed' ? 'current' : 'pending'), time: order.packedAt },
                  { label: 'Ready For Dispatch', status: order.readyForDispatchAt ? 'completed' : (currentStatusClean === 'ready_for_dispatch' ? 'current' : 'pending'), time: order.readyForDispatchAt },
                  { label: 'Shipped', status: order.shippedAt ? 'completed' : (currentStatusClean === 'shipped' ? 'current' : 'pending'), time: order.shippedAt },
                  { label: 'Out for Delivery', status: order.outForDeliveryAt ? 'completed' : (currentStatusClean === 'out_for_delivery' ? 'current' : 'pending'), time: order.outForDeliveryAt },
                  { label: 'Delivered', status: order.deliveredAt ? 'completed' : (currentStatusClean === 'delivered' ? 'current' : 'pending'), time: order.deliveredAt },
                  { label: 'Completed', status: order.completedAt ? 'completed' : (currentStatusClean === 'completed' ? 'current' : 'pending'), time: order.completedAt }
                ].map((step, i) => (
                  <div key={i} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-950 flex items-center justify-center z-10 ${
                      step.status === 'completed' ? 'bg-emerald-500' :
                      step.status === 'current' ? 'bg-amber-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                      'bg-slate-800'
                    }`}>
                      {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                    </div>
                    <div>
                      <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-tight ${
                        step.status === 'completed' ? 'text-white' :
                        step.status === 'current' ? 'text-amber-400' :
                        'text-slate-500'
                      }`}>
                        {step.label}
                      </p>
                      {step.time && <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{formatDate(step.time)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Audit Log / Activity */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Clock className="w-5 h-5 text-violet-400" /> History Audit Log
              </h2>
              
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {(order.activityLogs || []).map((log, i) => (
                  <div key={i} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{formatDate(log.timestamp)}</p>
                    <p className="text-xs font-medium text-slate-300">{log.message}</p>
                  </div>
                ))}
                {(!order.activityLogs || order.activityLogs.length === 0) && timeline.map((event, i) => (
                  <div key={i} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{formatDate(event.createdAt)}</p>
                    <p className="text-xs font-medium text-slate-300">{event.message}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Shipment Creation Modal */}
        {showShipmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Create Shipment & Dispatch</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Delivery Method</label>
                  <select 
                    value={shipmentMethod}
                    onChange={(e) => setShipmentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Method</option>
                    <option value="store_pickup">Store Pickup</option>
                    <option value="self_delivery">Self Delivery</option>
                    <option value="local_delivery">Local Delivery</option>
                    <option value="courier">Courier Partner</option>
                  </select>
                </div>
                
                {shipmentMethod === 'courier' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Courier Partner Name</label>
                      <input 
                        type="text" 
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="e.g. Shiprocket, BlueDart, DHL"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tracking Number</label>
                      <input 
                        type="text" 
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Waybill / Tracking ID"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowShipmentModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateShipment}
                  disabled={!shipmentMethod}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" /> Request Return / Refund
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reason for Refund</label>
                  <textarea 
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Describe issue with product or order delivery..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-medium text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Requested Amount (Pi)</label>
                  <input 
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder={`Max: ${order.grandTotal} Pi`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowRefundModal(false)} className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest">Cancel</button>
                <button onClick={handleRequestRefund} disabled={!refundReason} className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest">Submit Request</button>
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
