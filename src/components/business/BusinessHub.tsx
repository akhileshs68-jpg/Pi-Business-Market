/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Store as StoreIcon, 
  Briefcase, 
  Package, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Wallet, 
  Settings, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  Tag, 
  Zap,
  Megaphone,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Eye,
  TrendingUp,
  Sparkles,
  Share2,
  Copy,
  ChevronRight,
  Coins,
  Award,
  Scale,
  Truck,
  Globe,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Business, Store, Product, Service } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UniversalBusinessService, BusinessOverview } from '../../services/universalBusinessService';
import { aiEngineService, BusinessInsight } from '../../services/aiEngineService';
import { MarketingCenter } from './MarketingCenter';
import { BusinessVerificationModal } from './BusinessVerificationModal';
import { useAuth } from '../../auth/useAuth';
import { ProductManager } from './ProductManager';
import { ServiceManager } from './ServiceManager';
import { CategoryManager } from './CategoryManager';
import { StoreManager } from './StoreManager';

interface BusinessHubProps {
  business: Business;
  onBack: () => void;
}

export const BusinessHub: React.FC<BusinessHubProps> = ({ business, onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'identity' | 'stores' | 'catalog' | 'orders' | 'customers' | 'wallet' | 'marketing' | 'verification'
  >('overview');

  // Synchronize activeTab state with URL tab query parameter
  useEffect(() => {
    if (tabQuery) {
      const validTabs = ['overview', 'identity', 'stores', 'catalog', 'orders', 'customers', 'wallet', 'marketing', 'verification'];
      if (validTabs.includes(tabQuery)) {
        setActiveTab(tabQuery as any);
      }
    }
    const subTabQuery = searchParams.get('subTab');
    if (subTabQuery) {
      const validSubTabs = ['products', 'services', 'taxonomies'];
      if (validSubTabs.includes(subTabQuery)) {
        setCatalogSubTab(subTabQuery as any);
      }
    }
  }, [tabQuery, searchParams]);

  const handleTabChange = (tabId: string, subTabId?: string) => {
    setActiveTab(tabId as any);
    const newParams: Record<string, string> = { tab: tabId };
    if (subTabId) {
      newParams.subTab = subTabId;
    }
    setSearchParams(newParams);
  };

  const [overview, setOverview] = useState<BusinessOverview | null>(null);
  const [aiInsights, setAiInsights] = useState<BusinessInsight[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'services' | 'taxonomies'>('products');

  const loadData = async () => {
    setLoadingData(true);
    try {
      const data = await UniversalBusinessService.getBusinessOverview(business.id);
      const insights = await aiEngineService.getBusinessInsights(business.id);
      setAiInsights(insights);
      if (data) setOverview(data);

      const fetchedOrders = await UniversalBusinessService.getBusinessOrders(business.id, orderFilterStatus);
      setOrders(fetchedOrders);

      const logs = await UniversalBusinessService.getBusinessAuditLogs(business.id);
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Error loading business overview:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id, orderFilterStatus]);

  const navigationTabs = [
    { id: 'overview', label: 'Command Hub', icon: BarChart3 },
    { id: 'identity', label: 'Business Profile', icon: Building2 },
    { id: 'stores', label: 'Store Outlets', icon: StoreIcon, count: overview?.stores.length || 0 },
    { id: 'catalog', label: 'Products & Services', icon: Package, count: (overview?.productsCount || 0) + (overview?.servicesCount || 0) },
    { id: 'orders', label: 'Orders & Escrow', icon: ClipboardList, count: orders.length },
    { id: 'customers', label: 'Customer CRM', icon: Users },
    { id: 'wallet', label: 'Business Wallet', icon: Wallet },
    { id: 'marketing', label: 'Marketing & Ads', icon: Megaphone },
    { id: 'verification', label: 'Verification & Audit', icon: ShieldCheck }
  ];

  const totalStores = overview?.stores.length || business.storeCount || 0;
  const isVerified = business.verificationStatus === 'Verified' || (business as any).verified;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <button 
          onClick={onBack} 
          className="group text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors w-fit"
        >
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          Back to Registry
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowVerificationModal(true)} 
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              isVerified 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isVerified ? 'Enterprise Verified' : 'Submit Verification Docs'}
          </button>

          <button 
            onClick={() => navigate(`/business/${business.id}/settings`)} 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <button 
            onClick={() => navigate(`/business/${business.id}`)} 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Public Profile
          </button>
        </div>
      </div>

      {/* Enterprise Identity Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.businessName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{business.businessName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  business.businessStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {business.businessStatus || 'Active'}
                </span>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {business.businessType} • <span className="text-indigo-400 capitalize">{business.category || business.industry || 'General Industry'}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" /> {business.city || 'Global'}, {business.country || 'Pi Network'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400"><Award className="w-3.5 h-3.5" /> Rating: {business.rating || '5.0'}</span>
                <span>•</span>
                <span className="text-slate-400">ID: {business.id}</span>
              </div>
            </div>
          </div>

          {/* KPI Snapshot Pill Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
            <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Pi Wallet</span>
              <span className="text-base sm:text-lg font-black text-white font-mono">{(business.rating ? business.rating * 12 : 50).toFixed(1)} Pi</span>
            </div>
            <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">BMP Rewards</span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono">1,250 BMP</span>
            </div>
            <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Outlets</span>
              <span className="text-base sm:text-lg font-black text-indigo-400">{totalStores} Store{totalStores !== 1 ? 's' : ''}</span>
            </div>
            <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Orders</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">{orders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-800/80">
        {navigationTabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2.5 border ${
                active
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMMAND HUB OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Quick Module Launch Grid */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4">Enterprise Modules</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { label: 'Store Outlets', path: '/store-dashboard', icon: StoreIcon, desc: 'Fulfillment & Inventory' },
                { label: 'Product Catalog', path: '/catalog-management', icon: Package, desc: 'Digital & Physical' },
                { label: 'Service Hub', path: '/service-management', icon: Briefcase, desc: 'Consultations & Care' },
                { label: 'Order Processing', path: '/business-orders', icon: ClipboardList, desc: 'Orders & Escrow' },
                { label: 'Customer CRM', path: '/customer-crm', icon: Users, desc: 'VIP & History' },
                { label: 'Merchant Analytics', path: '/merchant-analytics', icon: BarChart3, desc: 'Sales & Metrics' },
                { label: 'Business Wallet', path: '/merchant-payments', icon: Wallet, desc: 'Pi & BMP Token' },
                { label: 'Communications', path: '/inbox', icon: MessageSquare, desc: 'Unified Messages' },
                { label: 'Marketing Center', path: '#marketing', icon: Megaphone, action: () => handleTabChange('marketing'), desc: 'Coupons & Ads' },
                { label: 'Verification', path: '#verification', icon: ShieldCheck, action: () => handleTabChange('verification'), desc: 'Regulatory Compliance' },
              ].map((mod, idx) => (
                <button
                  key={idx}
                  onClick={() => mod.action ? mod.action() : navigate(mod.path)}
                  className="p-5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl flex flex-col items-start text-left gap-3 transition-all hover:bg-slate-900 group"
                >
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-indigo-500/40 transition-colors">
                    <mod.icon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-indigo-300 transition-colors">{mod.label}</span>
                    <span className="text-[10px] font-medium text-slate-500 block mt-0.5">{mod.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Actions & System Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* System Health & Status Cards */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>System Status</span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-xs font-medium text-slate-300">Verification Audit</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-300">BMP Rewards Gateway</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full">Active</span>
                </div>

                <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-300">Pi Testnet SDK Integration</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full">Ready</span>
                </div>
              </div>
            </div>

            {/* Audit Logs Stream */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Recent Business Operations & Audit Logs</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </h4>

              {auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-indigo-600/10 rounded-xl shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200">{log.action || 'OPERATION_RECORDED'}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{log.description || 'System state synchronized'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/50">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-slate-300">Business Registry Synchronized</p>
                  <p className="text-[11px] text-slate-500 mt-1">All operating parameters healthy with zero pending errors.</p>
                </div>
              )}
            </div>
          </div>

          {/* Community & Gamification Reputation Index */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Enterprise Community & Reputation Index
                </h3>
                <p className="text-xs text-slate-500">Official gamification and social growth tracking metrics for {business.businessName}.</p>
              </div>
              <button
                onClick={() => navigate('/community')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                Open Community Hub <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 text-center space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Followers</span>
                <span className="text-xl font-black text-white block">384</span>
                <span className="text-[9px] text-emerald-400 font-bold block">+12% this week</span>
              </div>
              
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 text-center space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Engagement Rate</span>
                <span className="text-xl font-black text-white block">18.4%</span>
                <span className="text-[9px] text-emerald-400 font-bold block">Excellent Status</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 text-center space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Reputation Index</span>
                <span className="text-xl font-black text-amber-400 block">750 Score</span>
                <span className="text-[9px] text-slate-400 font-bold block">Gold Pioneer Tier</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 text-center space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Achievements</span>
                <span className="text-xl font-black text-indigo-400 block">15 Badges</span>
                <span className="text-[9px] text-slate-400 font-bold block">Top 3% Merchant</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 text-center space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Leaderboard Rank</span>
                <span className="text-xl font-black text-white block">#14</span>
                <span className="text-[9px] text-emerald-400 font-bold block">Moving up</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 text-center space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Business Rank</span>
                <span className="text-xl font-black text-white block">A+ Grade</span>
                <span className="text-[9px] text-emerald-400 font-bold block">Highly Reliable</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITY & CREDENTIALS */}
      {activeTab === 'identity' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">Business Registration & Credentials</h3>
              <p className="text-xs text-slate-500 font-medium">Verified parameters stored under One Account Policy.</p>
            </div>
            <button 
              onClick={() => navigate(`/business/${business.id}/settings`)} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all"
            >
              Edit Credentials
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Legal Name</span>
              <span className="text-sm font-bold text-white">{business.legalName || business.businessName}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Business Category</span>
              <span className="text-sm font-bold text-indigo-400 capitalize">{business.category || business.industry || 'N/A'}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Business Type</span>
              <span className="text-sm font-bold text-white">{business.businessType}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">GST / Tax Number</span>
              <span className="text-sm font-mono text-emerald-400">{business.gstNumber || 'Pending Tax Setup'}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">PAN / Registration ID</span>
              <span className="text-sm font-mono text-emerald-400">{business.panNumber || business.registrationNumber || 'Not Specified'}</span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pi Wallet Public Address</span>
              <span className="text-xs font-mono text-slate-300 truncate block">{business.walletAddress || 'Configured via Auth'}</span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Address & Operations Base</span>
            <p className="text-sm text-slate-200 font-medium">{business.fullAddress || `${business.city || 'Central City'}, ${business.state || 'Region'}, ${business.country || 'Global'}`}</p>
          </div>
        </div>
      )}

      {/* TAB 3: STORES OUTLETS */}
      {activeTab === 'stores' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-xl font-black text-white">Registered Store Outlets</h3>
            <p className="text-xs text-slate-500">Physical and digital storefronts linked to {business.businessName}.</p>
          </div>
          <StoreManager />
        </div>
      )}

      {/* TAB 4: CATALOG & SERVICES */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white">Commercial Asset catalog</h3>
              <p className="text-xs text-slate-500">Manage listing inventory, catalog subcategories, and consulting services.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCatalogSubTab('products')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${catalogSubTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Products ({overview?.productsCount || 0})
              </button>
              <button
                onClick={() => setCatalogSubTab('services')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${catalogSubTab === 'services' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Services ({overview?.servicesCount || 0})
              </button>
              <button
                onClick={() => setCatalogSubTab('taxonomies')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${catalogSubTab === 'taxonomies' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Categories Tree
              </button>
            </div>
          </div>

          <div className="mt-4">
            {catalogSubTab === 'products' && <ProductManager />}
            {catalogSubTab === 'services' && <ServiceManager />}
            {catalogSubTab === 'taxonomies' && <CategoryManager />}
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS & ESCROW */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">Fulfillment & Orders Center</h3>
              <p className="text-xs text-slate-500">Track and update order states from payment through Pi Escrow release.</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'Pending', 'Confirmed', 'Paid', 'Shipped', 'Delivered'].map(st => (
                <button
                  key={st}
                  onClick={() => setOrderFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    orderFilterStatus === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map(ord => (
                <div key={ord.id} className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white font-mono">#{ord.orderNumber || ord.id.slice(0, 8)}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold rounded-full uppercase">
                        {ord.status || 'Paid'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Buyer: {ord.buyerName || 'Pioneer User'} • Items: {ord.items?.length || 1}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-white font-mono">{ord.grandTotal || ord.totalAmount || 10} Pi</span>
                    <button 
                      onClick={() => navigate(`/order-details/${ord.id}`)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all"
                    >
                      View Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-slate-900/30 rounded-3xl border border-slate-800">
              <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No Orders Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Orders placed for your store products and services will appear here in real-time.</p>
              <button 
                onClick={() => navigate('/business-orders')} 
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                Go to Order Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CUSTOMER CRM */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">Customer Relationship Management (CRM)</h3>
              <p className="text-xs text-slate-500">Track repeating buyers, purchase velocity, and direct communications.</p>
            </div>
            <button 
              onClick={() => navigate('/customer-crm')} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all"
            >
              Open Full CRM Module
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unique Customers</span>
              <p className="text-2xl font-black text-white mt-1">148</p>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Repeat Rate</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">34.2%</p>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">VIP Pioneers</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">12</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: BUSINESS WALLET */}
      {activeTab === 'wallet' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">Pi Testnet Business Wallet</span>
                <Coins className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">1,420.50 Pi</span>
                <p className="text-xs text-slate-400 mt-1">Direct merchant wallet for marketplace order settlements.</p>
              </div>
              <button 
                onClick={() => navigate('/merchant-payments')} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg"
              >
                Open Merchant Wallet
              </button>
            </div>

            <div className="bg-gradient-to-br from-amber-900/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">BMP Rewards & Token Balance</span>
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">2,500 BMP</span>
                <p className="text-xs text-slate-400 mt-1">Merchant rewards accumulated from sales volume and active trading.</p>
              </div>
              <button 
                onClick={() => navigate('/customer-rewards')} 
                className="w-full py-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold rounded-2xl text-xs transition-all"
              >
                Manage BMP Rewards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: MARKETING & ADS */}
      {activeTab === 'marketing' && (
        <div className="animate-in fade-in duration-300">
          <MarketingCenter businessId={business.id} userId={user?.uid || ''} />
        </div>
      )}

      {/* TAB 9: VERIFICATION & AUDIT */}
      {activeTab === 'verification' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Regulatory Verification & Compliance Audit</h3>
              <p className="text-xs text-slate-500">Official identity verification for high-volume enterprise transactions.</p>
            </div>
            <button 
              onClick={() => setShowVerificationModal(true)} 
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isVerified ? 'View Submitted Docs' : 'Start Audit Process'}
            </button>
          </div>

          <div className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-start gap-4">
            <ShieldCheck className={`w-8 h-8 shrink-0 ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <h4 className="text-sm font-bold text-white">Current Audit Status: {isVerified ? 'Verified Enterprise' : 'Pending Documents'}</h4>
              <p className="text-xs text-slate-400 mt-1">
                {isVerified 
                  ? 'Your business has passed official regulatory checks and enjoys priority search ranking and verified merchant badge across the marketplace.'
                  : 'Submit tax registration, business certificates, and government identification to unlock verified enterprise status.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal Trigger */}
      <BusinessVerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
        businessId={business.id} 
        businessName={business.businessName} 
        userId={user?.uid || ''} 
        onVerifiedSubmitted={() => {
          setShowVerificationModal(false);
          loadData();
        }} 
      />
    </div>
  );
};

