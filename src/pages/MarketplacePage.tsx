import { aiEngineService } from '../services/aiEngineService';
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
  ChevronLeft,
  Loader2,
  X,
  History,
  TrendingUp,
  LayoutGrid,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  Heart,
  Scale,
  Award,
  Store,
  UserCheck,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Coffee,
  Wrench,
  Code,
  Sofa,
  Cpu,
  Sparkles,
  Package,
  ShoppingCart,
  Percent,
  Layers,
  Layout,
  ArrowUpRight,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { searchService } from '../services/searchService';
import { WishlistService } from '../services/wishlistService';
import { RatingStars } from '../components/RatingStars';
import { SearchIndexEntry, SearchEntityType, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { ServiceCard } from '../components/service/ServiceCard';
import { PriceDisplay } from '../components/pricing/PriceDisplay';
import { PRODUCT_TAXONOMY, SERVICE_TAXONOMY, TaxonomyItem } from '../config/taxonomy';

const mapSearchEntryToProduct = (entry: SearchIndexEntry): Product => {
  return {
    productId: entry.entityId,
    storeId: entry.storeId || '',
    businessId: entry.businessId,
    ownerUid: '',
    sku: entry.keywords?.[0] || 'N/A',
    productName: entry.title,
    productSlug: '',
    shortDescription: entry.description,
    description: entry.description,
    brand: entry.metadata?.seller || entry.metadata?.merchantName || 'Merchant',
    type: 'physical',
    category: entry.metadata?.category || 'General',
    subCategory: '',
    tags: entry.keywords || [],
    price: entry.price || 0,
    comparePrice: entry.metadata?.oldPrice || undefined,
    currency: entry.currency || 'Pi',
    taxClass: 'Standard',
    stock: 100,
    stockStatus: 'in_stock',
    minOrderQty: 1,
    maxOrderQty: 10,
    featured: entry.featured,
    status: entry.status as any,
    visibility: entry.visibility,
    seoTitle: entry.title,
    seoDescription: entry.description,
    mainImage: entry.metadata?.imageUrl || undefined,
    imageUrls: entry.metadata?.imageUrl ? [entry.metadata.imageUrl] : [],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    // Pass custom fields for ProductCard rendering
    rating: entry.metadata?.rating,
    reviewCount: entry.metadata?.reviewCount,
    seller: entry.metadata?.seller,
  } as any;
};

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('electr') || name.includes('smart') || name.includes('phone') || name.includes('computer')) {
    return <Laptop className="w-5 h-5 text-violet-400" />;
  }
  if (name.includes('fash') || name.includes('cloth') || name.includes('wear') || name.includes('apparel')) {
    return <Shirt className="w-5 h-5 text-emerald-400" />;
  }
  if (name.includes('home') || name.includes('garden') || name.includes('furnit') || name.includes('decor')) {
    return <HomeIcon className="w-5 h-5 text-amber-400" />;
  }
  if (name.includes('food') || name.includes('bever') || name.includes('coffee') || name.includes('snack')) {
    return <Coffee className="w-5 h-5 text-rose-400" />;
  }
  if (name.includes('digit') || name.includes('code') || name.includes('web') || name.includes('software')) {
    return <Code className="w-5 h-5 text-blue-400" />;
  }
  if (name.includes('consult') || name.includes('finance') || name.includes('market') || name.includes('strateg')) {
    return <Briefcase className="w-5 h-5 text-indigo-400" />;
  }
  if (name.includes('local') || name.includes('maintenance') || name.includes('plumb') || name.includes('wrench')) {
    return <Wrench className="w-5 h-5 text-orange-400" />;
  }
  return <Sparkles className="w-5 h-5 text-slate-400" />;
};

