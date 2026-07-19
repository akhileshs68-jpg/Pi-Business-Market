/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  CheckCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  Share2,
  Globe,
  Tv,
  Megaphone,
  Grid
} from 'lucide-react';
import { Product, Store, ProductCategory } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface MarketplaceFeedProps {
  onNavigate: (view: string, params?: any) => void;
  onOpenProduct: (product: Product) => void;
}

const FEED_CATEGORIES: { key: ProductCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Catalog' },
  { key: 'electronics', label: 'Electronics & Tech' },
  { key: 'fashion', label: 'Fashion & Clothes' },
  { key: 'digital_services', label: 'eBooks & Digital' },
  { key: 'food_delivery', label: 'Food & Coffee' },
  { key: 'home_living', label: 'Home & Living' },
  { key: 'health_beauty', label: 'Beauty & Health' },
  { key: 'books_education', label: 'Education' }
];

export default function MarketplaceFeed({
  onNavigate,
  onOpenProduct
}: MarketplaceFeedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'popular' | 'rating'>('popular');
  const [onlyDigital, setOnlyDigital] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setProducts(PiBusinessMarketDB.getProducts());
    setStores(PiBusinessMarketDB.getStores());
  }, []);

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((p) => {
      // Must be active status
      if (p.status !== 'active') return false;

      // Search match
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category match
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // Digital-only match
      const matchesDigital = !onlyDigital || p.isDigital;

      return matchesSearch && matchesCategory && matchesDigital;
    })
    .sort((a, b) => {
      // Prioritize boosted items if sorting by default/popular
      if (sortBy === 'popular') {
        if (a.boostedWithAds && !b.boostedWithAds) return -1;
        if (!a.boostedWithAds && b.boostedWithAds) return 1;
        return b.views - a.views;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'priceAsc') {
        return a.pricePi - b.pricePi;
      }
      if (sortBy === 'priceDesc') {
        return b.pricePi - a.pricePi;
      }
      if (sortBy === 'rating') {
        return b.averageRating - a.averageRating;
      }
      return 0;
    });

  // Highlight Boosted/Sponsored products specifically at the top
  const sponsoredProducts = products.filter(p => p.status === 'active' && p.boostedWithAds);

  return (
    <div className="space-y-10 py-6">
      
      {/* 1. MARKETING DISCOVER HERO BANNER */}
      <div className="bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden select-none border border-slate-800">
        {/* Background cosmic shapes */}
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-72 h-72 rounded-full bg-purple-600/10 blur-2xl"></div>
        
        <div className="max-w-xl relative z-10 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 backdrop-blur-md text-amber-300 font-mono text-[9px] font-bold uppercase tracking-wider border border-violet-500/20 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Empowering P2P Commerce
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight text-slate-100 leading-tight">
            The Decentralized Business Gateway
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Welcome to the Pi Business Market networks. Connect directly with global merchants, purchase premium items using non-custodial wallets, and enjoy secure ledger validation.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              onClick={() => onNavigate('store_wizard')}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              Open Store in 2 min
            </button>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold font-mono">
              <span>Fee rate: 0%</span>
              <span>•</span>
              <span>P2P Transactions: Instant</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VERIFIED MERCHANTS CAROUSEL */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between px-1 select-none">
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-100 tracking-tight">Verified Pioneer Merchants</h3>
            <p className="text-xs text-slate-500 mt-0.5">Explore certified nodes serving the Pi Network ecosystem.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Horizontal scroll →</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none select-none">
          {stores.map((store) => (
            <div
              key={store.id}
              onClick={() => onNavigate('store_page', { storeId: store.id })}
              className="w-72 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex-shrink-0 cursor-pointer shadow-md hover:border-violet-500/35 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 shadow-inner">
                  <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1">{store.name}</span>
                    {store.verified && <CheckCircle className="w-3.5 h-3.5 text-violet-400 fill-violet-500/10 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-550 font-semibold mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{store.rating.toFixed(1)}</span>
                    <span>({store.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3.5 line-clamp-2 leading-relaxed">
                {store.description}
              </p>

              <div className="border-t border-slate-800/60 pt-3.5 mt-3.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Category: {store.category}</span>
                <span className="text-violet-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Visit Store <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ADS SPONSOR DECK ROW (If active) */}
      {sponsoredProducts.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 text-left select-none">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-xl">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-base text-slate-100 tracking-tight">Sponsored Spotlights</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pioneer boosted listings with active advertising budget blocks.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sponsoredProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenProduct(p)}
                className="bg-slate-900 border-2 border-amber-500/20 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:border-amber-400 transition-all group flex flex-col justify-between"
              >
                <div className="h-32 bg-slate-950 relative overflow-hidden">
                  <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform opacity-90" />
                  <div className="absolute left-2.5 top-2.5 px-2 py-0.5 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-md text-xs font-mono font-bold text-slate-200 shadow-sm">
                    {p.pricePi} <span className="text-violet-400 font-bold">π</span>
                  </div>
                  <span className="absolute right-2.5 top-2.5 px-2 py-0.5 bg-amber-550 text-slate-950 rounded-md text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-slate-950" /> Sponsor
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-1">{p.title}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold">Store: {p.storeName}</span>
                  </div>

                  <div className="border-t border-slate-800/60 pt-2.5 mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold font-mono">
                    <span className="text-slate-500">Stock: {p.isDigital ? '∞' : p.stock}</span>
                    <span className="text-violet-400 font-bold">Buy Now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN FEED CONTAINER */}
      <div className="space-y-6 text-left">
        
        {/* FILTERS & SEARCH CONTROL CONTROLLER */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search inputs */}
            <div className="relative flex-1 w-full flex items-center border border-slate-800 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 rounded-xl px-3.5 transition-all bg-slate-950/40">
              <Search className="w-4 h-4 text-slate-550 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm pl-2 py-2.5 focus:outline-none text-slate-200 font-semibold bg-transparent placeholder-slate-600"
                placeholder="Search products, merchants, keywords..."
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showFilters || onlyDigital || sortBy !== 'popular'
                    ? 'bg-violet-950 border-violet-800 text-violet-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-900 focus:outline-none font-bold text-slate-300"
              >
                <option value="popular">Popular Index</option>
                <option value="newest">Newest Additions</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
              </select>
            </div>
          </div>

          {/* ADVANCED FILTER BOXES */}
          {showFilters && (
            <div className="border-t border-slate-800/80 pt-4 flex flex-wrap gap-4 items-center select-none animate-fade-in">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="digital_only_check"
                  checked={onlyDigital}
                  onChange={(e) => setOnlyDigital(e.target.checked)}
                  className="w-4 h-4 text-violet-600 border-slate-800 rounded focus:ring-violet-500 bg-slate-950"
                />
                <label htmlFor="digital_only_check" className="text-xs text-slate-400 font-bold cursor-pointer">
                  Digital/Virtual Assets Only (eBooks, Files, Codes)
                </label>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSortBy('popular');
                  setOnlyDigital(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-bold ml-auto"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* CATEGORIES CHIPS CONTAINER */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
            {FEED_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                    : 'bg-slate-950 text-slate-450 border-slate-800/80 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* PRODUCTS CATALOG LIST */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-16 text-center text-slate-500 select-none">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="font-sans font-bold text-slate-300">No Matching Products Found</h4>
            <p className="text-xs max-w-xs mx-auto mt-1 leading-normal text-slate-550">
              Adjust your search keywords, clear filtering chips, or switch categories to locate matching Pioneer items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenProduct(p)}
                className={`bg-slate-900 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:border-violet-500/35 hover:-translate-y-0.5 transition-all group flex flex-col justify-between border ${
                  p.boostedWithAds ? 'border-amber-500/30' : 'border-slate-800/80'
                }`}
              >
                <div className="h-44 bg-slate-950 relative overflow-hidden select-none">
                  <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform opacity-90" />
                  
                  {/* PRICE BADGE */}
                  <div className="absolute left-3.5 top-3.5 px-2.5 py-1 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 shadow-sm flex items-center gap-0.5">
                    {p.pricePi} <span className="text-violet-400 font-bold">π</span>
                  </div>

                  {/* SPONSOR / DIGITAL OVERLAY COVERS */}
                  {p.boostedWithAds && (
                    <span className="absolute right-3.5 top-3.5 px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Megaphone className="w-3 h-3" /> Sponsor
                    </span>
                  )}

                  {!p.boostedWithAds && p.isDigital && (
                    <span className="absolute right-3.5 top-3.5 px-2.5 py-0.5 bg-indigo-600/80 text-white rounded-md text-[8px] font-bold uppercase tracking-wider">
                      Digital File
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1 leading-tight">{p.title}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Store: {p.storeName}</span>
                    
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{p.averageRating.toFixed(1)}</span>
                      <span>({p.reviewCount})</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 mt-3 flex items-center justify-between text-[10px] text-slate-550 font-mono">
                    <span className="font-semibold text-slate-500">Stock: {p.isDigital ? 'Unlimited' : `${p.stock} units`}</span>
                    <span className="text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Buy Now <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
