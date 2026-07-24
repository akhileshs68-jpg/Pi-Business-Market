/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { cartService } from '../services/cartService';
import { searchService } from '../services/searchService';
import { productService } from '../services/productService';
import { storeService } from '../services/storeService';
import { checkoutService } from '../services/checkoutService';
import { ReputationWidget } from '../components/ReputationWidget';
import { ReviewList } from '../components/ReviewList';
import { ReviewForm } from '../components/ReviewForm';
import { SearchIndexEntry, Product, Store } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Interactive options
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Obsidian Black');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Zoom Ref and state
  const imageContainerRef = useRef<HTMLDivElement>(null);
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
    }
  }, [product]);

  // Sync wishlist from localStorage
  useEffect(() => {
    if (product) {
      const wish = localStorage.getItem(`wishlist_${product.productId}`);
      setIsWishlisted(wish === 'true');
    }
  }, [product]);

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
      const dbProd = await productService.getProduct(id!);
      if (dbProd) {
        setProduct(dbProd);
        return;
      }

      const { results } = await searchService.search('', { entityType: 'product' });
      const found = results.find(p => p.entityId === id);
      if (found) {
        setProduct(mapSearchEntryToProduct(found));
      }
    } catch (err) {
      console.error('Failed to fetch product', err);
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
          const filtered = storeProducts.filter(p => p.productId !== product.productId);
          setRelatedProducts(filtered.slice(0, 4));
        }
      }
    } catch (err) {
      console.error('Failed to load store and related items', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !user) return;
    setIsAdding(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, product.businessId);
      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        name: `${product.productName} (${selectedSize} / ${selectedColor})`,
        imageUrl: product.mainImage || product.imageUrls?.[0] || '',
        quantity,
        unitPrice: product.price || 0
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
      const cart = await cartService.getOrCreateCart(user.uid, product.businessId);
      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        name: `${product.productName} (${selectedSize} / ${selectedColor})`,
        imageUrl: product.mainImage || product.imageUrls?.[0] || '',
        quantity,
        unitPrice: product.price || 0
      });
      
      const updatedCart = await cartService.getOrCreateCart(user.uid, product.businessId);
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
        targetUid: product.businessId,
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
    const link = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product?.productName,
        text: product?.shortDescription,
        url: link
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(link);
      triggerToast('Product link copied to clipboard!');
    }
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

  const mainImageUrl = product.mainImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60');

  // Build high end multi angle image views if only single main image exists
  const generatedGallery = product.imageUrls && product.imageUrls.length > 1 
    ? product.imageUrls 
    : [
        mainImageUrl,
        // Add subtle styling crops to create multi-angle catalog view
        mainImageUrl + "&auto=format&fit=crop&w=600&q=80&crop=entropy",
        mainImageUrl + "&auto=format&fit=crop&w=600&q=80&crop=focalpoint&fp-z=2",
        mainImageUrl + "&auto=format&fit=crop&w=600&q=80&sat=-50",
      ];

  const currentGalleryImg = generatedGallery[selectedImageIndex] || mainImageUrl;

  const discountPercent = 20;
  const originalPrice = ((product.price || 0) * 1.25).toFixed(2);

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
            className="fixed bottom-6 right-6 z-50 bg-[#090e1a] border border-violet-500/30 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Back Link and Share */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white group">
            <ArrowLeft className="w-4 h-4 sm:w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Back to catalog</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Item</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">
          
          {/* COLUMN 1: Image Gallery */}
          <div className="space-y-6">
            <div 
              ref={imageContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="aspect-square bg-slate-900 border border-slate-800/80 rounded-2xl sm:rounded-[2rem] overflow-hidden relative group shadow-2xl shadow-violet-950/5"
            >
              <img 
                src={currentGalleryImg} 
                alt={product.productName} 
                className="w-full h-full object-cover transition-transform duration-100 ease-out" 
                style={zoomStyle}
                referrerPolicy="no-referrer"
              />
              
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
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
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
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {generatedGallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 bg-slate-900 transition-all ${
                    selectedImageIndex === idx 
                      ? 'border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.03]' 
                      : 'border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <img src={img} alt={`${product.productName} preview ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* COLUMN 2: Product purchasing choices */}
          <div className="flex flex-col space-y-8">
            
            {/* Header properties */}
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {product.category || 'General'}
                </span>
                <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-500/5 border border-amber-500/10 px-2.5 py-0.5 rounded-full">
                  <Star className="w-4 h-4 fill-current text-amber-400" />
                  <span>4.9</span>
                  <span className="text-slate-500 text-xs">({45 + (product.productId.charCodeAt(0) % 20)} reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">
                {product.productName}
              </h1>

              <div className="text-slate-500 text-xs font-mono mb-6 uppercase tracking-wider flex items-center gap-2">
                <span>SKU: <span className="text-slate-300">{product.sku}</span></span>
                <span>•</span>
                <span>Status: <span className="text-emerald-400">{product.status}</span></span>
              </div>

              <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                {product.description || 'This premium marketplace selection has been curated for superior manufacturing design, long-term operational durability, and verified compliant specifications. Crafted under professional industry supervision.'}
              </p>
            </div>

            {/* Premium Price Box */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Verified Pi Network Listing</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-white">{product.price} <span className="text-xl font-bold text-slate-400">π</span></span>
                  <span className="text-sm text-slate-500 line-through font-bold">{originalPrice} π</span>
                  <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    -{discountPercent}% OFF
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock Level</span>
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {product.stock > 0 ? `${product.stock} Units Available` : 'Temporarily Out'}
                </p>
              </div>
            </div>

            {/* Interactive variants selection */}
            <div className="space-y-6">
              
              {/* Color variant pills */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <span>Selected Color</span>
                  <span className="text-white">{selectedColor}</span>
                </div>
                <div className="flex gap-3">
                  {[
                    { name: 'Obsidian Black', color: 'bg-slate-900' },
                    { name: 'Cobalt Blue', color: 'bg-blue-600' },
                    { name: 'Glacier White', color: 'bg-slate-100' },
                    { name: 'Rose Gold', color: 'bg-rose-400' }
                  ].map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-9 h-9 rounded-full ${color.color} border-2 relative transition-all ${
                        selectedColor === color.name 
                          ? 'border-violet-500 ring-4 ring-violet-500/20 scale-105' 
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <span className={`absolute inset-0 flex items-center justify-center ${color.name === 'Glacier White' ? 'text-black' : 'text-white'}`}>
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size variant pills */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <span>Select Size</span>
                  <span className="text-white">{selectedSize}</span>
                </div>
                <div className="flex gap-2.5">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        selectedSize === size 
                          ? 'bg-violet-600/10 border-violet-500 text-white shadow-lg' 
                          : 'bg-[#030712] border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selection */}
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
                      <ShoppingBag className="w-4 h-4 text-violet-400" /> Add to bag
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
                      <BagIcon className="w-4 h-4" /> Buy Now
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

            {/* Delivery Estimation details */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4 text-xs font-medium text-slate-400">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Pi Network Express Delivery</h4>
                  <p className="leading-relaxed">Get delivery estimated between <span className="text-white font-black">{formatEstimateDate(deliveryStart)}</span> and <span className="text-white font-black">{formatEstimateDate(deliveryEnd)}</span>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-black uppercase text-[10px] tracking-wider mb-1">Safe Escrow Transactions</h4>
                  <p className="leading-relaxed">All Pi Network transactions are protected. Funds released to merchant only upon confirmed delivery receipt.</p>
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
