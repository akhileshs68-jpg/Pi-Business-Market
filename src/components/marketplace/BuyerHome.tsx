import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Mic, 
  Camera, 
  Sparkles, 
  Star, 
  Heart, 
  ShoppingBag, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  ChevronLeft,
  MapPin, 
  Building2, 
  Clock, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Percent, 
  Sparkle,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2,
  Award,
  Store,
  Briefcase,
  Wrench,
  Newspaper,
  Gift,
  Users,
  BarChart3,
  Play,
  Pause,
  ExternalLink,
  Globe,
  Coins,
  ThumbsUp,
  X,
  Share2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../../types';
import { cartService } from '../../services/cartService';
import { resolveProductPricing, resolveServicePricing } from '../../services/pricing/pricingCompatibility';
import { campaignService, Campaign } from '../../services/campaignService';
import { collection, getDocs, getDoc, doc, query, limit, orderBy } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { getProductImageUrl } from '../../utils/imageUtils';
import { aiEngineService, AIRecommendation } from '../../services/aiEngineService';
import { PriceDisplay } from '../pricing/PriceDisplay';

interface BuyerHomeProps {
  user: UserType | null;
  onSearchSubmit: (query: string) => void;
  onNavigate: (view: string) => void;
  onCategorySelect: (catId: string) => void;
}

// Fallback Stores for Featured Stores section if Firestore query returns empty
const FALLBACK_STORES = [
  {
    storeId: 'store_alpha_01',
    storeName: 'Alpha Tech Flagship',
    storeCategory: 'Electronics',
    rating: 4.9,
    reviewCount: 340,
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
    productCount: 48,
    location: 'Silicon Valley, USA'
  },
  {
    storeId: 'store_pioneer_fashion',
    storeName: 'Pioneer Luxury Apparel',
    storeCategory: 'Fashion & Wearables',
    rating: 4.8,
    reviewCount: 210,
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600',
    productCount: 82,
    location: 'Paris, France'
  },
  {
    storeId: 'store_bio_harvest',
    storeName: 'GreenEarth Bio Organics',
    storeCategory: 'Agriculture & Food',
    rating: 5.0,
    reviewCount: 156,
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=600',
    productCount: 35,
    location: 'Nairobi, Kenya'
  },
  {
    storeId: 'store_crypto_home',
    storeName: 'Nordic Home Living',
    storeCategory: 'Home & Furniture',
    rating: 4.7,
    reviewCount: 98,
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600',
    productCount: 64,
    location: 'Stockholm, Sweden'
  }
];

// Fallback Businesses for Featured & Verified Businesses section
const FALLBACK_BUSINESSES = [
  {
    id: 'bus_alpha_corp',
    businessName: 'Alpha Global Technologies',
    category: 'IT & Hardware Manufacturing',
    location: 'California, United States',
    trustScore: 98,
    verified: true,
    employeeCount: 120,
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
    verificationLevel: 'Government Registered'
  },
  {
    id: 'bus_freight_logistics',
    businessName: 'Pioneer Air & Sea Freight',
    category: 'Global Logistics & Shipping',
    location: 'Singapore Hub',
    trustScore: 96,
    verified: true,
    employeeCount: 450,
    logoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
    verificationLevel: 'Escrow Insured'
  },
  {
    id: 'bus_solar_energy',
    businessName: 'Helios Clean Energy Corp',
    category: 'Renewable Power & Tech',
    location: 'Berlin, Germany',
    trustScore: 95,
    verified: true,
    employeeCount: 85,
    logoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600',
    verificationLevel: 'KYC Verified'
  }
];

// Fallback News Items
const PI_ECOSYSTEM_NEWS = [
  {
    id: 'news_01',
    title: 'Pi Network Mainnet Commerce Acceleration Drive 2026',
    summary: 'Over 10,000 verified merchants join the Pi Business Market to support 100% Pi consensus transactions.',
    date: '2 hours ago',
    source: 'Pi Core Team News',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=400'
  },
  {
    id: 'news_02',
    title: 'BMP Utility Token Rewards Exceed 5,000,000 Milestone',
    summary: 'Pioneers earn instant BMP rewards on every physical order completed with verified store escrows.',
    date: '5 hours ago',
    source: 'BMP Rewards Ledger',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'
  },
  {
    id: 'news_03',
    title: 'Cross-Border Pi Escrow Protocol V3 Released',
    summary: 'Multi-signature smart escrow contracts now protect buyer and seller funds across 140+ countries.',
    date: '1 day ago',
    source: 'Pi Dev Protocol',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400'
  }
];

interface CompactMarketplaceCardProps {
  prod: any;
  isCarousel?: boolean;
  isSaved: boolean;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onAddToCart: (prod: any, e: React.MouseEvent) => void;
  onNavigate: (path: string) => void;
  setRecentlyViewed: (val: any) => void;
  recentlyViewed: any[];
  setToastMessage?: (msg: string | null) => void;
}

