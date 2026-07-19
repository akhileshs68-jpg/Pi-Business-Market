/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { searchService } from '../services/searchService';
import { RatingStars } from '../components/RatingStars';
import { SearchIndexEntry, SearchEntityType } from '../types';

export const UniversalSearch: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<SearchEntityType | 'all'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Smartphones', 'Web Design', 'Senior Dev Jobs', 'Organic Coffee']);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
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
      const filters = activeType === 'all' ? {} : { entityType: activeType };
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
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-violet-600/5 blur-[120px] rounded-full" />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-8 text-center">
              Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Pi Economy</span>
            </h1>

            <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-violet-600/20 blur-xl group-focus-within:bg-violet-600/40 transition-all rounded-[2.5rem]" />
                <div className="relative flex items-center bg-slate-900 border border-slate-800 focus-within:border-violet-500 rounded-[2.5rem] p-2 shadow-2xl transition-all">
                  <Search className="w-6 h-6 text-slate-500 ml-6" />
                  <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Products, Services, Jobs, or Businesses..." 
                    className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-lg font-bold text-white placeholder:text-slate-600"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-2 text-slate-500 hover:text-white mr-2">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 active:scale-95">
                    Search
                  </button>
                </div>
              </div>

              {/* Entity Type Filters */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                {[
                  { id: 'all', label: 'All Results', icon: LayoutGrid },
                  { id: 'product', label: 'Products', icon: ShoppingBag },
                  { id: 'service', label: 'Services', icon: Zap },
                  { id: 'job', label: 'Jobs', icon: Briefcase },
                  { id: 'business', label: 'Businesses', icon: Building2 },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveType(type.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                      activeType === type.id 
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <type.icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          {!query && (
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
          <div className={`${query ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Scanning Enterprise Index...</p>
              </div>
            ) : query && results.length === 0 ? (
              <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Search className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">We couldn't find anything matching your search. Try broadening your keywords.</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((item) => (
                  <motion.div
                    key={item.documentId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 rounded-[2.5rem] p-6 transition-all cursor-pointer relative overflow-hidden"
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
                    
                    {item.metadata.rating && (
                      <div className="flex items-center gap-2 mb-4">
                        <RatingStars rating={item.metadata.rating} size={10} />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">({item.metadata.reviewCount || 0})</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                      <div className="flex items-center gap-3">
                        {item.price && (
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
            ) : (
              /* Initial State - Discovery Cards */
              <div className="space-y-12">
                <section>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                    <div className="w-8 h-px bg-violet-500" /> Curated Opportunities
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DiscoveryCard 
                      title="Enterprise Services" 
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
      </main>
    </div>
  );
};

const DiscoveryCard = ({ title, desc, icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="group p-8 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-[2.5rem] transition-all cursor-pointer relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-600/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform`} />
    <div className={`p-4 bg-${color}-600/10 rounded-2xl w-fit mb-6 text-${color}-400 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{title}</h3>
    <p className="text-slate-500 text-xs font-medium mb-8 leading-relaxed">{desc}</p>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white transition-colors">
      Explore Ecosystem <ChevronRight className="w-4 h-4" />
    </div>
  </div>
);
