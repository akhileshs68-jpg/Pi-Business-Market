/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Globe, 
  Briefcase, 
  ShoppingBag, 
  Building2, 
  Star,
  ChevronRight,
  Loader2,
  X,
  History,
  TrendingUp,
  LayoutGrid,
  Zap,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { searchService } from '../services/searchService';
import { RatingStars } from '../components/RatingStars';
import { SearchIndexEntry, SearchEntityType } from '../types';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (location.state?.query) {
      setQuery(location.state.query);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<SearchEntityType | 'all'>('all');
  const [businessType, setBusinessType] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [locationStr, setLocationStr] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevant');

  const [recentSearches, setRecentSearches] = useState<string[]>(['Smartphones', 'Web Design', 'Senior Dev Jobs', 'Organic Coffee']);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        setVisibleCount(12);
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeType]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filters: any = activeType === 'all' ? {} : { entityType: activeType };
      if (activeType === 'business' || activeType === 'all') {
        if (businessType) filters.businessType = businessType;
        if (minRating > 0) filters.minRating = minRating;
        if (isVerified !== undefined) filters.isVerified = isVerified;
      }

      const { results: data } = await searchService.search(query, filters);
      setResults(data);
      if (user) {
        await searchService.recordSearch(user.uid, query);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (type: SearchEntityType) => {
    switch (type) {
      case 'product': return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'service': return <Zap className="w-4 h-4 text-violet-400" />;
      case 'job': return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'business': return <Building2 className="w-4 h-4 text-amber-400" />;
      default: return <Globe className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEntityLink = (entry: SearchIndexEntry) => {
    switch (entry.entityType) {
      case 'product': return `/product/${entry.entityId}`;
      case 'service': return `/service/${entry.entityId}`;
      case 'job': return `/jobs/${entry.metadata.slug || entry.entityId}`;
      case 'business': return `/business/${entry.entityId}`;
      case 'store': return `/store/${entry.entityId}`;
      default: return '#';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="discovery"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
        searchQuery={query}
        onSearchChange={setQuery}
        onSearchSubmit={(val) => {
          setQuery(val);
          handleSearch();
        }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-28 lg:pb-28">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Marketplace</h1>
        </div>
        <div className="w-full">
          <>
            {/* Search Header */}
            <div className="relative mb-8 sm:mb-12">
              <div className="absolute inset-0 bg-violet-600/5 blur-[120px] rounded-full" />
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-6 sm:mb-8 text-center">
                  Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Pi Economy</span>
                </h1>

                <div className="w-full mt-6">
                  {/* Entity Type Filters & Sort & Advanced toggle */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'all', label: 'All', icon: LayoutGrid },
                        { id: 'product', label: 'Products', icon: ShoppingBag },
                        { id: 'service', label: 'Services', icon: Zap },
                        { id: 'job', label: 'Jobs', icon: Briefcase },
                        { id: 'business', label: 'Businesses', icon: Building2 },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setActiveType(type.id as any)}
                          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border ${
                            activeType === type.id 
                              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <type.icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] sm:text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-violet-500 uppercase tracking-widest appearance-none"
                      >
                        <option value="relevant">Most Relevant</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="newest">Newest Arrivals</option>
                      </select>
                      
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border ${
                          showFilters 
                            ? 'bg-violet-600 border-violet-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4" /> Filters
                      </button>
                    </div>
                  </div>
                  
                  {/* Expandable Advanced Filters Panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 mt-4 bg-slate-900/50 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Category / Business Type</label>
                            <input 
                              type="text"
                              value={businessType}
                              onChange={(e) => setBusinessType(e.target.value)}
                              placeholder="e.g. Electronics, Cafe..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Max Price ({priceRange[1]} Pi)</label>
                            <input 
                              type="range"
                              min="0"
                              max="10000"
                              step="10"
                              value={priceRange[1]}
                              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                              className="w-full accent-violet-500 mt-2"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Location</label>
                            <div className="relative">
                              <MapPin className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-500" />
                              <input 
                                type="text"
                                value={locationStr}
                                onChange={(e) => setLocationStr(e.target.value)}
                                placeholder="City or Region"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col justify-end">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Quality</label>
                            <div className="flex items-center gap-4 h-[34px]">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                <input 
                                  type="checkbox" 
                                  checked={isVerified || false}
                                  onChange={(e) => setIsVerified(e.target.checked ? true : undefined)}
                                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900" 
                                />
                                Verified Only
                              </label>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Search Results Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Sidebar */}
              {query && (
                <div className="lg:col-span-1 space-y-12">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <History className="w-4 h-4 text-violet-400" /> Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {recentSearches.map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => setQuery(s)}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-slate-400 hover:text-violet-400 hover:bg-violet-500/5 rounded-xl transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Trending Now
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['Web3 Development', 'UI Kits', 'Remote Jobs', 'Business Consulting', 'AI Assets'].map((tag) => (
                        <span key={tag} className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:border-slate-600 transition-all">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results Grid */}
              <div className={`${query ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                {loading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Searching Marketplace...</p>
                  </div>
                ) : query && results.length === 0 ? (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="py-16 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                      <Search className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-white mb-2">No matches found for "{query}"</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">Try broadening your keywords or browse our suggestions below.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DiscoveryCard 
                        title="Suggested Products" 
                        desc="Explore our top-rated inventory and best sellers."
                        icon={<ShoppingBag className="w-6 h-6" />}
                        color="indigo"
                        onClick={() => setActiveType('product')}
                      />
                      <DiscoveryCard 
                        title="Popular Businesses" 
                        desc="Connect with leading enterprises in the Pi network."
                        icon={<Building2 className="w-6 h-6" />}
                        color="violet"
                        onClick={() => setActiveType('business')}
                      />
                      <DiscoveryCard 
                        title="Related Categories" 
                        desc="Browse by industry, service type, or product category."
                        icon={<LayoutGrid className="w-6 h-6" />}
                        color="emerald"
                        onClick={() => {}}
                      />
                      <DiscoveryCard 
                        title="Trending Searches" 
                        desc="See what others are looking for right now."
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="amber"
                        onClick={() => {}}
                      />
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-12">
                    {['product', 'business', 'store', 'service', 'job'].map(type => {
                      const typeResults = results.filter(r => r.entityType === type);
                      if (typeResults.length === 0) return null;
                      const visibleTypeResults = typeResults.slice(0, visibleCount);
                      
                      return (
                        <div key={type} className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                              {getEntityIcon(type as any)} {type}s
                            </h2>
                            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400">
                              {typeResults.length} result{typeResults.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {visibleTypeResults.map((item) => (
                              <motion.div
                                key={item.documentId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 rounded-[2.5rem] p-6 transition-all cursor-pointer relative overflow-hidden flex flex-col"
                                onClick={() => navigate(getEntityLink(item))}
                              >
                                <div className="flex items-start gap-4 mb-4">
                                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl group-hover:bg-violet-600/10 transition-colors">
                                    {getEntityIcon(item.entityType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[8px] font-black uppercase tracking-widest text-violet-400">{item.entityType}</span>
                                      {item.featured && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[6px] font-black uppercase tracking-tighter">
                                          <Star className="w-2 h-2 fill-amber-500" /> Featured
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-lg font-black text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight truncate">{item.title}</h3>
                                  </div>
                                </div>
                                
                                {item.metadata?.rating && (
                                  <div className="flex items-center gap-2 mb-4">
                                    <RatingStars rating={item.metadata.rating} size={10} />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">({item.metadata.reviewCount || 0})</span>
                                  </div>
                                )}
                                
                                <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed flex-1">{item.description}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
                                  <div className="flex items-center gap-3">
                                    {item.price !== undefined && (
                                      <p className="text-lg font-black text-white">{item.price} {item.currency}</p>
                                    )}
                                    {item.location && (
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                                        <MapPin className="w-3 h-3" /> {item.location}
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-2 bg-slate-800 group-hover:bg-violet-600 rounded-xl transition-all text-white">
                                    <ArrowRight className="w-4 h-4" />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {results.length > visibleCount && (
                      <div className="flex justify-center pt-6">
                        <button
                          onClick={() => setVisibleCount(prev => prev + 12)}
                          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20"
                        >
                          Load More Results
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Initial State - Discovery Cards */
                  <div className="space-y-12">
                    <section>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <div className="w-8 h-px bg-violet-500" /> Curated Opportunities
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DiscoveryCard 
                          title="Marketplace Services" 
                          desc="Hire top-tier Pi professionals for your next project."
                          icon={<Zap className="w-6 h-6" />}
                          color="violet"
                          onClick={() => navigate('/services')}
                        />
                        <DiscoveryCard 
                          title="Global Job Board" 
                          desc="Scale your career with the most innovative Web3 companies."
                          icon={<Briefcase className="w-6 h-6" />}
                          color="indigo"
                          onClick={() => navigate('/jobs')}
                        />
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </>
        </div>
      </main>
    </div>
  );
};

const DiscoveryCard = ({ title, desc, icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="group p-6 sm:p-8 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl sm:rounded-[2.5rem] transition-all cursor-pointer relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-600/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform`} />
    <div className={`p-3 sm:p-4 bg-${color}-600/10 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6 text-${color}-400 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-2">{title}</h3>
    <p className="text-slate-500 text-[10px] sm:text-xs font-medium mb-6 sm:mb-8 leading-relaxed">{desc}</p>
    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors">
      Explore Ecosystem <ChevronRight className="w-4 h-4" />
    </div>
  </div>
);
