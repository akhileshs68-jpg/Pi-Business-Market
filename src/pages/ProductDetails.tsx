/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { cartService } from '../services/cartService';
import { searchService } from '../services/searchService';
import { ReputationWidget } from '../components/ReputationWidget';
import { ReviewList } from '../components/ReviewList';
import { ReviewForm } from '../components/ReviewForm';
import { SearchIndexEntry } from '../types';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<SearchIndexEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // In a real app, we'd fetch the full product object
      // For foundation, we fetch from the search index or a mock
      const { results } = await searchService.search('', { entityType: 'product' });
      const found = results.find(p => p.entityId === id);
      if (found) {
        setProduct(found);
      }
    } catch (err) {
      console.error('Failed to fetch product', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !user) return;
    setIsAdding(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, product.businessId);
      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.entityId,
        name: product.title,
        image: product.metadata.image,
        quantity,
        unitPrice: product.price || 0
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Add to cart failed', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleMessageMerchant = () => {
    if (!product || !user) return;
    // Navigate to inbox with target user info via location state
    navigate('/inbox', { 
      state: { 
        targetUid: product.businessId,
        targetName: product.metadata.merchantName || product.title,
        contextType: 'product',
        contextId: product.entityId
      }
    });
  };

  const handleToggleWishlist = async () => {
    if (!product || !user) return;
    try {
      if (isWishlisted) {
        await cartService.removeFromWishlist(`${user.uid}_${product.entityId}`);
      } else {
        await cartService.addToWishlist(user.uid, 'product', product.entityId);
      }
      setIsWishlisted(!isWishlisted);
    } catch (err) {
      console.error('Wishlist toggle failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Loading Product Data...</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-12 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Results</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div className="aspect-square bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden relative group">
              {product.metadata.image ? (
                <img src={product.metadata.image} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-slate-800" />
                </div>
              )}
              <div className="absolute top-6 right-6">
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-4 rounded-2xl backdrop-blur-md transition-all shadow-xl ${
                    isWishlisted ? 'bg-rose-500 text-white' : 'bg-slate-950/40 text-white hover:bg-slate-950/60'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {product.metadata.category || 'General'}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-black">4.9</span>
                  <span className="text-xs font-bold text-slate-500">(120 Reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                {product.title}
              </h1>
              <p className="text-slate-400 font-medium leading-relaxed max-w-lg mb-8">
                {product.description}
              </p>
              
              {/* Reputation Summary */}
              <ReputationWidget entityId={product.entityId} entityType="product" />
            </div>

            <div className="mb-12">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-black text-white">{product.price} Pi</span>
                <span className="text-lg text-slate-600 line-through font-bold">{(product.price || 0) * 1.2} Pi</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase">Save 20%</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> In Stock & Ready to Ship
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center text-lg font-black text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-1 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
                    added 
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : added ? (
                    <>
                      <Check className="w-5 h-5" /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" /> Add to Bag
                    </>
                  )}
                </button>
              </div>

              <button 
                onClick={handleMessageMerchant}
                className="w-full py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message Merchant
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-12 border-t border-slate-900">
              <TrustBadge icon={<Truck className="w-5 h-5" />} label="Express Shipping" sub="Global Delivery" />
              <TrustBadge icon={<ShieldCheck className="w-5 h-5" />} label="Pi Secured" sub="Protected Payment" />
              <TrustBadge icon={<RefreshCcw className="w-5 h-5" />} label="Free Returns" sub="Within 30 days" />
              <TrustBadge icon={<Check className="w-5 h-5" />} label="Verified Asset" sub="Authored by Pi Entity" />
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-900 pb-12">
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Customer Experience</h2>
              <p className="text-slate-500 font-medium">Real feedback from the Pi Business Market community.</p>
            </div>
            {!showReviewForm && (
              <button 
                onClick={() => setShowReviewForm(true)}
                className="px-10 py-5 bg-white text-black rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95"
              >
                Write a Review
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              {showReviewForm ? (
                <ReviewForm 
                  entityId={product.entityId} 
                  entityType="product" 
                  onCancel={() => setShowReviewForm(false)}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    setRefreshReviews(prev => prev + 1);
                  }}
                />
              ) : (
                <ReviewList 
                  key={refreshReviews}
                  entityId={product.entityId} 
                  entityType="product" 
                />
              )}
            </div>

            <div className="lg:col-span-1 space-y-8">
              <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem]">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6">Review Guidelines</h3>
                <ul className="space-y-4">
                  <GuidelineItem text="Be respectful and honest" />
                  <GuidelineItem text="Focus on quality and service" />
                  <GuidelineItem text="Do not include personal info" />
                  <GuidelineItem text="Avoid promotional content" />
                </ul>
              </div>
              
              <div className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem]">
                <ShieldCheck className="w-8 h-8 text-indigo-400 mb-4" />
                <h4 className="text-sm font-black text-white uppercase mb-2">Verified Reviews</h4>
                <p className="text-xs text-slate-500 font-medium">Look for the badge to identify reviews from customers with confirmed Pi Network transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const GuidelineItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3 text-xs font-medium text-slate-400">
    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
    {text}
  </li>
);

const TrustBadge = ({ icon, label, sub }: any) => (
  <div className="flex items-center gap-3">
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-indigo-400">
      {icon}
    </div>
    <div>
      <h4 className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1">{label}</h4>
      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{sub}</p>
    </div>
  </div>
);
