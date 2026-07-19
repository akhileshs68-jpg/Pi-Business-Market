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
  MoreVertical,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  LayoutDashboard,
  ClipboardList
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { shippingService } from '../services/shippingService';
import { Order, OrderStatus, ShippingMethod } from '../types';

export const BusinessOrderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [businessId] = useState('PI-CORP-001'); // In a real app, from user profile

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const handleFulfillOrder = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!user) return;
    try {
      // Create shipment with Standard method by default
      const shipmentId = await shippingService.createShipment(order, ShippingMethod.STANDARD);
      navigate(`/shipment/${shipmentId}`);
    } catch (err) {
      console.error('Fulfillment failed', err);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case OrderStatus.CANCELLED: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case OrderStatus.READY_FOR_DISPATCH: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case OrderStatus.PROCESSING: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const filteredOrders = orders.filter(o => activeStatus === 'all' || o.orderStatus === activeStatus);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="employer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Order Management</h1>
            </div>
            <p className="text-slate-500 font-medium">Fulfill your enterprise orders and manage logistics.</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {['all', OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.READY_FOR_DISPATCH].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeStatus === status 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Pending Orders', value: orders.filter(o => o.orderStatus !== OrderStatus.COMPLETED).length, icon: Package, color: 'text-amber-400' },
            { label: 'Dispatched Today', value: '14', icon: Truck, color: 'text-indigo-400' },
            { label: 'Order Velocity', value: '2.4 / hr', icon: Clock, color: 'text-emerald-400' },
            { label: 'Revenue (Pi)', value: orders.reduce((acc, o) => acc + o.grandTotal, 0).toFixed(1), icon: LayoutDashboard, color: 'text-violet-400' },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders Table/List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                placeholder="Search Orders, Customers, Numbers..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              <Filter className="w-4 h-4" /> Filter Advanced
            </button>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Retrieving Order Manifest...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
              <ClipboardList className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Queue is Empty</h3>
              <p className="text-slate-500">No orders matching the current filter were found.</p>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-[3rem] overflow-hidden">
              <div className="hidden md:grid grid-cols-6 gap-4 p-6 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <div className="col-span-1">Order Ref</div>
                <div className="col-span-1">Customer</div>
                <div className="col-span-1">Total</div>
                <div className="col-span-1">Payment</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {filteredOrders.map((order) => (
                <div 
                  key={order.orderId}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors items-center group cursor-pointer"
                  onClick={() => navigate(`/order-details/${order.orderId}`)}
                >
                  <div className="col-span-1">
                    <p className="text-sm font-black text-white uppercase">{order.orderNumber}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-bold text-slate-300">Customer ID</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{order.userUid.slice(0, 8)}...</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-black text-white">{order.grandTotal.toFixed(1)} Pi</p>
                  </div>
                  <div className="col-span-1">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[8px] font-black uppercase tracking-tight border border-amber-500/20">
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight border ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-span-1 text-right flex items-center justify-end gap-3">
                    {order.orderStatus === OrderStatus.CONFIRMED && (
                      <button 
                        onClick={(e) => handleFulfillOrder(e, order)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Fulfill
                      </button>
                    )}
                    <button className="p-2.5 bg-slate-800 group-hover:bg-indigo-600 text-white rounded-xl transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
