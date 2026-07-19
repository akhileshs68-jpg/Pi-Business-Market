/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
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
  ClipboardList
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { Order, OrderItem, OrderTimelineEvent, OrderStatus, PaymentStatus, FulfillmentStatus } from '../types';
import { ReviewForm } from '../components/ReviewForm';

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);

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

  const isMerchant = user?.uid === order?.businessId; // Simplified check for foundation

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
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to History</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Order {order.orderNumber}</h1>
              <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                {order.orderStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>

          {isMerchant && (
            <div className="flex gap-2">
              <button 
                onClick={() => handleUpdateStatus(OrderStatus.PROCESSING)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Start Processing
              </button>
              <button 
                onClick={() => handleUpdateStatus(OrderStatus.READY_FOR_DISPATCH)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Mark Ready
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-indigo-400" /> Line Items
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.itemId} className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-slate-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white uppercase">{item.productName}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="text-sm font-black text-white">{item.subtotal} Pi</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.quantity} × {item.unitPrice} Pi</p>
                        </div>
                        {order.orderStatus === OrderStatus.COMPLETED && !isMerchant && reviewingItemId !== item.itemId && (
                          <button 
                            onClick={() => setReviewingItemId(item.itemId)}
                            className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            Review Item
                          </button>
                        )}
                      </div>
                    </div>

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
                            // Optionally show a success toast or message
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white">{order.subtotal} Pi</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="text-white">{order.shipping} Pi</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Tax</span>
                  <span className="text-white">{order.tax.toFixed(2)} Pi</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Grand Total</span>
                  <span className="text-3xl font-black text-indigo-500">{order.grandTotal.toFixed(2)} Pi</span>
                </div>
              </div>
            </section>

            {/* Logistics & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Delivery Address
                </h3>
                {order.shippingAddress ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">{order.shippingAddress.fullName}</p>
                    <p className="text-xs text-slate-400 font-medium">{order.shippingAddress.street}</p>
                    <p className="text-xs text-slate-400 font-medium">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                      <Truck className="w-3 h-3" /> Standard Shipping
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">No shipping address provided (Digital/Service)</p>
                )}
              </section>

              <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Payment Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Method</span>
                    <span className="text-xs font-bold text-white uppercase">Pi Network Wallet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Status</span>
                    <span className="text-xs font-bold text-amber-400 uppercase">{order.paymentStatus}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Transaction secured on Pi Mainnet</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div className="lg:col-span-1">
            <section className="sticky top-12 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-violet-400" /> Activity Log
              </h2>
              <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {timeline.map((event, i) => (
                  <div key={event.eventId} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center z-10 ${
                      i === timeline.length - 1 ? 'bg-indigo-600 scale-125' : 'bg-slate-800'
                    }`}>
                      {i === timeline.length - 1 && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xs font-bold uppercase tracking-tight ${i === timeline.length - 1 ? 'text-white' : 'text-slate-400'}`}>
                        {event.message}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{new Date(event.createdAt).toLocaleString()}</span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">by {event.actorName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
