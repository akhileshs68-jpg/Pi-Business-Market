/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Store,
  BookmarkCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { cartService } from '../../services/cartService';
import { productService } from '../../services/productService';
import { getFirebaseDb } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { WishlistItem } from '../../types';

interface WishlistProps {
  userUid: string;
  onCartUpdated?: () => void;
  onWishlistUpdated?: () => void;
}

interface ResolvedWishlistItem extends WishlistItem {
  name: string;
  price: number;
  imageUrl?: string;
  businessId: string;
  sellerName?: string;
}

export const Wishlist: React.FC<WishlistProps> = ({ 
  userUid, 
  onCartUpdated,
  onWishlistUpdated 
}) => {
  const [items, setItems] = useState<ResolvedWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (userUid) {
      loadWishlist();
    }
  }, [userUid]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      // 1. Get raw wishlist items
      const rawItems = await cartService.getWishlist(userUid);
      
      // 2. Resolve details for each wishlist item
      const resolvedList: ResolvedWishlistItem[] = [];

      for (const item of rawItems) {
        try {
          let name = 'Pi Network Item';
          let price = 5.00;
          let imageUrl = '';
          let businessId = 'demo_business_123';
          let sellerName = 'Pi Pioneer Merchant';

          if (item.entityType === 'service') {
            // Fetch service details from services collection
            const servRef = doc(db, 'services', item.entityId);
            const servSnap = await getDoc(servRef);
            if (servSnap.exists()) {
              const servData = servSnap.data();
              name = servData.title || name;
              price = servData.basePrice || price;
              imageUrl = servData.mainImage || servData.imageUrl || imageUrl;
              businessId = servData.businessId || businessId;
              sellerName = servData.sellerName || sellerName;
            } else {
              // Standard fallback demo service details
              if (item.entityId === 'demo_serv_1') {
                name = 'Pi Certified Smart Contract Audit';
                price = 120.00;
                imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300';
                businessId = 'demo_business_123';
                sellerName = 'Antigravity Audits Ltd';
              }
            }
          } else {
            // Fetch product details
            const prod = await productService.getProduct(item.entityId) as any;
            if (prod) {
              name = prod.productName;
              price = prod.price || 0;
              imageUrl = prod.mainImage || prod.imageUrls?.[0] || '';
              businessId = prod.businessId || businessId;
              sellerName = prod.brand || sellerName;
            } else {
              // Standard fallback demo product details
              if (item.entityId === 'demo_prod_1') {
                name = 'Enterprise Pi Laptop Pro';
                price = 45.00;
                imageUrl = 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=300';
                businessId = 'demo_business_123';
                sellerName = 'Enterprise Tech';
              }
            }
          }

          resolvedList.push({
            ...item,
            name,
            price,
            imageUrl,
            businessId,
            sellerName
          });
        } catch (resolveErr) {
          console.error(`Failed to resolve wishlist item ${item.entityId}:`, resolveErr);
          // Keep item with mock values so user can still interact
          resolvedList.push({
            ...item,
            name: 'Pioneer Shared Resource',
            price: 15.00,
            businessId: 'demo_business_123'
          });
        }
      }

      setItems(resolvedList);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wishlistId: string) => {
    setActionLoading(wishlistId);
    try {
      await cartService.removeFromWishlist(wishlistId);
      await loadWishlist();
      if (onWishlistUpdated) onWishlistUpdated();
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToCart = async (item: ResolvedWishlistItem) => {
    setActionLoading(item.wishlistId);
    try {
      // 1. Get or create cart for the seller/business
      const cart = await cartService.getOrCreateCart(userUid, item.businessId);

      // 2. Add to cart
      if (item.entityType === 'service') {
        const db = getFirebaseDb();
        const itemId = `${cart.cartId}_${item.entityId}_base`;
        const itemRef = doc(db, 'cartItems', itemId);
        await setDoc(itemRef, {
          itemId,
          cartId: cart.cartId,
          productId: item.entityId,
          name: item.name,
          imageUrl: item.imageUrl || '',
          quantity: 1,
          unitPrice: item.price,
          subtotal: item.price,
          status: 'active',
          type: 'service',
          serviceDate: '2026-08-15',
          serviceTime: '14:00',
          sellerName: item.sellerName || 'Pi Service Provider'
        });
        await cartService.recalculateCart(cart.cartId);
      } else {
        await cartService.addToCart(cart.cartId, {
          cartId: cart.cartId,
          productId: item.entityId,
          name: item.name,
          imageUrl: item.imageUrl || '',
          quantity: 1,
          unitPrice: item.price
        });
      }

      // 3. Remove from wishlist
      await cartService.removeFromWishlist(item.wishlistId);

      await loadWishlist();
      if (onCartUpdated) onCartUpdated();
      if (onWishlistUpdated) onWishlistUpdated();
    } catch (err) {
      console.error('Failed to move wishlist item to cart:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddDemoWishlistItem = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      
      // Add a product item to wishlist
      await cartService.addToWishlist(userUid, 'product', 'demo_prod_1');
      // Add a service item to wishlist
      await cartService.addToWishlist(userUid, 'service', 'demo_serv_1');
      
      await loadWishlist();
      if (onWishlistUpdated) onWishlistUpdated();
    } catch (err) {
      console.error('Failed to add demo wishlist item:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Querying Wishlist...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-900/20 border border-slate-800/60 p-10 rounded-2xl flex flex-col items-center justify-center text-center">
        <Heart className="w-10 h-10 text-slate-700 mb-4 animate-pulse" />
        <h3 className="text-base font-bold text-slate-300">No saved items yet.</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6 leading-relaxed">
          Tap the wishlist heart icon on products or services to keep track of items you love.
        </p>
        <button 
          onClick={handleAddDemoWishlistItem}
          className="py-2.5 px-5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-800 cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Add Wishlist Demo Items</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>My Wishlist ({items.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <motion.div 
            key={item.wishlistId}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl flex items-center gap-4 hover:border-slate-800 transition-all group"
          >
            {/* Image */}
            <div className="w-16 h-16 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shrink-0 relative flex items-center justify-center">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ShoppingBag className="w-5 h-5 text-slate-600" />
              )}
              <span className="absolute bottom-1 left-1 text-[8px] font-black uppercase tracking-widest px-1 py-0.2 bg-slate-950/80 text-slate-500 rounded border border-slate-850">
                {item.entityType === 'service' ? 'Serv' : 'Prod'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate uppercase tracking-tight">{item.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Store className="w-3 h-3 text-violet-400" />
                  <span className="truncate">{item.sellerName || 'Pi Merchant'}</span>
                </p>
                <p className="text-xs font-bold text-violet-400 font-mono mt-1">{item.price} Pi</p>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button 
                  onClick={() => handleMoveToCart(item)}
                  disabled={actionLoading === item.wishlistId}
                  className="px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === item.wishlistId ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <span>Add to Cart</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>

                <button 
                  onClick={() => handleRemove(item.wishlistId)}
                  disabled={actionLoading === item.wishlistId}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
