import React, { useState, useRef } from 'react';
import { 
  Search, 
  Star, 
  MapPin, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  ShoppingBag, 
  Zap, 
  Building2, 
  Clock, 
  User, 
  Home as HomeIcon, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { CategorySection } from './CategorySection';
import { User as UserType } from '../../types';

interface BuyerHomeProps {
  user: UserType | null;
  onSearchSubmit: (query: string) => void;
  onNavigate: (view: string) => void;
  onCategorySelect: (catId: string) => void;
}

// Highly descriptive, professional mock database
const FEATURED_PRODUCTS = [
  {
    id: 'p_1',
    title: 'Consensus Core Hardware Wallet',
    price: 45,
    currency: 'π',
    seller: 'PiSec Technologies',
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'p_2',
    title: 'Developer Workstation Book Pro',
    price: 350,
    currency: 'π',
    seller: 'Silicon Pioneers',
    rating: 4.8,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'p_3',
    title: 'Single-Origin Ethiopian Coffee Beans (1kg)',
    price: 2.5,
    currency: 'π',
    seller: 'Kaffa Pi Roasters',
    rating: 5.0,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'p_4',
    title: 'AeroSync Fitness Smartwatch',
    price: 18.5,
    currency: 'π',
    seller: 'OmniWear Global',
    rating: 4.7,
    reviews: 64,
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500&auto=format&fit=crop&q=60'
  }
];

const FEATURED_SERVICES = [
  {
    id: 's_1',
    title: 'Enterprise Web3 App Development',
    provider: 'Decentrix Labs',
    rating: 4.9,
    reviews: 73,
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 's_2',
    title: 'Global Business Setup & Legal Advisory',
    provider: 'LexPi Associates',
    rating: 4.8,
    reviews: 31,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 's_3',
    title: 'Product Design & Branding Sprint',
    provider: 'Creative Flow Studio',
    rating: 5.0,
    reviews: 58,
    image: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=500&auto=format&fit=crop&q=60'
  }
];

const FEATURED_BUSINESSES = [
  {
    id: 'b_1',
    name: 'Pi-Enterprise Solutions Inc.',
    category: 'Information Technology',
    location: 'Singapore (Global)',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'b_2',
    name: 'Intercontinental Logistics Hub',
    category: 'Supply Chain',
    location: 'Rotterdam, Netherlands',
    logo: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'b_3',
    name: 'EcoFarms Sustainable Agriculture',
    category: 'Agriculture',
    location: 'Nairobi, Kenya',
    logo: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=500&auto=format&fit=crop&q=60'
  }
];

const TRENDING_PRODUCTS = [
  { id: 'tp_1', title: 'Noise-Cancelling Earbuds Pro', price: '12 π', rating: 4.9, seller: 'AcousticPi' },
  { id: 'tp_2', title: 'Ergonomic Desk Chair Max', price: '75 π', rating: 4.8, seller: 'ComfySpace' },
];

const TRENDING_SERVICES = [
  { id: 'ts_1', title: 'SEO Optimization Blueprint', provider: 'RankBoost Co.', rating: 4.7 },
  { id: 'ts_2', title: 'Smart Contract Audit Service', provider: 'TrustVerify', rating: 5.0 },
];

const TRENDING_BUSINESSES = [
  { id: 'tb_1', name: 'Zeta Freight Logistics', industry: 'Transportation', location: 'Austin, TX' },
  { id: 'tb_2', name: 'Pi Academy Online', industry: 'Education', location: 'London, UK' },
];

export const BuyerHome: React.FC<BuyerHomeProps> = ({ 
  user, 
  onSearchSubmit, 
  onNavigate, 
  onCategorySelect 
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'categories' | 'search' | 'orders' | 'profile'>('home');
  const [trendingTab, setTrendingTab] = useState<'products' | 'services' | 'businesses'>('products');

  const homeRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      onSearchSubmit(searchVal.trim());
    }
  };

  const handleBottomTabClick = (tab: 'home' | 'categories' | 'search' | 'orders' | 'profile') => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      homeRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'categories') {
      categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (tab === 'search') {
      searchInputRef.current?.focus();
      homeRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'orders') {
      onNavigate('orders');
    } else if (tab === 'profile') {
      onNavigate('profile');
    }
  };

  return (
    <div ref={homeRef} className="pb-32 space-y-16" id="buyer_marketplace_home_container">
      
      {/* SECTION 1: Welcome Banner */}
      <section id="welcome_banner_section" className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Welcome User details */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* Pi Profile Photo */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 p-[3px] shadow-lg">
                <div className="w-full h-full rounded-[13px] bg-slate-950 flex items-center justify-center overflow-hidden">
                  {user?.photoUrl ? (
                    <img 
                      src={user.photoUrl} 
                      alt={user.username || 'Pioneer'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-amber-400 uppercase">
                      {user?.username?.slice(0, 2) || 'PI'}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] tracking-widest uppercase border-2 border-slate-900">
                Active
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-[0.25em] text-violet-400 uppercase block mb-1">
                WELCOME BACK, PIONEER
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-none">
                {user?.displayName || user?.username || 'Pioneer'}
              </h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Verified Pi Network Consensus Member
              </p>
            </div>
          </div>

          {/* Search Bar inside Welcome Banner */}
          <div className="w-full md:max-w-md">
            <div className="relative group">
              <div className="absolute inset-0 bg-violet-600/10 blur-xl group-focus-within:bg-violet-600/20 transition-all rounded-2xl" />
              <div className="relative flex items-center bg-slate-950 border border-slate-800/80 focus-within:border-violet-500/80 rounded-2xl p-1.5 transition-all">
                <Search className="w-5 h-5 text-slate-500 ml-3.5 shrink-0" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  placeholder="What are you looking for today?" 
                  className="flex-1 min-w-0 bg-transparent border-none outline-none px-3.5 py-2.5 text-sm font-bold text-white placeholder:text-slate-600"
                />
                <button 
                  onClick={() => searchVal.trim() && onSearchSubmit(searchVal.trim())}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase tracking-wider text-[10px] transition-all"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: Categories */}
      <section ref={categoriesRef} id="categories_section_container" className="scroll-mt-24">
        <CategorySection onSelectCategory={onCategorySelect} />
      </section>

      {/* SECTION 3: Featured Products (Horizontal scrolling list of elegant cards) */}
      <section id="featured_products_section" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block" />
            Featured Products
          </h2>
          <span className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1 uppercase tracking-widest">
            View All <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {/* Horizontal Card container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_PRODUCTS.map((prod) => (
            <div 
              key={prod.id} 
              onClick={() => onNavigate(`product/${prod.id}`)}
              className="group bg-slate-900/50 border border-slate-850 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full"
            >
              {/* Product Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img 
                  src={prod.image} 
                  alt={prod.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-emerald-600 text-white font-black px-2 py-0.5 rounded text-[8px] uppercase tracking-wider shadow-md">
                  Featured
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
                    <span>{prod.seller}</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{prod.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-2 tracking-tight leading-tight">
                    {prod.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                  <div className="font-mono text-lg font-black text-white flex items-baseline gap-1">
                    {prod.price} <span className="text-violet-400 font-bold">π</span>
                  </div>
                  <span className="p-2 rounded-lg bg-slate-950 text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Featured Services */}
      <section id="featured_services_section" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-violet-500 rounded-full inline-block" />
            Featured Services
          </h2>
          <span className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1 uppercase tracking-widest">
            View All <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_SERVICES.map((srv) => (
            <div 
              key={srv.id} 
              className="group bg-slate-900/50 border border-slate-850 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img 
                  src={srv.image} 
                  alt={srv.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-violet-600 text-white font-black px-2 py-0.5 rounded text-[8px] uppercase tracking-wider shadow-md">
                  Pro Service
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
                    <span>{srv.provider}</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{srv.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-2 tracking-tight leading-tight">
                    {srv.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Consultation Available
                  </span>
                  <span className="p-2 rounded-lg bg-slate-950 text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                    <Zap className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Featured Businesses */}
      <section id="featured_businesses_section" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block" />
            Featured Businesses
          </h2>
          <span className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1 uppercase tracking-widest">
            View All <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_BUSINESSES.map((biz) => (
            <div 
              key={biz.id} 
              onClick={() => onNavigate(`business/${biz.id}`)}
              className="group bg-slate-900/50 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-300 cursor-pointer flex items-center gap-5"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                <img 
                  src={biz.logo} 
                  alt={biz.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  {biz.category}
                </span>
                <h3 className="text-base font-bold text-slate-200 group-hover:text-violet-400 transition-colors truncate tracking-tight">
                  {biz.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{biz.location}</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 text-slate-500 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: Trending Today (Tabs interface for Products, Services, Businesses) */}
      <section id="trending_today_section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-violet-500 rounded-full inline-block" />
            Trending Today
          </h2>

          {/* Symmetrical tab buttons */}
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex self-start sm:self-auto">
            <button
              onClick={() => setTrendingTab('products')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${trendingTab === 'products' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Products
            </button>
            <button
              onClick={() => setTrendingTab('services')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${trendingTab === 'services' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Services
            </button>
            <button
              onClick={() => setTrendingTab('businesses')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${trendingTab === 'businesses' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Businesses
            </button>
          </div>
        </div>

        {/* Tab contents */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6">
          {trendingTab === 'products' && (
            <div className="divide-y divide-slate-850">
              {TRENDING_PRODUCTS.map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xl font-black text-violet-500/50 w-6">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{prod.title}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Seller: {prod.seller}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-sm font-black text-white">{prod.price}</span>
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black">
                      <Star className="w-2.5 h-2.5 fill-amber-500" /> {prod.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {trendingTab === 'services' && (
            <div className="divide-y divide-slate-850">
              {TRENDING_SERVICES.map((srv, idx) => (
                <div key={srv.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xl font-black text-violet-500/50 w-6">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{srv.title}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Provider: {srv.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider bg-violet-600/10 border border-violet-500/20 px-2 py-1 rounded-md">Hot Service</span>
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black">
                      <Star className="w-2.5 h-2.5 fill-amber-500" /> {srv.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {trendingTab === 'businesses' && (
            <div className="divide-y divide-slate-850">
              {TRENDING_BUSINESSES.map((biz, idx) => (
                <div key={biz.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xl font-black text-violet-500/50 w-6">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{biz.name}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{biz.industry} • {biz.location}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 hover:text-white cursor-pointer" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7: Recommended For You (Placeholder UI only) */}
      <section id="recommended_for_you_section" className="space-y-6">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block" />
          Recommended For You
        </h2>
        
        {/* Placeholder UI */}
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-violet-400 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider">AI Personalization Engine</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We are analyzing your past transactions and viewing history on the Pi Network to tailor unique product recommendations just for you. Keep exploring to enrich your recommendations!
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <span>Powered by Gemini AI</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </div>
      </section>

    </div>
  );
};