const getCategoryColor = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('electr') || name.includes('smart') || name.includes('phone') || name.includes('computer')) {
    return {
      bg: 'bg-violet-500/5 hover:bg-violet-500/10',
      border: 'border-violet-500/20 hover:border-violet-500/50',
      text: 'text-violet-400',
      glow: 'shadow-violet-500/5 hover:shadow-violet-500/10'
    };
  }
  if (name.includes('fash') || name.includes('cloth') || name.includes('wear') || name.includes('apparel')) {
    return {
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/5 hover:shadow-emerald-500/10'
    };
  }
  if (name.includes('home') || name.includes('garden') || name.includes('furnit') || name.includes('decor')) {
    return {
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      border: 'border-amber-500/20 hover:border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/5 hover:shadow-amber-500/10'
    };
  }
  if (name.includes('food') || name.includes('bever') || name.includes('coffee') || name.includes('snack')) {
    return {
      bg: 'bg-rose-500/5 hover:bg-rose-500/10',
      border: 'border-rose-500/20 hover:border-rose-500/50',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/5 hover:shadow-rose-500/10'
    };
  }
  if (name.includes('digit') || name.includes('code') || name.includes('web') || name.includes('software')) {
    return {
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/50',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/5 hover:shadow-blue-500/10'
    };
  }
  if (name.includes('consult') || name.includes('finance') || name.includes('market') || name.includes('strateg')) {
    return {
      bg: 'bg-indigo-500/5 hover:bg-indigo-500/10',
      border: 'border-indigo-500/20 hover:border-indigo-500/50',
      text: 'text-indigo-400',
      glow: 'shadow-indigo-500/5 hover:shadow-indigo-500/10'
    };
  }
  if (name.includes('local') || name.includes('maintenance') || name.includes('plumb') || name.includes('wrench')) {
    return {
      bg: 'bg-orange-500/5 hover:bg-orange-500/10',
      border: 'border-orange-500/20 hover:border-orange-500/50',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/5 hover:shadow-orange-500/10'
    };
  }
  return {
    bg: 'bg-slate-500/5 hover:bg-slate-500/10',
    border: 'border-slate-500/20 hover:border-slate-500/50',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/5 hover:shadow-slate-500/10'
  };
};

