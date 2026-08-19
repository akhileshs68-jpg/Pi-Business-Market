/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Loader2,
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { shippingService } from '../services/shippingService';
import { Order, OrderStatus, ShippingMethod } from '../types';
import { useBusiness } from '../context/BusinessContext';

export const BusinessOrderDashboard: React.FC<{ hideNavbar?: boolean }> = ({ hideNavbar = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentBusiness, businesses, isWorkspaceReady } = useBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const businessId = currentBusiness?.id || businesses[0]?.id || user?.uid || 'no-business';

  useEffect(() => {
    if (isWorkspaceReady || user) {
      fetchOrders();
    }
  }, [user, currentBusiness, businesses, isWorkspaceReady]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getBusinessOrders(businessId);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch business orders', err);
    } finally {
      setLoading(false);
    }
  };

  const [processingStatusId, setProcessingStatusId] = useState<string | null>(null);

  const handleQuickAdvanceStatus = async (e: React.MouseEvent, order: Order, nextStatus: string) => {
    e.stopPropagation();
    if (!user || processingStatusId === order.orderId) return;

    // Security check: Ensure user is authorized merchant for this order and NOT the buyer
    const isOrderMerchant = (
      user.uid === order.businessId || 
      user.uid === order.sellerId || 
      user.uid === order.storeId || 
      user.role === 'seller' || 
      user.role === 'merchant' || 
      user.role === 'Admin' || 
      user.role === 'Super Admin' || 
      user.platformRole === 'admin' || 
      user.platformRole === 'superadmin'
    ) && user.uid !== order.buyerId && user.uid !== order.userUid;

    if (!isOrderMerchant) {
      console.warn('Unauthorized quick advance attempt blocked.');
      return;
    }

    try {
      setProcessingStatusId(order.orderId);
      await orderService.updateOrderStatus(order.orderId, nextStatus, user.uid, 'seller', `Advanced status to ${nextStatus.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (err) {
      console.error('Failed status advance', err);
    } finally {
      setProcessingStatusId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'delivered'].includes(s)) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (['cancelled', 'rejected', 'returned'].includes(s)) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (['refund_requested', 'refund_approved', 'disputed'].includes(s)) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (['packed', 'ready_for_dispatch', 'shipped', 'out_for_delivery'].includes(s)) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (['preparing', 'accepted'].includes(s)) return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
    return 'bg-slate-800/60 text-slate-300 border-slate-700/60';
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchQuery === '' || 
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.buyerName || o.userUid || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeStatus === 'all') return true;
    return (o.orderStatus || '').toLowerCase() === activeStatus.toLowerCase();
  });

  const totalRevenue = orders
    .filter(o => !['cancelled', 'rejected', 'refund_completed'].includes((o.orderStatus || '').toLowerCase()))
    .reduce((acc, o) => acc + (o.grandTotal || 0), 0);

  const statusFilterOptions = [
    { label: 'All Orders', value: 'all' },
    { label: 'New', value: OrderStatus.NEW_ORDER },
    { label: 'Accepted', value: OrderStatus.ACCEPTED },
    { label: 'Preparing', value: OrderStatus.PREPARING },
    { label: 'Packed', value: OrderStatus.PACKED },
    { label: 'Shipped', value: OrderStatus.SHIPPED },
    { label: 'Delivered', value: OrderStatus.DELIVERED },
    { label: 'Completed', value: OrderStatus.COMPLETED },
    { label: 'Refund Requested', value: OrderStatus.REFUND_REQUESTED },
    { label: 'Disputed', value: OrderStatus.DISPUTED },
    { label: 'Cancelled', value: OrderStatus.CANCELLED }
  ];

  return (
    <div className={hideNavbar ? "text-slate-200" : "min-h-screen bg-slate-950 text-slate-200"}>
      {!hideNavbar && (
        <Navbar 
          currentUser={user!}
          currentView="employer"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
      )}

      <main className={hideNavbar ? "w-full py-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-violet-600/10 border border-violet-500/20 rounded-2xl text-violet-400 shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase break-words">Enterprise Order Management</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Manage order fulfillment, logistics tracking, and settlement lifecycle.</p>
          </div>

          <div className="w-full min-w-0 lg:w-auto overflow-x-auto scrollbar-hide max-w-full touch-pan-x py-1">
            <div className="inline-flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 w-max min-w-max flex-nowrap">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActiveStatus(opt.value)}
                  className={`shrink-0 px-3.5 sm:px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap min-h-[44px] focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer ${
                    activeStatus === opt.value 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 md:mb-10">
          {[
            { label: 'Active Queue', value: orders.filter(o => !['completed', 'cancelled', 'rejected'].includes((o.orderStatus || '').toLowerCase())).length, icon: Package, color: 'text-amber-400' },
            { label: 'Dispatched / In Transit', value: orders.filter(o => ['shipped', 'out_for_delivery', 'ready_for_dispatch'].includes((o.orderStatus || '').toLowerCase())).length, icon: Truck, color: 'text-sky-400' },
            { label: 'Completed Orders', value: orders.filter(o => (o.orderStatus || '').toLowerCase() === 'completed').length, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Total Revenue (Pi)', value: totalRevenue.toFixed(2), icon: LayoutDashboard, color: 'text-violet-400' },
          ].map((stat, i) => (
            <div key={i} className="p-4 sm:p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 mb-2 sm:mb-4">
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} shrink-0`} />
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right truncate">{stat.label}</p>
              </div>
              <p className="text-lg sm:text-2xl font-black text-white font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search & List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order Ref, Buyer, or Item..." 
                className="w-full min-h-[44px] bg-slate-900/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 outline-none transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Order Manifest...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-24 text-center bg-slate-900/30 border-2 border-dashed border-slate-800/80 rounded-3xl p-6">
              <ClipboardList className="w-14 h-14 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Queue is Clear</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">No enterprise orders matching the selected status filter.</p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="hidden md:grid grid-cols-6 gap-4 p-5 border-b border-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="col-span-1">Order Ref</div>
                <div className="col-span-1">Buyer</div>
                <div className="col-span-1">Grand Total</div>
                <div className="col-span-1">Escrow</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Fulfillment</div>
              </div>

              {filteredOrders.map((order) => (
                <div 
                  key={order.orderId}
                  className="flex flex-col md:grid md:grid-cols-6 gap-4 p-5 sm:p-6 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center group cursor-pointer"
                  onClick={() => navigate(`/order-details/${order.orderId}`)}
                >
                  <div className="flex justify-between items-start md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Ref</div>
                    <div className="text-right md:text-left">
                      <p className="text-sm font-black text-white uppercase">{order.orderNumber}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</div>
                    <div className="text-right md:text-left">
                      <p className="text-xs font-bold text-slate-200">{order.buyerName || 'Customer'}</p>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">{order.userUid?.substring(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</div>
                    <div className="text-right md:text-left">
                      <p className="text-sm font-black text-violet-300">{(order.grandTotal || 0).toFixed(2)} Pi</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Escrow</div>
                    <div className="text-right md:text-left">
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-[9px] font-bold uppercase tracking-tight border border-amber-500/20">
                        {order.escrowStatus || 'Holding'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</div>
                    <div className="text-right md:text-left">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(order.orderStatus)}`}>
                        {(order.orderStatus || 'Pending').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between md:justify-end items-center w-full gap-2 pt-3 md:pt-0 border-t border-slate-800 md:border-0">
                    <div className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</div>
                    <div className="flex items-center gap-2">
                      {['paid', 'payment_verified', 'new_order', 'pending_payment'].includes((order.orderStatus || '').toLowerCase()) && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.ACCEPTED)}
                          className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-600/10 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Accept
                        </button>
                      )}
                      {(order.orderStatus || '').toLowerCase() === 'accepted' && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.PREPARING)}
                          className="min-h-[44px] px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-violet-600/10 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Prepare
                        </button>
                      )}
                      {(order.orderStatus || '').toLowerCase() === 'preparing' && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.PACKED)}
                          className="min-h-[44px] px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Pack
                        </button>
                      )}
                      {(order.orderStatus || '').toLowerCase() === 'packed' && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.READY_FOR_DISPATCH)}
                          className="min-h-[44px] px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Ready Dispatch
                        </button>
                      )}
                      {(order.orderStatus || '').toLowerCase() === 'ready_for_dispatch' && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.SHIPPED)}
                          className="min-h-[44px] px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Ship
                        </button>
                      )}
                      {(order.orderStatus || '').toLowerCase() === 'shipped' && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.OUT_FOR_DELIVERY)}
                          className="min-h-[44px] px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Out For Delivery
                        </button>
                      )}
                      {(order.orderStatus || '').toLowerCase() === 'out_for_delivery' && (
                        <button 
                          type="button"
                          disabled={processingStatusId === order.orderId}
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.DELIVERED)}
                          className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                        >
                          {processingStatusId === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Delivered
                        </button>
                      )}
                      <button 
                        type="button"
                        aria-label="View Order Details"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 bg-slate-800 group-hover:bg-violet-600 text-white rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessOrderDashboard;
