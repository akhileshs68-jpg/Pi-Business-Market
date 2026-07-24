/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: Product) => void;
  onView: (product: Product) => void;
  onManageVariants: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onManageVariants,
  viewMode = 'grid'
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  // Sync Wishlist with localStorage
  useEffect(() => {
    const wishlisted = localStorage.getItem(`wishlist_${product.productId}`);
    if (wishlisted === 'true') {
      setIsWishlisted(true);
    }
  }, [product.productId]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isWishlisted;
    setIsWishlisted(newState);
    localStorage.setItem(`wishlist_${product.productId}`, String(newState));
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

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  const productImgUrl = product.mainImage || (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60';

  // Premium static rating and sales seed based on Product SKU/ID to prevent flickering
  const ratingSeed = 4.5 + (product.productId.charCodeAt(0) % 6) * 0.1;
  const rating = Math.min(5, Math.max(4, ratingSeed)).toFixed(1);
  const soldCount = 45 + (product.productId.charCodeAt(product.productId.length - 1) || 0) * 3;
  
  const oldPrice = ((product.price || 0) * 1.25).toFixed(2);
  const discountPct = "20%";

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onView(product)}
        className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden group hover:border-violet-500/40 hover:bg-slate-900 transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 cursor-pointer relative"
      >
        <div className="flex items-center gap-5 w-full md:w-auto">
          {/* Large Product Image with Hover Zoom */}
          <div className="w-24 h-24 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800/80 relative">
            <img 
              src={productImgUrl} 
              alt={product.productName} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
            {isOutOfStock ? (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-[10px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">OUT</span>
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
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getStatusColor(product.status)}`}>
                {product.status}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-850">
                {product.type}
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/5 border border-amber-500/10 text-amber-400 text-[10px]">
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span className="font-bold">{rating}</span>
                <span className="text-slate-500 text-[8px]">({soldCount} sold)</span>
              </div>
            </div>
            
            <h3 className="font-extrabold text-white text-lg group-hover:text-violet-400 transition-colors uppercase tracking-tight truncate max-w-md">
              {product.productName}
            </h3>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5 flex-wrap font-medium">
              <span className="font-mono text-indigo-400 font-bold bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded-lg">SKU: {product.sku}</span>
              <span className="flex items-center gap-1 uppercase tracking-wider"><Tag className="w-3.5 h-3.5 text-violet-400" /> {product.category}</span>
              <span className="flex items-center gap-1.5 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Seller
              </span>
            </div>
          </div>
        </div>

        {/* Pricing, Actions, Wishlist & Context Actions */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/50">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Pi Marketplace Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{product.price} <span className="text-sm font-bold text-slate-400">π</span></span>
              <span className="text-xs text-slate-600 line-through font-bold">{oldPrice} π</span>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
              <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Quick View */}
            <button 
              onClick={() => setShowQuickView(true)}
              className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
              title="Quick View"
            >
              <Eye className="w-4.5 h-4.5" />
            </button>

            <button 
              onClick={() => onManageVariants(product)}
              className="p-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all border border-indigo-500/20"
              title="Manage Variants"
            >
              <Layers className="w-4.5 h-4.5" />
            </button>
            
            <button 
              onClick={() => onEdit(product)}
              className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-violet-600/10"
            >
              Manage
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-800/80"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                    <button onClick={() => { onView(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button onClick={() => { onEdit(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => { onDuplicate(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider">
                      <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <div className="border-t border-slate-800 my-1" />
                    <button onClick={() => { onDelete(product.productId); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors uppercase tracking-wider">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
      onClick={() => onView(product)}
      className="bg-slate-900/60 border border-slate-800/85 rounded-2xl overflow-hidden group hover:border-violet-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-950/15 flex flex-col justify-between h-full relative cursor-pointer"
    >
      <div className="h-1 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 group-hover:from-violet-600 group-hover:to-indigo-600 transition-all duration-300" />
      
      {/* Large Product Image with Hover Zoom */}
      <div className="relative aspect-square bg-slate-950 overflow-hidden border-b border-slate-800/50">
        <img 
          src={productImgUrl} 
          alt={product.productName} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Quick View Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowQuickView(true)}
            className="p-3 bg-white text-black hover:bg-slate-100 rounded-full shadow-2xl hover:scale-105 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> Quick View
          </button>
        </div>

        {/* Wishlist Icon top-right */}
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={toggleWishlist}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-xl ${
              isWishlisted 
                ? 'bg-rose-500 text-white scale-105 shadow-rose-500/20' 
                : 'bg-slate-950/40 text-slate-300 hover:bg-slate-950/60 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Badges on Top-Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="text-[9px] font-black text-white bg-indigo-600/90 px-2 py-1 rounded-md uppercase tracking-wider shadow-lg">
            -{discountPct} OFF
          </span>
          {isOutOfStock ? (
            <span className="text-[9px] font-black text-red-400 bg-red-950/90 border border-red-900/50 px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-lg">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="text-[9px] font-black text-amber-400 bg-amber-950/90 border border-amber-900/50 px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-lg">
              Low Stock
            </span>
          ) : (
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/90 border border-emerald-900/50 px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-lg flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Rating, Sold Counts, Status */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span className="text-xs font-black text-slate-200">{rating}</span>
              <span className="text-[10px] text-slate-500 font-bold">({soldCount} sold)</span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(product.status)}`}>
              {product.status}
            </span>
          </div>

          <h3 className="font-extrabold text-white text-base leading-tight group-hover:text-violet-400 transition-colors uppercase tracking-tight line-clamp-2">
            {product.productName}
          </h3>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 font-bold">
            <Database className="w-3 h-3 text-indigo-400" />
            SKU: {product.sku}
          </div>
        </div>

        {/* Pricing Layout */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Market Price</p>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white">{product.price} <span className="text-xs font-bold text-indigo-400">π</span></span>
              <span className="text-[10px] text-slate-600 line-through font-bold">{oldPrice} π</span>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Tag className="w-3 h-3 text-violet-400" />
              <span className="text-[11px] font-black truncate uppercase tracking-wider">{product.category}</span>
            </div>
          </div>
        </div>

        {/* Progress level Stock */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span>Stock Availability</span>
            <span className={isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}>
              {isOutOfStock ? 'OUT OF STOCK' : `${product.stock} Units`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isOutOfStock ? 'w-0' :
                isLowStock ? 'w-1/4 bg-amber-500' : 'w-full bg-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Actions bar at bottom */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-850">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Views</span>
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1 font-mono">
                <BarChart3 className="w-3 h-3 text-violet-400" /> {soldCount * 4}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sales</span>
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1 font-mono">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> {soldCount}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onManageVariants(product)}
              className="p-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all border border-indigo-500/20"
              title="Manage Variants"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onEdit(product)}
              className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col md:flex-row relative"
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
          <div className="absolute top-4 left-4 bg-violet-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
            20% OFF
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest">
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
              <a 
                href={`/product/${product.productId}`}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-xl text-center shadow-lg transition-all"
              >
                Full Details
              </a>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.productName,
                      text: product.shortDescription,
                      url: window.location.origin + `/product/${product.productId}`
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin + `/product/${product.productId}`);
                    alert('Copied product share link to clipboard!');
                  }
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
