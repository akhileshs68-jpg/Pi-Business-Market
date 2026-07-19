/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { crmService } from '../services/crmService';
import { CustomerProfile } from '../types';

export const MerchantCRM: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const businessId = 'PI-CORP-001'; // Simulated for foundation

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await crmService.getBusinessCustomers(businessId);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase text-indigo-400">Customer 360</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage your enterprise customer relationships and loyalty programs.</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white focus:border-indigo-500 outline-none transition-all w-full md:w-80"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Customers" value={customers.length.toString()} icon={<Users />} color="text-indigo-400" />
          <StatCard label="Avg Order Value" value="42.5 Pi" icon={<TrendingUp />} color="text-emerald-400" />
          <StatCard label="Active Users" value={customers.filter(c => c.status === 'active').length.toString()} icon={<UserCheck />} color="text-amber-400" />
          <StatCard label="Customer LTV" value="1.2k Pi" icon={<Star />} color="text-violet-400" />
        </div>

        {/* Customer Table/List */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Customer Registry
            </h3>
            <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase hover:text-white transition-all">
              <Filter className="w-3 h-3" /> Filter Segment
            </button>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Compiling Customer Intelligence...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-slate-500 font-medium">No customers matching your search criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredCustomers.map((customer) => (
                <div 
                  key={customer.customerId}
                  onClick={() => navigate(`/crm/customer/${customer.customerId}`)}
                  className="p-8 hover:bg-slate-800/30 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Users size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-white uppercase truncate">{customer.displayName}</h4>
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Mail size={12} /> {customer.email}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <ShoppingBag size={12} /> {customer.totalOrders} Orders
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Clock size={12} /> Last Visit: {new Date(customer.lastVisitAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Total Spent</p>
                        <p className="text-sm font-black text-white">{customer.totalSpent.toFixed(2)} Pi</p>
                      </div>
                      <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                      </div>
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

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 bg-slate-950 rounded-xl border border-slate-800 ${color}`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);
