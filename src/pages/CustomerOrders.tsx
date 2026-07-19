/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  Loader2,
  Filter,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';

export const CustomerOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getCustomerOrders(user!.uid);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case OrderStatus.CANCELLED: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case OrderStatus.PENDING_PAYMENT: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.orderStatus !== OrderStatus.COMPLETED && order.orderStatus !== OrderStatus.CANCELLED;
    if (activeTab === 'completed') return order.orderStatus === OrderStatus.COMPLETED;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="discovery"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">My Orders</h1>
            <p className="text-slate-500 font-medium">Track your Pi Business Market purchases and history.</p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {(['all', 'pending', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Order History...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
            <Package className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No orders found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">You haven't placed any orders matching this filter yet.</p>
            <button 
              onClick={() => navigate('/discovery')}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-[2.5rem] p-8 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => navigate(`/order-details/${order.orderId}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl group-hover:bg-indigo-600/10 transition-colors">
                    <Package className="w-8 h-8 text-indigo-400" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order {order.orderNumber}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Placed on {new Date(order.createdAt).toLocaleDateString()}</h3>
                    <p className="text-xs text-slate-500 font-medium">Total Amount: <span className="text-white font-bold">{order.grandTotal} Pi</span></p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Payment Status</p>
                      <p className="text-xs font-bold text-slate-300 uppercase">{order.paymentStatus}</p>
                    </div>
                    <div className="p-3 bg-slate-800 group-hover:bg-indigo-600 rounded-2xl transition-all text-white">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
