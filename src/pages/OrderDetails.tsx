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
  MapPin, 
  CreditCard,
  Loader2,
  ChevronRight,
  ShieldCheck,
  User,
  ShoppingBag,
  ExternalLink,
  ClipboardList,
  MessageSquare,
  Store as StoreIcon,
  Star,
  MapPin as MapPinIcon,
  RotateCcw,
  Heart,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { Order, OrderItem, OrderTimelineEvent, OrderStatus, PaymentStatus, FulfillmentStatus, Store } from '../types';
import { storeService } from '../services/storeService';
import { ReviewForm } from '../components/ReviewForm';

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
      
      // Update local tracking info
      if (trackingNumber || courierName) {
        const { getFirebaseDb } = await import('../firebase/config');
        const { writeBatch, doc, serverTimestamp } = await import('firebase/firestore');
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
          'logistics.trackingNumber': trackingNumber,
          'logistics.courierName': courierName,
          updatedAt: serverTimestamp()
        });
        await batch.commit();
      }
      
      setShowShipmentModal(false);
      
      // Refresh order
      const { orderService } = await import('../services/orderService');
      const updatedOrder = await orderService.getOrder(order.orderId);
      if (updatedOrder) setOrder(updatedOrder);
    } catch (err) {
      console.error('Failed to create shipment', err);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrder(orderId!);
      if (data) {
        setOrder(data);
        if (data.storeId || data.businessId) {
          const s = await storeService.getStore(data.storeId || data.businessId);
          setStore(s);
        }
        const [orderItems, orderTimeline] = await Promise.all([
          orderService.getOrderItems(orderId!),
          orderService.getOrderTimeline(orderId!)
        ]);
        setItems(orderItems);
        setTimeline(orderTimeline);
      }
    } catch (err) {
      console.error('Failed to fetch order data', err);
    } finally {
      setLoading(false);
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

  const isMerchant = user?.uid === order?.businessId; // Simplified check for foundation

  const handleChatAboutOrder = () => {
    if (!order || !user) return;
    const partnerId = isMerchant ? order.userUid : order.businessId;
    const partnerName = isMerchant ? 'Customer' : 'Merchant';
    navigate('/inbox', { 
      state: { 
        targetUid: partnerId,
        targetName: partnerName,
        contextType: 'order',
        contextId: order.orderId
      }
    });
  };

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!order || !user) return;
    try {
      await orderService.updateOrderStatus(order.orderId, status, user.uid, 'Merchant');
      fetchOrderData();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Retrieving Order Ledger...</p>
      </div>
    );
  }

  if (!order) return null;

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
                {order.orderStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Placed on {formatDate(order.createdAt)}</p>
          </div>

          
                    {isMerchant && (
            <div className="flex flex-wrap gap-2">
              {order.orderStatus === OrderStatus.NEW_ORDER && (
                <>
                  <button onClick={() => handleUpdateStatus(OrderStatus.ACCEPTED)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Accept Order</button>
                  <button onClick={() => handleUpdateStatus(OrderStatus.CANCELLED)} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Reject Order</button>
                </>
              )}
              {order.orderStatus === OrderStatus.ACCEPTED && (
                <button onClick={() => handleUpdateStatus(OrderStatus.PACKED)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Pack Order</button>
              )}
              {order.orderStatus === OrderStatus.PACKED && (
                <button onClick={() => setShowShipmentModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Truck className="w-3 h-3" /> Create Shipment</button>
              )}
                                          {(order.orderStatus === OrderStatus.READY_FOR_PICKUP || order.orderStatus === OrderStatus.SHIPPED || order.orderStatus === OrderStatus.OUT_FOR_DELIVERY || order.orderStatus === OrderStatus.DELIVERED) && (
                <>
                  <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Navigation className="w-3 h-3" /> Track Shipment</button>
                  {order.orderStatus !== OrderStatus.SHIPPED && order.orderStatus !== OrderStatus.OUT_FOR_DELIVERY && order.orderStatus !== OrderStatus.DELIVERED && (
                    <button onClick={() => handleUpdateStatus(OrderStatus.SHIPPED)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Shipped</button>
                  )}
                  {order.orderStatus !== OrderStatus.DELIVERED && (
                    <button onClick={() => handleUpdateStatus(OrderStatus.COMPLETED)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Delivered</button>
                  )}
                </>
              )}
              <button onClick={handleChatAboutOrder} className="px-4 py-2 bg-indigo-600/15 border border-indigo-500/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Chat with Customer
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <Printer className="w-3 h-3" /> Print Invoice
              </button>
            </div>
          )}
          {!isMerchant && (
            <div className="flex gap-2">
              <button onClick={handleChatAboutOrder} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Chat with Merchant
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <Printer className="w-3 h-3" /> Print Invoice
              </button>
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 sm:mb-8 flex items-center gap-3">
                <Package className="w-6 h-6 text-indigo-400" /> Products
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.itemId} className="space-y-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 sm:p-6">
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
                         <button className="px-3 py-2 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" onClick={() => alert("Added to wishlist")}>
                           <Heart className="w-3 h-3" />
                         </button>
                         <button className="px-3 py-2 bg-slate-900 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" onClick={() => alert("Reported")}>
                           <AlertTriangle className="w-3 h-3" />
                         </button>
                         
                        {order.orderStatus === OrderStatus.COMPLETED && reviewingItemId !== item.itemId && (
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
                      <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                        <ReviewForm 
                          entityId={item.productId}
                          entityType="product"
                          businessId={order.businessId}
                          orderId={order.orderId}
                          onCancel={() => setReviewingItemId(null)}
                          onSuccess={() => {
                            setReviewingItemId(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-amber-400" /> Order Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order ID</p>
                   <p className="text-sm font-bold text-white">{order.orderNumber}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order Date</p>
                   <p className="text-sm font-bold text-white">{formatDate(order.createdAt)}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Method</p>
                   <p className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400"/> BMP Rewards Wallet</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Date</p>
                   <p className="text-sm font-bold text-white">{formatDate(order.createdAt)}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Transaction ID</p>
                   <p className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-max">{order.checkoutSessionId || 'TXN_' + order.orderId.substring(0, 8)}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice Number</p>
                   <p className="text-sm font-mono text-slate-300">INV-{order.orderNumber}</p>
                 </div>
              </div>
            </section>

                        {/* Price Breakdown */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Tag className="w-6 h-6 text-emerald-400" /> Price Breakdown
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Product Subtotal</span>
                  <span className="text-white">{order.subtotal.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Shipping Charge</span>
                  <span className="text-white">+{order.shipping.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-400">
                  <span>Discount</span>
                  <span>-{order.discount?.toFixed(2) || '0.00'} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>-0.00 Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400 border-b border-slate-800 pb-4">
                  <span>Tax (GST/VAT)</span>
                  <span className="text-white">+{order.tax.toFixed(2)} Pi</span>
                </div>
                
                <div className="pt-2 flex justify-between items-end border-b border-slate-800 pb-4">
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grand Total</span>
                    <span className="text-2xl sm:text-3xl font-black text-indigo-400">{order.grandTotal.toFixed(2)} Pi</span>
                  </div>
                  {order.paymentStatus === 'paid' && (
                    <div className="text-right">
                       <span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest">Paid via Wallet</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                    <span>BMP Rewards Used</span>
                    <span className="text-emerald-400">{(order as any).rewardsUsed?.toFixed(2) || '0.00'} Pi</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                    <span>Wallet Balance Before Payment</span>
                    <span className="text-white">{(order as any).walletBalanceBefore?.toFixed(2) || 'N/A'} Pi</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                    <span>Wallet Balance After Payment</span>
                    <span className="text-white">{(order as any).walletBalanceAfter?.toFixed(2) || 'N/A'} Pi</span>
                  </div>
                </div>
              </div>
            </section>

            {store && !isMerchant && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <StoreIcon className="w-5 h-5 text-amber-400" /> Seller Information
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
                       <User className="w-3 h-3" /> Merchant: {'Verified Partner'}
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
                       Chat with Seller
                     </button>
                   </div>
                </div>
              </section>
            )}
            {/* Logistics & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-400" /> Shipping Details
                  </h3>
                  {order.shipmentId && (
                    <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} className="px-3 py-1.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                      <Navigation className="w-3 h-3" /> Track
                    </button>
                  )}
                </div>
                {order.shippingAddress ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-800/50 pb-4">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Recipient Name</p>
                        <p className="text-xs font-bold text-slate-200">{order.shippingAddress.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Phone Number</p>
                        <p className="text-xs font-bold text-slate-200">{order.shippingAddress.phone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="border-b border-slate-800/50 pb-4">
                      <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Full Address</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {order.shippingAddress.street}<br/>
                        {order.shippingAddress.city}, {order.shippingAddress.state}<br/>
                        PIN: {order.shippingAddress.postalCode}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Courier Partner</p>
                        <p className="text-xs font-bold text-white">{order.logistics?.courierName || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Tracking Number</p>
                        {order.logistics?.trackingNumber ? (
                          <p className="text-xs font-mono text-emerald-400 bg-emerald-500/10 inline-block px-1.5 py-0.5 rounded">{order.logistics.trackingNumber}</p>
                        ) : (
                          <p className="text-xs font-bold text-slate-500">Pending</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Shipping Date</p>
                        <p className="text-xs font-bold text-slate-300">{formatDate(order.shippedAt) || 'Pending'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Estimated Delivery</p>
                        <p className="text-xs font-bold text-slate-300">{formatDate(order.estimatedDelivery) || 'Pending'}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800/50">
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Current Status</p>
                        <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded text-[10px] font-black uppercase">{order.currentStatus || order.orderStatus}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] sm:text-xs text-slate-600 italic">No address (Digital/Service)</p>
                )}
              </section>


                            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight mb-4 sm:mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Payment Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Method</span>
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> BMP Rewards Wallet</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Status</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">Success</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Transaction ID</span>
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded">{order.checkoutSessionId || 'TXN_PENDING'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Wallet Debit Amount</span>
                    <span className="text-xs font-bold text-amber-400 uppercase">{order.grandTotal.toFixed(2)} Pi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Time</span>
                    <span className="text-[10px] font-bold text-slate-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Timeline */}
                    <div className="lg:col-span-1 space-y-8">
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Navigation className="w-5 h-5 text-indigo-400" /> Order Timeline
              </h2>
              
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {[
                  { label: 'Order Placed', status: 'completed', time: order.createdAt },
                  { label: 'Payment Successful', status: 'completed', time: order.createdAt },
                  { label: 'Seller Accepted', status: order.acceptedAt ? 'completed' : (order.orderStatus === OrderStatus.NEW_ORDER ? 'current' : 'pending'), time: order.acceptedAt },
                  { label: 'Packed', status: order.packedAt ? 'completed' : (order.acceptedAt && !order.packedAt ? 'current' : 'pending'), time: order.packedAt },
                  { label: 'Shipped', status: order.shippedAt ? 'completed' : (order.packedAt && !order.shippedAt ? 'current' : 'pending'), time: order.shippedAt },
                  { label: 'Out for Delivery', status: order.currentStatus === 'out_for_delivery' || order.deliveredAt ? 'completed' : (order.shippedAt && !order.deliveredAt ? 'current' : 'pending'), time: null },
                  { label: 'Delivered', status: order.deliveredAt ? 'completed' : 'pending', time: order.deliveredAt }
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

            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Clock className="w-5 h-5 text-violet-400" /> Activity Log
              </h2>
              
              <div className="space-y-4">
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
            
            {!isMerchant && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} disabled={!order.shipmentId} className="w-full px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left">Track Shipment</button>
                  <button onClick={handleChatAboutOrder} className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left">Chat with Merchant</button>
                  <button onClick={() => window.print()} className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left">Download Invoice</button>
                  <button onClick={() => alert("Issue raised")} className="w-full px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left mt-2">Raise Issue</button>
                </div>
              </section>
            )}
          </div>
        </div>
      
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md">
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Create Shipment</h2>
            
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
                  <option value="courier">Courier Delivery</option>
                </select>
              </div>
              
              {shipmentMethod === 'courier' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Courier Name</label>
                    <input 
                      type="text" 
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Shiprocket, Blue Dart"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tracking Number</label>
                    <input 
                      type="text" 
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Tracking ID"
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
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
export default OrderDetails;
