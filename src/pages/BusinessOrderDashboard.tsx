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

export const BusinessOrderDashboard: React.FC<{ hideNavbar?: boolean }> = ({ hideNavbar = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const businessId = user?.uid || 'PI-CORP-001';

  useEffect(() => {
    fetchOrders();
  }, [user]);

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
    try {
      setProcessingStatusId(order.orderId);
      await orderService.updateOrderStatus(order.orderId, nextStatus, user.uid, 'seller', `Advanced status to ${nextStatus}`);
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
    if (['packed', 'ready_for_dispatch', 'shipped'].includes(s)) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
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

      <main className={hideNavbar ? "w-full py-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">Enterprise Order Management</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium">Manage order fulfillment, logistics tracking, and settlement lifecycle.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl sm:rounded-2xl border border-slate-800 overflow-x-auto scrollbar-hide max-w-xl">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveStatus(opt.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeStatus === opt.value 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {[
            { label: 'Active Queue', value: orders.filter(o => !['completed', 'cancelled', 'rejected'].includes((o.orderStatus || '').toLowerCase())).length, icon: Package, color: 'text-amber-400' },
            { label: 'Dispatched / In Transit', value: orders.filter(o => ['shipped', 'out_for_delivery', 'ready_for_dispatch'].includes((o.orderStatus || '').toLowerCase())).length, icon: Truck, color: 'text-indigo-400' },
            { label: 'Completed Orders', value: orders.filter(o => (o.orderStatus || '').toLowerCase() === 'completed').length, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Total Revenue (Pi)', value: totalRevenue.toFixed(1), icon: LayoutDashboard, color: 'text-violet-400' },
          ].map((stat, i) => (
            <div key={i} className="p-4 sm:p-6 bg-slate-900/50 border border-slate-800 rounded-2xl sm:rounded-3xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className="text-xl sm:text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search & List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order Ref, Buyer, or Item..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Loading Order Manifest...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
              <ClipboardList className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Queue is Clear</h3>
              <p className="text-slate-500">No enterprise orders matching the selected status filter.</p>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-[3rem] overflow-hidden">
              <div className="hidden md:grid grid-cols-6 gap-4 p-6 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
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
                  className="flex flex-col md:grid md:grid-cols-6 gap-4 p-6 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors items-center group cursor-pointer"
                  onClick={() => navigate(`/order-details/${order.orderId}`)}
                >
                  <div className="flex justify-between items-start md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Order Ref</div>
                    <div className="text-right md:text-left">
                      <p className="text-sm font-black text-white uppercase">{order.orderNumber}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-600 uppercase tracking-widest">Buyer</div>
                    <div className="text-right md:text-left">
                      <p className="text-xs font-bold text-slate-300">{order.buyerName || 'Customer'}</p>
                      <p className="text-[9px] font-mono text-slate-600 uppercase">{order.userUid?.substring(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-600 uppercase tracking-widest">Grand Total</div>
                    <div className="text-right md:text-left">
                      <p className="text-sm font-black text-white">{(order.grandTotal || 0).toFixed(2)} Pi</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-600 uppercase tracking-widest">Escrow</div>
                    <div className="text-right md:text-left">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[8px] font-black uppercase tracking-tight border border-amber-500/20">
                        {order.escrowStatus || 'Holding'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center md:block w-full">
                    <div className="md:hidden text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</div>
                    <div className="text-right md:text-left">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                        {(order.orderStatus || 'Pending').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between md:justify-end items-center w-full gap-2 pt-4 md:pt-0 border-t border-slate-800 md:border-0">
                    <div className="md:hidden text-[10px] font-black text-slate-600 uppercase tracking-widest">Action</div>
                    <div className="flex items-center gap-2">
                      {order.orderStatus === OrderStatus.NEW_ORDER && (
                        <button 
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.ACCEPTED)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                        >
                          Accept
                        </button>
                      )}
                      {order.orderStatus === OrderStatus.ACCEPTED && (
                        <button 
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.PREPARING)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                        >
                          Prepare
                        </button>
                      )}
                      {order.orderStatus === OrderStatus.PREPARING && (
                        <button 
                          onClick={(e) => handleQuickAdvanceStatus(e, order, OrderStatus.PACKED)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                        >
                          Pack
                        </button>
                      )}
                      <button className="p-2 bg-slate-800 group-hover:bg-indigo-600 text-white rounded-xl transition-all">
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
