import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { businessService } from '../services/businessService';
import { BusinessProfile } from '../types';
import { BusinessWizard } from '../components/business/BusinessWizard';
import { BusinessCard } from '../components/business/BusinessCard';
import { 
  Building2, 
  Plus, 
  LayoutDashboard, 
  Search, 
  Briefcase,
  Store,
  ShieldCheck,
  Zap,
  ShoppingBag,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'owned' | 'collaborations'>('owned');

  const fetchBusinesses = async () => {
    if (!user) return;
    try {
      const data = await businessService.getOwnedBusinesses(user.uid);
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

  const handleEdit = (business: BusinessProfile) => {
    console.log('Edit business:', business);
    // Future implementation
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this business profile?')) {
      try {
        await businessService.deleteBusiness(id);
        fetchBusinesses();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleToggleStatus = async (business: BusinessProfile) => {
    try {
      const newStatus = business.status === 'active' ? 'inactive' : 'active';
      await businessService.updateBusiness(business.businessId, { status: newStatus });
      fetchBusinesses();
    } catch (error) {
      console.error('Status toggle failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Navigation Rail */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20">
                <Briefcase className="w-5 h-5 text-violet-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Enterprise Engine</p>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Business Identities</h1>
          </div>
          
          <button 
            onClick={() => setShowWizard(true)}
            className="group flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold transition-all hover:scale-105 shadow-xl shadow-violet-600/20"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Create New Identity
          </button>
        </div>

        {/* Quick Access to Stores & Inbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-indigo-600 rounded-3xl p-8 flex flex-col items-start justify-between gap-6 shadow-2xl shadow-indigo-600/20">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Retail & Store Management</h2>
              <p className="text-indigo-100/80 font-medium">Manage individual outlets, physical stores, and online shops for your businesses.</p>
            </div>
            <a 
              href="/store-dashboard"
              className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <ShoppingBag className="w-5 h-5" />
              Manage Stores
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-start justify-between gap-6 shadow-xl">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Communications</h2>
              <p className="text-slate-400 font-medium">Respond to customer inquiries, order messages, and manage notifications.</p>
            </div>
            <a 
              href="/inbox"
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <MessageSquare className="w-5 h-5" />
              Open Business Inbox
            </a>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl col-span-full">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Business Intelligence & Analytics</h2>
              <p className="text-slate-400 font-medium max-w-xl">Monitor real-time sales trends, inventory health, and customer growth across all your business identities.</p>
            </div>
            <button 
              onClick={() => navigate('/merchant/analytics')}
              className="px-8 py-4 rounded-2xl bg-white text-indigo-950 font-bold hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <BarChart3 className="w-5 h-5" />
              View Dashboard
            </button>
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('owned')}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === 'owned' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              My Businesses
              {activeTab === 'owned' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('collaborations')}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === 'collaborations' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Managed by Me
              {activeTab === 'collaborations' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
              )}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search your identities..." 
                className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-violet-500 outline-none w-64"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-900/50 rounded-3xl border border-slate-800" />
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {businesses.map(business => (
                <motion.div
                  key={business.businessId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <BusinessCard 
                    business={business}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggleStatus}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
              <Store className="w-12 h-12 text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Business Profiles Found</h2>
            <p className="text-slate-500 max-w-sm mb-8">
              Start by creating your first business identity to manage your stores, products, and services on the Pi Network.
            </p>
            <button 
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all"
            >
              <Zap className="w-5 h-5" />
              Launch Your Business
            </button>
          </div>
        )}

        {/* Stats Summary */}
        {businesses.length > 0 && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 border border-slate-800/50 p-8 rounded-3xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4 text-violet-400">
                <ShieldCheck className="w-6 h-6" />
                <h4 className="font-bold">Verified Businesses</h4>
              </div>
              <p className="text-3xl font-extrabold text-white mb-1">
                {businesses.filter(b => b.verified).length}
              </p>
              <p className="text-sm text-slate-500">Official Pi verified identities</p>
            </div>
            {/* Additional stats... */}
          </div>
        )}
      </div>

      {/* Wizard Modal */}
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
