/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useActiveRole } from '../hooks/useActiveRole';
import { orderService } from '../services/orderService';
import { bookingService } from '../services/bookingService';
import { ORDER_STATUSES, BOOKING_STATUSES } from '../config/orderBookingConfig';
import { 
  Package, 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Check, 
  X, 
  ArrowRight, 
  User, 
  Building,
  Edit2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManagerProps {
  type: 'order' | 'booking';
  viewAs: 'buyer' | 'seller';
}

export const OrderBookingManager: React.FC<ManagerProps> = ({ type, viewAs }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeRole = useActiveRole();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab Filters for Bookings
  const [activeBookingTab, setActiveBookingTab] = useState<'all' | 'pending' | 'scheduled' | 'completed' | 'cancelled'>('all');

  // Interactive Operations State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reschedule Form State
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  // Rejection Form State
  const [rejectionId, setRejectionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadItems = async () => {
    if (!user) return;
    setLoading(true);
    setActionError(null);
    try {
      if (type === 'order') {
        const fetched = viewAs === 'seller' 
          ? await orderService.getOrdersBySeller(user.uid)
          : await orderService.getOrdersByBuyer(user.uid);
        // Sort orders newest first
        const sorted = [...fetched].sort((a: any, b: any) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setItems(sorted);
      } else {
        const fetched = viewAs === 'seller'
          ? await bookingService.getBookingsBySeller(user.uid)
          : await bookingService.getBookingsByBuyer(user.uid);
        // Sort bookings newest first
        const sorted = [...fetched].sort((a: any, b: any) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setItems(sorted);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
      setActionError('Could not sync booking dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // Close forms on tab/view changes
    setRescheduleId(null);
    setRejectionId(null);
  }, [user, type, viewAs]);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!user || actionLoadingId) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      if (type === 'order') {
        await orderService.updateOrderStatus(id, status);
      } else {
        await bookingService.updateBookingStatus(id, status);
      }
      await loadItems();
    } catch (err) {
      console.error('Failed to update status:', err);
      setActionError('Failed to transition appointment status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dedicated Provider Accept
  const handleAcceptBooking = async (id: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      await bookingService.updateBooking(id, {
        bookingStatus: 'Confirmed',
        providerConfirmedAt: new Date().toISOString()
      });
      await loadItems();
    } catch (err) {
      console.error('Acceptance failed:', err);
      setActionError('Failed to accept booking request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dedicated Provider Reject
  const handleRejectBookingSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (actionLoadingId) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      await bookingService.updateBooking(id, {
        bookingStatus: 'Rejected',
        rejectionReason: rejectionReason.trim() || 'Declined by service provider.',
        providerRejectedAt: new Date().toISOString()
      });
      setRejectionId(null);
      setRejectionReason('');
      await loadItems();
    } catch (err) {
      console.error('Rejection failed:', err);
      setActionError('Failed to record booking rejection.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dedicated Reschedule Action
  const handleRescheduleSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime || actionLoadingId) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      await bookingService.updateBooking(id, {
        bookingDate: rescheduleDate,
        bookingTime: rescheduleTime,
        bookingStatus: 'Rescheduled',
        rescheduleNotes: rescheduleNotes.trim() || 'Schedule adjusted.',
        lastRescheduledBy: viewAs,
        rescheduledAt: new Date().toISOString()
      });
      setRescheduleId(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleNotes('');
      await loadItems();
    } catch (err: any) {
      console.error('Rescheduling failed:', err);
      const msg = err?.message || '';
      if (msg.includes('SLOT_UNAVAILABLE:')) {
        setActionError(msg.replace('SLOT_UNAVAILABLE:', '').trim());
      } else {
        setActionError('Failed to update scheduled slot.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dedicated Cancel Action
  const handleCancelBooking = async (id: string) => {
    if (actionLoadingId) return;
    if (!window.confirm('Are you sure you want to cancel this service appointment request?')) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      await bookingService.updateBooking(id, {
        bookingStatus: 'Cancelled',
        cancelledBy: viewAs,
        cancelledAt: new Date().toISOString()
      });
      await loadItems();
    } catch (err) {
      console.error('Cancellation failed:', err);
      setActionError('Failed to cancel appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dedicated Completion Action
  const handleCompleteBooking = async (id: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      await bookingService.updateBooking(id, {
        bookingStatus: 'Completed',
        completedAt: new Date().toISOString()
      });
      await loadItems();
    } catch (err) {
      console.error('Completion failed:', err);
      setActionError('Failed to complete booking entry.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Unified Search and Filter matching
  const getFilteredItems = () => {
    return items.filter(item => {
      // 1. Search Query Match
      const matchesSearch = searchQuery === '' || 
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.packageName && item.packageName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Tab Filter Match (Bookings only)
      if (type === 'booking') {
        const s = (item.bookingStatus || 'Pending').toLowerCase();
        switch (activeBookingTab) {
          case 'pending':
            return s === 'pending';
          case 'scheduled':
            return ['confirmed', 'scheduled', 'in progress', 'rescheduled'].includes(s);
          case 'completed':
            return s === 'completed';
          case 'cancelled':
            return ['cancelled', 'rejected'].includes(s);
          case 'all':
          default:
            return true;
        }
      }
      return true;
    });
  };

  const filteredItems = getFilteredItems();

  const getStatusBadgeStyles = (statusStr: string) => {
    const s = (statusStr || 'Pending').toLowerCase();
    if (s === 'pending') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (['confirmed', 'scheduled', 'rescheduled'].includes(s)) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (s === 'in progress') {
      return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse';
    }
    if (s === 'completed') {
      return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
    if (['cancelled', 'rejected'].includes(s)) {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-slate-900 text-slate-400 border border-slate-800';
  };

  const getReadableStatusDescription = (statusStr: string, isBuyer: boolean) => {
    const s = (statusStr || 'Pending').toLowerCase();
    if (s === 'pending') {
      return isBuyer ? 'Waiting for provider confirmation' : 'New request requires your action';
    }
    if (s === 'confirmed' || s === 'scheduled') {
      return 'Confirmed appointment time';
    }
    if (s === 'rescheduled') {
      return 'Rescheduled slot';
    }
    if (s === 'in progress') {
      return 'Consultation is actively occurring';
    }
    if (s === 'completed') {
      return 'Fulfillment completed successfully';
    }
    if (s === 'cancelled') {
      return 'Request cancelled';
    }
    if (s === 'rejected') {
      return 'Request declined by specialist';
    }
    return 'Status updated';
  };

  return (
    <div className="bg-slate-900/30 border border-slate-900/60 rounded-[2rem] p-6 sm:p-8 space-y-6">
      
      {/* Upper Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            {type === 'order' ? <Package className="w-5 h-5 text-violet-400" /> : <Calendar className="w-5 h-5 text-violet-400" />}
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              {type === 'order' ? 'Product Orders Tracker' : 'Appointments Center'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Viewing as {viewAs === 'seller' ? 'Provider / Specialist' : 'Customer / Buyer'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Universal Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={`Search ${type === 'order' ? 'orders' : 'bookings'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Execution Error:</span> {actionError}
          </div>
        </div>
      )}

      {/* Bookings-Specific Status Tabs */}
      {type === 'booking' && (
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-2xl border border-slate-900 gap-1 self-start max-w-2xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'scheduled', label: 'Scheduled / Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled / Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveBookingTab(tab.id as any);
                setRescheduleId(null);
                setRejectionId(null);
              }}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeBookingTab === tab.id 
                  ? 'bg-violet-600/15 text-violet-400 border border-violet-500/15 shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Integrity Information Badge */}
      {type === 'booking' && (
        <div className="p-4 bg-slate-950/40 border border-slate-900/60 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
          <FileText className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold text-slate-200">Request & Approval Model:</span> Scheduling a consultation request initiates an agreement proposal with the specialist. Once accepted, both parties are expected to coordinate. There are no automated instant payments triggered here.
          </p>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
          Syncing records with the secure ledger...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-slate-950/20 border border-slate-900/40 border-dashed rounded-[2rem] p-6 space-y-4">
          {type === 'booking' ? (
            <Calendar className="w-12 h-12 text-slate-800 mx-auto" />
          ) : (
            <Package className="w-12 h-12 text-slate-800 mx-auto" />
          )}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              {type === 'booking' ? 'No Upcoming Appointments' : 'No Matching Records Found'}
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
              {type === 'booking'
                ? 'Explore services and consultation slots to book your next appointment.'
                : 'There are no records in this list that match your active search or tab filter.'}
            </p>
          </div>
          {type === 'booking' && viewAs === 'buyer' && (
            <button
              onClick={() => navigate('/directory')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-violet-600/20"
            >
              <span>Explore Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {type === 'order' && viewAs === 'buyer' && (
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredItems.map(item => {
            const isItemLoading = actionLoadingId === item.id;
            const isRescheduleOpen = rescheduleId === item.id;
            const isRejectionOpen = rejectionId === item.id;
            const displayPrice = item.grandTotal || item.price || 0;
            const displayCurrency = item.currency || 'π';
            const statusLabel = item.bookingStatus || item.orderStatus || 'Pending';

            return (
              <div 
                key={item.id} 
                className={`bg-slate-900/40 border rounded-[2rem] p-5 sm:p-6 transition-all space-y-5 ${
                  isItemLoading ? 'opacity-60 pointer-events-none' : ''
                } ${
                  isRescheduleOpen || isRejectionOpen ? 'border-violet-500/40 bg-slate-900/60' : 'border-slate-900 hover:border-slate-850'
                }`}
              >
                {/* ID & Status Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/60 pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference ID</span>
                    <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider block">{item.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadgeStyles(statusLabel)}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline-block">
                      • {getReadableStatusDescription(statusLabel, viewAs === 'buyer')}
                    </span>
                  </div>
                </div>

                {/* Main details block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Title and Details */}
                  <div className="space-y-2 md:col-span-2">
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-tight">
                      {item.title || item.packageName || (type === 'booking' ? 'Service Consultation' : 'Product Order')}
                    </h3>
                    
                    {item.packageName && (
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-violet-500" /> Package: <span className="text-slate-200">{item.packageName}</span>
                      </p>
                    )}

                    {/* Booking Date & Time detail */}
                    {type === 'booking' && (
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                        <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-850">
                          <Calendar className="w-3.5 h-3.5 text-violet-400" /> {item.bookingDate || 'Flexible'}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-850">
                          <Clock className="w-3.5 h-3.5 text-violet-400" /> {item.bookingTime || 'TBD'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Meta info */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/50 flex flex-col justify-center text-left md:text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Fulfillment Total</span>
                    <span className="text-base sm:text-lg font-black text-violet-400 uppercase tracking-tight">
                      {displayPrice} <span className="text-xs">{displayCurrency}</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">
                      {type === 'booking' ? 'Appointment Slot proposal' : 'Product Order total'}
                    </span>
                  </div>
                </div>

                {/* Additional Information: Rejection details, rescheduling records, notes */}
                <div className="space-y-3">
                  {/* Notes / Requested specifications */}
                  {(item.notes || item.bookingNotes) && (
                    <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-850/40 space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Client Consultation Notes</span>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{item.notes || item.bookingNotes}</p>
                    </div>
                  )}

                  {/* Rejection explanation if present */}
                  {item.rejectionReason && (
                    <div className="p-3.5 bg-rose-950/10 border border-rose-500/20 rounded-2xl flex items-start gap-2 text-rose-400 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wide text-[9px] block mb-0.5">Declined Explanation</span>
                        <p className="text-[11px] leading-relaxed">{item.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Rescheduling records if present */}
                  {item.rescheduleNotes && (
                    <div className="p-3.5 bg-violet-950/10 border border-violet-500/20 rounded-2xl flex items-start gap-2 text-violet-300 text-xs">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wide text-[9px] block mb-0.5">Reschedule Event Notes</span>
                        <p className="text-[11px] leading-relaxed">
                          Last adjusted by <span className="uppercase font-bold text-white">{item.lastRescheduledBy || 'system'}</span>: {item.rescheduleNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Action Forms (Reschedule / Rejection) */}
                <AnimatePresence>
                  {isRescheduleOpen && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={(e) => handleRescheduleSubmit(e, item.id)}
                      className="border border-violet-500/20 bg-slate-950 p-4 sm:p-5 rounded-2xl space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> Request / Update Slot Schedule
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setRescheduleId(null)}
                          className="text-slate-500 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Proposed Date</label>
                          <input 
                            type="date" 
                            required
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Proposed Time</label>
                          <input 
                            type="time" 
                            required
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reschedule Reason / Message</label>
                        <textarea 
                          placeholder="Provide context regarding the schedule adjustment..."
                          value={rescheduleNotes}
                          onChange={(e) => setRescheduleNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRescheduleId(null)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Submit Reschedule
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {isRejectionOpen && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={(e) => handleRejectBookingSubmit(e, item.id)}
                      className="border border-red-500/20 bg-slate-950 p-4 sm:p-5 rounded-2xl space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Decline Service Request
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setRejectionId(null)}
                          className="text-slate-500 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reason for Declining (Sent to Client)</label>
                        <textarea 
                          required
                          placeholder="Please explain to the client why you cannot fulfill this request..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRejectionId(null)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Go Back
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Confirm Decline
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Primary Action Buttons Bar */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-900/60">
                  
                  {type === 'order' ? (
                    /* Existing Product Order operations */
                    viewAs === 'seller' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Update Status:</span>
                        <select
                          value={item.orderStatus || ''}
                          disabled={isItemLoading}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                        >
                          <option value="" disabled>Choose status</option>
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )
                  ) : (
                    /* Refined Service Booking operations based on lifecycle */
                    <>
                      {/* 1. SELLER / SERVICE PROVIDER ACTIONS */}
                      {viewAs === 'seller' && (
                        <>
                          {/* If Pending: Accept or Reject */}
                          {statusLabel.toLowerCase() === 'pending' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => {
                                  setRejectionId(item.id);
                                  setRescheduleId(null);
                                }}
                                className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Decline Request
                              </button>
                              
                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => handleAcceptBooking(item.id)}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10"
                              >
                                <Check className="w-3.5 h-3.5" /> Confirm Slot
                              </button>
                            </div>
                          )}

                          {/* If Scheduled / Active / Confirmed: Reschedule, Cancel, or Complete */}
                          {['confirmed', 'scheduled', 'rescheduled', 'in progress'].includes(statusLabel.toLowerCase()) && (
                            <div className="flex flex-wrap items-center gap-2 justify-end">
                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => handleCancelBooking(item.id)}
                                className="px-3.5 py-2 bg-slate-950 hover:bg-red-950 hover:text-red-400 border border-slate-850 hover:border-red-900/50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => {
                                  setRescheduleId(item.id);
                                  setRescheduleDate(item.bookingDate || '');
                                  setRescheduleTime(item.bookingTime || '');
                                  setRejectionId(null);
                                }}
                                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-violet-400" /> Adjust Schedule
                              </button>

                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => handleCompleteBooking(item.id)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/15"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 2. BUYER ACTIONS */}
                      {viewAs === 'buyer' && (
                        <>
                          {/* If Active (Pending, Confirmed, Scheduled): Reschedule or Cancel */}
                          {['pending', 'confirmed', 'scheduled', 'rescheduled'].includes(statusLabel.toLowerCase()) && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => handleCancelBooking(item.id)}
                                className="px-3.5 py-2 bg-slate-950 hover:bg-red-950 hover:text-red-400 border border-slate-850 hover:border-red-900/40 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Cancel Request
                              </button>

                              <button
                                type="button"
                                disabled={isItemLoading}
                                onClick={() => {
                                  setRescheduleId(item.id);
                                  setRescheduleDate(item.bookingDate || '');
                                  setRescheduleTime(item.bookingTime || '');
                                  setRejectionId(null);
                                }}
                                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-violet-400" /> Reschedule Slot
                              </button>
                            </div>
                          )}

                          {/* Completed message */}
                          {statusLabel.toLowerCase() === 'completed' && (
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Fulfilled
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