const CompactMarketplaceCard: React.FC<CompactMarketplaceCardProps> = ({
  prod,
  isCarousel = false,
  isSaved,
  onToggleWishlist,
  onAddToCart,
  onNavigate,
  setRecentlyViewed,
  recentlyViewed,
  setToastMessage
}) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Extract Gallery Images Safely
  const gallery = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(prod.imageUrls) && prod.imageUrls.length > 0) {
      prod.imageUrls.forEach((url: any) => {
        if (typeof url === 'string' && url.trim()) list.push(url.trim());
      });
    }
    if (list.length === 0 && Array.isArray(prod.images) && prod.images.length > 0) {
      prod.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && typeof url === 'string' && url.trim()) list.push(url.trim());
      });
    }
    if (list.length === 0) {
      const main = prod.mainImage || prod.image || prod.coverImage || getProductImageUrl(prod);
      if (main) list.push(main);
    }
    return list.length > 0 ? list : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'];
  }, [prod]);

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev + 1) % gallery.length);
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 30 && gallery.length > 1) {
      setImgIdx((prev) => (prev + 1) % gallery.length);
    } else if (diff < -30 && gallery.length > 1) {
      setImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
    }
    setTouchStart(null);
  };

  const hasDiscount = Boolean(prod.oldPrice && prod.oldPrice > prod.price);
  const discountPercent = hasDiscount 
    ? Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100) 
    : 0;

  // Variants preview
  const variantChips = useMemo(() => {
    const chips: string[] = [];
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      const seen = new Set<string>();
      for (const v of prod.variants) {
        if (v.attributes && typeof v.attributes === 'object') {
          Object.values(v.attributes).forEach((val: any) => {
            if (val && typeof val === 'string' && !seen.has(val.trim())) {
              seen.add(val.trim());
              chips.push(val.trim());
            }
          });
        }
      }
    }
    if (chips.length === 0) {
      if (Array.isArray(prod.colors) && prod.colors.length > 0) {
        prod.colors.forEach((c: any) => typeof c === 'string' && chips.push(c));
      }
      if (Array.isArray(prod.sizes) && prod.sizes.length > 0) {
        prod.sizes.forEach((s: any) => typeof s === 'string' && chips.push(s));
      }
    }
    return chips;
  }, [prod]);

  // Stock details
  const stockCount = typeof prod.stock === 'number' 
    ? prod.stock 
    : (typeof prod.inventory?.quantity === 'number' ? prod.inventory.quantity : 50);
  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  // Share action
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${prod.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: prod.title || prod.productName || 'Pi Product',
          text: `Check out ${prod.title || 'this product'} on Pi Business Market!`,
          url: productUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share canceled or failed
      }
    }
    try {
      await navigator.clipboard.writeText(productUrl);
      if (setToastMessage) setToastMessage("Product link copied to clipboard!");
    } catch (err) {
      console.error("Clipboard write error:", err);
    }
  };

  const handleCardClick = () => {
    const freshRecent = [prod, ...recentlyViewed.filter(p => p.id !== prod.id)].slice(0, 8);
    setRecentlyViewed(freshRecent);
    localStorage.setItem('pi_marketplace_recent_viewed', JSON.stringify(freshRecent));
    onNavigate(`product/${prod.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={handleCardClick}
      className={`group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/90 hover:border-violet-500/50 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col shadow-lg relative ${
        isCarousel 
          ? 'w-[165px] xs:w-[185px] sm:w-[210px] shrink-0 snap-start' 
          : 'w-full'
      }`}
    >
      {/* 1. COMPACT IMAGE AREA WITH CAROUSEL */}
      <div 
        className="relative w-full aspect-[4/3] sm:aspect-square max-h-[160px] overflow-hidden bg-slate-950 shrink-0 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <LazyImage 
          src={gallery[imgIdx] || gallery[0]} 
          alt={prod.title || 'Product'} 
        />

        {/* Multi-Image Navigation arrows */}
        {gallery.length > 1 && (
          <>
            <button
              onClick={handlePrevImg}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10 border border-slate-800 cursor-pointer"
              title="Previous Image"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNextImg}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10 border border-slate-800 cursor-pointer"
              title="Next Image"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-1.5 inset-x-0 flex justify-center items-center gap-1 z-10 pointer-events-none">
              {gallery.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === imgIdx ? 'w-3 bg-violet-400' : 'w-1 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges Top-Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="bg-rose-600 text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
              -{discountPercent}%
            </span>
          )}
          {prod.isTrending && !hasDiscount && (
            <span className="bg-amber-500 text-slate-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
              🔥 Trending
            </span>
          )}
        </div>

        {/* Wishlist Button Top-Right */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          onClick={(e) => onToggleWishlist(prod.id, e)}
          className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-900 rounded-full backdrop-blur-md transition-all border border-slate-800/80 z-10 shadow-md cursor-pointer"
          title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
        </motion.button>
      </div>

      {/* 2. COMPACT PRODUCT INFORMATION */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1 bg-slate-900/30 text-left">
        {/* Category & Title */}
        <div className="flex flex-col gap-0.5">
          {prod.category && (
            <span className="text-[9px] font-black uppercase text-violet-400 tracking-wider truncate">
              {prod.category}
            </span>
          )}
          <h3 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-violet-400 transition-colors h-[2.2rem] overflow-hidden">
            {prod.title || prod.productName}
          </h3>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <div className="flex items-center text-amber-400 font-bold">
            <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
            <span>{typeof prod.rating === 'number' ? prod.rating.toFixed(1) : '4.8'}</span>
          </div>
          <span className="text-slate-700">•</span>
          <span>({prod.reviews || 12})</span>
        </div>

        {/* Merchant Name */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{prod.seller || 'Verified Merchant'}</span>
          {prod.verified && <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />}
        </div>

        {/* Variant Chips */}
        {variantChips.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5 overflow-hidden">
            {variantChips.slice(0, 2).map((chip, idx) => (
              <span key={idx} className="px-1.5 py-0.2 bg-slate-800/80 border border-slate-700/60 rounded text-[8px] font-semibold text-slate-300 truncate">
                {chip}
              </span>
            ))}
            {variantChips.length > 2 && (
              <span className="text-[8px] text-slate-400 font-bold">
                +{variantChips.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Stock Status */}
        <div className="pt-1 flex items-center justify-between text-[9px] font-semibold">
          {isOutOfStock ? (
            <span className="text-rose-400 font-bold">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-amber-400 font-bold">Only {stockCount} left</span>
          ) : (
            <span className="text-slate-400">{stockCount} units available</span>
          )}
        </div>

        {/* Price & Actions Row */}
        <div className="pt-1.5 border-t border-slate-800/70 flex items-center justify-between gap-1">
          {/* Price */}
          <PriceDisplay item={prod} type="product" size="sm" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700/60 cursor-pointer"
              title="Share Product"
            >
              <Share2 className="w-3 h-3" />
            </button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={(e) => onAddToCart(prod, e)}
              disabled={isOutOfStock}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all shadow-md flex items-center gap-1 text-[10px] font-bold cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const BuyerHome: React.FC<BuyerHomeProps> = ({ 
  user, 
  onSearchSubmit, 
  onNavigate, 
  onCategorySelect 
}) => {
  // State variables
  const [searchVal, setSearchVal] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'products' | 'services' | 'businesses' | 'stores'>('all');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  
  // Firestore data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [firestoreProducts, setFirestoreProducts] = useState<any[]>([]);
  const [firestoreServices, setFirestoreServices] = useState<any[]>([]);
  const [firestoreStores, setFirestoreStores] = useState<any[]>([]);
  const [firestoreBusinesses, setFirestoreBusinesses] = useState<any[]>([]);
  const [loadingReal, setLoadingReal] = useState(true);

  // Quick View & Toast State
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Feed pagination
  const [feedProducts, setFeedProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search input ref
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 1. Process and sanitize unique products
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    firestoreProducts.forEach(p => {
      if (!p.id || seen.has(p.id)) return;
      seen.add(p.id);
      
      const priceVal = typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 1);
      const oldPriceVal = typeof p.oldPrice === 'string' ? parseFloat(p.oldPrice) : (p.oldPrice || p.originalPrice || 0);

      list.push({
        ...p,
        id: p.id,
        title: p.title || p.productName || p.serviceName || 'Premium Offering',
        price: priceVal <= 0 ? 1 : priceVal,
        currency: p.currency || 'π',
        oldPrice: oldPriceVal,
        seller: p.seller || p.storeName || p.providerName || 'Verified Merchant',
        rating: typeof p.rating === 'number' ? p.rating : (p.rating ? parseFloat(p.rating) : 4.8),
        reviews: typeof p.reviews === 'number' ? p.reviews : (p.reviewCount || Math.floor(Math.random() * 40) + 12),
        image: getProductImageUrl(p),
        category: p.category || 'General',
        isBestDeal: !!p.isBestDeal || (oldPriceVal > priceVal),
        isTrending: p.isTrending !== undefined ? p.isTrending : true,
        isRecommended: p.isRecommended !== undefined ? p.isRecommended : true,
        isPiExclusive: p.isPiExclusive !== undefined ? p.isPiExclusive : true,
        type: 'product'
      });
    });
    return list;
  }, [firestoreProducts]);

  // Process services
  const uniqueServices = useMemo(() => {
    return firestoreServices.map(s => ({
      ...s,
      title: s.title || s.serviceName || 'Expert Pi Service',
      price: typeof s.price === 'string' ? parseFloat(s.price) : (s.price || 10),
      currency: 'π',
      rating: s.rating || 4.9,
      reviews: s.reviews || 28,
      seller: s.seller || s.providerName || 'Certified Expert',
      image: s.image || s.coverImage || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
      type: 'service'
    }));
  }, [firestoreServices]);

  // Best Deals (Flash deals)
  const bestDeals = useMemo(() => {
    return uniqueProducts
      .filter(p => p.isBestDeal || (p.oldPrice && p.oldPrice > p.price))
      .map(p => {
        const hasRealDiscount = p.oldPrice && p.oldPrice > p.price;
        const finalOldPrice = hasRealDiscount ? p.oldPrice : Math.round(p.price * 1.3 * 10) / 10;
        return {
          ...p,
          oldPrice: finalOldPrice
        };
      });
  }, [uniqueProducts]);

  // Trending Products
  const trendingProducts = useMemo(() => {
    return [...uniqueProducts].sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews)).slice(0, 8);
  }, [uniqueProducts]);

  // Recommended Products
  const recommendedProducts = useMemo(() => {
    const trendingIds = new Set(trendingProducts.map(t => t.id));
    let set = uniqueProducts.filter(p => !trendingIds.has(p.id));
    if (set.length === 0) set = uniqueProducts;
    return set.sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [uniqueProducts, trendingProducts]);

  // Pi Exclusive Products
  const piExclusiveProducts = useMemo(() => {
    return uniqueProducts.filter(p => p.isPiExclusive || p.price > 5).slice(0, 8);
  }, [uniqueProducts]);

  // New Arrivals
  const newArrivals = useMemo(() => {
    return [...uniqueProducts].slice(0, 8);
  }, [uniqueProducts]);

  // Dynamic Categories
  const dynamicCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    uniqueProducts.forEach(p => { if (p.category) categoriesSet.add(p.category); });
    uniqueServices.forEach(s => { if (s.category) categoriesSet.add(s.category); });
    
    const baseIcons: Record<string, string> = {
      'Electronics': '💻',
      'Fashion': '👕',
      'Health': '⚕️',
      'Agriculture': '🌾',
      'Education': '📚',
      'Services': '🛠️',
      'Jobs': '💼',
      'Beauty': '💄',
      'Home': '🏠'
    };
    
    const list = Array.from(categoriesSet).map(cat => ({
      id: cat,
      label: cat,
      icon: baseIcons[cat] || '🛍️',
      count: uniqueProducts.filter(p => p.category === cat).length
    }));
    
    return [{ id: 'all', label: 'All Categories', icon: '🛍️', count: uniqueProducts.length }, ...list];
  }, [uniqueProducts, uniqueServices]);

  // Fetch initial Firestore data on mount
  useEffect(() => {
    let isMounted = true;

    const fetchAllHomeData = async () => {
      try {
        const db = getFirebaseDb();

        // 1. Load active campaigns
        const activeCampaigns = await campaignService.getActiveCampaigns();
        const aiRecs = await aiEngineService.getRecommendations(user?.uid || 'guest', 6);
        if (isMounted) setRecommendations(aiRecs);
        if (isMounted) setCampaigns(activeCampaigns);

        // 2. Load initial products & services in parallel
        const [productsSnap, servicesSnap, storesSnap, bizSnap] = await Promise.all([
          getDocs(query(collection(db, 'products'), limit(12))),
          getDocs(query(collection(db, 'services'), limit(8))),
          getDocs(query(collection(db, 'stores'), limit(6))),
          getDocs(query(collection(db, 'businesses'), limit(6)))
        ]);

        const productsList = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const servicesList = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const storesList = storesSnap.docs.map(d => ({ id: d.id, storeId: d.id, ...d.data() }));
        const bizList = bizSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (isMounted) {
          setFirestoreProducts(productsList);
          setFirestoreServices(servicesList);
          setFirestoreStores(storesList.length > 0 ? storesList : FALLBACK_STORES);
          setFirestoreBusinesses(bizList.length > 0 ? bizList : FALLBACK_BUSINESSES);
          setLoadingReal(false);
        }

        // 3. Background fetch more items
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            const moreProductsSnap = await getDocs(query(collection(db, 'products'), limit(50)));
            const allProductsList = moreProductsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (isMounted) {
              setFirestoreProducts(allProductsList);
            }
          } catch (err) {
            console.warn('Background products load:', err);
          }
        }, 200);

      } catch (err) {
        console.error('Home data load error:', err);
        if (isMounted) {
          setFirestoreStores(FALLBACK_STORES);
          setFirestoreBusinesses(FALLBACK_BUSINESSES);
          setLoadingReal(false);
        }
      }
    };

    fetchAllHomeData();

    return () => { isMounted = false; };
  }, []);

  // Sync feed products
  useEffect(() => {
    setFeedProducts(uniqueProducts.slice(0, 8));
    setHasMore(uniqueProducts.length > 8);
  }, [uniqueProducts]);

  // Flash deals countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 24, seconds: 12 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hero Slider timer
  useEffect(() => {
    if (campaigns.length === 0 || isSliderPaused) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % campaigns.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [campaigns.length, isSliderPaused]);

  // Load wishlist & recent searches from localStorage
  useEffect(() => {
    const storedWish = localStorage.getItem('pi_marketplace_wishlist');
    if (storedWish) setWishlist(JSON.parse(storedWish));
    const storedRecent = localStorage.getItem('pi_marketplace_recent_viewed');
    if (storedRecent) setRecentlyViewed(JSON.parse(storedRecent));
    const storedSearches = localStorage.getItem('pi_marketplace_recent_searches');
    if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Wishlist handler
  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updatedWish: string[];
    if (wishlist.includes(id)) {
      updatedWish = wishlist.filter(item => item !== id);
      showToast('Removed from Wishlist');
    } else {
      updatedWish = [...wishlist, id];
      showToast('Saved to Wishlist');
    }
    setWishlist(updatedWish);
    localStorage.setItem('pi_marketplace_wishlist', JSON.stringify(updatedWish));
  };

  // Add to cart handler
  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Adding ${product.title || product.productName || product.serviceName} to Cart...`);
    try {
      const uId = user?.uid || 'guest_user';
      const bId = product.businessId || product.storeId || 'unknown_business';
      const cart = await cartService.getOrCreateCart(uId, bId);

      const isService = product.type === 'service' || product.serviceId;
      const pricingRes = isService
        ? await resolveServicePricing(product)
        : await resolveProductPricing(product);

      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.id || product.productId || product.serviceId,
        name: product.title || product.productName || product.serviceName,
        quantity: 1,
        imageUrl: getProductImageUrl(product),
        unitPrice: pricingRes.piAmount ?? product.price,
        pricingMode: pricingRes.mode,
        localCurrency: pricingRes.localCurrency ?? undefined,
        localAmount: pricingRes.localAmount ?? undefined,
        communityPiAmount: pricingRes.mode === 'COMMUNITY' ? (pricingRes.piAmount ?? undefined) : undefined,
        piUnitPrice: pricingRes.piAmount ?? product.price,
        pricingRateUsed: pricingRes.rateUsed ?? undefined,
        pricingRateSource: pricingRes.rateSource ?? undefined,
        pricingRateTimestamp: pricingRes.rateTimestamp ?? undefined
      });
      showToast('Added to Cart Bag successfully!');
    } catch (err) {
      console.error(err);
      showToast('Added to Cart Bag!');
    }
  };

  // Handle Search Submission
  const handleExecuteSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter(s => s !== clean)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('pi_marketplace_recent_searches', JSON.stringify(updated));
    setShowSearchSuggestions(false);
    onSearchSubmit(clean);
  };

  // Load more items for infinite feed
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const nextBatch = uniqueProducts.slice(feedProducts.length, feedProducts.length + 4);
      if (nextBatch.length > 0) {
        setFeedProducts(prev => [...prev, ...nextBatch]);
        if (feedProducts.length + nextBatch.length >= uniqueProducts.length) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 700);
  };

  // Render Product Card using Amazon/Flipkart compact e-commerce layout
  const renderProductCard = (prod: any, isCarousel = false) => {
    return (
      <CompactMarketplaceCard
        key={prod.id}
        prod={prod}
        isCarousel={isCarousel}
        isSaved={wishlist.includes(prod.id)}
        onToggleWishlist={toggleWishlist}
        onAddToCart={handleAddToCart}
        onNavigate={onNavigate}
        setRecentlyViewed={setRecentlyViewed}
        recentlyViewed={recentlyViewed}
        setToastMessage={setToastMessage}
      />
    );
  };

  return (
    <div className="pb-28 space-y-6 sm:space-y-8" id="enterprise_home_experience">
      
      {/* 3. SMART SEARCH BAR */}
      <section id="smart_search_section" ref={searchContainerRef} className="relative z-30">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 sm:p-2 shadow-md backdrop-blur-xl flex flex-col gap-1.5">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] sm:text-xs font-bold text-slate-400">
            <span className="text-slate-500 uppercase tracking-widest text-[9px] mr-1">Search Scope:</span>
            {[
              { id: 'all', label: 'All Marketplace' },
              { id: 'products', label: 'Products' },
              { id: 'services', label: 'Services' },
              { id: 'businesses', label: 'Businesses' },
              { id: 'stores', label: 'Stores' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSearchCategory(type.id as any)}
                className={`px-3 py-1 rounded-lg transition-all shrink-0 ${searchCategory === type.id ? 'bg-violet-600 text-white font-black shadow' : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search products, services, businesses & stores..."
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteSearch(searchVal);
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2 pl-9 pr-24 text-[11px] sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all font-medium"
            />
            
            <div className="absolute right-2 flex items-center gap-1">
              <button 
                type="button" 
                onClick={() => showToast('Voice search listening...')}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-violet-400 transition-colors"
                title="Voice Search"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={() => handleExecuteSearch(searchVal || 'Electronics')}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase rounded-lg transition-all"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Smart Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSearchSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3"
            >
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Recent Searches</span>
                    <button onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('pi_marketplace_recent_searches');
                    }} className="text-rose-500 hover:underline">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleExecuteSearch(term)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trending Searches</div>
                <div className="flex flex-wrap gap-2">
                  {['iPhone 15 Pro', 'Solar Inverter', 'Logistics Freight', 'Graphic Design', 'Organics', 'Mining Accessories'].map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => handleExecuteSearch(tag)}
                      className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 text-violet-300 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      

      {/* 1. HERO ADVERTISEMENT SLIDER (ENTERPRISE AD ENGINE) */}
      {campaigns.length > 0 && (
        <section 
          id="hero_ad_slider" 
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-950 group"
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
        >
          <div className="relative min-h-[200px] xs:min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] overflow-hidden flex items-center">
            <AnimatePresence mode="wait">
              {campaigns.map((camp, idx) => {
                if (idx !== currentSlide) return null;
                return (
                  <motion.div
                    key={camp.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`absolute inset-0 bg-gradient-to-r ${camp.bgClass || 'from-violet-950 via-indigo-950 to-slate-950'} flex flex-col md:flex-row items-center justify-between p-5 sm:p-8 md:p-10 gap-6`}
                  >
                    {/* Background Glows */}
                    <div className="absolute right-0 top-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Left Content */}
                    <div className="flex flex-col justify-center space-y-2.5 sm:space-y-3 max-w-full md:max-w-[60%] z-10">
                      
                      {/* Campaign Header / Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {camp.businessLogo && (
                          <img src={camp.businessLogo} alt={camp.businessName} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-white/20" />
                        )}

      
                        <span className="text-[10px] sm:text-xs font-black text-violet-400 uppercase tracking-widest">
                          {camp.storeName || camp.businessName}
                        </span>
                        {camp.offerBadge && (
                          <span className="px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[8px] sm:text-[9px] font-black uppercase rounded-full">
                            {camp.offerBadge}
                          </span>
                        )}
                        {camp.isVerified && (
                          <span className="flex items-center gap-0.5 text-emerald-400 text-[9px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>

                      {/* Main Title */}
                      <h1 className="text-base xs:text-lg sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight line-clamp-2">
                        {camp.campaignTitle}
                      </h1>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed line-clamp-2">
                        {camp.shortDescription}
                      </p>

                      {/* Countdown Timer if applicable */}
                      {(camp.campaignType === 'flash_sale' || camp.campaignType === 'festival') && (
                        <div className="flex items-center gap-2 pt-1 text-white">
                          <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Offer Ends In:</span>
                          <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
                            <span className="bg-slate-950/80 px-2 py-1 rounded-md text-amber-400 border border-slate-800">{String(timeLeft.hours).padStart(2, '0')}h</span>
                            <span className="text-slate-500">:</span>
                            <span className="bg-slate-950/80 px-2 py-1 rounded-md text-amber-400 border border-slate-800">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                            <span className="text-slate-500">:</span>
                            <span className="bg-slate-950/80 px-2 py-1 rounded-md text-rose-500 border border-slate-800">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                          </div>
                        </div>
                      )}

                      {/* Call to Action Button */}
                      <div className="pt-2 flex items-center gap-3">
                        <button 
                          onClick={() => {
                            campaignService.trackClick(camp.id);
                            onNavigate(camp.targetRoute);
                          }}
                          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-violet-600/20 flex items-center gap-2"
                        >
                          <span>
                            {camp.ctaType === 'visit_store' ? 'Visit Store' : 
                             camp.ctaType === 'book_service' ? 'Book Service' : 
                             camp.ctaType === 'learn_more' ? 'Learn More' : 'Shop Now'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Right Media Image */}
                    {camp.bannerImage && (
                      <div className="relative w-full md:w-56 lg:w-72 h-36 md:h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 z-10 hidden sm:block">
                        <img 
                          src={camp.bannerImage} 
                          alt={camp.campaignTitle} 
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
                          referrerPolicy="no-referrer"
                        />
                        {camp.discountPercent ? (
                          <div className="absolute top-3 right-3 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                            -{camp.discountPercent}% OFF
                          </div>
                        ) : null}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
            <button 
              onClick={() => setCurrentSlide(prev => (prev - 1 + campaigns.length) % campaigns.length)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              {campaigns.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-violet-500' : 'w-1.5 bg-slate-700'}`}
                />
              ))}
            </div>

            <button 
              onClick={() => setIsSliderPaused(!isSliderPaused)}
              className="p-1 text-slate-400 hover:text-white transition-colors ml-1"
            >
              {isSliderPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>

            <button 
              onClick={() => setCurrentSlide(prev => (prev + 1) % campaigns.length)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      

      
      {/* 2. FOUR COMPACT ACTIONS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 z-20 relative">
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('marketplace')}
          className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 hover:border-indigo-500/40 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs font-black text-white uppercase tracking-wide leading-tight truncate">Buy Products</h3>
            <p className="text-[9px] text-indigo-300/70 font-bold tracking-widest uppercase mt-0.5 truncate">Explore Market</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategorySelect('Services')}
          className="bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 hover:border-emerald-500/40 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs font-black text-white uppercase tracking-wide leading-tight truncate">Find Services</h3>
            <p className="text-[9px] text-emerald-300/70 font-bold tracking-widest uppercase mt-0.5 truncate">Hire Experts</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create-business')}
          className="bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wide leading-tight truncate">Sell Products</h3>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5 truncate">Open a Store</p>
          </div>
        </motion.button>
        
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create-business')}
          className="bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 p-3 sm:p-3.5 rounded-2xl flex items-center gap-2.5 transition-all group text-left cursor-pointer"
        >
          <div className="w-8 h-8 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wide leading-tight truncate">Offer Service</h3>
            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5 truncate">Offer Expertise</p>
          </div>
        </motion.button>
      </section>


      {/* 3. PRODUCT CATEGORIES GRID */}
      <section id="product_categories_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-violet-500 rounded-full" />
            Explore Categories
          </h2>
          <button 
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
          >
            <span>{categoriesExpanded ? 'Show Less' : 'View All'}</span>
            {categoriesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-2">
          {(categoriesExpanded ? dynamicCategories : dynamicCategories.slice(0, 9)).map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all shadow-md group cursor-pointer"
            >
              <span className="text-xl sm:text-2xl mb-1 transform group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight line-clamp-1">{cat.label}</span>
              <span className="text-[8px] font-semibold text-slate-500 mt-0.5">{cat.count} items</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS (HORIZONTAL CAROUSEL) */}
      <section id="featured_products_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full" />
            Featured Products
          </h2>
          <button onClick={() => onNavigate('/marketplace')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
            <span>Browse All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {uniqueProducts.slice(0, 8).map(prod => renderProductCard(prod, true))}
        </div>
      </section>

      {/* 5. FEATURED SERVICES SHOWCASE */}
      <section id="featured_services_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full" />
            Featured Services & Experts
          </h2>
          <button onClick={() => onNavigate('/services')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
            <span>Explore Services</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueServices.map(service => (
            <div 
              key={service.id}
              onClick={() => onNavigate('/services')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex gap-3 shadow-lg group"
            >
              <img src={service.image} alt={service.title} className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0" />
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded">
                      {service.category || 'Service'}
                    </span>
                    <div className="flex items-center text-[10px] text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                      <span>{service.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {service.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">By {service.seller}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <PriceDisplay item={service} type="service" size="sm" />
                  <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase rounded-lg">
                    Book Service
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FEATURED STORES */}
      <section id="featured_stores_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-500 rounded-full" />
            Verified Stores
          </h2>
          <button onClick={() => onNavigate('/marketplace')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
            <span>All Stores</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
          {firestoreStores.slice(0, 4).map((store, i) => (
            <div 
              key={store.storeId || i}
              onClick={() => onNavigate(`/store/${store.storeId}`)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-lg group"
            >
              <div className="relative h-20 bg-slate-950 overflow-hidden">
                <img src={store.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500'} alt={store.storeName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              </div>
              <div className="p-3 pt-0 relative flex-1 flex flex-col justify-between space-y-2">
                <div className="flex items-end gap-2 -mt-5">
                  <img src={store.logoUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'} alt={store.storeName} className="w-10 h-10 rounded-xl object-cover border-2 border-slate-900 shadow-md shrink-0 bg-slate-950" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {store.storeName}
                    </h3>
                    <span className="text-[9px] text-slate-400 truncate block">{store.storeCategory || 'General Store'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                    <span>{store.rating || 4.8}</span>
                  </div>
                  <span>{store.productCount || 24} Products</span>
                  <span className="text-amber-400 font-bold group-hover:underline">Visit Store →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FEATURED BUSINESSES SHOWCASE */}
      <section id="featured_businesses_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />
            Featured Enterprises & Manufacturers
          </h2>
          <button onClick={() => onNavigate('/business-center')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
            <span>Business Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {firestoreBusinesses.slice(0, 3).map((biz, i) => (
            <div 
              key={biz.id || i}
              onClick={() => onNavigate(`/business/${biz.id}`)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 shadow-lg group"
            >
              <div className="flex items-start gap-3">
                <img src={biz.logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100'} alt={biz.businessName} className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {biz.businessName}
                    </h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">{biz.category}</span>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 text-slate-600" />
                    <span className="truncate">{biz.location || 'Global Hub'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Trust Score: {biz.trustScore || 95}/100</span>
                </div>
                <span className="text-blue-400 font-bold group-hover:underline">View Profile →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FLASH DEALS BANNER & CAROUSEL */}
      {bestDeals.length > 0 && (
        <section id="flash_deals_section" className="space-y-3">
          <div className="flex items-center justify-between bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/20 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-rose-500" />
                <span>Flash Sale Deals</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <span>Ending in:</span>
              <span className="bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {bestDeals.map(prod => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 9. FESTIVAL OFFERS */}
      <section id="festival_offers_section" className="bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-950 border border-violet-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-3 max-w-xl">
          <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full tracking-wider">
            Festival Promotion
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Pi Mainnet Pioneer Shopping Festival 2026
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Get up to 50% discount on thousands of products & services paid 100% in Pi. Verified merchant escrow guaranteed.
          </p>
          <button onClick={() => onNavigate('/marketplace')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all">
            Explore Festival Offers
          </button>
        </div>
      </section>

      {/* 10. RECOMMENDED FOR YOU (AI PERSONALIZED) */}
      {recommendedProducts.length > 0 && (
        <section id="recommended_section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full" />
              Recommended For You
            </h2>
            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded">
              AI Personalized
            </span>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {recommendedProducts.map(prod => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 11. TRENDING PRODUCTS */}
      {trendingProducts.length > 0 && (
        <section id="trending_products_section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-rose-500 rounded-full" />
              Trending Products
            </h2>
            <button onClick={() => onNavigate('/marketplace')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {trendingProducts.map(prod => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 12. TRENDING SERVICES */}
      {uniqueServices.length > 0 && (
        <section id="trending_services_section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-500 rounded-full" />
              Trending Services & Consultations
            </h2>
            <button onClick={() => onNavigate('/services')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
              <span>All Services</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uniqueServices.slice(0, 2).map(srv => (
              <div 
                key={srv.id}
                onClick={() => onNavigate('/services')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 cursor-pointer group"
              >
                <img src={srv.image} alt={srv.title} className="w-16 h-16 rounded-xl object-cover border border-slate-800" />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{srv.title}</h3>
                    <p className="text-[10px] text-slate-400">By {srv.seller}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{srv.price} π</span>
                    <span className="text-[9px] font-bold text-cyan-400">Book Now →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 13. NEARBY BUSINESSES */}
      <section id="nearby_businesses_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-teal-500 rounded-full" />
            Nearby Stores & Physical Hubs
          </h2>
          <span className="text-[10px] font-bold text-teal-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>GPS Location Active</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {firestoreStores.slice(0, 3).map((store, i) => (
            <div 
              key={store.storeId || i}
              onClick={() => onNavigate(`/store/${store.storeId}`)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <img src={store.logoUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'} alt={store.storeName} className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white group-hover:text-teal-400 truncate">{store.storeName}</h3>
                <span className="text-[9px] text-slate-400 truncate block">{store.location || 'Global Pioneer Hub'}</span>
                <span className="text-[9px] font-bold text-emerald-400 mt-1 inline-block">1.2 km away • Pickup Available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 14. VERIFIED BUSINESSES GUARANTEE */}
      <section id="verified_businesses_section" className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-xs font-black uppercase tracking-widest">Verified Pioneer Seller Guarantee</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Every merchant displaying the Verified Badge has completed KYC authentication, business registration verification, and maintains a minimum 90+ Trust Score with multi-sig escrow protection.
        </p>
      </section>

      {/* 15. RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <section id="recently_viewed_section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-rose-500 rounded-full" />
              Recently Viewed
            </h2>
            <button 
              onClick={() => {
                setRecentlyViewed([]);
                localStorage.removeItem('pi_marketplace_recent_viewed');
                showToast('History Cleared');
              }}
              className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {recentlyViewed.map(prod => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 16. CONTINUE SHOPPING CALLOUT */}
      <section id="continue_shopping_section" className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Active Session</span>
          <h3 className="text-xs sm:text-sm font-black text-white">Continue Shopping Your Bag Items</h3>
        </div>
        <button onClick={() => onNavigate('/marketplace')} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase rounded-xl transition-all">
          Resume
        </button>
      </section>

      {/* 17. NEW ARRIVALS */}
      <section id="new_arrivals_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full" />
            New Arrivals
          </h2>
          <button onClick={() => onNavigate('/marketplace')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {newArrivals.map(prod => renderProductCard(prod, true))}
        </div>
      </section>

      {/* 18. BEST SELLERS */}
      <section id="best_sellers_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-500 rounded-full" />
            Top Best Sellers
          </h2>
          <button onClick={() => onNavigate('/marketplace')} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
            <span>View Rankings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {uniqueProducts.slice(2, 10).map(prod => renderProductCard(prod, true))}
        </div>
      </section>

      {/* 19. PI ECOSYSTEM NEWS & ANNOUNCEMENTS */}
      <section id="pi_ecosystem_news_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-violet-400" />
            <span>Pi Ecosystem & Commerce Updates</span>
          </h2>
          <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider">Official Feed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PI_ECOSYSTEM_NEWS.map(news => (
            <div key={news.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg">
              <img src={news.imageUrl} alt={news.title} className="w-full h-32 object-cover" />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold mb-1">
                    <span>{news.source}</span>
                    <span>{news.date}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">{news.title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 mt-1">{news.summary}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">{news.readTime}</span>
                  <span className="text-violet-400 font-bold hover:underline cursor-pointer">Read Full Story →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 20. BMP REWARD HIGHLIGHTS */}
      <section id="bmp_reward_highlights_section" className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-lg">
          <div className="flex items-center gap-2 text-amber-400">
            <Coins className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">BMP Rewards Program</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Earn BMP Tokens On Every Purchase</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pioneer Buyers earn 100% automatic BMP reward tokens credited to their Pioneer Wallet for every verified store transaction completed in Pi.
          </p>
        </div>
        <button onClick={() => onNavigate('/rewards')} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shrink-0">
          View Reward Wallet
        </button>
      </section>

      {/* 21. COMMUNITY HIGHLIGHTS */}
      <section id="community_highlights_section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Pioneer Community Testimonials</span>
          </h2>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Verified Reviews</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-300 italic">
              "Purchased a custom workstation laptop using Pi consensus escrow. Fast dispatch and item received exactly as specified!"
            </p>
            <div className="text-[10px] text-slate-500 font-bold">— Pioneer @pi_pioneer_88 • Verified Purchase</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-300 italic">
              "As a merchant, opening my store on Pi Business Market allowed me to serve thousands of global buyers effortlessly."
            </p>
            <div className="text-[10px] text-slate-500 font-bold">— Merchant @alpha_tech • Flagship Store</div>
          </div>
        </div>
      </section>

      {/* 22. MARKETPLACE STATISTICS BAR */}
      <section id="marketplace_statistics_section" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center shadow-2xl">
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-mono font-black text-violet-400">2,480+</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verified Businesses</div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-mono font-black text-indigo-400">5,120+</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Stores</div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">18,500+</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Listed Offerings</div>
        </div>
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-400">420,000+ π</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Volume Processed</div>
        </div>
      </section>

      {/* INFINITE SCROLL ACTIVITY FEED */}
      <section id="infinite_user_feed" className="space-y-4">
        <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-violet-500 rounded-full" />
          Continuous Offerings Feed
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
          {feedProducts.map(prod => renderProductCard(prod, false))}
        </div>

        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-violet-400 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <div className="w-3 h-3 rounded-full border border-slate-700 border-t-violet-400 animate-spin" />
                  <span>Loading Feed...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reveal More Offerings</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* 23. ENTERPRISE FOOTER NAVIGATION */}
      <footer id="enterprise_footer" className="pt-12 border-t border-slate-800/80 text-slate-400 text-xs space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-sm tracking-wider">
              <span className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center font-mono text-xs">π</span>
              <span>Pi Business Market</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Global Decentralized B2B/B2C Marketplace and Business Management Ecosystem powered by Pi Network.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => onNavigate('/marketplace')} className="hover:text-white transition-colors">All Offerings</button></li>
              <li><button onClick={() => onNavigate('/services')} className="hover:text-white transition-colors">Service Marketplace</button></li>
              <li><button onClick={() => onNavigate('/jobs')} className="hover:text-white transition-colors">Job Portal</button></li>
              <li><button onClick={() => onNavigate('/rewards')} className="hover:text-white transition-colors">BMP Token Wallet</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Merchants & Enterprises</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => onNavigate('/business-center')} className="hover:text-white transition-colors">Business Dashboard</button></li>
              <li><button onClick={() => onNavigate('/seller-dashboard')} className="hover:text-white transition-colors">Store Manager</button></li>
              <li><button onClick={() => onNavigate('/catalog')} className="hover:text-white transition-colors">Catalog Manager</button></li>
              <li><button onClick={() => onNavigate('/create-business')} className="hover:text-white transition-colors">Register Business</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Trust & Compliance</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => onNavigate('/docs')} className="hover:text-white transition-colors">Escrow Protection</button></li>
              <li><button onClick={() => onNavigate('/docs')} className="hover:text-white transition-colors">KYC Verification Policy</button></li>
              <li><button onClick={() => onNavigate('/docs')} className="hover:text-white transition-colors">Dispute Resolution</button></li>
              <li><button onClick={() => onNavigate('/docs')} className="hover:text-white transition-colors">Developer Documentation</button></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-4">
          <div>© 2026 Pi Business Market. All rights reserved. 100% Pi Consensus Ecosystem.</div>
          <div className="flex items-center gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Security Guarantee</span>
          </div>
        </div>
      </footer>

      {/* QUICK VIEW MODAL */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQuickViewProduct(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 p-5 space-y-4">
              <div className="flex gap-4">
                <img src={getProductImageUrl(quickViewProduct)} alt={quickViewProduct.title} className="w-28 h-28 rounded-xl object-cover border border-slate-800 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="px-1.5 py-0.5 bg-violet-500/15 text-[8px] font-black text-violet-400 rounded uppercase">{quickViewProduct.category}</span>
                  <h3 className="text-sm font-black text-white leading-tight truncate">{quickViewProduct.title}</h3>
                  <div className="font-mono text-sm font-black text-white">{quickViewProduct.price} <span className="text-violet-400">π</span></div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{quickViewProduct.rating} ({quickViewProduct.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => { setQuickViewProduct(null); onNavigate(`product/${quickViewProduct.id}`); }} className="flex-1 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white">Full Details</button>
                <button onClick={(e) => { handleAddToCart(quickViewProduct, e); setQuickViewProduct(null); }} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold">Add to Bag</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border border-violet-500/30 text-slate-200 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl">
            <Sparkle className="w-3 h-3 text-violet-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Lazy Image Shimmer Component
const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'scale-100 opacity-100 blur-0' : 'scale-102 opacity-0 blur-sm'}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
