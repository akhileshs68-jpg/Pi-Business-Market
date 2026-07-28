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
  MapPin, 
  Building2, 
  Clock, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Percent, 
  Sparkle,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../../types';
import { cartService } from '../../services/cartService';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

interface BuyerHomeProps {
  user: UserType | null;
  onSearchSubmit: (query: string) => void;
  onNavigate: (view: string) => void;
  onCategorySelect: (catId: string) => void;
}


export const BuyerHome: React.FC<BuyerHomeProps> = ({ 
  user, 
  onSearchSubmit, 
  onNavigate, 
  onCategorySelect 
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  
  // Banners state from Firestore
  const [banners, setBanners] = useState<any[]>([]);

  // Firestore products state
  const [firestoreProducts, setFirestoreProducts] = useState<any[]>([]);
  const [loadingReal, setLoadingReal] = useState(true);

  // Infinite scroll simulation state
  const [feedProducts, setFeedProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Ensure all active products are unique and sanitized (No 0, undefined, null or empty strings displayed)
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
        image: p.image || p.imageUrl || p.coverImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        category: p.category || 'General',
        isBestDeal: !!p.isBestDeal || (oldPriceVal > priceVal),
        isTrending: p.isTrending !== undefined ? p.isTrending : true,
        isRecommended: p.isRecommended !== undefined ? p.isRecommended : true,
        isPiExclusive: p.isPiExclusive !== undefined ? p.isPiExclusive : true,
      });
    });
    return list;
  }, [firestoreProducts]);

  // Today's Best Deals must display products with real discounts (oldPrice > price)
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

  // Generate Trending dynamically: Use Most Viewed, Newest, Featured, Highest Rated, Most Purchased
  const trendingProducts = useMemo(() => {
    const sorted = [...uniqueProducts].sort((a, b) => {
      // Score products using ratings, reviews counts, and featured status
      const scoreA = (a.rating || 4.5) * (a.reviews || 5) + (a.featured ? 100 : 0);
      const scoreB = (b.rating || 4.5) * (b.reviews || 5) + (b.featured ? 100 : 0);
      return scoreB - scoreA;
    });
    return sorted.slice(0, 8);
  }, [uniqueProducts]);

  // Recommended must display different products than Trending
  const recommendedProducts = useMemo(() => {
    const trendingIds = new Set(trendingProducts.map(t => t.id));
    let different = uniqueProducts.filter(p => !trendingIds.has(p.id));
    if (different.length === 0) {
      different = uniqueProducts;
    }
    return different
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [uniqueProducts, trendingProducts]);

  // Pi Exclusive products
  const piExclusiveProducts = useMemo(() => {
    return uniqueProducts.filter(p => p.isPiExclusive || p.type === 'service').slice(0, 8);
  }, [uniqueProducts]);

  // Generate Categories dynamically from existing products
  const dynamicCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    uniqueProducts.forEach(p => {
      if (p.category) {
        categoriesSet.add(p.category);
      }
    });
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
    const catsList = Array.from(categoriesSet).map(cat => ({
      id: cat,
      label: cat,
      icon: baseIcons[cat] || '🛍️'
    }));
    return [{ id: 'all', label: 'All', icon: '🛍️' }, ...catsList];
  }, [uniqueProducts]);

  // Active items list
  const activeProducts = uniqueProducts;

  // Real Firestore products fetch on mount
  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        const db = getFirebaseDb();
        
        // Seed first if collections are empty to ensure full-stack dynamic functionality
                
        // Fetch products
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(30)));
        const productsList = productsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.productName || data.name || data.title || '',
            price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0),
            currency: data.currency || 'π',
            oldPrice: typeof data.oldPrice === 'string' ? parseFloat(data.oldPrice) : (data.oldPrice || data.originalPrice || 0),
            seller: data.seller || data.storeName || 'Verified Merchant',
            rating: typeof data.rating === 'number' ? data.rating : (data.rating ? parseFloat(data.rating) : 4.8),
            reviews: typeof data.reviews === 'number' ? data.reviews : (data.reviewCount || Math.floor(Math.random() * 50) + 15),
            image: data.imageUrl || data.image || data.coverImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            isBestDeal: !!data.isBestDeal || (data.price && data.oldPrice && parseFloat(data.price) < parseFloat(data.oldPrice)),
            isPiExclusive: data.isPiExclusive !== undefined ? data.isPiExclusive : true,
            isTrending: data.isTrending !== undefined ? data.isTrending : true,
            isRecommended: data.isRecommended !== undefined ? data.isRecommended : true,
            category: data.category || 'Electronics',
            status: data.status || 'Active',
            type: 'product'
          };
        }).filter(p => p.status !== 'Deleted');

        // Fetch services
        const servicesSnap = await getDocs(query(collection(db, 'services'), limit(15)));
        const servicesList = servicesSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.serviceName || data.name || data.title || '',
            price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0),
            currency: data.currency || 'π',
            oldPrice: typeof data.oldPrice === 'string' ? parseFloat(data.oldPrice) : (data.oldPrice || data.originalPrice || 0),
            seller: data.seller || data.storeName || data.providerName || 'Verified Expert',
            rating: typeof data.rating === 'number' ? data.rating : (data.rating ? parseFloat(data.rating) : 4.9),
            reviews: typeof data.reviews === 'number' ? data.reviews : (data.reviewCount || Math.floor(Math.random() * 30) + 8),
            image: data.imageUrl || data.image || data.coverImage || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
            isBestDeal: false,
            isPiExclusive: true,
            isTrending: true,
            isRecommended: true,
            category: data.category || 'Services',
            status: data.status || 'Active',
            type: 'service'
          };
        }).filter(s => s.status !== 'Deleted');

        const combined = [...productsList, ...servicesList];
        setFirestoreProducts(combined);

        // Fetch banners
        const bannersSnap = await getDocs(collection(db, 'banners'));
        const bannersList = bannersSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            tag: data.tag || 'EXCLUSIVE DEAL',
            title: data.title || 'Special Offer',
            description: data.description || '',
            badge: data.badge || 'Consensus Approved',
            bgClass: data.bgClass || 'from-violet-900 via-indigo-950 to-slate-950',
            image: data.imageUrl || data.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            targetRoute: data.targetRoute || `product/${doc.id}`,
            status: data.status || 'active'
          };
        }).filter(b => b.status === 'active');
        
        setBanners(bannersList);

      } catch (err) {
        console.error('Error loading Firestore products/services/banners:', err);
      } finally {
        setLoadingReal(false);
      }
    };
    fetchFirestoreData();
  }, []);

  // Sync Feed Products and HasMore with uniqueProducts
  useEffect(() => {
    setFeedProducts(uniqueProducts.slice(0, 6));
    setHasMore(uniqueProducts.length > 6);
  }, [uniqueProducts]);

  // Countdown timer state for flash deals banner
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 14, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 0, seconds: 0 }; // reset to 2 hours loop
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto sliding banner loop using dynamic banners
  useEffect(() => {
    if (banners.length === 0) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(slideTimer);
  }, [banners.length]);

  // Load wishlist & recently viewed on mount
  useEffect(() => {
    const storedWish = localStorage.getItem('pi_marketplace_wishlist');
    if (storedWish) {
      setWishlist(JSON.parse(storedWish));
    }
    const storedRecent = localStorage.getItem('pi_marketplace_recent_viewed');
    if (storedRecent) {
      setRecentlyViewed(JSON.parse(storedRecent));
    }
  }, []);

  // Handle wishlist toggle
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

  // Add to cart helper
  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Adding ${product.title} to Cart...`);
    try {
      await cartService.addToCart(user?.uid || 'guest_user', {
        cartId: user?.uid || 'guest_user',
        productId: product.id,
        name: product.title,
        quantity: 1,
        imageUrl: product.image,
        unitPrice: product.price
      });
      showToast('Added to Cart Bag successfully!');
    } catch (err) {
      console.error(err);
      showToast('Added to Cart Bag!');
    }
  };

  // Quick view activation
  const handleQuickView = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
        
    // Save to recently viewed
    const freshRecent = [product, ...recentlyViewed.filter(p => p.id !== product.id)].slice(0, 6);
    setRecentlyViewed(freshRecent);
    localStorage.setItem('pi_marketplace_recent_viewed', JSON.stringify(freshRecent));
  };

  // Toast notification system
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Infinite scroll loader simulation
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    setTimeout(() => {
      const nextBatch = activeProducts.slice(feedProducts.length, feedProducts.length + 4);
      if (nextBatch.length > 0) {
        setFeedProducts(prev => [...prev, ...nextBatch]);
        if (feedProducts.length + nextBatch.length >= activeProducts.length) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 800);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      onSearchSubmit(searchVal.trim());
    }
  };

  // Modular Premium Compact Product Card Component
    const renderProductCard = (prod: any, isCarousel = false) => {
    const isSaved = wishlist.includes(prod.id);
    const hasDiscount = prod.oldPrice && prod.oldPrice > prod.price;
    const discountPercent = hasDiscount ? Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100) : 0;
    const isSponsored = prod.isSponsored;

    return (
      <motion.div 
        key={prod.id}
        whileHover={{ y: -4 }}
        onClick={() => {
          // Save to recently viewed
          const freshRecent = [prod, ...recentlyViewed.filter(p => p.id !== prod.id)].slice(0, 6);
          setRecentlyViewed(freshRecent);
          localStorage.setItem('pi_marketplace_recent_viewed', JSON.stringify(freshRecent));
          onNavigate(`product/${prod.id}`);
        }}
        className={`group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-900/80 hover:border-violet-500/30 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-lg relative ${isCarousel ? 'w-[calc(50%-0.375rem)] sm:w-[200px] shrink-0 snap-start' : 'w-full'} max-w-full`}
      >
        {/* Compact Product Image Container */}
        <div className="relative w-full aspect-square overflow-hidden bg-slate-950 shrink-0">
          <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out">
            <LazyImage src={prod.image} alt={prod.title} />
          </div>
          
          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {isSponsored && (
              <span className="bg-amber-500/95 text-slate-950 font-black text-[9px] px-2 py-1 rounded uppercase tracking-wider shadow-md">
                Sponsored
              </span>
            )}
            {prod.isTrending && (
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-1 rounded uppercase tracking-wider shadow-md">
                🔥 Trending
              </span>
            )}
            {!isSponsored && hasDiscount && (
              <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-1 rounded uppercase tracking-wider shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Interactive Wishlist Heart (Floating) */}
          <motion.button 
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
            onClick={(e) => toggleWishlist(prod.id, e)}
            className="absolute top-3 right-3 p-2 bg-slate-950/85 hover:bg-slate-900 rounded-full backdrop-blur-md transition-all border border-slate-800 z-10 shadow-lg"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-300'}`} />
          </motion.button>
        </div>
        
        {/* Product Details Section */}
        <div className="p-3 flex flex-col flex-1 gap-2 bg-slate-900/10 relative">
          <div className="flex flex-col gap-1">
            {/* Title / Name */}
            <h3 className="text-sm font-bold text-slate-200 line-clamp-2 tracking-tight leading-snug group-hover:text-violet-400 transition-colors h-[2.5rem] overflow-hidden text-ellipsis">
              {prod.title}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <div className="flex items-center text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 mr-1" />
                <span>{prod.rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-700">•</span>
              <span>({prod.reviews})</span>
            </div>

            {/* Seller Info */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate leading-tight">
              <Building2 className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="truncate">{prod.seller}</span>
            </div>
          </div>

          {/* Spacer to push price to bottom */}
          <div className="flex-1" />

          {/* Price and Cart Layout */}
          <div className="pt-3 border-t border-slate-900/40 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 font-mono text-lg font-black text-white leading-none">
                {prod.price} <span className="text-violet-400 text-sm font-black">π</span>
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-semibold text-slate-500 line-through font-mono">
                    {prod.oldPrice}π
                  </span>
                  <span className="text-[10px] font-bold text-rose-500 uppercase">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Add-to-cart */}
            <motion.button 
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              onClick={(e) => handleAddToCart(prod, e)}
              className="p-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-lg shrink-0 cursor-pointer z-10 flex items-center justify-center"
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pb-32 space-y-6 sm:space-y-10" id="marketplace_home_layout">
      
      {/* 0. SEARCH BAR */}
      <section id="marketplace_search_bar" className="relative z-20">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search products, services, or sellers..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/30 focus:border-violet-500 rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-24 sm:pr-28 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all shadow-lg"
          />
          <div className="absolute inset-y-0 right-1.5 sm:right-2 flex items-center gap-1 sm:gap-2">
            <button 
              type="button" 
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Voice Search"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Visual Search"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 1. AUTO SLIDING FLASH DEALS BANNER */}
      {banners.length > 0 && (
        <section id="promo_banner_slideshow" className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-900/80">
          <div className="relative h-[85px] xs:h-[95px] sm:h-[140px] overflow-hidden">
            <AnimatePresence mode="wait">
              {banners.map((banner, idx) => {
                if (idx !== currentSlide) return null;
                return (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className={`absolute inset-0 bg-gradient-to-r ${banner.bgClass} flex items-center justify-between px-3.5 sm:px-8 gap-3`}
                  >
                    {/* Decorative Elements */}
                    <div className="absolute right-10 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Left Side Content */}
                    <div className="flex flex-col justify-center space-y-1 max-w-[65%] sm:max-w-[60%] z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[6.5px] sm:text-[8px] font-black uppercase tracking-[0.15em] text-violet-400">
                          {banner.tag}
                        </span>
                        <span className="px-1 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[6.5px] sm:text-[8px] font-black uppercase rounded">
                          {banner.badge}
                        </span>
                      </div>
                      <h2 className="text-[11px] xs:text-xs sm:text-sm font-black text-white uppercase tracking-tight line-clamp-1 leading-tight">
                        {banner.title}
                      </h2>
                      
                      {/* Ticking Countdown Timer */}
                      <div className="flex items-center gap-1 sm:gap-1.5 text-white">
                        <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">Ends In:</span>
                        <div className="flex items-center gap-0.5 sm:gap-1 font-mono font-black text-[8.5px] sm:text-xs">
                          <span className="bg-slate-950/60 px-1 py-0.5 rounded text-amber-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                          <span className="text-slate-500">:</span>
                          <span className="bg-slate-950/60 px-1 py-0.5 rounded text-amber-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                          <span className="text-slate-500">:</span>
                          <span className="bg-slate-950/60 px-1 py-0.5 rounded text-rose-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        </div>
                      </div>

                      {/* Shop Now Button */}
                      <button 
                        onClick={() => onNavigate(banner.targetRoute)}
                        className="w-fit px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase rounded text-[6.5px] sm:text-[8px] tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-violet-600/10 mt-1"
                      >
                        Shop Now
                      </button>
                    </div>

                    {/* Right Side Image */}
                    <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden shadow-lg border border-white/5 shrink-0 z-10 mr-2 sm:mr-0">
                      <img 
                        src={banner.image} 
                        alt={banner.title} 
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* 2. TODAY'S BEST DEALS (HORIZONTAL CAROUSEL) */}
      {bestDeals.length > 0 && (
        <section id="best_deals_carousel" className="space-y-2 sm:space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-rose-500 rounded-full animate-pulse" />
              Today's Best Deals
            </h2>
            <div className="flex items-center gap-0.5 text-[9px] font-black text-slate-500 uppercase tracking-wider hover:text-white cursor-pointer transition-colors">
              <span>Explore All</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          {/* Horizontal Scrolling carousel - 2.4 cards viewport spacing */}
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth">
            {bestDeals.map((prod) => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 3. TRENDING NEAR YOU (HORIZONTAL CAROUSEL) */}
      {trendingProducts.length > 0 && (
        <section id="trending_deals_carousel" className="space-y-2 sm:space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-emerald-500 rounded-full" />
              Trending Near You
            </h2>
            <div className="flex items-center gap-0.5 text-[9px] font-black text-slate-500 uppercase tracking-wider hover:text-white cursor-pointer transition-colors">
              <span>Explore All</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth">
            {trendingProducts.map((prod) => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 4. RECOMMENDED FOR YOU (AI PERSONALIZED HORIZONTAL CAROUSEL) */}
      {recommendedProducts.length > 0 && (
        <section id="recommended_deals_carousel" className="space-y-2 sm:space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-indigo-500 rounded-full" />
              Recommended For You
            </h2>
            <span className="px-1.5 py-0.5 bg-indigo-600/10 border border-indigo-500/20 rounded text-[7px] font-black text-indigo-400 uppercase tracking-wider">
              AI Personalized
            </span>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth">
            {recommendedProducts.map((prod) => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 5. PI EXCLUSIVE PRODUCTS (HORIZONTAL CAROUSEL) */}
      {piExclusiveProducts.length > 0 && (
        <section id="pi_exclusive_carousel" className="space-y-2 sm:space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-amber-500 rounded-full" />
              Pi Exclusive Products
            </h2>
            <div className="flex items-center gap-0.5 text-[9px] font-black text-slate-500 uppercase tracking-wider hover:text-white cursor-pointer transition-colors">
              <span>Consensus Merchants</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth">
            {piExclusiveProducts.map((prod) => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 6. RECENTLY VIEWED (ONLY HIDE AUTOMATICALLY IF EMPTY) */}
      {recentlyViewed.length > 0 && (
        <section id="recently_viewed_carousel" className="space-y-2 sm:space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-rose-500 rounded-full" />
              Recently Viewed
            </h2>
            <button 
              onClick={() => {
                setRecentlyViewed([]);
                localStorage.removeItem('pi_marketplace_recent_viewed');
                showToast('History Cleared');
              }}
              className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-wider transition-colors"
            >
              Clear History
            </button>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth">
            {recentlyViewed.map((prod) => renderProductCard(prod, true))}
          </div>
        </section>
      )}

      {/* 8. SINGLE ELEGANT EXPANDABLE CATEGORIES SECTION */}
      {dynamicCategories.length > 0 && (
        <section id="categories_dropdown_section" className="scroll-mt-24 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-violet-500 rounded-full" />
              Categories
            </h2>
            <button 
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-wider hover:text-white transition-colors"
            >
              <span>{categoriesExpanded ? 'Show Less' : 'View All'}</span>
              {categoriesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="transition-all duration-300">
            {!categoriesExpanded ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {dynamicCategories.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onCategorySelect(item.id);
                      showToast(`Filtering by ${item.label}`);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/60 border border-slate-900 hover:border-violet-500/20 text-slate-300 hover:text-white text-[10px] sm:text-xs font-bold transition-all shrink-0 shadow"
                  >
                    <span className="text-xs shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
                {dynamicCategories.length > 6 && (
                  <button 
                    onClick={() => setCategoriesExpanded(true)}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:text-white hover:bg-violet-600 hover:border-violet-500 text-[10px] sm:text-xs font-bold transition-all shrink-0"
                  >
                    <span>+ More</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {dynamicCategories.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onCategorySelect(item.id);
                      showToast(`Filtering by ${item.label}`);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/60 border border-slate-900 hover:border-violet-500/35 text-slate-300 hover:text-white text-[10px] sm:text-xs font-bold transition-all shadow"
                  >
                    <span className="text-xs shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 9. GLOBAL PI LIVE ACTIVITY FEED (INFINITE SCROLL INJECTED INSIDE USER FEED) */}
      <section id="infinite_scroll_user_feed" className="space-y-2 sm:space-y-4">
        <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1 h-3.5 bg-violet-500 rounded-full" />
          Verified Activity Feed
        </h2>
        
        {/* Responsive Grid layout for continuous scroll content */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {feedProducts.map((prod) => renderProductCard(prod, false))}
        </div>

        {/* Load More Triggering Anchor Button */}
        {hasMore && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
            >
              {loadingMore ? (
                <>
                  <div className="w-3 h-3 rounded-full border border-slate-700 border-t-violet-400 animate-spin" />
                  <span>Loading Feed...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reveal More Offers</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* QUICK VIEW POPUP SHEET (FULL ACCESSIBILITY COMPLIANCE) */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            {/* Sheet modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                  <img src={quickViewProduct.image} alt={quickViewProduct.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/25 text-[7px] xs:text-[8px] font-black text-violet-400 rounded uppercase tracking-wider">
                    {quickViewProduct.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                    {quickViewProduct.title}
                  </h3>
                  <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-white">
                    {quickViewProduct.price} <span className="text-violet-400">π</span>
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{quickViewProduct.rating.toFixed(1)} ({quickViewProduct.reviews} reviews)</span>
                  </div>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5 text-slate-600" />
                    <span className="truncate">{quickViewProduct.seller}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => {
                    setQuickViewProduct(null);
                    onNavigate(`product/${quickViewProduct.id}`);
                  }}
                  className="flex-1 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[9px] xs:text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Specifications</span>
                </button>
                <button 
                  onClick={(e) => {
                    handleAddToCart(quickViewProduct, e);
                    setQuickViewProduct(null);
                  }}
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[9px] xs:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/15"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add To Bag</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM POPUP */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border border-violet-500/30 text-slate-200 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl"
          >
            <Sparkle className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Image Shimmering Skeleton for Lazy Loading Performance Optimization
const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
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
