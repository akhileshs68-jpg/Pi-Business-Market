/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Share2, ShoppingBag, Eye, Heart, Store, Tag, 
  ChevronLeft, ChevronRight, Check, CheckCircle2, ShieldCheck, Scale
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../auth/useAuth';
import { cartService } from '../../services/cartService';
import { WishlistService } from '../../services/wishlistService';
import { PriceDisplay } from '../pricing/PriceDisplay';
import { resolveProductPricing, resolveVariantPricing } from '../../services/pricing/pricingCompatibility';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onDuplicate?: (product: Product) => void;
  onView?: (product: Product) => void;
  onManageVariants?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
  isMerchantView?: boolean;
  isSelected?: boolean;
  onSelect?: (productId: string, selected: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isMerchantView = false,
  isSelected = false,
  onSelect
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Gallery
  const [imgIdx, setImgIdx] = useState(0);
  const [isImgZoom, setIsImgZoom] = useState(false);
  
  // Variants
  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? product.variants![0].variantId : null
  );
  
  const activeVariant = hasVariants ? product.variants!.find(v => v.variantId === selectedVariantId) || product.variants![0] : null;
  const displayPrice = activeVariant?.price || product.price || 0;
  const displayStock = activeVariant?.stock ?? (product.stock || 0);
  
  // Images
  let gallery = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls 
    : (product.mainImage ? [product.mainImage] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']);
    
  if (activeVariant?.imageUrls && activeVariant.imageUrls.length > 0) {
    gallery = activeVariant.imageUrls;
  }
  
  useEffect(() => {
    if (imgIdx >= gallery.length) setImgIdx(0);
  }, [gallery.length, imgIdx]);

  // Touch Swipe
  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 30) {
      setImgIdx((prev) => (prev + 1) % gallery.length);
    } else if (touchStart - touchEnd < -30) {
      setImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev + 1) % gallery.length);
  };
  
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const wishlist = WishlistService.getLocalWishlist();
    const compare = WishlistService.getLocalCompare();
    setIsWishlisted(wishlist.includes(product.productId));
    setIsComparing(compare.includes(product.productId));
  }, [product.productId]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const wishStatus = await WishlistService.toggleWishlist(product.productId, user?.uid);
    setIsWishlisted(wishStatus);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { inCompare } = WishlistService.toggleCompare(product.productId);
    setIsComparing(inCompare);
  };
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to add to cart");
      return;
    }
    setIsAdding(true);
    try {
      const cart = await cartService.getOrCreateCart(user.uid, (product.businessId || product.storeId || 'unknown_business'));
      let variantName = '';
      let pricingRes;
      if (activeVariant) {
        variantName = ` (${Object.values(activeVariant.attributes).join(' / ')})`;
        pricingRes = await resolveVariantPricing(activeVariant, product);
      } else {
        pricingRes = await resolveProductPricing(product);
      }

      await cartService.addToCart(cart.cartId, {
        cartId: cart.cartId,
        productId: product.productId,
        variantId: activeVariant?.variantId,
        name: `${product.productName}${variantName}`,
        imageUrl: gallery[0],
        quantity: 1,
        unitPrice: pricingRes.piAmount ?? displayPrice,
        pricingMode: pricingRes.mode,
        localCurrency: pricingRes.localCurrency ?? undefined,
        localAmount: pricingRes.localAmount ?? undefined,
        communityPiAmount: pricingRes.mode === 'COMMUNITY' ? (pricingRes.piAmount ?? undefined) : undefined,
        piUnitPrice: pricingRes.piAmount ?? displayPrice,
        pricingRateUsed: pricingRes.rateUsed ?? undefined,
        pricingRateSource: pricingRes.rateSource ?? undefined,
        pricingRateTimestamp: pricingRes.rateTimestamp ?? undefined
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.productId}`;
    let text = `Check out ${product.productName}`;
    if (activeVariant) {
      text += ` (${Object.values(activeVariant.attributes).join(', ')})`;
    }
    text += `\nPrice: ${displayPrice} π`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.productName,
          text: text,
          url: url
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Product Link Copied!');
    }
  };

  // Generate Variant Preview
  let variantPreview = null;
  if (hasVariants) {
    const attrNames = new Set<string>();
    product.variants!.forEach(v => Object.keys(v.attributes).forEach(k => attrNames.add(k)));
    
    variantPreview = Array.from(attrNames).map(attrName => {
      const isColor = attrName.toLowerCase().includes('color');
      const values = Array.from(new Set(product.variants!.map(v => v.attributes[attrName])));
      
      return (
        <div key={attrName} className="text-[10px] text-slate-400 mt-2">
          <span className="font-bold block mb-1 uppercase tracking-wider">{attrName}:</span>
          <div className="flex flex-wrap gap-1.5">
            {values.map(val => {
              const matchingVariant = product.variants!.find(v => v.attributes[attrName] === val);
              const isSelected = activeVariant?.attributes[attrName] === val;
              
              if (isColor) {
                 const colorsMap: Record<string, string> = {
                  black: '#0f172a', white: '#f8fafc', blue: '#2563eb', red: '#dc2626',
                  green: '#16a34a', yellow: '#eab308', pink: '#db2777', purple: '#9333ea',
                  orange: '#ea580c', gray: '#4b5563', silver: '#cbd5e1', gold: '#fbbf24',
                };
                const visualColor = colorsMap[val.toLowerCase().trim()] || val;
                return (
                  <button
                    key={val}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (matchingVariant) setSelectedVariantId(matchingVariant.variantId);
                    }}
                    style={{ backgroundColor: visualColor }}
                    className={`w-5 h-5 rounded-full border ${isSelected ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-slate-700'}`}
                    title={val}
                  />
                );
              }
              
              return (
                <button
                  key={val}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (matchingVariant) setSelectedVariantId(matchingVariant.variantId);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isSelected ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  }

  const currentPrice = displayPrice;
  const originalPrice = activeVariant?.comparePrice || product.comparePrice || 0;
  const hasDiscount = originalPrice > currentPrice && originalPrice > 0;
  const discountPct = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  const rating = (product as any).rating ?? (product as any).averageRating ?? product.metrics?.performanceScore ?? null;
  const reviewCount = (product as any).reviewCount ?? product.metrics?.views ?? null;
  const sellerName = (product as any).seller || product.brand || 'Verified Merchant';
  const isVerifiedMerchant = (product as any).isVerified || product.featured || sellerName.toLowerCase().includes('verified');

  const showEscrowBadge = currentPrice > 0 && product.status !== 'draft';

  return (
    <>
      <div 
        onClick={() => navigate(`/product/${product.productId}`)}
        className={`bg-[#0a0f1c] border ${isSelected ? 'border-violet-500 ring-1 ring-violet-500' : 'border-slate-800'} rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col group cursor-pointer w-full shadow-lg relative`}
      >
        {isMerchantView && onSelect && (
          <div className="absolute top-2 left-2 z-20" onClick={e => e.stopPropagation()}>
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={e => onSelect(product.productId, e.target.checked)}
              className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500/50 cursor-pointer shadow-md"
            />
          </div>
        )}

        {/* TOP ROW: Image (Left) + Details (Right) */}
        <div className="flex flex-row p-3 gap-3">
          {/* LEFT: Image Gallery */}
          <div className="w-[40%] sm:w-[35%] shrink-0 relative aspect-square sm:aspect-auto sm:h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <div 
              className="w-full h-full relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => { e.stopPropagation(); setIsImgZoom(true); }}
            >
              <img 
                src={gallery[imgIdx]} 
                alt={product.productName} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Action Badges & Buttons over Image */}
              {hasDiscount && (
                <div className="absolute top-2 left-2 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg z-10 select-none">
                  -{discountPct}% OFF
                </div>
              )}

              <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10" onClick={e => e.stopPropagation()}>
                <button
                  title="Compare Item"
                  onClick={handleToggleCompare}
                  className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
                    isComparing
                      ? 'bg-indigo-600/95 border-indigo-500 text-white shadow-md'
                      : 'bg-black/50 hover:bg-black/85 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                </button>
                <button
                  title="Wishlist"
                  onClick={handleToggleWishlist}
                  className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
                    isWishlisted
                      ? 'bg-rose-600/95 border-rose-500 text-white shadow-md'
                      : 'bg-black/50 hover:bg-black/85 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-white' : ''}`} />
                </button>
              </div>

              {gallery.length > 1 && (
                <>
                  <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1 z-10">
                    {gallery.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full ${i === imgIdx ? 'w-3 bg-white' : 'w-1 bg-white/50'}`} />
                    ))}
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[7px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
                    {imgIdx + 1} / {gallery.length}
                  </div>
                  
                  <button onClick={handlePrev} className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-black/40 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button onClick={handleNext} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-black/40 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="w-[60%] sm:w-[65%] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-1">
                <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest line-clamp-1 mb-0.5">
                  {product.category || 'Product'}
                </span>
                {rating !== null && (
                  <span className="flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded shrink-0">
                    <Star className="w-2.5 h-2.5 fill-current" /> {rating} {reviewCount !== null ? `(${reviewCount})` : ''}
                  </span>
                )}
              </div>
              
              <h3 className="text-xs sm:text-sm font-extrabold text-white leading-tight line-clamp-2 mt-0.5 group-hover:text-indigo-300 transition-colors">
                {product.productName}
              </h3>
              
              <p className="text-[9px] text-slate-400 line-clamp-1 mt-1 font-medium">
                {product.shortDescription || product.description}
              </p>

              {/* Dynamic Buyer Protection Badge */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {showEscrowBadge && (
                  <span 
                    title="Merchant payout is held for 7 days after successful payment."
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[7px] font-black uppercase tracking-wider select-none cursor-help"
                  >
                    <ShieldCheck className="w-2 h-2 text-amber-400" /> 7-Day Buyer Protection
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <PriceDisplay 
                  item={activeVariant || product} 
                  parentProduct={hasVariants ? product : undefined}
                  type={hasVariants && activeVariant ? 'variant' : 'product'}
                  size="sm"
                />
                {hasDiscount && (
                  <div className="flex items-center gap-1 shrink-0 select-none">
                    <span className="text-[10px] text-slate-500 line-through font-medium">
                      {originalPrice} π
                    </span>
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                      -{discountPct}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold ${displayStock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {displayStock > 0 ? `${displayStock} units available` : 'Out of Stock'}
                </span>
                {sellerName && (
                  <span className="text-[8px] flex items-center gap-0.5 text-slate-500 font-bold truncate max-w-[100px]" title={sellerName}>
                    <Store className="w-2.5 h-2.5 text-violet-400 shrink-0" /> {sellerName}
                    {isVerifiedMerchant && <Check className="w-2 h-2 text-emerald-400 shrink-0" />}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Variants & Actions */}
        <div className="px-3 pb-3 border-t border-slate-800/80 mt-1">
          {hasVariants && (
            <div className="pt-1 pb-3">
              {variantPreview}
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleShare}
              className="p-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl text-slate-300 transition-all flex items-center justify-center shrink-0"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={isAdding || displayStock === 0}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                displayStock === 0 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : added 
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
              }`}
            >
              {displayStock === 0 ? (
                'Out of Stock'
              ) : added ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Added</>
              ) : (
                <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Lightbox */}
      {isImgZoom && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          onClick={() => setIsImgZoom(false)}
        >
          {gallery.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handlePrev(e); }} className="absolute left-4 p-3 bg-slate-900/60 hover:bg-slate-900 rounded-full text-white z-[110]">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleNext(e); }} className="absolute right-4 p-3 bg-slate-900/60 hover:bg-slate-900 rounded-full text-white z-[110]">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          <div className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={gallery[imgIdx]} 
              alt={product.productName} 
              className="max-w-full max-h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-8 text-white font-mono text-sm tracking-widest font-black">
            {imgIdx + 1} / {gallery.length}
          </div>
        </div>
      )}
    </>
  );
};
