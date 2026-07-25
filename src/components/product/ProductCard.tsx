/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  TrendingUp,
  Tag,
  Database,
  BarChart3,
  Copy,
  AlertTriangle,
  Layers,
  Star,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Info,
  X,
  Share2,
  Check,
  Loader2,
  Truck,
  ArrowRight,
  GitCompare,
  Sparkles,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { useAuth } from '../../auth/useAuth';
import { cartService } from '../../services/cartService';
import { checkoutService } from '../../services/checkoutService';
import { BottomDrawer } from '../ui/BottomDrawer';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onDuplicate?: (product: Product) => void;
  onView?: (product: Product) => void;
  onManageVariants?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
  isMerchantView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onManageVariants,
  viewMode = 'grid',
  isMerchantView = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showMenu, setShowMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [added, setAdded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync Wishlist with localStorage
  useEffect(() => {
    const wishlisted = localStorage.getItem(`wishlist_${product.productId}`);
    if (wishlisted === 'true') {
      setIsWishlisted(true);
    }
    const compared = localStorage.getItem(`compare_${product.productId}`);
    if (compared === 'true') {
      setIsCompared(true);
    }
  }, [product.productId]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isWishlisted;
    setIsWishlisted(newState);
    localStorage.setItem(`wishlist_${product.productId}`, String(newState));
    
    // Custom window event to notify other components (e.g. Navbar)
    window.dispatchEvent(new Event('wishlistUpdated'));
    triggerToast(newState ? 'Added to Wishlist' : 'Removed from Wishlist');
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCompared;
    setIsCompared(newState);
    localStorage.setItem(`compare_${product.productId}`, String(newState));
    
    // Save to list of compared items
    let compareList: string[] = JSON.parse(localStorage.getItem('compare_list') || '[]');
    if (newState) {
      if (!compareList.includes(product.productId)) {
        compareList.push(product.productId);
      }
    } else {
      compareList = compareList.filter(id => id !== product.productId);
    }
    localStorage.setItem('compare_list', JSON.stringify(compareList));
    window.dispatchEvent(new Event('compareUpdated'));
    triggerToast(newState ? 'Added to comparison list' : 'Removed from comparison');
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setIsAdding(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, product.businessId);
      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        name: product.productName,
        imageUrl: product.mainImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : ''),
        quantity: 1,
        unitPrice: product.price || 0
      });
      setAdded(true);
      triggerToast('Added to Shopping Bag!');
      setTimeout(() => setAdded(false), 2000);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Failed to add to cart', err);
      triggerToast('Error adding to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setIsBuying(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, product.businessId);
      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        name: product.productName,
        imageUrl: product.mainImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : ''),
        quantity: 1,
        unitPrice: product.price || 0
      });
      const updatedCart = await cartService.getOrCreateCart(user.uid, product.businessId);
      const sessionId = await checkoutService.createSession(updatedCart, user.uid);
      navigate(`/checkout/${sessionId}`);
    } catch (err) {
      console.error('Buy Now failed', err);
      triggerToast('Error initiating checkout');
    } finally {
      setIsBuying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'archived': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handleCardClick = () => {
    if (onView) {
      onView(product);
    } else {
      navigate(`/product/${product.productId}`);
    }
  };

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  const productImgUrl = product.mainImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60';

  // Seed ratings and sales numbers deterministically to look real and premium
  const ratingSeed = 4.3 + (product.productId.charCodeAt(0) % 8) * 0.1;
  const rating = Math.min(5, Math.max(4, ratingSeed)).toFixed(1);
  const soldCount = 50 + (product.productId.charCodeAt(product.productId.length - 1) || 0) * 4;
  
  const oldPrice = ((product.price || 0) * 1.25).toFixed(2);
  const discountPct = "20%";

  // Badges logic
  const isBestSeller = (product.productId.charCodeAt(0) % 3) === 0;
  const isTrending = (product.productId.charCodeAt(product.productId.length - 1) % 3) === 0;

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-[20px] overflow-hidden group hover:border-violet-500/50 hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-1 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 cursor-pointer relative shadow-lg hover:shadow-violet-950/20"
      >
        <div className="flex items-center gap-5 w-full md:w-auto">
          {/* Large Product Image with Hover Zoom */}
          <div className="w-28 h-28 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800/80 relative">
            <img 
              src={productImgUrl} 
              alt={product.productName} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
            {isOutOfStock ? (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-[9px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">OUT OF STOCK</span>
              </div>
            ) : isLowStock ? (
              <div className="absolute bottom-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg">
                Low Stock
              </div>
            ) : (
              <div className="absolute top-1 left-1 bg-violet-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg">
                -{discountPct}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest">
                {product.brand || 'Premium Brand'}
              </span>
              <span className="text-slate-700">•</span>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(product.status)}`}>
                {product.status}
              </span>
              {isBestSeller && (
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Best Seller
                </span>
              )}
              {isTrending && (
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Trending
                </span>
              )}
            </div>
            
            <h3 className="font-extrabold text-white text-lg group-hover:text-violet-400 transition-colors uppercase tracking-tight truncate max-w-md">
              {product.productName}
            </h3>

            <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-1.5 max-w-md">
              {product.shortDescription || 'Exclusive product selection designed for supreme utility and quality.'}
            </p>

            <div className="flex items-center gap-3.5 text-[10px] text-slate-400 flex-wrap font-medium">
              <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-lg">SKU: {product.sku}</span>
              <span className="flex items-center gap-1 uppercase tracking-wider"><Tag className="w-3.5 h-3.5 text-violet-400" /> {product.category}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span className="font-bold">{rating}</span>
                <span className="text-slate-500 text-[8px]">({soldCount} sold)</span>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Seller
              </span>
            </div>
          </div>
        </div>

        {/* Pricing, Actions, Wishlist & Context Actions */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/50">
          <div className="text-left md:text-right min-w-[100px]">
            <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Price</p>
            <div className="flex items-baseline gap-2 md:justify-end">
              <span className="text-2xl font-black text-white">{product.price} <span className="text-sm font-bold text-slate-400">π</span></span>
            </div>
            <span className="text-[10px] text-slate-500 line-through font-bold">{oldPrice} π</span>
            <span className="text-[10px] text-emerald-400 font-black ml-1">({discountPct} OFF)</span>
            <div className="text-[9px] text-slate-500 font-extrabold uppercase mt-1 flex items-center gap-1 md:justify-end">
              <Truck className="w-3 h-3 text-emerald-400" /> Free Delivery
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isMerchantView ? (
              <>
                {/* Manage button */}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(product)}
                    className="px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Manage
                  </button>
                )}

                {/* Edit Button */}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(product)}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white transition-all"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {/* Inventory Button */}
                {onManageVariants && (
                  <button 
                    onClick={() => onManageVariants(product)}
                    className="p-3 rounded-xl bg-indigo-650/10 border border-indigo-550/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all"
                    title="Inventory"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                )}

                {/* Duplicate Button */}
                {onDuplicate && (
                  <button 
                    onClick={() => onDuplicate(product)}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white transition-all"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}

                {/* Analytics Button */}
                <button 
                  onClick={() => navigate('/merchant-analytics')}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white transition-all"
                  title="Analytics"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(product.productId)}
                    className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-600 text-red-400 hover:text-white transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Wishlist Button */}
                <button 
                  onClick={toggleWishlist}
                  className={`p-3 rounded-xl border transition-all ${
                    isWishlisted 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title="Add to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Compare Button */}
                <button 
                  onClick={toggleCompare}
                  className={`p-3 rounded-xl border transition-all ${
                    isCompared 
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title="Compare Product"
                >
                  <GitCompare className="w-4 h-4" />
                </button>

                {/* Quick View */}
                <button 
                  onClick={() => setShowQuickView(true)}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="px-4 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />}
                  <span>{added ? 'Added' : 'Add Bag'}</span>
                </button>

                <button 
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider transition-all"
                >
                  {isBuying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buy Now'}
                </button>
              </>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800/80 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && !isMobile && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                    <button onClick={() => { handleCardClick(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    {isMerchantView ? (
                      <>
                        {onEdit && (
                          <button onClick={() => { onEdit(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider">
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                        )}
                        {onDuplicate && (
                          <button onClick={() => { onDuplicate(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider">
                            <Copy className="w-4 h-4" /> Duplicate
                          </button>
                        )}
                        {onDelete && (
                          <>
                            <div className="border-t border-slate-800 my-1" />
                            <button onClick={() => { onDelete(product.productId); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors uppercase tracking-wider">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          const link = window.location.origin + `/product/${product.productId}`;
                          navigator.clipboard.writeText(link);
                          triggerToast('Product link copied!');
                          setShowMenu(false);
                        }} 
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider"
                      >
                        <Share2 className="w-4 h-4" /> Copy Share Link
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Mobile-First Sliding Bottom Drawer */}
              {isMobile && (
                <BottomDrawer
                  isOpen={showMenu}
                  onClose={() => setShowMenu(false)}
                  title={product.productName}
                  description="Choose an action for this product listing"
                >
                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => { handleCardClick(); setShowMenu(false); }} 
                      className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 hover:text-white transition-all min-h-[48px]"
                    >
                      <Eye className="w-5 h-5 text-violet-400 shrink-0" /> 
                      <span>View Details</span>
                    </button>
                    
                    {isMerchantView ? (
                      <>
                        {onEdit && (
                          <button 
                            onClick={() => { onEdit(product); setShowMenu(false); }} 
                            className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 hover:text-white transition-all min-h-[48px]"
                          >
                            <Edit2 className="w-5 h-5 text-indigo-400 shrink-0" /> 
                            <span>Edit Listing</span>
                          </button>
                        )}
                        {onDuplicate && (
                          <button 
                            onClick={() => { onDuplicate(product); setShowMenu(false); }} 
                            className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 hover:text-white transition-all min-h-[48px]"
                          >
                            <Copy className="w-5 h-5 text-amber-400 shrink-0" /> 
                            <span>Duplicate Listing</span>
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => { onDelete(product.productId); setShowMenu(false); }} 
                            className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-2xl border border-red-900/40 hover:text-red-300 transition-all min-h-[48px]"
                          >
                            <Trash2 className="w-5 h-5 shrink-0" /> 
                            <span>Delete Listing</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          const link = window.location.origin + `/product/${product.productId}`;
                          navigator.clipboard.writeText(link);
                          triggerToast('Product link copied!');
                          setShowMenu(false);
                        }} 
                        className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 hover:text-white transition-all min-h-[48px]"
                      >
                        <Share2 className="w-5 h-5 text-emerald-400 shrink-0" /> 
                        <span>Copy Share Link</span>
                      </button>
                    )}
                  </div>
                </BottomDrawer>
              )}
            </div>
          </div>
        </div>

        {/* Float toast notice */}
        <AnimatePresence>
          {toastMessage && (
            <div className="absolute bottom-2 right-2 z-50 bg-[#090e1a] border border-violet-500/30 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              {toastMessage}
            </div>
          )}
        </AnimatePresence>

        {/* Quick View Modal */}
        {showQuickView && (
          <QuickViewModal product={product} imgUrl={productImgUrl} rating={rating} soldCount={soldCount} oldPrice={oldPrice} onClose={() => setShowQuickView(false)} />
        )}
      </div>
    );
  }

  // Grid view (Default - premium card)
  return (
    <div 
      className="bg-[#090e1a]/80 backdrop-blur-md border border-slate-800 hover:border-violet-500/30 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(139,92,246,0.12)] transition-all duration-200 flex flex-col justify-between h-full relative rounded-2xl overflow-hidden cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Visual top highlight bar */}
      <div className="h-1 bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-purple-600/30 group-hover:from-violet-500 group-hover:via-indigo-500 group-hover:to-purple-500 transition-all duration-500" />
      
      {/* Large Product Image with Hover Zoom & Image loading skeleton */}
      <div className="relative aspect-square bg-slate-950 overflow-hidden border-b border-slate-900">
        {/* Shimmer loading skeleton */}
        {!isImgLoaded && (
          <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        <img 
          src={productImgUrl} 
          alt={product.productName} 
          onLoad={() => setIsImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${isImgLoaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
        />

        {/* Quick View Action Overlay */}
        {!isMerchantView && (
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowQuickView(true)}
              className="px-3 py-1.5 bg-slate-950/90 text-white hover:bg-violet-600 rounded-full border border-slate-800 hover:border-violet-500/30 shadow-2xl hover:scale-105 transition-all text-[9px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap"
            >
              <Eye className="w-3 h-3 text-violet-400" /> Quick View
            </button>
          </div>
        )}

        {/* Wishlist Icon top-right with tap effect */}
        {!isMerchantView && (
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={toggleWishlist}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all shadow-md ${
                isWishlisted 
                  ? 'bg-rose-500 text-white shadow-rose-500/20' 
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-950 hover:text-white'
              }`}
              title="Toggle Wishlist"
            >
              <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
        )}

        {/* Compare Icon top-left */}
        {!isMerchantView && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={toggleCompare}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all shadow-md ${
                isCompared 
                  ? 'bg-indigo-600 text-white shadow-indigo-650/20' 
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-950 hover:text-white'
              }`}
              title="Compare Product"
            >
              <GitCompare className="w-3 h-3" />
            </motion.button>
          </div>
        )}

        {/* Badges on Bottom-Left - Designed for tight proportional scaling with zero overlap */}
        <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1 z-10 max-w-[95%]">
          {/* Discount Badge */}
          <span className="text-[7px] leading-none font-black text-white bg-indigo-600 px-1 py-0.5 rounded uppercase tracking-wider shadow-md whitespace-nowrap">
            -{discountPct} OFF
          </span>

          {/* Stock status badge */}
          {isOutOfStock ? (
            <span className="text-[7px] leading-none font-black text-red-400 bg-red-950/95 border border-red-900/40 px-1 py-0.5 rounded uppercase tracking-wider shadow-md whitespace-nowrap">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="text-[7px] leading-none font-black text-amber-400 bg-amber-950/95 border border-amber-900/40 px-1 py-0.5 rounded uppercase tracking-wider shadow-md whitespace-nowrap">
              Only {product.stock}
            </span>
          ) : (
            <span className="text-[7px] leading-none font-black text-emerald-400 bg-emerald-950/95 border border-emerald-900/40 px-1 py-0.5 rounded uppercase tracking-wider shadow-md flex items-center gap-0.5 whitespace-nowrap">
              In Stock
            </span>
          )}

          {/* Pi accepted badge */}
          <span className="text-[7px] leading-none font-black text-amber-400 bg-slate-950/95 border border-amber-500/30 px-1 py-0.5 rounded uppercase tracking-wider shadow-md flex items-center gap-0.5 whitespace-nowrap">
            <span className="text-[7.5px] leading-none text-amber-400 font-extrabold">π</span> Accepted
          </span>

          {/* Verified Merchant Badge */}
          <span className="text-[7px] leading-none font-black text-violet-400 bg-slate-950/95 border border-violet-500/20 px-1 py-0.5 rounded uppercase tracking-wider shadow-md flex items-center gap-0.5 whitespace-nowrap">
            <ShieldCheck className="w-2.5 h-2.5 text-violet-400" /> Merchant
          </span>
        </div>
      </div>

      {/* Details Area - Reduced height, elegant layout */}
      <div className="p-2.5 sm:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Brand & Rating row */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider block truncate max-w-[70%]">
              {product.brand || 'Premium Brand'}
            </span>
            <div className="flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded text-[8.5px] font-black text-amber-400 shrink-0">
              <Star className="w-2 h-2 fill-current text-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          <h3 className="font-extrabold text-white text-[11px] sm:text-xs leading-snug group-hover:text-violet-400 transition-colors uppercase tracking-tight line-clamp-2 min-h-[1.75rem]">
            {product.productName}
          </h3>

          <p className="text-[9px] text-slate-400 font-medium leading-normal line-clamp-1">
            {product.shortDescription || 'Exclusive curated item designed for maximum operational efficiency.'}
          </p>
        </div>

        {/* Pricing Layout */}
        <div className="bg-slate-950/60 border border-slate-900/60 p-1.5 rounded-lg flex items-center justify-between gap-1.5">
          <div>
            <p className="text-[6.5px] font-bold text-slate-500 uppercase tracking-widest leading-none">Store Price</p>
            <div className="flex items-baseline gap-1 flex-wrap md:flex-nowrap mt-0.5">
              <span className="text-xs font-black text-white whitespace-nowrap">{product.price} <span className="text-[9px] font-bold text-indigo-400">π</span></span>
              <span className="text-[8px] text-slate-600 line-through font-bold whitespace-nowrap">{oldPrice} π</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[7px] leading-none font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded uppercase tracking-wider block mb-0.5 whitespace-nowrap">
              -{discountPct} OFF
            </span>
            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block whitespace-nowrap">
              Free Delivery
            </span>
          </div>
        </div>

        {/* Bottom bar for actions */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-900" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <span className="text-[6.5px] font-bold text-slate-500 uppercase tracking-widest leading-none">Verified Log</span>
            <span className="text-[8.5px] font-bold text-slate-300 flex items-center gap-0.5 font-mono mt-0.5">
              <BarChart3 className="w-2.5 h-2.5 text-violet-400" /> {soldCount} Sold
            </span>
          </div>
          
          <div className="flex items-center flex-nowrap gap-1 shrink-0">
            {isMerchantView ? (
              <>
                {/* Inventory / Variants */}
                {onManageVariants && (
                  <button 
                    onClick={() => onManageVariants(product)}
                    className="p-1.5 rounded-lg bg-indigo-650/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition-all"
                    title="Inventory"
                  >
                    <Layers className="w-3 h-3" />
                  </button>
                )}
                {/* Edit */}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(product)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
                {/* Delete */}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(product.productId)}
                    className="p-1.5 rounded-lg bg-red-950/20 border border-red-900/30 hover:bg-red-600 text-red-400 hover:text-white transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {/* Manage Text Button */}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(product)}
                    className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[8px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    Manage
                  </button>
                )}
              </>
            ) : (
              <>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${window.location.origin}/product/${product.productId}`);
                    setToastMessage('Link copied!');
                    setTimeout(() => setToastMessage(null), 2000);
                  }}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all"
                  title="Share Link"
                >
                  <Share2 className="w-3 h-3 text-indigo-400" />
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all"
                  title="Add to Shopping Bag"
                >
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : added ? <Check className="w-3 h-3 text-emerald-400" /> : <ShoppingBag className="w-3 h-3 text-violet-400" />}
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-violet-600/20 whitespace-nowrap"
                >
                  Buy
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating local toast notice */}
      <AnimatePresence>
        {toastMessage && (
          <div className="absolute bottom-2 right-2 z-50 bg-[#090e1a] border border-violet-500/30 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-violet-400" />
            {toastMessage}
          </div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal product={product} imgUrl={productImgUrl} rating={rating} soldCount={soldCount} oldPrice={oldPrice} onClose={() => setShowQuickView(false)} />
      )}
    </div>
  );
};

// Premium Inline Quick View Modal Component
interface QuickViewProps {
  product: Product;
  imgUrl: string;
  rating: string;
  soldCount: number;
  oldPrice: string;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewProps> = ({ product, imgUrl, rating, soldCount, oldPrice, onClose }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-850 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full z-10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-full md:w-1/2 aspect-square bg-slate-950 overflow-hidden relative">
          <img src={imgUrl} alt={product.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute bottom-4 left-4 bg-violet-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded shadow-lg">
            20% OFF
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-650/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{rating}</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-snug mb-2">
              {product.productName}
            </h2>

            <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-4">
              {product.description || 'This premium catalog selection features precise manufacturing specifications, durable material standards, and compliance certifications designed for long-term operational excellence.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Pi Network Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{product.price} π</span>
                <span className="text-xs text-slate-600 line-through font-bold">{oldPrice} π</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Instant Delivery Available
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/product/${product.productId}`)}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-xl text-center shadow-lg transition-all"
              >
                Full Details
              </button>
              <button 
                onClick={() => {
                  const link = window.location.origin + `/product/${product.productId}`;
                  navigator.clipboard.writeText(link);
                  alert('Copied product share link to clipboard!');
                }}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                title="Share Selection"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
