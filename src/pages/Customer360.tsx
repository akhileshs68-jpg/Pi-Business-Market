/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { crmService } from '../services/crmService';
import { loyaltyService } from '../services/loyaltyService';
import { 
  CustomerProfile, 
  CustomerTimelineEvent, 
  CustomerNote, 
  LoyaltyAccount 
} from '../types';

export const Customer360: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineEvent[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // In a real app, we'd fetch the customer profile by ID
      // For now, we'll fetch all and find (since our ID is composite)
      const allCustomers = await crmService.getBusinessCustomers('PI-CORP-001');
      const found = allCustomers.find(c => c.customerId === customerId);
      
      if (found) {
        setCustomer(found);
        const [timelineData, notesData, loyaltyData] = await Promise.all([
          crmService.getCustomerTimeline(customerId!),
          crmService.getCustomerNotes(customerId!),
          loyaltyService.getOrCreateAccount(found.userUid, found.businessId)
        ]);
        setTimeline(timelineData);
        setNotes(notesData);
        setLoyalty(loyaltyData);
      }
    } catch (err) {
      console.error('Failed to fetch customer data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !customer || !user) return;
    setIsAddingNote(true);
    try {
      await crmService.addNote(
        customer.customerId, 
        customer.businessId, 
        user.uid, 
        user.displayName || 'Staff', 
        noteText
      );
      setNoteText('');
      const updatedNotes = await crmService.getCustomerNotes(customer.customerId);
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Customer Intelligence Layer...</p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to CRM</span>
            </button>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400">
                <Users size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{customer.displayName}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {customer.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Mail size={12} /> {customer.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <SummaryBox label="Lifetime Spent" value={`${customer.totalSpent.toFixed(2)} Pi`} />
            <SummaryBox label="Total Orders" value={customer.totalOrders.toString()} />
            <SummaryBox label="Loyalty Tier" value={loyalty?.tier || 'Bronze'} primary />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-10 flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-400" /> Customer Activity Timeline
              </h2>
              <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {timeline.map((event) => (
                  <div key={event.eventId} className="relative pl-14">
                    <div className="absolute left-0 top-1 w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 z-10">
                      <TimelineIcon type={event.type} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase">{event.title}</h4>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">{event.description}</p>
                      {event.points && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                          +{event.points} Points
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="py-12 text-center text-slate-500 font-medium">No activity recorded yet.</div>
                )}
              </div>
            </section>
          </div>

          {/* Side Panels: Notes & Loyalty */}
          <div className="lg:col-span-1 space-y-12">
            {/* Loyalty Panel */}
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Loyalty Program</h3>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <p className="text-4xl font-black text-white">{loyalty?.pointsBalance || 0}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Points</p>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[80px]">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Tier</p>
                    <p className="text-xs font-black text-white uppercase tracking-widest">{loyalty?.tier || 'Bronze'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: '65%' }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Progress to Silver</span>
                    <span>1,250 / 5,000</span>
                  </p>
                </div>
              </div>
              <Award className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 text-indigo-600/5 group-hover:text-indigo-600/10 transition-all pointer-events-none" />
            </section>

            {/* Internal Notes */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <StickyNote size={18} className="text-indigo-400" /> Merchant Notes
                </h3>
              </div>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {notes.map(note => (
                  <div key={note.noteId} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-300 font-medium mb-3">{note.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{note.authorName}</span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-[10px] text-slate-500 text-center font-medium py-4">No internal notes yet.</p>}
              </div>

              <div className="relative">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add an internal note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-12 text-xs text-white focus:border-indigo-500 outline-none transition-all resize-none h-24"
                />
                <button 
                  onClick={handleAddNote}
                  disabled={isAddingNote || !noteText.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value, primary }: any) => (
  <div className={`px-6 py-4 rounded-3xl border ${primary ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-slate-900/50 border-slate-800'} text-center min-w-[140px]`}>
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-black ${primary ? 'text-indigo-400' : 'text-white'} uppercase tracking-tight`}>{value}</p>
  </div>
);

const TimelineIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'order_placed': return <ShoppingBag size={18} />;
    case 'payment_completed': return <CreditCard size={18} />;
    case 'shipment_delivered': return <Calendar size={18} />;
    case 'review_submitted': return <MessageSquare size={18} />;
    case 'loyalty_earned': return <Award size={18} />;
    case 'loyalty_redeemed': return <TrendingUp size={18} />;
    default: return <Clock size={18} />;
  }
};
