/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  CheckCircle,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Store, Product, ProductCategory } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface StorePageProps {
  storeId: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenProduct: (product: Product) => void;
}

export default function StorePage({
  storeId,
  onNavigate,
  onOpenProduct
}: StorePageProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const s = PiBusinessMarketDB.getStoreById(storeId);
    if (s) {
      setStore(s);
      setProducts(PiBusinessMarketDB.getProductsByStore(storeId));
    }
  }, [storeId]);

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center select-none text-slate-400">
        <Compass className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-300" />
        <p className="text-xs">Loading Storefront Nodes...</p>
      </div>
    );
  }

  // Filter products by store category
  const filteredProducts = products.filter((p) => {
    if (p.status !== 'active') return false;
    return selectedCategory === 'all' || p.category === selectedCategory;
  });

  // Unique categories in this store's listings
  const storeCategories: string[] = ['all', ...(Array.from(new Set(products.map(p => p.category as string))) as string[])];

  // Custom theme colors fallback
  const accentColor = store.customTheme?.primaryColor || '#7A1A78';

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8 text-left">
      
      {/* HEADER NAVIGATION */}
      <div className="flex items-center gap-3 select-none">
        <button
          onClick={() => onNavigate('marketplace')}
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Back to Marketplace</span>
      </div>

      {/* COVER BANNER SHEET */}
      <div className="h-44 sm:h-60 rounded-3xl overflow-hidden relative shadow-lg border border-slate-800/60">
        <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
      </div>

      {/* BUSINESS CARD INTERFACES */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl -mt-16 sm:-mt-24 relative z-10 mx-4 sm:mx-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-slate-950 overflow-hidden shadow-md flex-shrink-0">
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-extrabold text-2xl text-slate-100 tracking-tight leading-none">{store.name}</h2>
                {store.verified && <CheckCircle className="w-5 h-5 text-violet-400 fill-violet-500/10 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400 mt-2 max-w-xl">{store.description}</p>
              
              <div className="flex items-center gap-3 mt-3 text-slate-500 text-xs select-none">
                <span className="flex items-center gap-1 font-bold text-slate-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)} ({store.reviewCount} reviews)
                </span>
                <span>•</span>
                <span className="font-mono text-[10px] uppercase bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-md text-violet-400">
                  {store.category}
                </span>
              </div>
            </div>
          </div>

          {/* SOCIAL CONECTIVITY RAIL */}
          <div className="flex flex-wrap gap-2.5 max-w-sm md:self-center">
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
            )}
            {store.email && (
              <a
                href={`mailto:${store.email}`}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            )}
            {store.socials?.telegram && (
              <a
                href={`https://t.me/${store.socials.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-white font-bold text-xs transition-all shadow-md bg-sky-600 hover:bg-sky-500"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
            )}
            {store.socials?.whatsapp && (
              <a
                href={`https://wa.me/${store.socials.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-white font-bold text-xs transition-all shadow-md bg-emerald-600 hover:bg-emerald-500"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
          </div>

        </div>
      </div>

      {/* CATALOG FILTER SHIELDS */}
      <div className="space-y-6">
        
        <div className="flex border-b border-slate-800/80 pb-2 overflow-x-auto gap-4 select-none">
          {storeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-2 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'text-slate-100 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
              style={{
                borderBottomColor: selectedCategory === cat ? accentColor : 'transparent',
                color: selectedCategory === cat ? accentColor : undefined
              }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-12 text-center text-slate-550 select-none">
            <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs">This merchant catalog is empty under this category.</p>
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
                  <div className="absolute left-3.5 top-3.5 px-2.5 py-1 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200 shadow-sm flex items-center gap-0.5">
                    {p.pricePi} <span className="text-violet-400 font-bold">π</span>
                  </div>
                  {p.boostedWithAds && (
                    <span className="absolute right-3.5 top-3.5 px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-slate-950" /> Boosted
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1">{p.title}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{p.averageRating.toFixed(1)}</span>
                      <span>({p.reviewCount})</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 mt-3 flex items-center justify-between text-[10px] text-slate-550 font-mono">
                    <span className="font-semibold text-slate-500">Stock: {p.isDigital ? 'Unlimited' : p.stock}</span>
                    <span 
                      className="font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5"
                      style={{ color: accentColor }}
                    >
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
