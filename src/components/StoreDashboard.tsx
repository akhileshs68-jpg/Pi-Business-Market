/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Layers,
  ShoppingBag,
  Star,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Truck,
  Sparkles,
  Megaphone,
  CheckCircle,
  Eye,
  Percent,
  X,
  PlusCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Share2,
  Lock,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Store, Product, Order, Review, OrderStatus, ProductCategory, ProductAttribute } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface StoreDashboardProps {
  store: Store;
  onNavigate: (view: string, params?: any) => void;
  onRefreshUser: () => void;
}

export default function StoreDashboard({
  store,
  onNavigate,
  onRefreshUser
}: StoreDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'reviews' | 'marketing'>('analytics');
  
  // Data lists
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Modals & form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(1.0);
  const [prodCategory, setProdCategory] = useState<ProductCategory>('electronics');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodTags, setProdTags] = useState('');
  const [prodIsDigital, setProdIsDigital] = useState(false);
  const [prodDownloadUrl, setProdDownloadUrl] = useState('');
  
  // Custom Attribute States
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrOptions, setNewAttrOptions] = useState('');

  // Ad campaign states
  const [selectedAdProduct, setSelectedAdProduct] = useState<string>('');
  const [adBudget, setAdBudget] = useState<number>(10);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adSuccessMsg, setAdSuccessMsg] = useState('');

  // Review reply state
  const [activeReviewId, setActiveReviewId] = useState<string>('');
  const [reviewReplyText, setReviewReplyText] = useState('');

  // AI assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestedDesc, setAiSuggestedDesc] = useState('');

  useEffect(() => {
    refreshData();
  }, [store.id]);

  const refreshData = () => {
    setProducts(PiBusinessMarketDB.getProductsByStore(store.id));
    setOrders(PiBusinessMarketDB.getOrdersByStore(store.id));
    setReviews(PiBusinessMarketDB.getReviewsByStore(store.id));
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdPrice(5.0);
    setProdCategory('electronics');
    setProdDescription('');
    setProdImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80');
    setProdStock(15);
    setProdTags('gadget, premium');
    setProdIsDigital(false);
    setProdDownloadUrl('');
    setAttributes([]);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdTitle(p.title);
    setProdPrice(p.pricePi);
    setProdCategory(p.category);
    setProdDescription(p.description);
    setProdImage(p.imageUrls[0] || '');
    setProdStock(p.stock);
    setProdTags(p.tags.join(', '));
    setProdIsDigital(p.isDigital);
    setProdDownloadUrl(p.downloadUrl || '');
    setAttributes(p.attributes || []);
    setIsProductModalOpen(true);
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !newAttrOptions.trim()) return;
    const opts = newAttrOptions.split(',').map(o => o.trim()).filter(Boolean);
    setAttributes(prev => [...prev, { name: newAttrName, options: opts }]);
    setNewAttrName('');
    setNewAttrOptions('');
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodDescription.trim() || prodPrice <= 0) return;

    const parsedTags = prodTags.split(',').map(t => t.trim()).filter(Boolean);
    const pData = {
      storeId: store.id,
      storeName: store.name,
      title: prodTitle,
      description: prodDescription,
      pricePi: prodPrice,
      category: prodCategory,
      imageUrls: [prodImage],
      stock: prodIsDigital ? 99999 : prodStock,
      tags: parsedTags,
      attributes: attributes,
      isDigital: prodIsDigital,
      downloadUrl: prodIsDigital ? (prodDownloadUrl || 'https://example.com/downloads/file') : undefined,
      status: 'active' as const
    };

    if (editingProduct) {
      PiBusinessMarketDB.updateProduct(editingProduct.id, pData);
    } else {
      PiBusinessMarketDB.createProduct(pData);
    }

    setIsProductModalOpen(false);
    refreshData();
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      PiBusinessMarketDB.deleteProduct(id);
      refreshData();
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    PiBusinessMarketDB.updateOrderStatus(orderId, status);
    refreshData();
  };

  const handleSendReviewReply = (reviewId: string) => {
    if (!reviewReplyText.trim()) return;
    PiBusinessMarketDB.replyToReview(reviewId, reviewReplyText);
    setActiveReviewId('');
    setReviewReplyText('');
    refreshData();
  };

  // AD booster campaign launch
  const handleBoostCampaign = () => {
    if (!selectedAdProduct) return;
    setIsAdLoading(true);
    setAdSuccessMsg('');

    setTimeout(() => {
      // Toggle boosted status
      PiBusinessMarketDB.updateProduct(selectedAdProduct, { boostedWithAds: true });
      
      // Deduct balance simulated
      const currentBal = parseFloat(localStorage.getItem('pi_biz_mkt_wallet_balance') || '350.00');
      localStorage.setItem('pi_biz_mkt_wallet_balance', Math.max(0, currentBal - adBudget).toFixed(2));
      
      setIsAdLoading(false);
      setAdSuccessMsg(`Success! Campaign launched. Product is now pushed to the top of discovery feeds. Budget: ${adBudget} Pi`);
      refreshData();
      
      // Clear message after 4s
      setTimeout(() => setAdSuccessMsg(''), 4000);
    }, 1500);
  };

  // AI description generator
  const handleAiOptimize = () => {
    if (!prodTitle.trim()) {
      alert('Please fill in the Product Title first so our AI knows what to optimize!');
      return;
    }
    setAiLoading(true);
    setAiSuggestedDesc('');

    // Simulated beautiful copywriting model representing server-side prompt output
    setTimeout(() => {
      const enhanced = `⚡ PREMIUM SPECIFICATION SHEET ⚡\n\nTake your digital workspace to the next level with the high-performance ${prodTitle}. Engineered exclusively for demanding pioneers and tech enthusiasts who value efficiency, speed, and premium craftsmanship.\n\n✨ CORE ADVANTAGES:\n• Pro-Grade Componentry: Crafted from military-grade sustainable chassis for ultimate durability.\n• Smart Ergonomics: Optimized tactile angles to reduce operator strain during node maintenance.\n• Seamless Decentralized Ecosystem: Native formatting configured to mesh with modern developer environments.\n\n💼 SHIPPING & SERVICE CONTRACTS:\nShips internationally via secure express courier within 24 hours of Pi Network blockchain receipt confirmation. 100% customer satisfaction guaranteed.`;
      setAiSuggestedDesc(enhanced);
      setAiLoading(false);
    }, 1500);
  };

  const applyAiSuggested = () => {
    setProdDescription(aiSuggestedDesc);
    setAiSuggestedDesc('');
  };

  // Sandbox injection helper (for user testing)
  const handleInjectSandboxOrder = () => {
    if (products.length === 0) {
      alert('Please add at least one active product first before injecting sandbox orders.');
      return;
    }
    const randomProduct = products[0];
    PiBusinessMarketDB.createOrder({
      storeId: store.id,
      storeName: store.name,
      buyerUid: 'user_buyer_sandbox_test',
      buyerUsername: 'pi_testnet_buyer_99',
      items: [
        {
          productId: randomProduct.id,
          title: randomProduct.title,
          pricePi: randomProduct.pricePi,
          quantity: 1,
          imageUrl: randomProduct.imageUrls[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&h=150&q=80',
          selectedAttributes: {}
        }
      ],
      totalPi: randomProduct.pricePi,
      status: OrderStatus.PREPARING,
      shippingAddress: {
        fullName: 'Sandbox Tester',
        streetAddress: '742 Web3 Avenue',
        city: 'Blockchain City',
        state: 'Ledger State',
        postalCode: '10101',
        country: 'Consensus Planet',
        phoneNumber: '+1 (555) 909-2026'
      },
      blockchainTxId: `tx_sandbox_test_${Math.random().toString(36).substring(2, 12)}`,
      isDigital: randomProduct.isDigital
    });
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* MERCHANT HEADER PROFILE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 select-none relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-40 h-40 rounded-full bg-violet-650/10 blur-3xl"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex-shrink-0">
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-xl text-slate-100 tracking-tight leading-none">{store.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Active Partner
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1.5 line-clamp-1 max-w-lg">{store.description}</p>
              <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)} ({store.reviewCount} reviews)
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-violet-400">Route: pibiz.mkt/{store.slug}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('store_page', { storeId: store.id })}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              View Frontend
            </button>
            <button
              onClick={handleInjectSandboxOrder}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Inject a test order into this dashboard"
            >
              <Plus className="w-4 h-4" />
              Test Order Sandbox
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD TAB NAVIGATION BAR */}
      <div className="flex border-b border-slate-800/80 mb-6 overflow-x-auto gap-4 select-none">
        {[
          { key: 'analytics', label: 'Overview Analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'products', label: 'Manage Inventory', icon: <Layers className="w-4 h-4" /> },
          { key: 'orders', label: 'Fulfillment Desk', icon: <ShoppingBag className="w-4 h-4" /> },
          { key: 'reviews', label: 'Customer Reviews', icon: <Star className="w-4 h-4" /> },
          { key: 'marketing', label: 'Marketing & AI', icon: <Sparkles className="w-4 h-4 text-violet-400" /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 py-3 px-1.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==============================================
          TAB 1: DETAILED WEB3 ANALYTICS
          ============================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* STATS HIGHLIGHT GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Merchant Sales Gross</span>
              <p className="text-2xl font-mono font-bold text-slate-100 mt-2 flex items-baseline gap-1">
                {store.analytics.totalRevenuePi.toFixed(2)} <span className="text-violet-400 font-bold text-lg">π</span>
              </p>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md mt-2 inline-block border border-emerald-500/15">
                +18.4% this week
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Traffic Impressions</span>
              <p className="text-2xl font-mono font-bold text-slate-100 mt-2">
                {store.analytics.views.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md mt-2 inline-block border border-emerald-500/15">
                +4.2% daily view avg
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Orders Processed</span>
              <p className="text-2xl font-mono font-bold text-slate-100 mt-2">
                {orders.length}
              </p>
              <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-md mt-2 inline-block border border-violet-500/15">
                {orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED).length} Completed
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Est. Checkout Conversion</span>
              <p className="text-2xl font-mono font-bold text-slate-100 mt-2">
                {store.analytics.conversionRate}%
              </p>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-md mt-2 inline-block border border-slate-700/60">
                Global average: 2.1%
              </span>
            </div>
          </div>

          {/* CUSTOM SVG FINANCES CHART */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Weekly Revenue Stream Performance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time node recording transaction volumes in Pi coins.</p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-1 bg-slate-950 text-slate-400 rounded-lg border border-slate-850">
                Consensus Sandbox Nodes Live
              </span>
            </div>

            <div className="h-64 w-full relative">
              {/* Custom SVG Line Chart */}
              <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="30" x2="680" y2="30" stroke="#1E293B" strokeWidth="1" />
                <line x1="40" y1="80" x2="680" y2="80" stroke="#1E293B" strokeWidth="1" />
                <line x1="40" y1="130" x2="680" y2="130" stroke="#1E293B" strokeWidth="1" />
                <line x1="40" y1="180" x2="680" y2="180" stroke="#1E293B" strokeWidth="1" />

                {/* Chart path area */}
                <path
                  d="M 40,180 L 140,150 L 240,120 L 340,160 L 440,90 L 540,60 L 640,40 L 640,180 Z"
                  fill="url(#chartGrad)"
                />

                {/* Chart Line */}
                <path
                  d="M 40,180 L 140,150 L 240,120 L 340,160 L 440,90 L 540,60 L 640,40"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Point nodes */}
                <circle cx="140" cy="150" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
                <circle cx="240" cy="120" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
                <circle cx="340" cy="160" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
                <circle cx="440" cy="90" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
                <circle cx="540" cy="60" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
                <circle cx="640" cy="40" r="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
              </svg>

              {/* Chart labels overlay */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-10 text-[10px] font-mono text-slate-500 select-none">
                <span>Jul 12</span>
                <span>Jul 13</span>
                <span>Jul 14</span>
                <span>Jul 15</span>
                <span>Jul 16</span>
                <span>Jul 17</span>
                <span>Jul 18 (Today)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          TAB 2: INVENTORY & CATALOG CONTROL
          ============================================== */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between select-none">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Product Inventory Catalog</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control pricing, stock parameters, attributes, and tags.</p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="flex items-center gap-1 py-2 px-4 bg-violet-600 text-white hover:bg-violet-500 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-12 text-center text-slate-550 select-none">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-300">Your Catalog is Empty</h4>
              <p className="text-xs max-w-xs mx-auto mt-1 text-slate-500">Publish your first service or tangible product for Pi to attract global checkout flows.</p>
              <button
                onClick={handleOpenAddProduct}
                className="mt-4 py-1.5 px-3.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Create Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-md flex flex-col group hover:border-violet-500/35 transition-all">
                  <div className="h-44 bg-slate-950 relative overflow-hidden">
                    <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform opacity-95" />
                    <div className="absolute left-3 top-3 px-2 py-0.5 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 shadow-sm">
                      {p.pricePi} <span className="text-violet-400 font-bold">π</span>
                    </div>
                    {p.isDigital && (
                      <div className="absolute right-3 top-3 px-2 py-0.5 bg-indigo-500/80 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        Digital
                      </div>
                    )}
                    {p.boostedWithAds && (
                      <div className="absolute left-3 bottom-3 px-2 py-0.5 bg-amber-500 text-slate-950 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Megaphone className="w-3 h-3" />
                        Boosted
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1">{p.title}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {p.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-950 text-slate-500 rounded-md font-mono border border-slate-850">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-800/60 pt-4 mt-4 flex items-center justify-between text-slate-500 text-[11px] select-none">
                      <span className="font-semibold text-slate-500">Stock: {p.isDigital ? '∞' : `${p.stock} units`}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg border border-red-950/40 bg-red-950/10 hover:bg-red-900/20 text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==============================================
          TAB 3: CUSTOMER ORDERS & LOGISTICS FULFILLMENT
          ============================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Logistics Fulfillment Center</h3>
            <p className="text-xs text-slate-500 mt-0.5">Approve, prepare, and update tracking signatures for client orders.</p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-12 text-center text-slate-550 select-none">
              <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-300">No Orders Placed Yet</h4>
              <p className="text-xs max-w-xs mx-auto mt-1 text-slate-500">When customers purchase items using their Pi Browser wallets, orders will surface here instantly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 select-none">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">{o.id}</span>
                        <span className="text-[10px] font-medium text-slate-500">{new Date(o.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Buyer: <span className="font-bold text-violet-400">@{o.buyerUsername}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-100">
                        Total: {o.totalPi.toFixed(2)} <span className="text-violet-400 font-bold">π</span>
                      </span>
                      
                      {/* STATUS CHIPS */}
                      {o.status === OrderStatus.PREPARING && (
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase rounded-md">
                          Preparing
                        </span>
                      )}
                      {o.status === OrderStatus.SHIPPED && (
                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase rounded-md">
                          Shipped
                        </span>
                      )}
                      {o.status === OrderStatus.COMPLETED && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-md">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ORDERED ITEMS LIST */}
                  <div className="py-4 space-y-3.5">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200 block leading-tight">{item.title}</span>
                            {Object.entries(item.selectedAttributes).map(([k, v]) => (
                              <span key={k} className="text-[10px] text-slate-500 mt-1 mr-2 font-medium">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-450">
                          Qty: {item.quantity} × {item.pricePi} π
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* LOGISTICS DETAILS & ACTIONS */}
                  <div className="border-t border-slate-800/60 pt-4 flex flex-col md:flex-row justify-between gap-4">
                    {o.shippingAddress ? (
                      <div className="text-left text-[11px] text-slate-400 max-w-sm">
                        <span className="font-bold text-slate-500 block mb-1">Shipping Logistics Destination:</span>
                        <p className="font-bold text-slate-300">{o.shippingAddress.fullName}</p>
                        <p className="text-slate-400">{o.shippingAddress.streetAddress}, {o.shippingAddress.city}, {o.shippingAddress.state}, {o.shippingAddress.postalCode}, {o.shippingAddress.country}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">Tel: {o.shippingAddress.phoneNumber}</p>
                      </div>
                    ) : (
                      <div className="text-left text-[11px] text-emerald-400 bg-emerald-950/20 p-2.5 border border-emerald-900/30 rounded-xl">
                        <span className="font-bold block text-emerald-300">Instant Digital Delivery</span>
                        The buyer purchased online access credentials or files. Transacted instantly.
                      </div>
                    )}

                    {/* FULFILLMENT TRIGGERS */}
                    <div className="flex items-center gap-2 md:self-end">
                      {o.status === OrderStatus.PREPARING && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.SHIPPED)}
                          className="flex items-center gap-1 py-1.5 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Mark Shipped & Provide Tracking
                        </button>
                      )}
                      {o.status === OrderStatus.SHIPPED && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.COMPLETED)}
                          className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete Fulfillments
                        </button>
                      )}
                      {o.blockchainTxId && (
                        <span className="text-[10px] font-mono text-slate-550 self-center">
                          Tx Hash: {o.blockchainTxId.substring(0, 14)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==============================================
          TAB 4: FEEDBACK & REVIEWS MANAGEMENT
          ============================================== */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Customer Experience Desk</h3>
            <p className="text-xs text-slate-500 mt-0.5">Read customer scores and reply directly to construct robust consensus reputation scores.</p>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-12 text-center text-slate-550 select-none">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-300">No Review Records Found</h4>
              <p className="text-xs max-w-xs mx-auto mt-1 text-slate-500 font-medium">Customer reviews are critical for merchant rankings inside the Pi Browser Marketplace.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">@{r.buyerUsername}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3.5 h-3.5 ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">Reviewed: "{r.productTitle}"</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-3.5 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-medium">
                    "{r.comment}"
                  </p>

                  {/* MERCHANT REPLY LOGIC */}
                  {r.merchantResponse ? (
                    <div className="mt-4 bg-violet-500/10 border border-violet-500/20 rounded-xl p-3.5 ml-4 text-xs">
                      <span className="font-bold text-violet-400 block mb-1">Your response:</span>
                      <p className="text-slate-300 italic">"{r.merchantResponse}"</p>
                    </div>
                  ) : (
                    <div className="mt-4 ml-4">
                      {activeReviewId === r.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={reviewReplyText}
                            onChange={(e) => setReviewReplyText(e.target.value)}
                            rows={2}
                            className="w-full text-xs border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                            placeholder="Write a friendly, professional response back to this client..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveReviewId('')}
                              className="px-3 py-1.5 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSendReviewReply(r.id)}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold"
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveReviewId(r.id);
                            setReviewReplyText('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Reply to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==============================================
          TAB 5: MARKETING & AI SUITE (ADS BOOSTER + MOCK AI)
          ============================================== */}
      {activeTab === 'marketing' && (
        <div className="space-y-8 animate-fade-in text-left">
          
          {/* MOCK AI SPEC WRITE-UP ASSISTANT */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md select-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-400">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">AI Content Optimization Suite</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Let AI refine listings to boost organic click-throughs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-3">AI Copy Sandbox</span>
                <p className="text-xs text-slate-400 mb-4">Select or write any product profile, and let our AI expand it into a beautiful spec sheet with marketing hooks.</p>
                
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Product Title</label>
                    <input
                      type="text"
                      value={prodTitle}
                      onChange={(e) => setProdTitle(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-900 text-slate-250"
                      placeholder="e.g. Hand-roasted Sidamo Beans"
                    />
                  </div>
                  <button
                    onClick={handleAiOptimize}
                    disabled={aiLoading}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-650 disabled:from-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {aiLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Optimizing Copywriting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        Generate AI Copy Description
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-violet-950/40 text-slate-100 rounded-2xl p-4 border border-violet-900/60 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-28 h-28 rounded-full bg-violet-600/10 blur-xl"></div>
                <div>
                  <span className="text-[11px] text-violet-300 font-bold uppercase tracking-wider block mb-3">AI Copy Output</span>
                  {aiSuggestedDesc ? (
                    <div className="bg-slate-950/80 rounded-lg p-3 font-mono text-[10px] text-slate-350 max-h-36 overflow-y-auto leading-relaxed select-text border border-slate-850 whitespace-pre-line">
                      {aiSuggestedDesc}
                    </div>
                  ) : (
                    <p className="text-xs text-violet-300/50 italic py-6 text-center">AI suggested specs will be generated here.</p>
                  )}
                </div>

                {aiSuggestedDesc && (
                  <button
                    onClick={applyAiSuggested}
                    className="mt-4 w-full py-2 bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold rounded-lg transition-all"
                  >
                    Apply Enhanced Description to Active Form
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AD CAMPAIGN SPONSOR BLOCK */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md select-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                <Megaphone className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Ads Campaign Booster</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Sponsor listings with Pi coins to rank #1 in the main discover feeds.</p>
              </div>
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Please add products to your catalog to unlock sponsored advertising.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Select Product to Boost</label>
                    <select
                      value={selectedAdProduct}
                      onChange={(e) => setSelectedAdProduct(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl p-2.5 bg-slate-950 text-slate-200 focus:outline-none font-semibold"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.pricePi} π)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5">Sponsor Budget (Paid in Sandbox Pi)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 25, 50].map((b) => (
                        <button
                          key={b}
                          onClick={() => setAdBudget(b)}
                          className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                            adBudget === b
                              ? 'bg-amber-500 text-slate-950 border-amber-550 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {b} π
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleBoostCampaign}
                    disabled={isAdLoading || !selectedAdProduct}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-450 disabled:bg-slate-850 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {isAdLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        Processing Node Fees...
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-4 h-4" />
                        Boost Product Now
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 flex flex-col justify-between h-full min-h-48 text-xs text-amber-200">
                  <div>
                    <span className="font-bold text-amber-400 block mb-1">Campaign Privileges:</span>
                    <ul className="space-y-1.5 list-disc pl-4 mt-2">
                      <li>Permanent **Sponsor Flag** on product feed grids.</li>
                      <li>Prioritized high-ranking visibility above standard catalogs.</li>
                      <li>Simulated impressions tracking index logs.</li>
                      <li>Direct integration with sandbox analytics.</li>
                    </ul>
                  </div>

                  {adSuccessMsg && (
                    <div className="mt-4 p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl font-semibold animate-fade-in">
                      {adSuccessMsg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==============================================
          MODULAR MODAL: ADD / EDIT PRODUCT
          ============================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in text-left">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10 select-none">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-450 animate-pulse" />
                {editingProduct ? 'Edit Catalog Product' : 'Publish New Product'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    placeholder="e.g. CyberLite-88 Mech Keyboard"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Price in Pi Coins *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    placeholder="e.g. 145"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Short Visual Image URL</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Inventory Stock Units *</label>
                  <input
                    type="number"
                    required
                    disabled={prodIsDigital}
                    value={prodIsDigital ? 99999 : prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-250 disabled:text-slate-500 disabled:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Product Catalog Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full text-xs border border-slate-800 rounded-lg p-2.5 bg-slate-950 focus:outline-none text-slate-300 font-semibold"
                  >
                    <option value="electronics">Electronics & Tech</option>
                    <option value="fashion">Fashion & Clothes</option>
                    <option value="food_delivery">Food, Coffee & Delivery</option>
                    <option value="digital_services">Digital Assets & eBooks</option>
                    <option value="home_living">Home & Living</option>
                    <option value="health_beauty">Health & Beauty</option>
                    <option value="books_education">Books & Education</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>

              {/* TOGGLE DIGITAL PRODUCT */}
              <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-250 block">Is this a Virtual/Digital Asset?</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">eBooks, access licenses, software codes. Deliver instantly.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prodIsDigital}
                  onChange={(e) => {
                    const chk = e.target.checked;
                    setProdIsDigital(chk);
                    if (chk) {
                      setProdStock(99999);
                    }
                  }}
                  className="w-4 h-4 text-violet-500 focus:ring-violet-500 rounded border-slate-800 bg-slate-900"
                />
              </div>

              {prodIsDigital && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Instant File Download URL</label>
                  <input
                    type="text"
                    required
                    value={prodDownloadUrl}
                    onChange={(e) => setProdDownloadUrl(e.target.value)}
                    className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    placeholder="https://example.com/file.zip"
                  />
                </div>
              )}

              {/* ATTRIBUTE DESK */}
              <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/40">
                <span className="text-[11px] font-bold text-slate-300 block mb-2">Configure Variations (Sizes, Colors, Switches)</span>
                
                {/* LIST OF ATTRIBUTES */}
                {attributes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {attributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                        <div>
                          <span className="font-bold text-slate-300">{attr.name}:</span>
                          <span className="text-slate-500 font-mono ml-1">{attr.options.join(', ')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(idx)}
                          className="text-red-400 font-bold text-xs hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500">Variation Name</label>
                    <input
                      type="text"
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-1.5 bg-slate-950 text-slate-250 focus:outline-none"
                      placeholder="e.g. Size"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500">Options (Comma separated)</label>
                    <input
                      type="text"
                      value={newAttrOptions}
                      onChange={(e) => setNewAttrOptions(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-1.5 bg-slate-950 text-slate-250 focus:outline-none"
                      placeholder="e.g. M, L, XL"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-750 rounded-lg text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* MAIN DESCRIPTION BOX & AI OPTIMIZE ENTRY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-400">Product Detailed Specification *</label>
                  <button
                    type="button"
                    onClick={() => {
                      handleAiOptimize();
                    }}
                    className="text-[10px] text-violet-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    Expand specs with AI Builder
                  </button>
                </div>
                
                {aiSuggestedDesc && (
                  <div className="mb-2 p-3 bg-violet-950/80 text-white rounded-xl border border-violet-900 text-[10px] font-mono leading-relaxed relative">
                    <span className="font-bold text-violet-300 block mb-1">AI Suggestion:</span>
                    <p className="whitespace-pre-line truncate max-h-20 text-slate-300">{aiSuggestedDesc}</p>
                    <button
                      type="button"
                      onClick={applyAiSuggested}
                      className="text-amber-300 font-bold mt-1.5 block hover:underline"
                    >
                      ✓ Apply to editor box
                    </button>
                  </div>
                )}

                <textarea
                  required
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  rows={4}
                  className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                  placeholder="Detail your dimensions, shipping rates, and refund parameters..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={prodTags}
                  onChange={(e) => setProdTags(e.target.value)}
                  className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                  placeholder="gadget, technology, premium"
                />
              </div>

              {/* SAVE / DISMISS OPERATIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 select-none">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white hover:bg-violet-500 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Save to Ledger
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
