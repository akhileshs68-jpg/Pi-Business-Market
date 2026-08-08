/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '../auth/useAuth';
import { businessService } from '../services/businessService';
import { Business } from '../types';
import { BusinessWizard } from '../components/business/BusinessWizard';
import { BusinessCard } from '../components/business/BusinessCard';
import { useBusiness } from '../context/BusinessContext';
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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const BusinessHub = lazy(() => import('../components/business/BusinessHub').then(m => ({ default: m.BusinessHub })));

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    businesses, 
    currentBusiness, 
    setCurrentBusinessId, 
    refreshWorkspace, 
    isWorkspaceReady 
  } = useBusiness();

  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'owned' | 'collaborations'>('owned');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const loading = !isWorkspaceReady;

  // Symmetrical sync of local selection with context
  useEffect(() => {
    if (currentBusiness) {
      setSelectedBusiness(currentBusiness);
    } else {
      setSelectedBusiness(null);
    }
  }, [currentBusiness]);

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setCurrentBusinessId(business.id);
  };

  const handleBackToRegistry = () => {
    setSelectedBusiness(null);
    setCurrentBusinessId(null);
  };

  const handleEdit = (business: Business) => {
    navigate(`/business/${business.id}/settings`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this business identity?')) {
      await businessService.updateBusiness(id, user!.uid, user!.displayName || 'Admin', { businessStatus: 'archived' });
      await refreshWorkspace();
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 sm:pb-28 lg:pb-28">
        
        {/* Active Business Banner & Switcher (only if at least one business exists) */}
        {businesses.length > 0 && (
          <div className="mb-10 p-6 sm:p-8 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                {currentBusiness?.logoUrl ? (
                  <img src={currentBusiness.logoUrl} alt={currentBusiness.businessName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-indigo-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">This is your Business</p>
                  {currentBusiness?.verificationStatus === 'Verified' ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider">Verified</span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider">Pending Approval</span>
                  )}
                  <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider">
                    {currentBusiness?.businessStatus || 'Active'}
                  </span>
                </div>

                {/* Switcher dropdown if multiple exist */}
                {businesses.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs font-bold">Switch:</span>
                    <select
                      value={currentBusiness?.id || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setCurrentBusinessId(id);
                        const matched = businesses.find(b => b.id === id);
                        if (matched) setSelectedBusiness(matched);
                      }}
                      className="bg-slate-950 border border-slate-800 text-sm font-extrabold text-white rounded-xl px-3 py-1.5 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      {businesses.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {currentBusiness?.businessName}
                  </h1>
                )}

                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Category: <span className="text-indigo-400 capitalize">{currentBusiness?.category || 'General'}</span> • Type: <span className="text-indigo-400 capitalize">{currentBusiness?.businessType || 'Enterprise'}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions (inheriting business context directly!) */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  if (currentBusiness) {
                    setSelectedBusiness(currentBusiness);
                    navigate('/business-center?tab=catalog&subTab=products&action=add_product');
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
              
              <button
                onClick={() => {
                  if (currentBusiness) {
                    setSelectedBusiness(currentBusiness);
                    navigate('/business-center?tab=catalog&subTab=services&action=add_service');
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-violet-600/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>

              <button
                onClick={() => {
                  if (currentBusiness) {
                    setSelectedBusiness(currentBusiness);
                    navigate('/business-center?tab=stores');
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                title="Store outlets are optional"
              >
                <Store className="w-4 h-4" /> Store (Optional)
              </button>

              <button
                onClick={() => setShowWizard(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs transition-all"
                title="Create another business under One Account Policy"
              >
                + Add Another Business
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] bg-slate-900/50 rounded-[2rem] border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          /* FIRST-TIME USER EXPERIENCE - SIMPLE GUIDED ONBOARDING SCREEN */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto py-12 px-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm text-center my-10"
          >
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Briefcase className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-3">Pioneer Workspace</p>
            <h2 className="text-3xl font-extrabold text-white mb-6">START YOUR BUSINESS</h2>
            
            <div className="space-y-4 text-left max-w-md mx-auto mb-10">
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Create your Business Profile</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Register your business identity under the One Account Policy.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Add Products or Services</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">List physical products or consulting services directly under your business context.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Submit for Approval</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Undergo compliance audit to receive the verified merchant badge.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowWizard(true)}
              className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold transition-all shadow-xl shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              CREATE MY BUSINESS
            </button>
          </motion.div>
        ) : selectedBusiness ? (
          <Suspense fallback={<div className="text-white text-center py-20">Loading Dashboard...</div>}>
            <BusinessHub business={selectedBusiness} onBack={handleBackToRegistry} />
          </Suspense>
        ) : (
          <>
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
                  Managed Businesses
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
                    placeholder="Filter business..." 
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

            {/* Businesses Grid */}
            {filteredBusinesses.length > 0 ? (
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
                        onClick={handleSelectBusiness}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                No matching businesses found.
              </div>
            )}
          </>
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
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Marketplace Registry v1.0.4</p>
        </div>
      </main>

      {/* Onboarding Wizard */}
      {showWizard && (
        <BusinessWizard 
          onComplete={async () => {
            setShowWizard(false);
            await refreshWorkspace();
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
};

export default BusinessDashboard;
