/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { businessService } from '../services/businessService';
import { Business } from '../types';
import { BusinessWizard } from '../components/business/BusinessWizard';
import { BusinessCard } from '../components/business/BusinessCard';
import { 
  Building2, 
  Plus, 
  Search, 
  Briefcase,
  Store,
  ShieldCheck,
  Zap,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  Globe,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'owned' | 'collaborations'>('owned');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBusinesses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await businessService.getMyBusinesses(user.uid);
      setBusinesses(data);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const handleEdit = (business: Business) => {
    navigate(`/business/${business.id}/settings`);
  };

  const handleDelete = async (id: string) => {
    // Soft delete logic would go here
    if (window.confirm('Are you sure you want to archive this business identity?')) {
      await businessService.updateBusiness(id, user!.uid, user!.displayName || 'Admin', { businessStatus: 'archived' });
      fetchBusinesses();
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar 
        currentUser={user as any} 
        currentView="business_dashboard" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24 sm:pb-10">
        
        {/* Enterprise Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-inner">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Corporate Registry</p>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">Enterprise Identities</h1>
            <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium">Root control for all your marketplace operations.</p>
          </div>
          
          <button 
            onClick={() => setShowWizard(true)}
            className="group flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-bold transition-all hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="text-sm sm:text-base">Establish New Identity</span>
          </button>
        </div>

        {/* Global Context Rail */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
           {[
            { label: 'Total Identities', val: businesses.length, icon: Building2, color: 'text-indigo-400' },
            { label: 'Verified Status', val: businesses.filter(b => b.verificationStatus === 'Verified').length, icon: ShieldCheck, color: 'text-emerald-400' },
            { label: 'Active Personnel', val: businesses.reduce((acc, b) => acc + b.employeeCount, 0), icon: Zap, color: 'text-amber-400' },
            { label: 'System Health', val: 'Operational', icon: Globe, color: 'text-sky-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Quick Hub Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-start justify-between gap-6 sm:gap-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <ShoppingBag className="w-32 h-32 sm:w-40 sm:h-40" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">Global Store Management</h2>
              <p className="text-indigo-100/70 text-xs sm:text-sm md:text-base font-medium max-w-sm">Synchronize inventory, pricing, and fulfillment across all your registered storefronts.</p>
            </div>
            <button 
              onClick={() => navigate('/store-dashboard')}
              className="relative z-10 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-indigo-700 font-bold hover:bg-slate-50 transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              Manage Fleet
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-start justify-between gap-6 sm:gap-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 group-hover:scale-110 transition-transform hidden sm:block">
              <MessageSquare className="w-32 h-32 sm:w-40 sm:h-40" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">Omnichannel Communications</h2>
              <p className="text-slate-400 text-xs sm:text-sm md:text-base font-medium max-w-sm">Centralized support desk and automated CRM for every business identity in your registry.</p>
            </div>
            <button 
              onClick={() => navigate('/inbox')}
              className="relative z-10 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              Open Unified Inbox
            </button>
          </div>
        </div>

        {/* List Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-4 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('owned')}
              className={`text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'owned' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Managed Identities
              {activeTab === 'owned' && (
                <motion.div layoutId="activeTab" className="absolute -bottom-[25px] md:-bottom-[25px] left-0 right-0 h-1 bg-indigo-600 rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('collaborations')}
              className={`text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'collaborations' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Collaborations
              {activeTab === 'collaborations' && (
                <motion.div layoutId="activeTab" className="absolute -bottom-[25px] md:-bottom-[25px] left-0 right-0 h-1 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Filter identity..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full md:w-64 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
              />
            </div>
            <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shrink-0">
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Identities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] bg-slate-900/50 rounded-[2rem] border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBusinesses.map(business => (
                <motion.div
                  key={business.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <BusinessCard 
                    business={business}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={() => {}}
                    onClick={(b) => navigate(`/business/${b.id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 shadow-inner">
              <Building2 className="w-10 h-10 text-slate-700" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">No Registered Identities</h2>
            <p className="text-slate-500 max-w-sm mb-10 font-medium">
              You haven't established any business identities yet. Create one to start trading on the Pi Network.
            </p>
            <button 
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-slate-950 font-extrabold hover:bg-slate-200 transition-all shadow-2xl shadow-white/10"
            >
              <Zap className="w-5 h-5" />
              Launch Identity
            </button>
          </motion.div>
        )}

        {/* Global Footer Status */}
        <div className="mt-20 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" />
              Last Sync: Just Now
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Network Healthy
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Enterprise Registry v1.0.4</p>
        </div>
      </main>

      {/* Onboarding Wizard */}
      {showWizard && (
        <BusinessWizard 
          onComplete={() => {
            setShowWizard(false);
            fetchBusinesses();
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
};

export default BusinessDashboard;
