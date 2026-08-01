import React, { useState, useEffect } from 'react';
import { crmService } from '../../services/crmService';
import { CustomerProfile, CustomerTimelineEvent } from '../../types';
import { 
  Users, 
  Search, 
  Mail, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FileText, 
  UserCheck, 
  Eye, 
  ShieldAlert,
  Award,
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoreCustomersTabProps {
  businessId: string;
}

export const StoreCustomersTab: React.FC<StoreCustomersTabProps> = ({ businessId }) => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View Timeline Details
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await crmService.getBusinessCustomers(businessId);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch CRM customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [businessId]);

  const loadTimeline = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setLoadingTimeline(true);
    try {
      const data = await crmService.getCustomerTimeline(customer.customerId);
      setTimeline(data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute LTV Stats
  const totalLTV = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const averageLTV = customers.length ? totalLTV / customers.length : 0;
  const vipCount = customers.filter(c => (c.totalSpent || 0) > 1000).length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#090e1a]/95 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total LTV Sum</span>
            <p className="text-3xl font-black text-white">{totalLTV?.toLocaleString()} <span className="text-xs text-slate-500">Pi</span></p>
          </div>
          <div className="p-3.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#090e1a]/95 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Average Customer LTV</span>
            <p className="text-3xl font-black text-white">{averageLTV?.toFixed(1)} <span className="text-xs text-slate-500">Pi</span></p>
          </div>
          <div className="p-3.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#090e1a]/95 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">VIP Accounts (&gt;1000 Pi)</span>
            <p className="text-3xl font-black text-amber-500">{vipCount} <span className="text-xs text-slate-500">Users</span></p>
          </div>
          <div className="p-3.5 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer List Column (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Customer Profiles
              </h4>
              <span className="text-[10px] font-bold text-slate-500 px-2 py-1 bg-[#030712] border border-slate-850 rounded-lg uppercase">Total: {customers.length}</span>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Search CRM ledger by name, contact, or email address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading Customer CRM...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                No customer profiles match the filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map(customer => (
                  <div key={customer.customerId} className="p-4 bg-[#030712]/40 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-sm">
                        {customer.displayName?.slice(0, 2).toUpperCase() || 'CU'}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                          {customer.displayName}
                          {(customer.totalSpent || 0) > 1000 && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] rounded-md font-black uppercase tracking-wider">VIP</span>
                          )}
                        </h5>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-slate-600" /> {customer.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0 border-slate-850/40">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Lifetime Value</span>
                        <span className="text-xs font-black text-white">{customer.totalSpent?.toLocaleString()} Pi <span className="text-[9px] text-slate-500 font-normal">({customer.totalOrders} ord)</span></span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Account Status</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${
                          customer.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>{customer.status || 'Active'}</span>
                      </div>

                      <button 
                        onClick={() => loadTimeline(customer)}
                        className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Customer Timeline Column (1/3) */}
        <div className="space-y-4">
          <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-400" /> Contact History Timeline
            </h4>

            {!selectedCustomer ? (
              <div className="py-20 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Select a customer's eye icon to view comprehensive transaction history and touchpoints.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-850">
                  <h5 className="text-xs font-black text-white">{selectedCustomer.displayName}</h5>
                  <p className="text-[10px] text-slate-500 font-medium">Joined {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>

                {loadingTimeline ? (
                  <div className="text-center text-xs text-slate-500 py-8">Fetching activity history...</div>
                ) : timeline.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8 border border-dashed border-slate-800 rounded-xl">
                    No activity logs recorded.
                  </div>
                ) : (
                  <div className="space-y-4 relative pl-3 border-l border-slate-800">
                    {timeline.map(event => (
                      <div key={event.eventId} className="relative space-y-1">
                        <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-indigo-500 border-2 border-[#090e1a]" />
                        <h6 className="text-[11px] font-bold text-white leading-tight">{event.title}</h6>
                        <p className="text-[10px] text-slate-400 leading-normal">{event.description}</p>
                        {event.amount && <p className="text-[9px] font-bold text-emerald-400">Total: {event.amount} Pi</p>}
                        <span className="text-[9px] text-slate-500 block pt-0.5">{new Date(event.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
