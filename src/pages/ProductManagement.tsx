/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Download, 
  Upload, 
  MoreHorizontal,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  Store as StoreIcon,
  Briefcase,
  X,
  Layers,
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  Trash2,
  Settings,
  FolderTree,
  Activity,
  FileText,
  Percent,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { ProductCard } from '../components/product/ProductCard';
import { ProductWizard } from '../components/product/ProductWizard';
import { VariantWizard } from '../components/product/VariantWizard';
import { VariantList } from '../components/product/VariantList';
import { productService } from '../services/productService';
import { storeService } from '../services/storeService';
import { orderService } from '../services/orderService';
import { useAuth } from '../auth/useAuth';
import { Product, Store, Order, OrderStatus } from '../types';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

// Modular Tab components
import { StoreCategoriesTab } from '../components/store/StoreCategoriesTab';
import { StoreInventoryTab } from '../components/store/StoreInventoryTab';
import { StoreOrdersTab } from '../components/store/StoreOrdersTab';
import { StoreCustomersTab } from '../components/store/StoreCustomersTab';
import { StoreAnalyticsTab } from '../components/store/StoreAnalyticsTab';
import { StoreSettingsTab } from '../components/store/StoreSettingsTab';

export const ProductManagement: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'categories' | 'inventory' | 'orders' | 'crm' | 'analytics' | 'settings'>('overview');

  // Products Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  // Variant Management State
  const [isVariantWizardOpen, setIsVariantWizardOpen] = useState(false);
  const [isVariantListOpen, setIsVariantListOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Custom Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeData, productsData] = await Promise.all([
        storeService.getStore(storeId!),
        productService.getStoreProducts(storeId!)
      ]);
      
      if (!storeData) throw new Error('Store not found');
      
      // Verify ownership
      if (storeData.ownerUid !== user?.uid) {
        throw new Error('You do not have permission to manage this store');
      }
      
      setStore(storeData);
      setProducts(productsData);

      // Fetch related orders
      const orderList = await orderService.getBusinessOrders(storeData.businessId);
      // Filter for this store's orders specifically if saved, or fallback
      const storeOrders = orderList.filter(o => !o.storeId || o.storeId === storeId);
      setOrders(storeOrders);

    } catch (err: any) {
      console.error('ProductManagement error:', err);
      if (err?.message?.includes('index') || err?.message?.includes('FAILED_PRECONDITION')) {
        setError('Database is preparing your data.\nPlease try again in a few minutes.');
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is irreversible.')) return;
    
    try {
      await productService.softDeleteProduct(productId);
      setProducts(prev => prev.filter(p => p.productId !== productId));
      triggerToast('Product soft-deleted successfully.');
    } catch (err: any) {
      setError('Failed to delete product: ' + err.message);
    }
  };

  const handleDeleteStore = async () => {
    if (!window.confirm('CRITICAL: Are you absolutely sure you want to delete this Entire Store? This will delete all catalog layouts, custom settings, and is irreversible.')) return;
    try {
      await storeService.deleteStore(storeId!);
      triggerToast('Store profile permanently deleted.');
      navigate('/store-dashboard');
    } catch (err: any) {
      alert('Deletion error: ' + err.message);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const { productId, createdAt, updatedAt, ...rest } = product;
      const newSku = `${rest.sku}-COPY-${Math.floor(Math.random() * 1000)}`;
      const newSlug = `${rest.productSlug}-copy-${Math.floor(Math.random() * 1000)}`;
      
      await productService.createProduct({
        ...rest,
        productName: `${rest.productName} (Copy)`,
        productSlug: newSlug,
        sku: newSku,
        status: 'draft'
      });
      
      await loadData();
      triggerToast('Product duplicated as Draft copy.');
    } catch (err: any) {
      setError('Failed to duplicate product: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.orderStatus === OrderStatus.PENDING_PAYMENT).length;
  const completedOrdersCount = orders.filter(o => o.orderStatus === OrderStatus.COMPLETED).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">
        <Navbar 
          currentUser={user!}
          currentView="store-dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-900 rounded-lg animate-pulse border border-slate-800" />
                <div className="h-4 w-48 bg-slate-900 rounded-lg animate-pulse border border-slate-800" />
              </div>
            </div>
          </div>
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error || !store) {
    const isIndexError = error?.includes('preparing your data') || error?.includes('FAILED_PRECONDITION') || error?.includes('index');
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">
        <Navbar 
          currentUser={user!}
          currentView="store-dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-[#6366f1]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isIndexError ? 'Preparing Database' : 'Access Denied'}
          </h2>
          <p className="text-slate-400 mb-8 text-center max-w-md whitespace-pre-line">
            {isIndexError 
              ? 'Database is preparing your data.\nPlease try again in a few minutes.' 
              : error || 'Failed to load store profile'}
          </p>
          <button 
            onClick={() => navigate('/store-dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar 
        currentUser={user!}
        currentView="store-dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-[#030712] border-b border-slate-800/60 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/business-dashboard');
              }
            }}
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
            <button 
              onClick={() => navigate('/store-dashboard')} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              Store Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-indigo-400">{store?.storeName}</span>
          </div>
        </div>
      </div>

      {/* Store Banner Hero Section */}
      <div className="relative border-b border-slate-800/80 bg-slate-950 overflow-hidden">
        {/* Banner Image */}
        <div className="h-48 sm:h-64 w-full relative bg-slate-900 overflow-hidden">
          {store.coverImageUrl ? (
            <img 
              src={store.coverImageUrl} 
              className="w-full h-full object-cover opacity-40 blur-sm scale-105" 
              alt="Store Banner background"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-black/50" />
        </div>

        {/* Store Detail Metadata Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 pb-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
            
            {/* Logo and text metadata */}
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-xl shadow-black/40">
                {store.logoUrl ? (
                  <img src={store.logoUrl} className="max-w-full max-h-full object-contain" alt="Store logo" referrerPolicy="no-referrer" />
                ) : (
                  <StoreIcon className="w-10 h-10 text-indigo-400" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    {store.storeName}
                    {store.verified && (
                      <span className="p-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full" title="Verified Store Profile">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    )}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                    store.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {store.status || 'Active'}
                  </span>
                </div>

                <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-xl">{store.description}</p>
                
                {/* Details layout */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-1.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-600" /> {store.city || 'Chicago'}, {store.country || 'USA'}</span>
                  <span className="text-slate-800">•</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-600" /> Type: {store.storeType || 'Retail'}</span>
                  <span className="text-slate-800">•</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {store.rating || '4.9'} rating</span>
                  <span className="text-slate-800">•</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-500" /> {store.followers || '1.2k'} followers</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons & ID display */}
            <div className="flex flex-col items-stretch lg:items-end gap-3 w-full lg:w-auto border-t lg:border-t-0 border-slate-850 pt-4 lg:pt-0 shrink-0">
              <div className="text-left lg:text-right text-[10px] font-mono text-slate-500 space-y-0.5">
                <div>ID: <span className="text-slate-300">{store.storeId}</span></div>
                <div>Slug: <span className="text-indigo-400">/{store.storeSlug}</span></div>
                <div>Created: <span className="text-slate-400">{new Date(store.createdAt).toLocaleDateString()}</span></div>
              </div>

              <div className="flex gap-2.5">
                <button 
                  onClick={() => { setActiveTab('settings'); triggerToast('Loading settings tab...'); }}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#030712] border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold"
                >
                  <Settings className="w-4 h-4" />
                  <span>Customize</span>
                </button>
                
                <button 
                  onClick={handleDeleteStore}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                  title="Permanently Delete Store"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Left side dynamic Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-850/60 lg:pr-6 pr-0">
          {[
            { id: 'overview', label: 'Console Console', icon: StoreIcon },
            { id: 'catalog', label: 'Product Catalog', icon: Package },
            { id: 'categories', label: 'Categories Hub', icon: FolderTree },
            { id: 'inventory', label: 'Stock Logistics', icon: Layers },
            { id: 'orders', label: 'Orders ledger', icon: FileText },
            { id: 'crm', label: 'CRM Profiles', icon: Users },
            { id: 'analytics', label: 'Analytics reports', icon: Activity },
            { id: 'settings', label: 'Settings Hub', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left border whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Title */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <StoreIcon className="w-5 h-5 text-indigo-400" /> Store Console Dashboard
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time status, health, and analytical indicators of operations.</p>
                    </div>
                  </div>

                  {/* 10 KPI Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Listed Products', value: products.length, suffix: 'SKUs', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                      { label: 'Lifetime Orders', value: orders.length, suffix: 'Orders', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'Customer Profiles', value: '1.4k', suffix: 'Users', color: 'text-teal-400', bg: 'bg-teal-500/10' },
                      { label: 'Total Revenue', value: `${totalRevenue?.toLocaleString() || '18.4k'}`, suffix: 'Pi', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Aggregate Stock', value: totalStockCount, suffix: 'Units', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                      { label: 'Pending checkout', value: pendingOrdersCount, suffix: 'Orders', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'Completed checkout', value: completedOrdersCount, suffix: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Low Stock SKU', value: lowStockCount, suffix: 'Models', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                      { label: 'Disputes/Returns', value: '0.0%', suffix: 'Disputes', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                      { label: 'Operations Health', value: '99.9%', suffix: 'Excellent', color: 'text-teal-400', bg: 'bg-teal-500/10' },
                    ].map((card, idx) => (
                      <div key={idx} className="bg-[#090e1a]/95 border border-slate-800 p-4 rounded-xl flex flex-col justify-between h-28 hover:border-slate-700/80 transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-normal">{card.label}</span>
                        <div>
                          <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                          <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 block">{card.suffix}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Operational Guides */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="bg-[#090e1a]/90 border border-slate-800 p-6 rounded-2xl space-y-4">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fast Console Actions
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Instantly manage items, categorizations, and track ledger updates without page delays.</p>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={() => setActiveTab('catalog')} 
                          className="py-3 px-4 bg-[#030712] hover:bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-bold uppercase tracking-wider text-indigo-400 text-center transition-all"
                        >
                          View Catalog
                        </button>
                        <button 
                          onClick={() => setActiveTab('orders')} 
                          className="py-3 px-4 bg-[#030712] hover:bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-bold uppercase tracking-wider text-indigo-400 text-center transition-all"
                        >
                          View Orders
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#090e1a]/90 border border-slate-800 p-6 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white">Merchant Operational Guide</h4>
                        <p className="text-xs text-slate-400 mt-1">To test dynamic checkout flows, products should remain published with visibility toggled on. Keep inventory counts adjusted to prevent back-orders.</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pi Network Merchant Standard v1.2</span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: PRODUCT CATALOG */}
              {activeTab === 'catalog' && (
                <div className="space-y-6">
                  {/* Hero Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-slate-850">
                    <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-400" /> Catalog Management
                      </h1>
                      <p className="text-xs text-slate-400">Manage digital inventory, prices, status options, and generate SKU copies.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingProduct(undefined); setIsWizardOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all text-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Controls Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Search by name, SKU, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#090e1a] border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <div className="bg-[#090e1a] border border-slate-800 rounded-xl p-1 flex items-center">
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#030712] text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#030712] text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product List */}
                  {filteredProducts.length === 0 ? (
                    <EmptyState 
                      icon={Package}
                      title={searchQuery ? 'No matching products' : 'Inventory Catalog Empty'}
                      description={searchQuery ? 'We couldn\'t find any products matching your current filters. Try adjusting your search query.' : 'Start building your digital inventory by adding your first product to this store.'}
                      actionLabel={!searchQuery ? 'Add First Product' : undefined}
                      onAction={!searchQuery ? () => setIsWizardOpen(true) : undefined}
                    />
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                      {filteredProducts.map(product => (
                        <ProductCard 
                          key={product.productId}
                          product={product}
                          viewMode={viewMode}
                          onEdit={(p) => { setEditingProduct(p); setIsWizardOpen(true); }}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          onView={(p) => navigate(`/product/${p.productId}`)}
                          onManageVariants={(p) => {
                            setSelectedProduct(p);
                            setIsVariantListOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CATEGORIES */}
              {activeTab === 'categories' && (
                <StoreCategoriesTab storeId={storeId!} onToast={triggerToast} />
              )}

              {/* TAB 4: STOCK LOGISTICS */}
              {activeTab === 'inventory' && (
                <StoreInventoryTab 
                  storeId={storeId!} 
                  products={products} 
                  onRefreshProducts={loadData} 
                  onToast={triggerToast} 
                />
              )}

              {/* TAB 5: ORDERS LEDGER */}
              {activeTab === 'orders' && (
                <StoreOrdersTab storeId={storeId!} businessId={store.businessId} onToast={triggerToast} />
              )}

              {/* TAB 6: CRM PROFILES */}
              {activeTab === 'crm' && (
                <StoreCustomersTab businessId={store.businessId} />
              )}

              {/* TAB 7: ANALYTICS */}
              {activeTab === 'analytics' && (
                <StoreAnalyticsTab products={products} orders={orders} />
              )}

              {/* TAB 8: SETTINGS */}
              {activeTab === 'settings' && (
                <StoreSettingsTab 
                  store={store} 
                  onRefreshStore={loadData} 
                  onToast={triggerToast} 
                />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Floating toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[150] bg-indigo-600 border border-indigo-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Check className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant List Modal */}
      <AnimatePresence>
        {isVariantListOpen && selectedProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090e1a] border border-slate-800 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-650/20 rounded-xl">
                    <Layers className="w-5 h-5 text-indigo-450" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1">Product Variants</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedProduct.productName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVariantListOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <VariantList 
                  product={selectedProduct} 
                  onUpdate={loadData} 
                />
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-slate-800">
                <button 
                  onClick={() => {
                    setIsVariantListOpen(false);
                    setIsVariantWizardOpen(true);
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  Generate New Variants
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Variant Wizard */}
      {isVariantWizardOpen && selectedProduct && (
        <VariantWizard 
          isOpen={isVariantWizardOpen}
          onClose={() => setIsVariantWizardOpen(false)}
          onSuccess={() => {
            setIsVariantWizardOpen(false);
            loadData();
          }}
          product={selectedProduct}
        />
      )}

      {/* Product Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <ProductWizard 
            storeId={storeId!}
            businessId={store.businessId}
            ownerUid={user!.uid}
            initialProduct={editingProduct}
            onClose={() => setIsWizardOpen(false)}
            onComplete={(id) => {
              setIsWizardOpen(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
