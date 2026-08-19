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
  Calendar,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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

  const getStatusBadge = (status: string) => {
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

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => setCopiedId(null), 2000);
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-2">
            Orders & Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Unified tracking for your purchases, merchant orders, and service bookings.
          </p>
        </div>

        {/* Unified Portal Navigation Tabs */}
        <div 
          role="tablist" 
          aria-label="Order sections" 
          className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1 mb-8 max-w-md"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'purchases'}
            onClick={() => setActiveSection('purchases')}
            className={`flex-1 min-h-[44px] px-3 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none ${
              activeSection === 'purchases' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            My Purchases
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'sales'}
            onClick={() => setActiveSection('sales')}
            className={`flex-1 min-h-[44px] px-3 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none ${
              activeSection === 'sales' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            My Sales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'bookings'}
            onClick={() => setActiveSection('bookings')}
            className={`flex-1 min-h-[44px] px-3 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none ${
              activeSection === 'bookings' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Bookings
          </button>
        </div>

        {activeSection === 'purchases' && (
          <div className="animate-fade-in">
            {/* Search and Filters Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">Purchase History</h2>
                <p className="text-slate-400 text-xs mt-0.5">Track shipment updates, verification tokens, and invoices.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order # or item..."
                    aria-label="Search orders by number or item"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20 transition-all"
                  />
                </div>

                {/* Filter Tabs */}
                <div 
                  role="tablist"
                  aria-label="Order status filter"
                  className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-hide"
                >
                  {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-none min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer ${
                        activeTab === tab 
                          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content States */}
            {loading ? (
              <div 
                role="status"
                aria-live="polite"
                className="py-24 flex flex-col items-center justify-center gap-4 bg-slate-900/30 border border-slate-800/60 rounded-2xl"
              >
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  Syncing Order Ledger...
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 sm:py-28 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-6">
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No purchases found</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
                  {searchQuery ? 'No order transactions match your search filter.' : 'You have not placed any orders yet.'}
                </p>
                <button 
                  type="button"
                  onClick={() => navigate('/marketplace')}
                  className="min-h-[44px] px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.orderStatus);
                  const StatusIcon = badge.icon;
                  return (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-sm"
                    >
                      {/* Top Row: Info & Actions */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/70">
                        <div className="flex items-start gap-4">
                          <div className="p-3 sm:p-3.5 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-violet-500/30 group-hover:bg-violet-950/20 transition-colors shrink-0">
                            <Package className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                              <span className="text-sm font-black text-white uppercase tracking-tight">
                                Order #{order.orderNumber}
                              </span>
                              
                              <button
                                type="button"
                                onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                                title="Copy Order Number"
                                aria-label={`Copy order number ${order.orderNumber}`}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-violet-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none -my-2"
                              >
                                {copiedId === order.orderNumber ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}>
                                <StatusIcon className="w-3 h-3" />
                                {(order.orderStatus || 'Pending').replace(/_/g, ' ')}
                              </span>

                              {order.paymentStatus && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  {order.paymentStatus.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>
                                  Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>

                              {(order.storeName || order.businessName || order.sellerName) && (
                                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                  <span className="text-slate-600">•</span>
                                  <span className="text-violet-300 font-semibold">{order.storeName || order.businessName || order.sellerName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Price & CTA */}
                        <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                            <p className="text-base sm:text-lg font-black text-violet-300">
                              {(order.grandTotal || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">Pi</span>
                            </p>
                          </div>

                          <button 
                            type="button"
                            onClick={() => navigate(`/order-details/${order.orderId}`)}
                            aria-label={`View details for order ${order.orderNumber}`}
                            className="min-h-[44px] px-4 sm:px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items Preview Snippet */}
                      {order.items && order.items.length > 0 && (
                        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-slate-300 shrink-0">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}:
                            </span>
                            <span className="truncate text-slate-400 max-w-xs sm:max-w-md lg:max-w-xl">
                              {order.items.map(i => i.productName).join(', ')}
                            </span>
                          </div>

                          {order.qrVerificationCode && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-violet-300 shrink-0">
                              Token: {order.qrVerificationCode.substring(0, 12)}...
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === 'sales' && (
          <div className="animate-fade-in bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 lg:p-8">
            <BusinessOrderDashboard hideNavbar={true} />
          </div>
        )}

        {activeSection === 'bookings' && (
          <div className="animate-fade-in bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/70">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mb-1">
                  Service Appointment Bookings
                </h2>
                <p className="text-slate-400 text-xs">
                  Manage schedule slots, consulting appointments, and service sessions.
                </p>
              </div>
              
              <div 
                role="tablist"
                aria-label="Booking view mode"
                className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-center"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={bookingViewMode === 'buyer'}
                  onClick={() => setBookingViewMode('buyer')}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    bookingViewMode === 'buyer' 
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  My Bookings (Buyer)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={bookingViewMode === 'seller'}
                  onClick={() => setBookingViewMode('seller')}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    bookingViewMode === 'seller' 
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
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
