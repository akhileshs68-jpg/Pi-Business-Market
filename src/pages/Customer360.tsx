/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  Mail, 
  Phone, 
  Tag, 
  Loader2, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  ShieldCheck, 
  Plus, 
  StickyNote, 
  Award,
  Copy,
  Check,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  DollarSign,
  Truck,
  Star,
  RefreshCw,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { crmService } from '../services/crmService';
import { loyaltyService } from '../services/loyaltyService';
import { messagingService } from '../services/messagingService';
import { 
  CustomerProfile, 
  CustomerTimelineEvent, 
  CustomerNote, 
  LoyaltyAccount 
} from '../types';
import { useBusiness } from '../context/BusinessContext';

export const Customer360: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentBusiness, businesses, isWorkspaceReady } = useBusiness();
  
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineEvent[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Note creation state
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Timeline filter state
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'orders' | 'loyalty' | 'reviews'>('all');

  // Direct Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Feedback and copy states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const businessId = currentBusiness?.id || businesses[0]?.id || user?.uid || 'no-business';
  const businessName = currentBusiness?.businessName || (currentBusiness as any)?.name || 'My Business';

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showFeedback('info', `Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  useEffect(() => {
    if (customerId && (isWorkspaceReady || user)) {
      fetchCustomerData();
    }
  }, [customerId, user, currentBusiness, businesses, isWorkspaceReady]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const allCustomers = await crmService.getBusinessCustomers(businessId);
      const found = allCustomers.find(c => c.customerId === customerId);
      
      if (found) {
        setCustomer(found);
        const [timelineData, notesData, loyaltyData] = await Promise.all([
          crmService.getCustomerTimeline(customerId!),
          crmService.getCustomerNotes(customerId!),
          loyaltyService.getOrCreateAccount(found.userUid, found.businessId)
        ]);
        setTimeline(timelineData || []);
        setNotes(notesData || []);
        setLoyalty(loyaltyData);
      } else {
        showFeedback('error', 'Customer record not found for this business.');
      }
    } catch (err) {
      console.error('Failed to fetch customer data', err);
      showFeedback('error', 'Failed to retrieve complete customer 360 intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !customer || !user) return;
    setIsAddingNote(true);
    try {
      await crmService.addNote(
        customer.customerId, 
        customer.businessId, 
        user.uid, 
        user.displayName || businessName || 'Merchant Staff', 
        noteText.trim()
      );
      setNoteText('');
      const updatedNotes = await crmService.getCustomerNotes(customer.customerId);
      setNotes(updatedNotes || []);
      showFeedback('success', 'Internal merchant note saved successfully.');
    } catch (err) {
      console.error('Failed to add note', err);
      showFeedback('error', 'Unable to record merchant note. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !customer || !user) return;
    
    setIsSendingMessage(true);
    try {
      const participants = [user.uid, customer.userUid];
      const conv = await messagingService.getOrCreateConversation(participants, 'business_customer', {
        businessId: customer.businessId,
        relatedEntityType: 'business_customer',
        relatedEntityId: customer.customerId
      });

      await messagingService.sendMessage(
        conv.conversationId,
        user.uid,
        messageContent.trim(),
        'text'
      );

      showFeedback('success', `Message dispatched to ${customer.displayName}!`);
      setMessageContent('');
      setShowMessageModal(false);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      showFeedback('error', err?.message || 'Failed to dispatch customer message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Filtered timeline events
  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'all') return timeline;
    if (timelineFilter === 'orders') {
      return timeline.filter(t => t.type === 'order_placed' || t.type === 'payment_completed' || t.type === 'shipment_delivered');
    }
    if (timelineFilter === 'loyalty') {
      return timeline.filter(t => t.type === 'loyalty_earned' || t.type === 'loyalty_redeemed');
    }
    if (timelineFilter === 'reviews') {
      return timeline.filter(t => t.type === 'review_submitted');
    }
    return timeline;
  }, [timeline, timelineFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Compiling Customer 360 Intelligence Layer...
        </p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-slate-500">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Customer Record Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          The requested customer profile could not be located in your business CRM records.
        </p>
        <button
          onClick={() => navigate('/crm')}
          className="px-5 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Return to Customer CRM
        </button>
      </div>
    );
  }

  const isVip = (customer.totalSpent || 0) >= 50 || (customer.totalOrders || 0) >= 3;
  const isLead = (customer.totalOrders || 0) === 0;
  const averageOrderValue = (customer.totalOrders || 0) > 0 ? (customer.totalSpent || 0) / customer.totalOrders : 0;

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
        
        {/* Navigation & Header */}
        <div className="space-y-6">
          <button 
            onClick={() => navigate('/crm')} 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg px-2 -ml-2"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Customer Registry</span>
          </button>

          {/* Customer Profile Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 rounded-3xl flex items-center justify-center text-violet-300 font-black text-2xl uppercase shadow-inner">
                  {customer.displayName ? customer.displayName.substring(0, 2) : 'CU'}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 ${
                  customer.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                }`} />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {customer.displayName || 'Pioneer Buyer'}
                  </h1>
                  
                  {isVip && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3" /> VIP Pioneer
                    </span>
                  )}

                  {isLead && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider">
                      Prospect Lead
                    </span>
                  )}

                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">
                    {customer.status || 'Active'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
                  {customer.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-500" /> {customer.email}
                    </span>
                  )}

                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    UID: {customer.userUid?.substring(0, 12)}...
                    <button
                      onClick={() => copyToClipboard(customer.userUid, 'uid')}
                      title="Copy User UID"
                      aria-label="Copy User UID"
                      className="text-slate-500 hover:text-white p-0.5 cursor-pointer ml-1"
                    >
                      {copiedKey === 'uid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
              <button
                onClick={() => setShowMessageModal(true)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Customer</span>
              </button>

              <button
                onClick={() => {
                  const textarea = document.getElementById('new-internal-note-input');
                  textarea?.focus();
                  textarea?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                <StickyNote className="w-4 h-4 text-amber-400" />
                <span>Add Note</span>
              </button>

              <button
                onClick={fetchCustomerData}
                disabled={loading}
                title="Refresh Intelligence"
                aria-label="Refresh Intelligence"
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
              </button>
            </div>
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

        {/* Lifetime Performance KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime Volume</span>
              <div className="p-2 bg-emerald-600/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {(customer.totalSpent || 0).toFixed(2)} π
            </p>
            <p className="text-[11px] text-slate-500">Gross purchase settlements</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <div className="p-2 bg-violet-600/10 rounded-xl text-violet-400 border border-violet-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">
              {customer.totalOrders || 0}
            </p>
            <p className="text-[11px] text-slate-500">Completed purchases</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</span>
              <div className="p-2 bg-sky-600/10 rounded-xl text-sky-400 border border-sky-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
              {averageOrderValue.toFixed(1)} π
            </p>
            <p className="text-[11px] text-slate-500">Basket average per transaction</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Loyalty Tier</span>
              <div className="p-2 bg-amber-600/10 rounded-xl text-amber-400 border border-amber-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">
              {loyalty?.tier || 'Bronze'}
            </p>
            <p className="text-[11px] text-slate-500">{loyalty?.pointsBalance || 0} Reward Points</p>
          </div>
        </div>

        {/* Main Content Grid: Activity Timeline & Merchant Notes/Loyalty */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Activity Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-violet-400" /> Customer Activity Timeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Chronological record of orders, reviews, loyalty, and interactions.</p>
                </div>

                {/* Timeline Filters */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setTimelineFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                      timelineFilter === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({timeline.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('orders')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                      timelineFilter === 'orders' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setTimelineFilter('loyalty')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                      timelineFilter === 'loyalty' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Loyalty
                  </button>
                  <button
                    onClick={() => setTimelineFilter('reviews')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                      timelineFilter === 'reviews' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reviews
                  </button>
                </div>
              </div>

              {/* Timeline Items */}
              {filteredTimeline.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No activity events recorded</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Events will automatically populate here as the customer engages with your products and services.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-6 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-slate-800">
                  {filteredTimeline.map(event => (
                    <div key={event.eventId} className="relative pl-12 sm:pl-14 group">
                      <div className="absolute left-0 top-1 w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-violet-400 group-hover:border-violet-500/50 group-hover:text-violet-300 transition-all z-10 shadow">
                        <TimelineEventIcon type={event.type} />
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-slate-700 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-white uppercase">{event.title}</h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'Recent'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {event.points && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-bold uppercase border border-amber-500/20">
                              +{event.points} Points
                            </span>
                          )}
                          {event.amount && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold font-mono border border-emerald-500/20">
                              {event.amount.toFixed(2)} π
                            </span>
                          )}
                          {event.referenceId && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Ref: {event.referenceId.substring(0, 12)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Right 1 Col: Notes & Loyalty Programs */}
          <div className="space-y-6">
            
            {/* Loyalty Program Summary */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4" /> Loyalty Account
                </h3>
                <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase">
                  {loyalty?.tier || 'Bronze'} Tier
                </span>
              </div>

              <div className="flex items-baseline justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-3xl font-black text-white font-mono">{loyalty?.pointsBalance || 0}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mt-0.5">Points Balance</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 uppercase">Tier: {loyalty?.tier || 'Bronze'}</span>
                  <span className="text-[10px] text-slate-500 block">Rewards Active</span>
                </div>
              </div>
            </div>

            {/* Merchant Internal Notes */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-400" /> Merchant Internal Notes
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{notes.length} Recorded</span>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No internal merchant notes yet. Use the field below to store buyer preferences or service details.
                  </p>
                ) : (
                  notes.map(note => (
                    <div key={note.noteId} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                        <span className="text-violet-400">{note.authorName}</span>
                        <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recorded'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                <div className="relative">
                  <textarea
                    id="new-internal-note-input"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Record private staff note (e.g. VIP packaging preference, inquiries, delivery instructions)..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingNote || !noteText.trim()}
                  className="w-full py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAddingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      <span>Saving Note...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save Internal Note</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>

      </main>

      {/* DIRECT MESSAGE MODAL */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct Message Customer</h3>
                  <p className="text-xs text-slate-400">To: {customer.displayName} ({customer.email || 'Pi Pioneer'})</p>
                </div>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                aria-label="Close Message Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="customerDirectMessageText" className="text-xs font-bold text-slate-300 block">
                  Message Content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="customerDirectMessageText"
                  required
                  rows={4}
                  placeholder={`Write a direct inquiry reply or promotion message to ${customer.displayName}...`}
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/inbox', {
                      state: {
                        targetUid: customer.userUid,
                        targetName: customer.displayName,
                        contextType: 'business_customer',
                        businessId: customer.businessId
                      }
                    });
                  }}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 underline cursor-pointer p-1 min-h-[44px] flex items-center"
                >
                  Open in Full Inbox →
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMessage || !messageContent.trim()}
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

const TimelineEventIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'order_placed': return <ShoppingBag size={18} className="text-violet-400" />;
    case 'payment_completed': return <CreditCard size={18} className="text-emerald-400" />;
    case 'shipment_delivered': return <Truck size={18} className="text-sky-400" />;
    case 'review_submitted': return <Star size={18} className="text-amber-400" />;
    case 'loyalty_earned': return <Award size={18} className="text-amber-400" />;
    case 'loyalty_redeemed': return <TrendingUp size={18} className="text-rose-400" />;
    default: return <Clock size={18} className="text-slate-400" />;
  }
};
