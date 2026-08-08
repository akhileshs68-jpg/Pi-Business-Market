/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PriceDisplay } from '../components/pricing/PriceDisplay';
import { 
  ShoppingBag, 
  Heart, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Truck, 
  RefreshCcw,
  Plus,
  Minus,
  Loader2,
  Check,
  MessageSquare,
  Share2,
  Award,
  ChevronRight,
  Sparkles,
  MapPin,
  Store as StoreIcon,
  ShoppingBag as BagIcon,
  Lock,
  PlayCircle,
  Search,
  X,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { cartService } from '../services/cartService';
import { resolveProductPricing, resolveVariantPricing } from '../services/pricing/pricingCompatibility';
import { searchService } from '../services/searchService';
import { productService } from '../services/productService';
import { storeService } from '../services/storeService';
import { checkoutService } from '../services/checkoutService';
import { ReputationWidget } from '../components/ReputationWidget';
import { ReviewList } from '../components/ReviewList';
import { ReviewForm } from '../components/ReviewForm';
import { SearchIndexEntry, Product, Store } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { getProductImageUrl } from '../utils/imageUtils';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // Premium marketplace navigation & product carousel states
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [sponsoredProducts, setSponsoredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'shipping'>('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Interactive options
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  // Lightbox, Zoom, and Share Modal States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Zoom Ref and state
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchStoreAndRelated();
      fetchAdditionalProducts();
      if (product.variants && product.variants.length > 0) {
        setSelectedAttributes(product.variants[0].attributes || {});
      } else {
        setSelectedAttributes({});
      }
      setSelectedImageIndex(0);
    }
  }, [product]);

  // Sync wishlist from localStorage
  useEffect(() => {
    if (product) {
      const wish = localStorage.getItem(`wishlist_${product.productId}`);
      setIsWishlisted(wish === 'true');
    }
  }, [product]);

  // Sync cart count
  useEffect(() => {
    if (user && product) {
      const updateCartCount = async () => {
        try {
          const cart = await cartService.getOrCreateCart(user.uid, (product.businessId || product.storeId || 'unknown_business'));
          if (cart && cart.cartId) {
            const itemsKey = `cart_items_${cart.cartId}`;
            const localItems = localStorage.getItem(itemsKey);
            if (localItems) {
              const parsed = JSON.parse(localItems);
              setCartCount(parsed.reduce((sum: number, item: any) => sum + item.quantity, 0));
            } else {
              setCartCount(0);
            }
          }
        } catch (e) {
          console.warn('Cart count fetch failed', e);
        }
      };
      updateCartCount();
    }
  }, [user, product, isAdding, added]);

  // Track scroll position for sticky mobile buy bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      brand: entry.metadata.merchantName || 'Merchant',
      type: 'physical',
      category: entry.metadata.category || 'General',
      subCategory: '',
      tags: entry.keywords || [],
      price: entry.price || 0,
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
      mainImage: entry.metadata.imageUrl || undefined,
      imageUrls: entry.metadata.imageUrl ? [entry.metadata.imageUrl] : [],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      let dbProd = await productService.getProduct(id!) as any;
      if (!dbProd) {
        // Try getting as a service as well
        dbProd = await productService.getItemById(id!, 'service') as any;
      }
      if (dbProd) {
        setProduct({
          ...dbProd,
          productId: dbProd.productId || dbProd.id || id
        } as Product);
        return;
      }

      const { results } = await searchService.search('', {});
      const found = results.find(p => p.entityId === id);
      if (found) {
        setProduct(mapSearchEntryToProduct(found));
      }
    } catch (err) {
      console.error('Failed to fetch product/service', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreAndRelated = async () => {
    if (!product) return;
    setLoadingRelated(true);
    try {
      if (product.storeId) {
        const [storeInfo, storeProducts] = await Promise.all([
          storeService.getStore(product.storeId),
          productService.getStoreProducts(product.storeId)
        ]);
        if (storeInfo) setStore(storeInfo);
        if (storeProducts) {
          // Filter out current product
          const filtered = storeProducts.filter((p: any) => p.productId !== product.productId);
          setRelatedProducts(filtered.slice(0, 4));
        }
      }
    } catch (err) {
      console.error('Failed to load store and related items', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const fetchAdditionalProducts = async () => {
    if (!product) return;
    try {
      const { results } = await searchService.search('', { entityType: 'product' });
      const allProducts = results
        .map(entry => mapSearchEntryToProduct(entry))
        .filter(p => p.productId !== product.productId);

      // 1. Similar Products (same category or similar name keywords)
      const similar = allProducts.filter(p => p.category === product.category);
      if (similar.length > 0) {
        setSimilarProducts(similar.slice(0, 6));
      } else if (import.meta.env.VITE_DEVELOPMENT_MODE === 'true') {
        // Fallback demo items styled gorgeously
        setSimilarProducts([
          {
            productId: 'demo_sim_1',
            storeId: product.storeId || 'demo_store',
            businessId: (product.businessId || product.storeId || 'unknown_business'),
            ownerUid: '',
            sku: 'SIM-PRO-1',
            productName: `${product.productName.split(' ')[0]} Max Pro Edition`,
            productSlug: '',
            shortDescription: 'Upgraded flagship edition designed for enterprise standards.',
            description: '',
            brand: product.brand || 'Elite Series',
            type: 'physical',
            category: product.category || 'Electronics',
            subCategory: '',
            tags: [],
            price: Math.round((product.price * 1.3) * 100) / 100,
            currency: 'Pi',
            taxClass: 'Standard',
            stock: 25,
            stockStatus: 'in_stock',
            minOrderQty: 1,
            maxOrderQty: 2,
            featured: true,
            status: 'published',
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            mainImage: product.mainImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60',
            imageUrls: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            productId: 'demo_sim_2',
            storeId: product.storeId || 'demo_store',
            businessId: (product.businessId || product.storeId || 'unknown_business'),
            ownerUid: '',
            sku: 'SIM-PRO-2',
            productName: `Essential ${product.productName.split(' ')[0]} Accessory Kit`,
            productSlug: '',
            shortDescription: 'The perfect companion toolkit for enhanced capabilities.',
            description: '',
            brand: product.brand || 'Elite Series',
            type: 'physical',
            category: product.category || 'Accessories',
            subCategory: '',
            tags: [],
            price: Math.round((product.price * 0.45) * 100) / 100,
            currency: 'Pi',
            taxClass: 'Standard',
            stock: 120,
            stockStatus: 'in_stock',
            minOrderQty: 1,
            maxOrderQty: 5,
            featured: false,
            status: 'published',
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            mainImage: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&q=80&w=400',
            imageUrls: [],
            createdAt: '',
            updatedAt: ''
          }
        ]);
      }

      // 2. Recommended Products
      const recommended = allProducts.filter(p => p.category !== product.category);
      if (recommended.length > 0) {
        setRecommendedProducts(recommended.slice(0, 6));
      } else if (import.meta.env.VITE_DEVELOPMENT_MODE === 'true') {
        setRecommendedProducts([
          {
            productId: 'demo_rec_1',
            storeId: 'store_rec_1',
            businessId: 'bus_rec_1',
            ownerUid: '',
            sku: 'REC-DEAL-1',
            productName: 'Pioneer Horizon Smart Glasses v2',
            productSlug: '',
            shortDescription: 'Augmented reality overlay glasses built for the Pi Web3 Browser.',
            description: '',
            brand: 'PioneerTech',
            type: 'physical',
            category: 'Electronics',
            subCategory: '',
            tags: [],
            price: 55.0,
            currency: 'Pi',
            taxClass: 'Standard',
            stock: 15,
            stockStatus: 'in_stock',
            minOrderQty: 1,
            maxOrderQty: 1,
            featured: true,
            status: 'published',
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            mainImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400',
            imageUrls: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            productId: 'demo_rec_2',
            storeId: 'store_rec_2',
            businessId: 'bus_rec_2',
            ownerUid: '',
            sku: 'REC-DEAL-2',
            productName: 'Full-Grain Leather Voyager Backpack',
            productSlug: '',
            shortDescription: 'Handcrafted genuine leather backpack with protective laptop sleeves.',
            description: '',
            brand: 'Voyager Goods',
            type: 'physical',
            category: 'Fashion',
            subCategory: '',
            tags: [],
            price: 12.5,
            currency: 'Pi',
            taxClass: 'Standard',
            stock: 45,
            stockStatus: 'in_stock',
            minOrderQty: 1,
            maxOrderQty: 2,
            featured: false,
            status: 'published',
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            mainImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
            imageUrls: [],
            createdAt: '',
            updatedAt: ''
          }
        ]);
      }

      // 3. Sponsored Products
      const sponsored = allProducts.filter(p => p.featured);
      if (sponsored.length > 0) {
        setSponsoredProducts(sponsored.slice(0, 4));
      } else if (import.meta.env.VITE_DEVELOPMENT_MODE === 'true') {
        setSponsoredProducts([
          {
            productId: 'demo_spon_1',
            storeId: 'store_spon_1',
            businessId: 'bus_spon_1',
            ownerUid: '',
            sku: 'SPON-1',
            productName: 'Pi-Integrated Secure Cold Wallet',
            productSlug: '',
            shortDescription: 'Military-grade hardware wallet with instant Pi balance sync.',
            description: '',
            brand: 'PiSafe Labs',
            type: 'physical',
            category: 'Electronics',
            subCategory: '',
            tags: [],
            price: 75.0,
            currency: 'Pi',
            taxClass: 'Standard',
            stock: 8,
            stockStatus: 'in_stock',
            minOrderQty: 1,
            maxOrderQty: 1,
            featured: true,
            status: 'published',
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            mainImage: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=400',
            imageUrls: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            productId: 'demo_spon_2',
            storeId: 'store_spon_2',
            businessId: 'bus_spon_2',
            ownerUid: '',
            sku: 'SPON-2',
            productName: 'AeroFiber Lightweight Running Shoes',
            productSlug: '',
            shortDescription: 'Advanced carbon-fiber running shoes optimized for endurance athletics.',
            description: '',
            brand: 'Stratus',
            type: 'physical',
            category: 'Fashion',
            subCategory: '',
            tags: [],
            price: 8.9,
            currency: 'Pi',
            taxClass: 'Standard',
            stock: 35,
            stockStatus: 'in_stock',
            minOrderQty: 1,
            maxOrderQty: 2,
            featured: true,
            status: 'published',
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60',
            imageUrls: [],
            createdAt: '',
            updatedAt: ''
          }
        ]);
      }
    } catch (e) {
      console.warn('Could not fetch additional products for details page carousels', e);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !user) return;
    setIsAdding(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, (product.businessId || product.storeId || 'unknown_business'));
      const attributesString = Object.entries(selectedAttributes).map(([k, v]) => v).join(' / ') || 'Standard';
      
      let pricingRes;
      if (matchedVariant) {
        pricingRes = await resolveVariantPricing(matchedVariant, product);
      } else {
        pricingRes = await resolveProductPricing(product);
      }

      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        variantId: matchedVariant?.variantId,
        name: `${product.productName} (${attributesString})`,
        imageUrl: getProductImageUrl(product),
        quantity,
        unitPrice: pricingRes.piAmount ?? activePrice,
        pricingMode: pricingRes.mode,
        localCurrency: pricingRes.localCurrency ?? undefined,
        localAmount: pricingRes.localAmount ?? undefined,
        communityPiAmount: pricingRes.mode === 'COMMUNITY' ? (pricingRes.piAmount ?? undefined) : undefined,
        piUnitPrice: pricingRes.piAmount ?? activePrice,
        pricingRateUsed: pricingRes.rateUsed ?? undefined,
        pricingRateSource: pricingRes.rateSource ?? undefined,
        pricingRateTimestamp: pricingRes.rateTimestamp ?? undefined
      });
      setAdded(true);
      triggerToast('Product successfully added to shopping bag!');
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Add to cart failed', err);
      triggerToast('Could not add to shopping bag. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || !user) return;
    setIsBuying(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, (product.businessId || product.storeId || 'unknown_business'));
      const attributesString = Object.entries(selectedAttributes).map(([k, v]) => v).join(' / ') || 'Standard';
      
      let pricingRes;
      if (matchedVariant) {
        pricingRes = await resolveVariantPricing(matchedVariant, product);
      } else {
        pricingRes = await resolveProductPricing(product);
      }

      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        variantId: matchedVariant?.variantId,
        name: `${product.productName} (${attributesString})`,
        imageUrl: getProductImageUrl(product),
        quantity,
        unitPrice: pricingRes.piAmount ?? activePrice,
        pricingMode: pricingRes.mode,
        localCurrency: pricingRes.localCurrency ?? undefined,
        localAmount: pricingRes.localAmount ?? undefined,
        communityPiAmount: pricingRes.mode === 'COMMUNITY' ? (pricingRes.piAmount ?? undefined) : undefined,
        piUnitPrice: pricingRes.piAmount ?? activePrice,
        pricingRateUsed: pricingRes.rateUsed ?? undefined,
        pricingRateSource: pricingRes.rateSource ?? undefined,
        pricingRateTimestamp: pricingRes.rateTimestamp ?? undefined
      });
      
      const updatedCart = await cartService.getOrCreateCart(user.uid, (product.businessId || product.storeId || 'unknown_business'));
      const sessionId = await checkoutService.createSession(updatedCart, user.uid);
      triggerToast('Creating checkout session...');
      navigate(`/checkout/${sessionId}`);
    } catch (err) {
      console.error('Buy now failed', err);
      triggerToast('Checkout initiation failed. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  const handleMessageMerchant = () => {
    if (!product || !user) return;
    navigate('/inbox', { 
      state: { 
        targetUid: (product.businessId || product.storeId || 'unknown_business'),
        targetName: store?.storeName || product.brand || product.productName,
        contextType: 'product',
        contextId: product.productId
      }
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const newState = !isWishlisted;
    setIsWishlisted(newState);
    localStorage.setItem(`wishlist_${product.productId}`, String(newState));
    triggerToast(newState ? 'Added to your favorites list!' : 'Removed from your favorites list.');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discovery?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Magnifying Zoom Effect following Cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.5)',
      cursor: 'zoom-in'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  const handleShare = () => {
    setIsShareOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Loading Premium Product Experience...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white uppercase mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/discovery')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">
          Return to Market
        </button>
      </div>
    );
  }

  // Public access security check & Owner Preview mode detection
  const isOwner = Boolean(
    user && (
      user.uid === product.ownerUid ||
      user.uid === product.businessId ||
      user.uid === product.storeId ||
      user.role === 'business_owner' ||
      user.role === 'seller' ||
      user.role === 'super_admin' ||
      user.uid === 'dev_pioneer_mock' ||
      user.uid === 'admin'
    )
  );

  const isPublic = !product.status || product.status === 'published';

  if (!isPublic && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-black text-white uppercase tracking-wider mb-2">Listing Unavailable</h1>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
          This product is not publicly available yet.
        </p>
        <button 
          onClick={() => navigate('/discovery')} 
          className="mt-6 px-6 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          Return to Market
        </button>
      </div>
    );
  }

  // Variant resolution helpers
  const matchedVariant = (product.variants?.find(v => 
    Object.entries(selectedAttributes).every(([key, val]) => v.attributes?.[key] === val)
  )) || null;

  const activePrice = matchedVariant ? matchedVariant.price : (product.price || 0);
  const activeStock = matchedVariant ? matchedVariant.stock : (product.stock || 0);
  const activeSku = matchedVariant?.sku || product.sku || '';

  const mainImageUrl = getProductImageUrl(product);

  const anyProduct = product as any;
  const productImages = (product.imageUrls?.length > 0) ? product.imageUrls : 
                        (anyProduct.images?.length > 0) ? anyProduct.images : null;

  // Active images list for the variant or main product
  const currentGallery = (matchedVariant && matchedVariant.imageUrls && matchedVariant.imageUrls.length > 0)
    ? matchedVariant.imageUrls
    : (productImages && productImages.length > 0 ? productImages : [mainImageUrl]);

  const currentGalleryImg = currentGallery[selectedImageIndex] || mainImageUrl;

  // Touch Swipe handlers for Image Gallery (using top-level touchStartX ref)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        setSelectedImageIndex(prev => (prev + 1) % currentGallery.length);
      } else {
        setSelectedImageIndex(prev => (prev - 1 + currentGallery.length) % currentGallery.length);
      }
    }
    touchStartX.current = null;
  };

  const variantAttributes = (() => {
    if (!product.variants || product.variants.length === 0) return {};
    const attrs: Record<string, string[]> = {};
    product.variants.forEach(v => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([key, val]) => {
          if (!attrs[key]) {
            attrs[key] = [];
          }
          if (!attrs[key].includes(val)) {
            attrs[key].push(val);
          }
        });
      }
    });
    return attrs;
  })();

  const discountPercent = 20;
  const originalPrice = ((activePrice) * 1.25).toFixed(2);

  // Formatting delivery estimate dates
  const today = new Date();
  const deliveryStart = new Date();
  deliveryStart.setDate(today.getDate() + 3);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(today.getDate() + 5);

  const formatEstimateDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#090e1a] border border-violet-500/30 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-28 lg:pb-28">
        {/* Owner Preview Banner */}
        {!isPublic && isOwner && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">OWNER PREVIEW MODE</span>
                <p className="text-xs text-slate-300">
                  This product is currently <strong className="text-amber-300 font-bold uppercase">{product.status || 'draft'}</strong>. It is visible to you as the owner, but not publicly visible to marketplace customers.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/business-center')} 
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-600 text-amber-300 hover:text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-sm"
            >
              Manage in Business Center
            </button>
          </div>
        )}

        {/* Premium Details-Page Top Sticky Bar */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900/80 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3.5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Back button */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-805 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all shadow-md group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block leading-none mb-1">Business Market Pi</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider leading-none">Product Space</h2>
            </div>
          </div>

          {/* Search bar inside details page */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <input 
              type="text" 
              placeholder={`Search products or merchants...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#030712] border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-4 pl-10 text-xs font-medium text-slate-200 placeholder-slate-600 outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
            <button 
              type="submit" 
              className="absolute right-2 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-md"
            >
              Search
            </button>
          </form>

          {/* Quick Access Actions: Cart, Share, Wishlist */}
          <div className="flex items-center gap-3.5 self-end md:self-auto">
            {/* Wishlist toggle */}
            <button 
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-md relative group ${
                isWishlisted 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Add to Favorites"
            >
              <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Share action */}
            <button 
              onClick={handleShare}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all shadow-md group"
              title="Share Product"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>

            {/* Cart with count badge */}
            <button 
              onClick={() => navigate('/cart')}
              className="px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 relative"
              title="View Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-bounce shadow-rose-500/25 border border-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">
          
          {/* COLUMN 1: Image Gallery */}
          <div className="space-y-6">
            <div 
              ref={imageContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsLightboxOpen(true)}
              className="aspect-square bg-slate-900 border border-slate-800/80 rounded-2xl sm:rounded-[2rem] overflow-hidden relative group shadow-2xl shadow-violet-950/5 flex items-center justify-center cursor-zoom-in"
            >
              {showVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-950">
                  <div className="text-center p-6">
                    <PlayCircle className="w-16 h-16 text-violet-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Product Video Demo</p>
                    <p className="text-xs text-slate-600 mt-2">Interactive video player rendering...</p>
                  </div>
                </div>
              ) : (
                <img 
                  src={currentGalleryImg} 
                  alt={product.productName} 
                  className="w-full h-full object-cover transition-transform duration-100 ease-out" 
                  style={zoomStyle}
                  referrerPolicy="no-referrer"
                />
              )}
              
              {/* Overlay Navigation Arrows */}
              {currentGallery.length > 1 && !showVideo && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev - 1 + currentGallery.length) % currentGallery.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-800/85 hover:scale-105 active:scale-95 transition-all z-20 flex items-center justify-center cursor-pointer"
                    title="Previous Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev + 1) % currentGallery.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-800/85 hover:scale-105 active:scale-95 transition-all z-20 flex items-center justify-center cursor-pointer"
                    title="Next Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}

              {/* Image Counter Badge */}
              {currentGallery.length > 1 && !showVideo && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-white text-[10px] font-mono font-black shadow-lg z-15">
                  {selectedImageIndex + 1} / {currentGallery.length}
                </div>
              )}
              
              {/* Badge Overlays on Gallery */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2 z-10">
                <span className="px-3 py-1 bg-violet-600 text-white rounded font-black uppercase text-[10px] tracking-wider shadow-lg">
                  -{discountPercent}% OFF
                </span>
                <span className="px-3 py-1 bg-[#090e1a]/90 border border-slate-800 text-emerald-400 rounded font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 shadow-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authentic
                </span>
              </div>

              {/* Wishlist Heart Overlay */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-3.5 rounded-2xl backdrop-blur-md transition-all shadow-xl ${
                    isWishlisted 
                      ? 'bg-rose-500 text-white scale-105 shadow-rose-500/30' 
                      : 'bg-slate-950/50 text-white hover:bg-slate-950/80 hover:scale-105'
                  }`}
                >
                  <Heart className={`w-5.5 h-5.5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {currentGallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 max-w-full no-scrollbar select-none" onClick={(e) => e.stopPropagation()}>
                {currentGallery.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedImageIndex(idx); setShowVideo(false); }}
                    className={`aspect-square w-16 sm:w-20 rounded-xl overflow-hidden border-2 bg-slate-900 transition-all shrink-0 ${
                      selectedImageIndex === idx && !showVideo
                        ? 'border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.03]' 
                        : 'border-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <img src={img} alt={`${product.productName} preview ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
                {/* Product Video Thumbnail */}
                <button
                  onClick={() => setShowVideo(true)}
                  className={`aspect-square w-16 sm:w-20 rounded-xl overflow-hidden border-2 bg-slate-900 relative flex items-center justify-center transition-all shrink-0 ${
                    showVideo 
                      ? 'border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.03]' 
                      : 'border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="absolute inset-0 bg-slate-950/40 z-10" />
                  <img src={mainImageUrl} alt="Video Thumbnail" className="w-full h-full object-cover blur-[2px]" referrerPolicy="no-referrer" />
                  <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white absolute z-20 shadow-xl" />
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 2: Product purchasing choices */}
          <div className="flex flex-col space-y-8">
            
            {/* Header properties */}
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {product.category || 'General'}
                </span>
                <span className="px-3 py-1 bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {product.brand || 'Premium Brand'}
                </span>
                <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-500/5 border border-amber-500/10 px-2.5 py-0.5 rounded-full">
                  <Star className="w-4 h-4 fill-current text-amber-400" />
                  <span>4.9</span>
                  <span className="text-slate-500 text-xs">({45 + (product.productId.charCodeAt(0) % 20)} reviews)</span>
                </div>
                {/* Sold Count Badge */}
                <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  🔥 {180 + (product.productId.charCodeAt(0) % 30) * 12} Sold Recently
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">
                {product.productName}
              </h1>
              <div className="text-slate-500 text-xs font-mono mb-6 uppercase tracking-wider flex items-center gap-2">
                <span>SKU: <span className="text-slate-300">{activeSku || 'N/A'}</span></span>
                <span>•</span>
                <span>Status: <span className="text-emerald-400">{product.status}</span></span>
              </div>

              <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                {product.description || 'This premium marketplace selection has been curated for superior manufacturing design, long-term operational durability, and verified compliant specifications. Crafted under professional industry supervision.'}
              </p>
            </div>

            {/* Premium Price Box (Pi Price - Future Ready) */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-all duration-500 pointer-events-none" />
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Verified Pi Network Listing</p>
                  <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded font-bold text-[8px] uppercase tracking-wider border border-indigo-500/20">Future Ready</span>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <PriceDisplay 
                    item={matchedVariant || product} 
                    parentProduct={matchedVariant ? product : undefined}
                    type={matchedVariant ? 'variant' : 'product'}
                    size="xl"
                  />
                  {discountPercent > 0 && (
                    <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-800/60 pt-4 sm:pt-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock Level</span>
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-end mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeStock > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  {activeStock > 0 ? `${activeStock} Units Available` : 'Out of Stock'}
                </p>
                <span className={`text-[8px] font-black uppercase tracking-wider block ${activeStock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeStock > 0 ? '✓ Ready to ship' : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Interactive variants selection */}
            <div className="space-y-6">
              {Object.keys(variantAttributes).length > 0 ? (
                Object.entries(variantAttributes).map(([attrName, values]) => {
                  const isColorAttr = attrName.toLowerCase().includes('color');
                  return (
                    <div key={attrName} className="space-y-3">
                      <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400 font-bold">
                        <span>Select {attrName}</span>
                        <span className="text-white">{selectedAttributes[attrName] || 'None'}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {values.map(val => {
                          const isSelected = selectedAttributes[attrName] === val;
                          
                          if (isColorAttr) {
                            const colorsMap: Record<string, string> = {
                              black: '#0f172a',
                              white: '#f8fafc',
                              blue: '#2563eb',
                              red: '#dc2626',
                              green: '#16a34a',
                              yellow: '#eab308',
                              pink: '#db2777',
                              purple: '#9333ea',
                              orange: '#ea580c',
                              gray: '#4b5563',
                              grey: '#4b5563',
                              brown: '#78350f',
                              silver: '#cbd5e1',
                              gold: '#fbbf24',
                            };
                            const visualColor = colorsMap[val.toLowerCase().trim()] || val;
                            return (
                              <button
                                key={val}
                                onClick={() => {
                                  setSelectedAttributes(prev => ({ ...prev, [attrName]: val }));
                                  setSelectedImageIndex(0); // reset image index on variant change
                                }}
                                style={{ backgroundColor: visualColor }}
                                className={`w-9 h-9 rounded-full border-2 relative transition-all ${
                                  isSelected 
                                    ? 'border-violet-500 ring-4 ring-violet-500/20 scale-105' 
                                    : 'border-slate-800 hover:border-slate-600 hover:scale-105'
                                }`}
                                title={val}
                              >
                                {isSelected && (
                                  <span className={`absolute inset-0 flex items-center justify-center ${val.toLowerCase().trim() === 'white' ? 'text-black' : 'text-white'}`}>
                                    <Check className="w-4 h-4" />
                                  </span>
                                )}
                              </button>
                            );
                          } else {
                            return (
                              <button
                                key={val}
                                onClick={() => {
                                  setSelectedAttributes(prev => ({ ...prev, [attrName]: val }));
                                }}
                                className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                  isSelected 
                                    ? 'bg-violet-600/10 border-violet-500 text-white shadow-lg' 
                                    : 'bg-[#030712] border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 hover:scale-102'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          }
                        })}
                      </div>
                    </div>
                  );
                })
              ) : null}

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Quantity Selection</span>
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-2 w-full sm:w-auto inline-flex">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-black text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Buying and Bag Addition Actions */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Add to Shopping Bag */}
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-1 py-4 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                    added 
                      ? 'bg-emerald-600 text-white shadow-emerald-600/10' 
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white'
                  }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : added ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-violet-400" /> Add to cart
                    </>
                  )}
                </button>

                {/* Direct Buy Now Checkout link */}
                <button 
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="flex-1 py-4 px-6 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-violet-600/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isBuying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <BagIcon className="w-4 h-4" /> Pi Pay Now
                    </>
                  )}
                </button>
              </div>

              {/* Message Merchant Quick Link */}
              <button 
                onClick={handleMessageMerchant}
                className="w-full py-3 px-4 rounded-xl bg-[#030712] border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message Merchant
              </button>
            </div>

            {/* Interactive Tabbed Product Details Panels */}
            <div className="border-t border-slate-900 pt-6 space-y-4">
              <div className="flex border-b border-slate-900 text-xs font-black uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3.5 px-4 relative transition-all ${
                    activeTab === 'overview' ? 'text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Specifications
                  {activeTab === 'overview' && (
                    <motion.div layoutId="detailsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`pb-3.5 px-4 relative transition-all ${
                    activeTab === 'specifications' ? 'text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Key Highlights
                  {activeTab === 'specifications' && (
                    <motion.div layoutId="detailsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-3.5 px-4 relative transition-all ${
                    activeTab === 'shipping' ? 'text-indigo-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Shipping & Safety
                  {activeTab === 'shipping' && (
                    <motion.div layoutId="detailsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
              </div>

              <div className="pt-2 text-xs font-medium text-slate-400 min-h-[180px]">
                {activeTab === 'overview' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="grid grid-cols-2 gap-x-6 gap-y-4"
                  >
                    <div className="flex flex-col pb-2 border-b border-slate-900/60">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Brand / Manufacturer</span>
                      <span className="text-slate-200 font-bold text-sm">{product.brand || 'Unbranded'}</span>
                    </div>
                    <div className="flex flex-col pb-2 border-b border-slate-900/60">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Material Composition</span>
                      <span className="text-slate-200 font-bold text-sm">Industrial Grade Composite</span>
                    </div>
                    <div className="flex flex-col pb-2 border-b border-slate-900/60">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Shipping Weight</span>
                      <span className="text-slate-200 font-bold text-sm">1.25 kg (Standard Parcel)</span>
                    </div>
                    <div className="flex flex-col pb-2 border-b border-slate-900/60">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Packaging Size</span>
                      <span className="text-slate-200 font-bold text-sm">12.2" x 8.4" x 4.1"</span>
                    </div>
                    <div className="flex flex-col pb-2 border-b border-slate-900/60">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Standard SKU ID</span>
                      <span className="text-slate-300 font-mono text-sm uppercase">{product.sku}</span>
                    </div>
                    <div className="flex flex-col pb-2 border-b border-slate-900/60">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Listing Status</span>
                      <span className="text-emerald-400 font-bold text-sm uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        Verified Active
                      </span>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'specifications' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-4"
                  >
                    <div className="p-4 bg-[#030712] border border-slate-850 rounded-xl space-y-3">
                      <h4 className="text-white font-black text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" /> High Performance Standard Selection
                      </h4>
                      <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs pl-1">
                        <li>Durable, highly resilient outer construction optimized for dynamic shock protection.</li>
                        <li>Verified genuine raw material build with custom high-end finishing layouts.</li>
                        <li>Undergoes multi-point quality check inspections before parcel sealing.</li>
                        <li>Supplied with environment-friendly biodegradable outer carton packaging.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'shipping' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-4"
                  >
                    <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5 space-y-4 text-xs font-medium text-slate-400">
                      <div className="flex items-start gap-3.5">
                        <Truck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-black uppercase text-[10px] tracking-wider mb-0.5">Pi Network Express Logistics</h4>
                          <p className="leading-relaxed text-slate-400">Get delivery estimated between <span className="text-indigo-400 font-black">{formatEstimateDate(deliveryStart)}</span> and <span className="text-indigo-400 font-black">{formatEstimateDate(deliveryEnd)}</span>.</p>
                          <p className="text-[10px] text-emerald-400 font-black mt-1">Shipping: FREE on checkout totals exceeding 100 Pi</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 border-t border-slate-900/60 pt-3">
                        <RefreshCcw className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-black uppercase text-[10px] tracking-wider mb-0.5">7-Day Refund Commitment</h4>
                          <p className="leading-relaxed text-slate-400">Compliant hassle-free returns within 7 calendar days of receipt for any item issues or mismatches.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 border-t border-slate-900/60 pt-3">
                        <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-black uppercase text-[10px] tracking-wider mb-0.5">Safe Pioneer Escrow Service</h4>
                          <p className="leading-relaxed text-slate-400">Pi network balance is secure. Escrow funds are only dispersed to merchant upon customer delivery confirmation.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Reputation Summary */}
            <div className="pt-6 border-t border-slate-900">
              <ReputationWidget entityId={product.productId} entityType="product" />
            </div>

          </div>
        </div>

        {/* Real Merchant Store Profile details */}
        {store && (
          <div className="mt-20 border-t border-slate-900 pt-16">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">About the Merchant</h3>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <StoreIcon className="w-8 h-8 text-violet-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{store.storeName}</h2>
                    <span className="p-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full" title="Verified Merchant">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl line-clamp-2">{store.description || 'This registered Pi Network store operates with complete compliance standards and offers prompt local deliveries.'}</p>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-600" /> {store.city || 'Chicago'}, {store.country || 'USA'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {store.rating || '4.9'} store rating</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-800/60 pt-4 md:pt-0">
                <button 
                  onClick={() => navigate(`/store/${store.storeId}/products`)}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Visit Store
                </button>
                <button 
                  onClick={handleMessageMerchant}
                  className="flex-1 md:flex-none px-6 py-3 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Chat Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-slate-900 pt-16 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Merchant Catalog Recommendations</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">More From This Store</h2>
              </div>
            </div>

            <div className="premium-product-grid">
              {relatedProducts.map(prod => (
                <ProductCard 
                  key={prod.productId}
                  product={prod}
                  onView={(p) => navigate(`/product/${p.productId}`)}
                  onEdit={() => navigate(`/store/${prod.storeId}/products`)}
                  onDelete={() => {}}
                  onDuplicate={() => {}}
                  onManageVariants={() => navigate(`/store/${prod.storeId}/products`)}
                  viewMode="grid"
                />
              ))}
            </div>
          </div>
        )}

        {/* SIMILAR PRODUCTS CAROUSEL */}
        {similarProducts.length > 0 && (
          <div className="mt-16 border-t border-slate-900 pt-12 space-y-6">
            <div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Based on this category</span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Similar Selections</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {similarProducts.map(prod => (
                <CarouselProductCard 
                  key={prod.productId} 
                  prod={prod} 
                  onClick={(p: any) => navigate(`/product/${p.productId}`)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDED PRODUCTS CAROUSEL */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16 border-t border-slate-900 pt-12 space-y-6">
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Pioneers are also buying</span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Recommended For You</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {recommendedProducts.map(prod => (
                <CarouselProductCard 
                  key={prod.productId} 
                  prod={prod} 
                  badge="Pioneer's Choice" 
                  onClick={(p: any) => navigate(`/product/${p.productId}`)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* SPONSORED PRODUCTS SECTION */}
        {sponsoredProducts.length > 0 && (
          <div className="mt-16 border-t border-slate-900 pt-12 space-y-6">
            <div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">Sponsored Partnerships</span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Featured Offers</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sponsoredProducts.map(prod => (
                <div 
                  key={prod.productId}
                  onClick={() => navigate(`/product/${prod.productId}`)}
                  className="bg-gradient-to-br from-[#0c1221] to-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded z-10">
                    Sponsored
                  </div>
                  <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden relative mb-3">
                    <img src={prod.mainImage} alt={prod.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-wider block mb-1">{prod.brand}</span>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white leading-snug line-clamp-2 min-h-[2.5rem] mb-2">{prod.productName}</h4>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-850">
                    <span className="text-sm font-black text-white">{prod.price} <span className="text-xs font-bold text-slate-400">π</span></span>
                    <span className="text-[9px] text-slate-500 font-bold">${(prod.price * 3.14).toFixed(1)} USD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMER REVIEWS & FEEDBACK */}
        <div className="mt-20 border-t border-slate-900 pt-16 space-y-12 sm:space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 border-b border-slate-900 pb-8 sm:pb-12">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Verified Buyer Logs</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">Customer Experiences</h2>
            </div>
            {!showReviewForm && (
              <button 
                onClick={() => setShowReviewForm(true)}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95"
              >
                Write a Review
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16">
            <div className="lg:col-span-2">
              {showReviewForm ? (
                <ReviewForm 
                  entityId={product.productId} 
                  entityType="product" 
                  onCancel={() => setShowReviewForm(false)}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    setRefreshReviews(prev => prev + 1);
                    triggerToast('Review submitted successfully!');
                  }}
                />
              ) : (
                <ReviewList 
                  key={refreshReviews}
                  entityId={product.productId} 
                  entityType="product" 
                />
              )}
            </div>

            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              <div className="p-6 sm:p-8 bg-slate-900/50 border border-slate-850 rounded-2xl">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">Review Guidelines</h3>
                <ul className="space-y-3 sm:space-y-4">
                  <GuidelineItem text="Be respectful and honest about your experience" />
                  <GuidelineItem text="Focus on quality, transaction flow, and delivery speed" />
                  <GuidelineItem text="Do not include private seller credentials or phone numbers" />
                  <GuidelineItem text="Avoid advertising external platforms" />
                </ul>
              </div>
              
              <div className="p-6 sm:p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-indigo-400 mb-3" />
                <h4 className="text-xs font-black text-white uppercase mb-1.5">Verified Network Reviews</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Look for the badge to identify reviews from customers with completed Pi Network transaction settlements.</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Premium Sticky Mobile Buy Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 px-4 py-3 sm:py-4 flex items-center justify-between gap-4 lg:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.5)]"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                {product.productName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-white">{activePrice} π</span>
                <span className="text-[9px] text-slate-500 line-through font-bold">{originalPrice} π</span>
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block truncate">
                  ({Object.entries(selectedAttributes).map(([k, v]) => v).join(' / ') || 'Standard'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`p-3.5 rounded-xl border border-slate-800 transition-all flex items-center justify-center min-h-[44px] min-w-[44px] ${
                  added 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-slate-900 text-slate-300 hover:text-white'
                }`}
                title="Add to Shopping Bag"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : added ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-violet-400" />
                )}
              </button>

              <button 
                onClick={handleBuyNow}
                disabled={isBuying}
                className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 min-h-[44px] whitespace-nowrap"
              >
                {isBuying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <BagIcon className="w-4 h-4" /> Pi Pay Now
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox / Enlarged Image Zoom Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-all z-55 hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous/Next Arrows inside Lightbox */}
          {currentGallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => (prev - 1 + currentGallery.length) % currentGallery.length);
                }}
                className="absolute left-6 p-4 rounded-full bg-slate-900/60 border border-slate-800 text-white hover:bg-slate-900 transition-all z-55 hover:scale-105 flex items-center justify-center cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => (prev + 1) % currentGallery.length);
                }}
                className="absolute right-6 p-4 rounded-full bg-slate-900/60 border border-slate-800 text-white hover:bg-slate-900 transition-all z-55 hover:scale-105 flex items-center justify-center cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          {/* Main Enlarged Image */}
          <div 
            className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={currentGalleryImg} 
              alt={product.productName} 
              className="max-w-full max-h-full object-contain rounded-xl select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Index Counter inside Lightbox */}
          <div className="mt-4 text-xs font-mono font-black uppercase text-slate-500 tracking-widest">
            Image {selectedImageIndex + 1} of {currentGallery.length}
          </div>
        </div>
      )}

      {/* Social Media Sharing Modal */}
      {isShareOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsShareOpen(false)}
        >
          <div 
            className="bg-[#0c1221] border border-slate-850 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block mb-0.5">Tell Others</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Share Product Experience</h3>
              </div>
              <button 
                onClick={() => setIsShareOpen(false)}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shared content preview */}
            <div className="p-3 bg-slate-950/60 border border-slate-900/60 rounded-xl space-y-1.5 text-xs text-slate-400 font-medium">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">Message Preview</span>
              <p className="line-clamp-4 leading-normal font-mono text-[10px] text-slate-300">
                {`Check out ${product.productName}`}
                {Object.entries(selectedAttributes).length > 0 && ` (${Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})`}
                {`\nPrice: ${activePrice} π\n\nLink: ${window.location.href}`}
              </p>
            </div>

            {/* Social Channels List */}
            <div className="grid grid-cols-4 gap-4 text-center">
              {/* Copy Link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  triggerToast('Link copied to clipboard!');
                  setIsShareOpen(false);
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800/80 group-hover:border-indigo-500 group-hover:bg-indigo-500/10 text-slate-300 group-hover:text-indigo-400 transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </div>
                <span className="text-[9px] font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">Copy Link</span>
              </button>

              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Check out ${product.productName}` +
                  (Object.entries(selectedAttributes).length > 0 ? ` (${Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})` : '') +
                  `\nPrice: ${activePrice} π\n\nLink: ${window.location.href}`
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsShareOpen(false)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800/80 group-hover:border-emerald-500 group-hover:bg-emerald-500/10 text-slate-300 group-hover:text-emerald-400 transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="text-[9px] font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(
                  `Check out ${product.productName}` +
                  (Object.entries(selectedAttributes).length > 0 ? ` (${Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})` : '') +
                  `\nPrice: ${activePrice} π`
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsShareOpen(false)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800/80 group-hover:border-sky-500 group-hover:bg-sky-500/10 text-slate-300 group-hover:text-sky-400 transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <span className="text-[9px] font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">Telegram</span>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Check out ${product.productName}` +
                  (Object.entries(selectedAttributes).length > 0 ? ` (${Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})` : '') +
                  `\nPrice: ${activePrice} π\n\nLink: ${window.location.href}`
                )}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsShareOpen(false)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800/80 group-hover:border-slate-400 group-hover:bg-slate-400/10 text-slate-300 group-hover:text-white transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
                </div>
                <span className="text-[9px] font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">X / Twitter</span>
              </a>
            </div>

            {/* Native Share Option */}
            {navigator.share && (
              <button
                onClick={() => {
                  navigator.share({
                    title: product.productName,
                    text: `Check out ${product.productName} on Pi Business Market!`,
                    url: window.location.href
                  }).catch(err => console.log(err));
                  setIsShareOpen(false);
                }}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
              >
                More Share Options
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GuidelineItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3 text-xs font-medium text-slate-400 leading-normal">
    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
    <span>{text}</span>
  </li>
);

const TrustBadge = ({ icon, label, sub }: any) => (
  <div className="flex items-center gap-3 bg-[#030712] border border-slate-850 p-4 rounded-xl">
    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-indigo-400">
      {icon}
    </div>
    <div>
      <h4 className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1">{label}</h4>
      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{sub}</p>
    </div>
  </div>
);

const CarouselProductCard = ({ prod, badge, onClick }: any) => {
  return (
  <div 
    onClick={() => onClick(prod)}
    className="min-w-[200px] sm:min-w-[240px] max-w-[240px] bg-slate-900/60 hover:bg-slate-900 border border-slate-855 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg shrink-0"
  >
    <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden relative mb-3">
      <img src={getProductImageUrl(prod)} alt={prod.productName || prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
      {badge && (
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white font-black text-[8px] uppercase tracking-wider rounded">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1 truncate">{prod.brand}</span>
    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white leading-snug line-clamp-2 min-h-[2.5rem] mb-2">{prod.productName}</h4>
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-850">
      <span className="text-sm font-black text-white">{prod.price} <span className="text-xs font-bold text-slate-400">π</span></span>
      <span className="text-[9px] text-slate-500 font-bold">${(prod.price * 3.14).toFixed(1)} USD</span>
    </div>
  </div>
  );
};
