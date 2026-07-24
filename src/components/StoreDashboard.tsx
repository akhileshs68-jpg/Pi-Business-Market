import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { storeService } from '../services/storeService';
import { businessService } from '../services/businessService';
import { Store, Business } from '../types';
import { StoreWizard } from '../components/store/StoreWizard';
import { StoreCard } from '../components/store/StoreCard';
import { ReviewManagement } from '../components/ReviewManagement';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ShoppingBag, 
  Search, 
  Building2,
  Store as StoreIcon,
  Filter,
  BarChart3,
  Users,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StoreDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [filterBusiness, setFilterBusiness] = useState<string>('all');
  const [activeView, setActiveView] = useState<'stores' | 'reviews'>('stores');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [storeData, businessData] = await Promise.all([
        storeService.getOwnedStores(user.uid),
        businessService.getMyBusinesses(user.uid)
      ]);
      setStores(storeData);
      setBusinesses(businessData);
    } catch (err: any) {
      console.error('Failed to fetch store dashboard data:', err);
      if (err?.message?.includes('index') || err?.message?.includes('FAILED_PRECONDITION')) {
        setError('Database is preparing your data.\nPlease try again in a few minutes.');
      } else {
        setError('An unexpected error occurred while loading your stores. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Archive this store? This will soft-delete the store identity.')) {
      try {
        await storeService.deleteStore(id);
        fetchData();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleArchive = async (store: Store) => {
    try {
      const newStatus = store.status === 'archived' ? 'active' : 'archived';
      await storeService.updateStore(store.storeId, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Archive failed:', error);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/business-dashboard');
    }
  };

  const filteredStores = filterBusiness === 'all' 
    ? stores 
    : stores.filter(s => s.businessId === filterBusiness);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all bg-slate-900 hover:bg-slate-850 border border-slate-800 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <button 
                onClick={() => navigate('/business-dashboard')} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Business
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-indigo-400">Store Dashboard</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Retail Engine</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Store Management</h1>
          </div>
          
          <button 
            onClick={() => setShowWizard(true)}
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl md:rounded-2xl bg-indigo-600 text-white font-bold transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 w-full md:w-auto"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Open New Store
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 mb-8">
          <div className="flex bg-slate-900 p-1 rounded-xl sm:rounded-2xl border border-slate-800 self-start w-full sm:w-auto">
            <button
              onClick={() => setActiveView('stores')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === 'stores' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <StoreIcon size={14} /> My Stores
            </button>
            <button
              onClick={() => setActiveView('reviews')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === 'reviews' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <MessageSquare size={14} /> Reputation
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button 
              onClick={() => setFilterBusiness('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-widest border ${
                filterBusiness === 'all' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              All Stores
            </button>
            {businesses.map(biz => (
              <button
                key={biz.id}
                onClick={() => setFilterBusiness(biz.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-widest border ${
                  filterBusiness === biz.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {biz.businessName}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Find a store..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {[
            { label: 'Active Stores', value: stores.filter(s => s.status === 'active').length, icon: StoreIcon, color: 'text-emerald-400' },
            { label: 'Business Units', value: businesses.length, icon: Building2, color: 'text-violet-400' },
            { label: 'Total Fans', value: stores.reduce((acc, s) => acc + s.followers, 0), icon: Users, color: 'text-indigo-400' },
            { label: 'Avg Rating', value: (stores.reduce((acc, s) => acc + s.rating, 0) / (stores.length || 1)).toFixed(1), icon: BarChart3, color: 'text-amber-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        {error ? (
          <div className="py-24 text-center bg-slate-900/30 rounded-3xl border border-rose-500/20 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Preparing Database</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-8 whitespace-pre-line">
              {error}
            </p>
            <button 
              onClick={fetchData}
              className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all"
            >
              Retry
            </button>
          </div>
        ) : activeView === 'reviews' ? (
          <ReviewManagement businessId={filterBusiness === 'all' ? businesses[0]?.id : filterBusiness} />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-72 bg-slate-900/50 rounded-3xl border border-slate-800 animate-pulse" />)}
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStores.map(store => (
                <motion.div
                  key={store.storeId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <StoreCard 
                    store={store}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-24 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto mb-6">
              <StoreIcon className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">You don't have any stores yet.</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              Launch your first store under an existing business profile to start managing products, inventory, orders, and customer relationships.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setShowWizard(true)}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
              >
                Create Store
              </button>
              <button 
                onClick={() => navigate('/business-dashboard')}
                className="px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:bg-slate-800 transition-all"
              >
                Return to Business
              </button>
              <button 
                onClick={() => navigate('/docs')}
                className="px-8 py-3.5 rounded-2xl bg-transparent border border-slate-800 text-slate-400 font-bold hover:bg-slate-900 hover:text-white transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Wizard */}
      {showWizard && (
        <StoreWizard 
          onComplete={(newStoreId) => {
            setShowWizard(false);
            fetchData();
            if (newStoreId) {
              navigate(`/store/${newStoreId}/products`);
            }
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
};