const getPlaceholderImage = (category: string, title: string): string => {
  const catLower = (category || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();
  
  if (catLower.includes('electr') || titleLower.includes('smart') || titleLower.includes('laptop') || titleLower.includes('headphone')) {
    if (titleLower.includes('headphone') || titleLower.includes('audio') || titleLower.includes('ear')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
    }
    if (titleLower.includes('phone') || titleLower.includes('iphone') || titleLower.includes('mobile')) {
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500';
    }
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
  }
  if (catLower.includes('fash') || catLower.includes('cloth') || titleLower.includes('shirt') || titleLower.includes('dress') || titleLower.includes('shoe')) {
    if (titleLower.includes('shoe') || titleLower.includes('sneaker')) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500';
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500';
  }
  if (catLower.includes('home') || catLower.includes('garden') || titleLower.includes('sofa') || titleLower.includes('chair') || titleLower.includes('table')) {
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500';
  }
  if (catLower.includes('food') || catLower.includes('bever') || titleLower.includes('coffee') || titleLower.includes('tea') || titleLower.includes('chocolate')) {
    if (titleLower.includes('coffee') || titleLower.includes('cup') || titleLower.includes('tea')) {
      return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500';
    }
    return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500';
  }
  return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500';
};

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<SearchEntityType | 'all'>('all');
  const [businessType, setBusinessType] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [locationStr, setLocationStr] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevant');

  const [recentSearches, setRecentSearches] = useState<string[]>(['Smartphones', 'Web Design', 'Senior Dev Jobs', 'Organic Coffee']);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => WishlistService.getLocalWishlist());
  const [compareIds, setCompareIds] = useState<string[]>(() => WishlistService.getLocalCompare());

  // Category Taxonomy State
  const [selectedCategory, setSelectedCategory] = useState<TaxonomyItem | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<TaxonomyItem | null>(null);
  const [selectedChildCategory, setSelectedChildCategory] = useState<TaxonomyItem | null>(null);

  // Reset category filters when switching between All, Products, Services, etc.
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedChildCategory(null);
  }, [activeType]);

  useEffect(() => {
    if (location.state?.query || location.state?.category) {
      const stateQuery = location.state.query || '';
      const stateCategory = location.state.category || '';
      
      const isEntityScope = ['all', 'products', 'services', 'businesses', 'stores', 'product', 'service', 'business', 'store', 'job'].includes(stateCategory.toLowerCase());
      
      if (isEntityScope) {
        const catMap: Record<string, string> = {
          'all': 'all',
          'products': 'product',
          'services': 'service',
          'businesses': 'business',
          'stores': 'store',
          'product': 'product',
          'service': 'service',
          'business': 'business',
          'store': 'store',
          'job': 'job'
        };
        const activeCat = catMap[stateCategory.toLowerCase()] || 'all';
        setActiveType(activeCat as any);
        if (stateQuery) {
          setQuery(stateQuery);
        }
      } else {
        if (stateCategory) {
          setQuery(stateCategory);
          setBusinessType(stateCategory);
        } else if (stateQuery) {
          setQuery(stateQuery);
        }
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleToggleWishlist = async (e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    const isAdded = await WishlistService.toggleWishlist(entityId, user?.uid);
    setWishlistIds(prev => isAdded ? [...prev, entityId] : prev.filter(id => id !== entityId));
  };

  const handleToggleCompare = (e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    const res = WishlistService.toggleCompare(entityId);
    setCompareIds(res.compareList);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query || activeType !== 'all' || selectedCategory !== null) {
        setVisibleCount(12);
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeType, selectedCategory, selectedSubcategory, selectedChildCategory]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filters: any = activeType === 'all' ? {} : { entityType: activeType };
      
      // Category selection mapping
      let activeCatName = '';
      if (selectedChildCategory) {
        activeCatName = selectedChildCategory.name;
      } else if (selectedSubcategory) {
        activeCatName = selectedSubcategory.name;
      } else if (selectedCategory) {
        activeCatName = selectedCategory.name;
      }

      if (activeCatName) {
        filters.categoryId = activeCatName;
      }

      if (activeType === 'business' || activeType === 'all') {
        if (businessType) filters.businessType = businessType;
        if (minRating > 0) filters.minRating = minRating;
        if (isVerified !== undefined) filters.isVerified = isVerified;
      }

      const { results: data } = await aiEngineService.smartSearch(query, filters, user?.uid);
      setResults(data);
      if (user && query.trim()) {
        await searchService.recordSearch(user.uid, query);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  // High-fidelity Client-Side Sorting & Filtering Engine
  const getSortedResults = (rawResults: SearchIndexEntry[]) => {
    let filtered = [...rawResults];

    // 1. Minimum Rating Filter
    if (minRating > 0) {
      filtered = filtered.filter(item => {
        const rating = item.metadata?.rating ?? 4.5; // fallback rating
        return rating >= minRating;
      });
    }

    // 2. Verification / Trust Filter
    if (isVerified) {
      filtered = filtered.filter(item => {
        const isVerifiedMerchant = item.metadata?.verified === true || 
                                   item.metadata?.isVerified === true || 
                                   item.featured === true || 
                                   String(item.metadata?.seller || '').toLowerCase().includes('verified');
        return isVerifiedMerchant;
      });
    }

    // 3. Stock / Availability Filter
    if (inStockOnly) {
      filtered = filtered.filter(item => {
        if (item.entityType === 'product') {
          const stock = item.metadata?.stock !== undefined ? item.metadata.stock : 100;
          return stock > 0;
        }
        return true;
      });
    }

    // 4. Max Price Range Filter
    if (priceRange[1] < 1000) {
      filtered = filtered.filter(item => {
        const price = item.price !== undefined ? Number(item.price) : 0;
        return price <= priceRange[1];
      });
    }

    // 5. Location Filter
    if (locationStr.trim()) {
      const lowerLoc = locationStr.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const loc = String(item.location || item.metadata?.location || '').toLowerCase();
        return loc.includes(lowerLoc);
      });
    }

    // 6. Category/Business Type Text Filter
    if (businessType.trim()) {
      const bt = businessType.toLowerCase().trim();
      filtered = filtered.filter(item => 
        String(item.title || '').toLowerCase().includes(bt) || 
        String(item.description || '').toLowerCase().includes(bt) || 
        String(item.metadata?.category || '').toLowerCase().includes(bt) ||
        String(item.metadata?.seller || '').toLowerCase().includes(bt)
      );
    }

    // 7. Sorting Logic
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => {
        const priceA = a.price !== undefined ? Number(a.price) : 9999999;
        const priceB = b.price !== undefined ? Number(b.price) : 9999999;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => {
        const priceA = a.price !== undefined ? Number(a.price) : -1;
        const priceB = b.price !== undefined ? Number(b.price) : -1;
        return priceB - priceA;
      });
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    return filtered;
  };

  const getEntityIcon = (type: SearchEntityType) => {
    switch (type) {
      case 'product': return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'service': return <Zap className="w-4 h-4 text-violet-400" />;
      case 'job': return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'business': return <Building2 className="w-4 h-4 text-amber-400" />;
      case 'store': return <Store className="w-4 h-4 text-indigo-400" />;
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

  // Synchronize placeholder with selected type context
  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'product': return 'Search products...';
      case 'service': return 'Search services...';
      case 'business': return 'Search businesses...';
      case 'store': return 'Search stores...';
      case 'job': return 'Search jobs...';
      default: return 'Search products, services, businesses or stores...';
    }
  };

  const sortedResults = getSortedResults(results);

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
        searchPlaceholder={getPlaceholder(activeType)}
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
            <div className="relative mb-8 sm:mb-10">
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
                        { id: 'business', label: 'Businesses', icon: Building2 },
                        { id: 'store', label: 'Stores', icon: Store },
                        { id: 'job', label: 'Jobs', icon: Briefcase },
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
                        <div className="p-5 mt-4 bg-slate-900/50 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Options</label>
                            <div className="flex flex-col gap-1.5 justify-center h-full min-h-[34px]">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                <input 
                                  type="checkbox" 
                                  checked={isVerified || false}
                                  onChange={(e) => setIsVerified(e.target.checked ? true : undefined)}
                                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900" 
                                />
                                Verified Only
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                                <input 
                                  type="checkbox" 
                                  checked={inStockOnly}
                                  onChange={(e) => setInStockOnly(e.target.checked)}
                                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900" 
                                />
                                In Stock Only
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Minimum Rating</label>
                            <select 
                              value={minRating}
                              onChange={(e) => setMinRating(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-500 appearance-none uppercase tracking-widest font-black"
                            >
                              <option value="0">All Ratings</option>
                              <option value="4.5">★ 4.5 & up</option>
                              <option value="4.0">★ 4.0 & up</option>
                              <option value="3.5">★ 3.5 & up</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Context Header */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 mb-8 relative overflow-hidden backdrop-blur-sm shadow-2xl">
              {/* Subtle back-glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black tracking-[0.25em] uppercase text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                      Marketplace Context
                    </span>
                    {activeType === 'product' && (
                      <>
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" /> Escrow Protected
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Percent className="w-3 h-3" /> BMP Rewards
                        </span>
                      </>
                    )}
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-3">
                    {activeType === 'all' && "All Marketplace"}
                    {activeType === 'product' && (
                      <>
                        <ShoppingBag className="w-7 h-7 text-violet-400" />
                        Products Hub
                      </>
                    )}
                    {activeType === 'service' && "Browsing Services"}
                    {activeType === 'business' && "Business Directory"}
                    {activeType === 'store' && "Merchant Stores"}
                    {activeType === 'job' && "Career Board"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">
                    {activeType === 'all' && "Broad cross-entity discovery across all products, services, and merchants."}
                    {activeType === 'product' && "Discover and buy physical or digital products in the Pi Ecosystem. Filter by high-fidelity taxonomies."}
                    {activeType === 'service' && "Hire verified service providers, experts, and freelancers."}
                    {activeType === 'business' && "Connect with leading businesses and registered enterprises."}
                    {activeType === 'store' && "Browse dedicated vendor storefronts and local shops."}
                    {activeType === 'job' && "Find Web3 and local jobs offered by Pi Business network."}
                  </p>
                </div>
                
                {/* Clean, mathematical breadcrumbs for subcategories */}
                {(selectedCategory || selectedSubcategory || selectedChildCategory) && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 sm:mt-0 shadow-lg">
                    <button 
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedSubcategory(null);
                        setSelectedChildCategory(null);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      All
                    </button>
                    {selectedCategory && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <button 
                          onClick={() => {
                            setSelectedSubcategory(null);
                            setSelectedChildCategory(null);
                          }}
                          className="text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          {selectedCategory.name}
                        </button>
                      </>
                    )}
                    {selectedSubcategory && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <button 
                          onClick={() => setSelectedChildCategory(null)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          {selectedSubcategory.name}
                        </button>
                      </>
                    )}
                    {selectedChildCategory && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span className="text-amber-400 font-extrabold">
                          {selectedChildCategory.name}
                        </span>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedSubcategory(null);
                        setSelectedChildCategory(null);
                      }}
                      className="ml-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Clear Category Filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Category Selector - Grid & Taxonomy Experience */}
            {activeType === 'product' && (
              <div className="mb-10 space-y-6">
                {!selectedCategory ? (
                  /* Visual Category Card Grid */
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Browse Categories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {PRODUCT_TAXONOMY.map((cat) => {
                        const style = getCategoryColor(cat.name);
                        return (
                          <motion.div
                            key={cat.id}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSelectedSubcategory(null);
                              setSelectedChildCategory(null);
                            }}
                            className={`group cursor-pointer p-6 bg-slate-900 border ${style.border} rounded-[2rem] transition-all relative overflow-hidden flex flex-col justify-between h-40 ${style.glow}`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full pointer-events-none" />
                            <div className="flex items-start justify-between">
                              <div className={`p-3.5 ${style.bg} rounded-2xl ${style.text} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                                {getCategoryIcon(cat.name)}
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                              <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-violet-400 transition-colors">{cat.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {cat.subcategories?.length || 0} Subcategories
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Expanded Taxonomy Subcategory & Child selectors */
                  <div className="bg-slate-900/20 border border-slate-900 rounded-[2.5rem] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${getCategoryColor(selectedCategory.name).bg}`}>
                          {getCategoryIcon(selectedCategory.name)}
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Selected Category</span>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight">{selectedCategory.name}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setSelectedChildCategory(null);
                        }}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        ← Back to All
                      </button>
                    </div>

                    {/* Subcategories Row */}
                    {selectedCategory.subcategories && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Subcategories:</span>
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                          {selectedCategory.subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setSelectedSubcategory(sub);
                                setSelectedChildCategory(null);
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                selectedSubcategory?.id === sub.id
                                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Child Categories Row */}
                    {selectedSubcategory?.subcategories && (
                      <div className="space-y-2 pt-2 border-t border-slate-850/50 animate-in fade-in duration-300">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 block">Child Categories:</span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {selectedSubcategory.subcategories.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => setSelectedChildCategory(child)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                selectedChildCategory?.id === child.id
                                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-white hover:border-slate-800'
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Service Category Selector - Grid Experience */}
            {activeType === 'service' && (
              <div className="mb-10 space-y-6">
                {!selectedCategory ? (
                  /* Visual Service Category Card Grid */
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Browse Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {SERVICE_TAXONOMY.map((cat) => {
                        const style = getCategoryColor(cat.name);
                        return (
                          <motion.div
                            key={cat.id}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSelectedSubcategory(null);
                              setSelectedChildCategory(null);
                            }}
                            className={`group cursor-pointer p-6 bg-slate-900 border ${style.border} rounded-[2rem] transition-all relative overflow-hidden flex flex-col justify-between h-40 ${style.glow}`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full pointer-events-none" />
                            <div className="flex items-start justify-between">
                              <div className={`p-3.5 ${style.bg} rounded-2xl ${style.text} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                                {getCategoryIcon(cat.name)}
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                              <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-violet-400 transition-colors">{cat.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {cat.subcategories?.length || 0} Subcategories
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Expanded Services Taxonomy selectors */
                  <div className="bg-slate-900/20 border border-slate-900 rounded-[2.5rem] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${getCategoryColor(selectedCategory.name).bg}`}>
                          {getCategoryIcon(selectedCategory.name)}
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Selected Category</span>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight">{selectedCategory.name}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setSelectedChildCategory(null);
                        }}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        ← Back to All
                      </button>
                    </div>

                    {/* Subcategories Row */}
                    {selectedCategory.subcategories && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Subcategories:</span>
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                          {selectedCategory.subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setSelectedSubcategory(sub);
                                setSelectedChildCategory(null);
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                selectedSubcategory?.id === sub.id
                                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Child Categories Row */}
                    {selectedSubcategory?.subcategories && (
                      <div className="space-y-2 pt-2 border-t border-slate-850/50 animate-in fade-in duration-300">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 block">Specialties:</span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {selectedSubcategory.subcategories.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => setSelectedChildCategory(child)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                selectedChildCategory?.id === child.id
                                  ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-sm'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-white hover:border-slate-800'
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Search Results Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Sidebar */}
              {query && (
                <div className="lg:col-span-1 space-y-12">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-400" /> Recent Activity
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
              <div className={`${query || selectedCategory ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                {loading ? (
                  /* High-fidelity shimmering skeleton loader grids */
                  <div className="space-y-8">
                    <div className="h-6 bg-slate-900 rounded-xl w-48 animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-4 space-y-4 animate-pulse">
                          <div className="aspect-square bg-slate-800/50 rounded-2xl w-full" />
                          <div className="space-y-2">
                            <div className="h-3 bg-slate-800/80 rounded w-1/3" />
                            <div className="h-4 bg-slate-800 rounded w-3/4" />
                            <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <div className="h-5 bg-slate-800 rounded w-1/4" />
                            <div className="h-8 w-8 bg-slate-850 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (query || activeType !== 'all' || selectedCategory) && sortedResults.length === 0 ? (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="py-16 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                      <Search className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
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
                ) : sortedResults.length > 0 ? (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    {['product', 'business', 'store', 'service', 'job']
                      .filter(type => activeType === 'all' || activeType === type)
                      .map(type => {
                        const typeResults = sortedResults.filter(r => r.entityType === type);
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

                            {type === 'product' ? (
                              /* Professional 4-column e-commerce retail grid design */
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {visibleTypeResults.map((item) => {
                                  const productObj = mapSearchEntryToProduct(item);
                                  return (
                                    <motion.div
                                      key={item.documentId}
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="w-full flex"
                                    >
                                      <ProductCard product={productObj} />
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : type === 'service' ? (
                              /* Professional 3-column Service-booking card layout */
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {visibleTypeResults.map((item) => (
                                  <motion.div
                                    key={item.documentId}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full flex"
                                  >
                                    <ServiceCard item={item} />
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              /* List-like responsive layout for non-product entities */
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

                                      <div className="flex items-center gap-1">
                                        <button
                                          title="Compare Item"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleCompare(e, item.entityId);
                                          }}
                                          className={`p-2 rounded-xl border transition-all ${
                                            compareIds.includes(item.entityId)
                                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                                          }`}
                                        >
                                          <Scale className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          title="Wishlist"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleWishlist(e, item.entityId);
                                          }}
                                          className={`p-2 rounded-xl border transition-all ${
                                            wishlistIds.includes(item.entityId)
                                              ? 'bg-rose-600/20 border-rose-500 text-rose-400'
                                              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                                          }`}
                                        >
                                          <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(item.entityId) ? 'fill-rose-400' : ''}`} />
                                        </button>
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
                                          <PriceDisplay 
                                            item={item} 
                                            type={item.entityType === 'service' ? 'service' : 'product'} 
                                            size="md" 
                                          />
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
                            )}
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
                  /* Initial State - Discovery Cards for All Marketplace Hubs */
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <section>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <div className="w-8 h-px bg-violet-500" /> Marketplace Hubs
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        <DiscoveryCard 
                          title="Products Hub" 
                          desc="Browse physical & digital inventory."
                          icon={<ShoppingBag className="w-6 h-6" />}
                          color="emerald"
                          onClick={() => setActiveType('product')}
                        />
                        <DiscoveryCard 
                          title="Services Hub" 
                          desc="Hire vetted experts and agencies."
                          icon={<Zap className="w-6 h-6" />}
                          color="violet"
                          onClick={() => setActiveType('service')}
                        />
                        <DiscoveryCard 
                          title="Businesses" 
                          desc="Connect with trusted corporations."
                          icon={<Building2 className="w-6 h-6" />}
                          color="amber"
                          onClick={() => setActiveType('business')}
                        />
                        <DiscoveryCard 
                          title="Merchant Stores" 
                          desc="Explore vendor storefronts."
                          icon={<Store className="w-6 h-6" />}
                          color="indigo"
                          onClick={() => setActiveType('store')}
                        />
                        <DiscoveryCard 
                          title="Job Board" 
                          desc="Discover Web3 careers & local roles."
                          icon={<Briefcase className="w-6 h-6" />}
                          color="rose"
                          onClick={() => setActiveType('job')}
                        />
                      </div>
                    </section>

                    <section className="bg-slate-900/20 border border-slate-900 rounded-[2.5rem] p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-xl">
                          <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md">Featured Promotion</span>
                          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-3">Ready to sell in the Pi Network?</h3>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Publish your own listings, open a merchant storefront, or showcase your expertise as a service provider. Scale your operations today with zero startup fees.
                          </p>
                        </div>
                        <button 
                          onClick={() => navigate('/seller-dashboard')}
                          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 whitespace-nowrap"
                        >
                          Launch Dashboard
                        </button>
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

const DiscoveryCard = ({ title, desc, icon, color, onClick }: any) => {
  // Map color names to classes safely to prevent tailwind compile strip issues
  const colorMap: Record<string, { bg: string, text: string, hoverBg: string }> = {
    emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-400', hoverBg: 'group-hover:bg-emerald-600/15' },
    violet: { bg: 'bg-violet-600/10', text: 'text-violet-400', hoverBg: 'group-hover:bg-violet-600/15' },
    amber: { bg: 'bg-amber-600/10', text: 'text-amber-400', hoverBg: 'group-hover:bg-amber-600/15' },
    indigo: { bg: 'bg-indigo-600/10', text: 'text-indigo-400', hoverBg: 'group-hover:bg-indigo-600/15' },
    rose: { bg: 'bg-rose-600/10', text: 'text-rose-400', hoverBg: 'group-hover:bg-rose-600/15' }
  };
  const design = colorMap[color] || colorMap.violet;

  return (
    <div 
      onClick={onClick}
      className="group p-6 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className={`p-3.5 ${design.bg} rounded-2xl w-fit mb-4 ${design.text} group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">{title}</h3>
        <p className="text-slate-500 text-[11px] font-medium mb-6 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors mt-auto">
        Browse <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
