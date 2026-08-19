/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  Mail, 
  Phone, 
  Tag, 
  ArrowRight, 
  Loader2, 
  UserCheck, 
  Star, 
  Activity, 
  MessageSquare, 
  Plus, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  RefreshCw, 
  DollarSign, 
  Send, 
  UserPlus, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { crmService } from '../services/crmService';
import { messagingService } from '../services/messagingService';
import { CustomerProfile } from '../types';
import { useBusiness } from '../context/BusinessContext';

export const MerchantCRM: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentBusiness, businesses, isWorkspaceReady } = useBusiness();
  
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<'all' | 'buyers' | 'vip' | 'leads' | 'inactive'>('all');
  const [minSpendFilter, setMinSpendFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'spent_desc' | 'orders_desc' | 'recent_visit' | 'name_asc'>('spent_desc');
  
  // Feedback & Copy State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Quick Message Modal State
  const [messageTargetCustomer, setMessageTargetCustomer] = useState<CustomerProfile | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const businessId = currentBusiness?.id || businesses[0]?.id || user?.uid || 'no-business';
  const businessName = currentBusiness?.businessName || (currentBusiness as any)?.name || 'My Business';

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    if (isWorkspaceReady || user) {
      fetchCustomers();
    }
  }, [user, currentBusiness, businesses, isWorkspaceReady]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await crmService.getBusinessCustomers(businessId);
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      showFeedback('error', 'Unable to retrieve customer records. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showFeedback('info', `Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenDirectChat = (cust: CustomerProfile) => {
    navigate('/inbox', {
      state: {
        targetUid: cust.userUid,
        targetName: cust.displayName,
        contextType: 'business_customer',
        businessId: cust.businessId
      }
    });
  };

  const handleSendQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessageText.trim() || !messageTargetCustomer || !user) return;
    
    setIsSendingMessage(true);
    try {
      const participants = [user.uid, messageTargetCustomer.userUid];
      const conv = await messagingService.getOrCreateConversation(participants, 'business_customer', {
        businessId: messageTargetCustomer.businessId,
        relatedEntityType: 'business_customer',
        relatedEntityId: messageTargetCustomer.customerId
      });

      await messagingService.sendMessage(
        conv.conversationId,
        user.uid,
        quickMessageText.trim(),
        'text'
      );

      showFeedback('success', `Message sent to ${messageTargetCustomer.displayName}!`);
      setQuickMessageText('');
      setMessageTargetCustomer(null);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      showFeedback('error', err?.message || 'Failed to dispatch customer message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // KPI Calculations from real customer records
  const totalCustomersCount = customers.length;
  const totalPiSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersCount = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
  const averageOrderValue = totalOrdersCount > 0 ? totalPiSpent / totalOrdersCount : 0;
  const activeBuyersCount = customers.filter(c => (c.totalOrders || 0) > 0).length;
  const leadsCount = customers.filter(c => (c.totalOrders || 0) === 0).length;
  const vipCount = customers.filter(c => (c.totalSpent || 0) >= 50 || (c.totalOrders || 0) >= 3).length;

  // Filtered & Sorted Customer Profiles
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (c.displayName || '').toLowerCase().includes(query);
        const matchesEmail = (c.email || '').toLowerCase().includes(query);
        const matchesId = (c.customerId || '').toLowerCase().includes(query);
        const matchesUid = (c.userUid || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesId && !matchesUid) return false;
      }

      // Segment Filter
      if (activeSegment === 'buyers' && (c.totalOrders || 0) === 0) return false;
      if (activeSegment === 'vip' && ((c.totalSpent || 0) < 50 && (c.totalOrders || 0) < 3)) return false;
      if (activeSegment === 'leads' && (c.totalOrders || 0) > 0) return false;
      if (activeSegment === 'inactive' && c.status !== 'inactive') return false;

      // Spend Filter
      if (minSpendFilter === 'low' && (c.totalSpent || 0) >= 20) return false;
      if (minSpendFilter === 'medium' && ((c.totalSpent || 0) < 20 || (c.totalSpent || 0) > 100)) return false;
      if (minSpendFilter === 'high' && (c.totalSpent || 0) < 100) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'spent_desc') {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      if (sortBy === 'orders_desc') {
        return (b.totalOrders || 0) - (a.totalOrders || 0);
      }
      if (sortBy === 'recent_visit') {
        return new Date(b.lastVisitAt || b.updatedAt || 0).getTime() - new Date(a.lastVisitAt || a.updatedAt || 0).getTime();
      }
      if (sortBy === 'name_asc') {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }
      return 0;
    });
  }, [customers, searchTerm, activeSegment, minSpendFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar 
        currentUser={user!}
        currentView="employer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Top Header & Overview Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-600/20 rounded-2xl text-violet-400 border border-violet-500/30 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Customer 360 & Relationship Management
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">Enterprise CRM Registry</span>
                  {businessName && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                      {businessName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Track repeat buyers, analyze customer lifetime values, monitor prospect leads, and maintain direct communications.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={fetchCustomers}
              disabled={loading}
              title="Refresh Customer Records"
              aria-label="Refresh Customer Records"
              className="p-3 min-h-[44px] min-w-[44px] rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/inbox')}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <span>Unified Inbox</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
            feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            feedback.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
            'bg-violet-500/10 border-violet-500/30 text-violet-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> :
             feedback.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> :
             <Info className="w-5 h-5 text-violet-400 shrink-0" />}
            <span className="flex-1">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Row (Live Verified Data) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
              <div className="p-2 bg-violet-600/10 rounded-xl text-violet-400 border border-violet-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{totalCustomersCount}</p>
            <p className="text-[11px] text-slate-500">{activeBuyersCount} active buyers • {leadsCount} leads</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Lifetime Volume</span>
              <div className="p-2 bg-emerald-600/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{totalPiSpent.toFixed(2)} π</p>
            <p className="text-[11px] text-slate-500">{totalOrdersCount} fulfilled orders</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Average Order Value</span>
              <div className="p-2 bg-sky-600/10 rounded-xl text-sky-400 border border-sky-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">{averageOrderValue.toFixed(1)} π</p>
            <p className="text-[11px] text-slate-500">Per customer order average</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">VIP Pioneers</span>
              <div className="p-2 bg-amber-600/10 rounded-xl text-amber-400 border border-amber-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">{vipCount}</p>
            <p className="text-[11px] text-slate-500">High-volume repeating clients</p>
          </div>
        </div>

        {/* Customer Registry Module */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl space-y-6">
          
          {/* Segment Filter Tabs */}
          <div className="p-6 border-b border-slate-800/80 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" /> Customer Profiles & Leads
              </h2>

              {/* Segment Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 border border-slate-800 rounded-2xl">
                <button
                  onClick={() => setActiveSegment('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    activeSegment === 'all' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>All ({customers.length})</span>
                </button>

                <button
                  onClick={() => setActiveSegment('buyers')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    activeSegment === 'buyers' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buyers ({activeBuyersCount})</span>
                </button>

                <button
                  onClick={() => setActiveSegment('vip')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    activeSegment === 'vip' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>VIPs ({vipCount})</span>
                </button>

                <button
                  onClick={() => setActiveSegment('leads')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    activeSegment === 'leads' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Leads ({leadsCount})</span>
                </button>
              </div>
            </div>

            {/* Search, Filter & Sort Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              
              {/* Search Bar */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer by name, email, or UID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md"
                    aria-label="Clear search term"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Spend Filter */}
              <div className="sm:col-span-3">
                <select
                  value={minSpendFilter}
                  onChange={e => setMinSpendFilter(e.target.value as any)}
                  aria-label="Filter by lifetime spend"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                >
                  <option value="all">All Spend Ranges</option>
                  <option value="low">Under 20 Pi</option>
                  <option value="medium">20 Pi to 100 Pi</option>
                  <option value="high">Over 100 Pi (High Volume)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="sm:col-span-4">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  aria-label="Sort customer registry"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                >
                  <option value="spent_desc">Highest Lifetime Spend</option>
                  <option value="orders_desc">Most Orders Fulfilled</option>
                  <option value="recent_visit">Most Recent Activity</option>
                  <option value="name_asc">Alphabetical (A - Z)</option>
                </select>
              </div>

            </div>

            {/* Active Filters Summary */}
            {(searchTerm || activeSegment !== 'all' || minSpendFilter !== 'all') && (
              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                <span>
                  Showing <strong className="text-white">{filteredCustomers.length}</strong> of {customers.length} registered profiles
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSegment('all');
                    setMinSpendFilter('all');
                  }}
                  className="text-violet-400 hover:text-violet-300 font-semibold underline cursor-pointer p-1"
                >
                  Reset all filters
                </button>
              </div>
            )}

          </div>

          {/* Customer Table / Card List */}
          <div className="p-6 pt-0">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Customer Intelligence Registry...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-slate-950/60 rounded-3xl border border-slate-800/80 p-8">
                <div className="w-14 h-14 bg-violet-600/10 text-violet-400 rounded-2xl border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white">
                    {searchTerm || activeSegment !== 'all' || minSpendFilter !== 'all' 
                      ? 'No customer records match your filter criteria' 
                      : 'No customer relationships recorded yet'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {searchTerm || activeSegment !== 'all' 
                      ? 'Try modifying your search keywords or resetting your active segment filters.'
                      : 'Customers will automatically appear here once buyers place orders, book services, or send inquiries to your store.'}
                  </p>
                </div>
                {(searchTerm || activeSegment !== 'all' || minSpendFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveSegment('all');
                      setMinSpendFilter('all');
                    }}
                    className="px-5 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredCustomers.map(customer => {
                  const isVip = (customer.totalSpent || 0) >= 50 || (customer.totalOrders || 0) >= 3;
                  const isLead = (customer.totalOrders || 0) === 0;

                  return (
                    <div 
                      key={customer.customerId}
                      className="py-5 sm:py-6 hover:bg-slate-800/30 rounded-2xl px-4 transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      {/* Customer Identity Block */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-black text-base uppercase group-hover:bg-violet-600 group-hover:text-white transition-all shadow">
                            {customer.displayName ? customer.displayName.substring(0, 2) : 'CU'}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                            customer.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`} />
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 
                              onClick={() => navigate(`/crm/customer/${customer.customerId}`)}
                              className="text-base font-black text-white uppercase truncate cursor-pointer hover:text-violet-400 transition-colors"
                            >
                              {customer.displayName || 'Pioneer Customer'}
                            </h3>
                            
                            {/* Badges */}
                            {isVip && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Award className="w-2.5 h-2.5" /> VIP
                              </span>
                            )}

                            {isLead && (
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <UserPlus className="w-2.5 h-2.5" /> Lead
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[9px] font-bold uppercase">
                              {customer.status || 'Active'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" /> {customer.email}
                              </span>
                            )}
                            
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              UID: {customer.userUid?.substring(0, 10)}...
                              <button
                                onClick={() => copyToClipboard(customer.userUid, customer.customerId)}
                                title="Copy User UID"
                                aria-label="Copy User UID"
                                className="text-slate-500 hover:text-white p-0.5 cursor-pointer ml-0.5"
                              >
                                {copiedId === customer.customerId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </span>
                          </div>

                          {customer.lastVisitAt && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                              <Clock className="w-3 h-3" /> Last Active: {new Date(customer.lastVisitAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Orders & Volume Metrics Block */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-start lg:justify-end gap-6 sm:gap-8 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                        
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Orders</span>
                          <span className="text-sm font-black text-white font-mono flex items-center sm:justify-end gap-1 mt-0.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
                            {customer.totalOrders || 0}
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Lifetime Spent</span>
                          <span className="text-sm font-black text-emerald-400 font-mono block mt-0.5">
                            {(customer.totalSpent || 0).toFixed(2)} π
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMessageTargetCustomer(customer)}
                            title={`Send message to ${customer.displayName}`}
                            aria-label={`Send message to ${customer.displayName}`}
                            className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <MessageSquare className="w-4 h-4 text-violet-400" />
                          </button>

                          <button
                            onClick={() => navigate(`/crm/customer/${customer.customerId}`)}
                            aria-label={`View 360 profile for ${customer.displayName}`}
                            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-md shadow-violet-600/20 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <span>Profile 360</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* QUICK MESSAGE MODAL */}
      {messageTargetCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct Message Customer</h3>
                  <p className="text-xs text-slate-400">To: {messageTargetCustomer.displayName} ({messageTargetCustomer.email || 'Pi Pioneer'})</p>
                </div>
              </div>
              <button
                onClick={() => setMessageTargetCustomer(null)}
                className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                aria-label="Close Message Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendQuickMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="quickMessageText" className="text-xs font-bold text-slate-300 block">
                  Message Content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="quickMessageText"
                  required
                  rows={4}
                  placeholder={`Write a direct inquiry reply or promotional message to ${messageTargetCustomer.displayName}...`}
                  value={quickMessageText}
                  onChange={e => setQuickMessageText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenDirectChat(messageTargetCustomer)}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 underline cursor-pointer p-1 min-h-[44px] flex items-center"
                >
                  Open in Full Inbox →
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMessageTargetCustomer(null)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMessage || !quickMessageText.trim()}
                    className="px-5 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingMessage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
