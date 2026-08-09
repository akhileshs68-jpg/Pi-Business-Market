/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  FileText,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { orderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { BusinessOrderDashboard } from './BusinessOrderDashboard';
import { OrderBookingManager } from '../components/OrderBookingManager';

export const CustomerOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // High level Section State
  const [activeSection, setActiveSection] = useState<'purchases' | 'sales' | 'bookings'>('purchases');
  const [bookingViewMode, setBookingViewMode] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await orderService.getCustomerOrders(user.uid);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'delivered'].includes(s)) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (['cancelled', 'rejected', 'returned'].includes(s)) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (['refund_requested', 'refund_approved', 'disputed'].includes(s)) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  };

  const filteredOrders = orders.filter(order => {
    const s = (order.orderStatus || '').toLowerCase();
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.items || []).some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !['completed', 'cancelled', 'rejected', 'refund_completed'].includes(s);
    if (activeTab === 'completed') return s === 'completed' || s === 'delivered';
    if (activeTab === 'cancelled') return ['cancelled', 'rejected', 'returned', 'refund_completed'].includes(s);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="orders"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-28">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-2">Orders & Bookings</h1>
          <p className="text-slate-500 font-medium">Unified center for your purchases, business sales, and service bookings.</p>
        </div>

        {/* Unified Portal Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-900 gap-1 mb-10 max-w-lg">
          <button
            onClick={() => setActiveSection('purchases')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeSection === 'purchases' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            My Purchases
          </button>
          <button
            onClick={() => setActiveSection('sales')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeSection === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            My Sales
          </button>
          <button
            onClick={() => setActiveSection('bookings')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeSection === 'bookings' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Bookings
          </button>
        </div>

        {activeSection === 'purchases' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Purchase History Tracker</h2>
                <p className="text-slate-500 text-xs">Track payments and logs for purchases made by you.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order # or product..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
                  {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-lg' 
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Order Ledger...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Package className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No purchases found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8">No order transactions match your selected filter criteria.</p>
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.orderId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-[2.5rem] p-6 sm:p-8 transition-all relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl group-hover:bg-indigo-600/10 transition-colors shrink-0">
                          <Package className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-black text-white uppercase tracking-tight">Order #{order.orderNumber}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                              {(order.orderStatus || 'Pending').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Amount</p>
                          <p className="text-lg font-black text-indigo-400">{(order.grandTotal || 0).toFixed(2)} Pi</p>
                        </div>

                        <button 
                          onClick={() => navigate(`/order-details/${order.orderId}`)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Items preview snippet */}
                    {order.items && order.items.length > 0 && (
                      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300">{order.items.length} item(s):</span>
                          <span className="truncate max-w-md text-slate-400">{order.items.map(i => i.productName).join(', ')}</span>
                        </div>

                        {order.qrVerificationCode && (
                          <span className="font-mono text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-400">
                            Token: {order.qrVerificationCode.substring(0, 16)}...
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'sales' && (
          <div className="animate-fade-in bg-slate-900/10 border border-slate-900 rounded-[2.5rem] p-4 sm:p-8">
            <BusinessOrderDashboard hideNavbar={true} />
          </div>
        )}

        {activeSection === 'bookings' && (
          <div className="animate-fade-in bg-slate-900/10 border border-slate-900 rounded-[2.5rem] p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-wider mb-1">Service Appointment Bookings</h2>
                <p className="text-slate-500 text-xs">Manage appointment slots, live consulting bookings, and service fulfillment.</p>
              </div>
              
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
                <button
                  onClick={() => setBookingViewMode('buyer')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    bookingViewMode === 'buyer' 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  My Bookings (Buyer)
                </button>
                <button
                  onClick={() => setBookingViewMode('seller')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    bookingViewMode === 'seller' 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  My Schedule (Provider)
                </button>
              </div>
            </div>
            <OrderBookingManager type="booking" viewAs={bookingViewMode} />
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerOrders;
