/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  Clock, 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Loader2,
  Bookmark,
  Store,
  RefreshCw,
  Ticket,
  Zap,
  RotateCcw,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { cartService } from '../../services/cartService';
import { checkoutService } from '../../services/checkoutService';
import { EnterpriseCartEngine } from '../../core/cart/enterpriseCartEngine';
import { CartCoupon, ExtendedCartItem } from '../../core/cart/enterpriseCartTypes';
import { formatCurrencyAmount } from '../../services/pricing/currencyRegistry';
import { getFirebaseDb } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Cart, CartItem } from '../../types';
import { useNavigate } from 'react-router-dom';

export type { ExtendedCartItem };

interface ShoppingCartProps {
  userUid: string;
  onItemMovedToWishlist?: () => void;
  onCartUpdated?: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ 
  userUid, 
  onItemMovedToWishlist,
  onCartUpdated 
}) => {
  const navigate = useNavigate();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [items, setItems] = useState<ExtendedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Coupon Engine state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CartCoupon | undefined>(undefined);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Undo Remove state
  const [undoItem, setUndoItem] = useState<ExtendedCartItem | null>(null);

  const cartIdsString = carts.map(c => c.cartId).sort().join(',');

  useEffect(() => {
    if (!userUid) return;
    setLoading(true);
    const db = getFirebaseDb();
    
    const cartsQuery = query(collection(db, 'carts'), where('userUid', '==', userUid));
    const unsubscribeCarts = onSnapshot(cartsQuery, (snapshot) => {
      const fetchedCarts = snapshot.docs.map(doc => doc.data() as Cart);
      setCarts(fetchedCarts);
      if (fetchedCarts.length === 0) {
        setItems([]);
        setLoading(false);
      }
    }, (err) => {
      console.error('Error listening to carts:', err);
      setLoading(false);
    });

    return () => unsubscribeCarts();
  }, [userUid]);

  useEffect(() => {
    if (!cartIdsString) return;
    
    const db = getFirebaseDb();
    const cartIds = cartIdsString.split(',');
    
    // Subscribe to each cart's items
    const unsubs: (() => void)[] = [];
    let itemsMap = new Map<string, ExtendedCartItem[]>();
    let loads = 0;

    cartIds.forEach(cartId => {
      const itemsQuery = query(collection(db, 'cartItems'), where('cartId', '==', cartId));
      const unsub = onSnapshot(itemsQuery, (snapshot) => {
        const cartItems = snapshot.docs.map(doc => doc.data() as ExtendedCartItem);
        itemsMap.set(cartId, cartItems);
        
        // Flatten
        const allItems: ExtendedCartItem[] = [];
        for (const cid of cartIds) {
          const cidItems = itemsMap.get(cid) || [];
          allItems.push(...cidItems);
        }
        setItems(allItems);
        
        loads++;
        if (loads >= cartIds.length) {
          setLoading(false);
        }
      }, (err) => {
        console.warn('Error listening to cart items:', err);
        setLoading(false);
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [cartIdsString]);

  const isServiceItem = (item: ExtendedCartItem) => {
    return item.type === 'service' || 
           item.serviceDate !== undefined || 
           (item.name && (
             item.name.toLowerCase().includes('consultation') || 
             item.name.toLowerCase().includes('service') || 
             item.name.toLowerCase().includes('repair') || 
             item.name.toLowerCase().includes('class') || 
             item.name.toLowerCase().includes('lesson') ||
             item.name.toLowerCase().includes('electrician') ||
             item.name.toLowerCase().includes('doctor') ||
             item.name.toLowerCase().includes('teacher') ||
             item.name.toLowerCase().includes('cleaning') ||
             item.name.toLowerCase().includes('booking')
           ));
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    const sub = items.reduce((acc, item) => acc + (item.unitPrice || 0) * (item.quantity || 1), 0);
    const res = await EnterpriseCartEngine.validateCoupon(couponInput, sub);
    if (res.error) {
      setCouponError(res.error);
    } else if (res.coupon) {
      setAppliedCoupon(res.coupon);
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(undefined);
    setCouponError(null);
  };

  const handleUpdateQuantity = async (item: ExtendedCartItem, newQty: number) => {
    if (newQty < 1) return;
    if (item.stock !== undefined && newQty > item.stock) {
      alert(`Only ${item.stock} items available in stock.`);
      return;
    }
    setActionLoading(item.itemId);
    try {
      await cartService.updateQuantity(item.itemId, item.cartId, newQty);
      
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateServiceDateTime = async (item: ExtendedCartItem, date: string, time: string) => {
    const db = getFirebaseDb();
    try {
      const itemRef = doc(db, 'cartItems', item.itemId);
      await updateDoc(itemRef, {
        serviceDate: date,
        serviceTime: time
      });
      // Update local state directly for responsive feel
      setItems(prev => prev.map(i => i.itemId === item.itemId ? { ...i, serviceDate: date, serviceTime: time } : i));
    } catch (err) {
      console.error('Failed to update service datetime:', err);
    }
  };

  const handleRemoveItem = async (item: ExtendedCartItem) => {
    setActionLoading(item.itemId);
    try {
      EnterpriseCartEngine.saveForUndo(userUid, item);
      setUndoItem(item);
      await cartService.removeItem(item.itemId, item.cartId);
      
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreUndo = async () => {
    if (!undoItem) return;
    setActionLoading('undo');
    try {
      const ok = await EnterpriseCartEngine.restoreUndoItem(userUid);
      if (ok) {
        setUndoItem(null);
        if (onCartUpdated) onCartUpdated();
      }
    } catch (err) {
      console.error('Failed to restore item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveForLater = async (item: ExtendedCartItem) => {
    setActionLoading(item.itemId);
    try {
      const entityType = isServiceItem(item) ? 'service' : 'product';
      await cartService.addToWishlist(userUid, entityType, item.productId);
      await cartService.removeItem(item.itemId, item.cartId);
      
      if (onItemMovedToWishlist) onItemMovedToWishlist();
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      console.error('Failed to save for later:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuyNow = async (item: ExtendedCartItem) => {
    setActionLoading(item.itemId);
    try {
      const sessionId = await EnterpriseCartEngine.createBuyNowSession(userUid, {
        productId: item.productId,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        businessId: item.businessId,
        storeId: item.storeId,
        type: item.type
      });
      navigate(`/checkout/${sessionId}`);
    } catch (err) {
      console.error('Failed buy now:', err);
      alert('Could not start direct checkout session.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCart = async () => {
    if (carts.length === 0) return;
    setLoading(true);
    try {
      for (const cart of carts) {
        await cartService.clearCart(cart.cartId);
      }
      
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations via Enterprise Engine
  const summary = EnterpriseCartEngine.calculateCartSummary(items, appliedCoupon);
  const sellerGroups = EnterpriseCartEngine.groupItemsBySeller(items);
  const validation = EnterpriseCartEngine.validateCartItems(items);
  const totalItems = items.reduce((acc, item) => acc + (isServiceItem(item) ? 1 : item.quantity), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Loading your universal cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 text-slate-500 shadow-xl">
          <ShoppingBag className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Your cart is empty.</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
          Discover products, services, and opportunities across the entire Pi network.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <button 
            onClick={() => navigate('/discovery')}
            className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/10 cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Items Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Undo Notification Banner */}
        {undoItem && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-violet-950/60 border border-violet-800/80 rounded-2xl flex items-center justify-between text-xs text-violet-200"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-violet-400" />
              <span>Removed <strong>{undoItem.name}</strong> from cart.</span>
            </div>
            <button 
              onClick={handleRestoreUndo}
              disabled={actionLoading === 'undo'}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 font-bold text-white rounded-lg transition-colors flex items-center gap-1"
            >
              {actionLoading === 'undo' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Undo'}
            </button>
          </motion.div>
        )}

        {/* Validation Issues Alert */}
        {!validation.isValid && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-2 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Cart Item Validation Notice</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-300/80">
              {validation.issues.map((issue, idx) => (
                <li key={idx}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Shopping Items</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-bold">
              {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
            </span>
          </h2>
          <button 
            onClick={handleClearCart}
            className="text-xs text-slate-500 hover:text-rose-400 font-bold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>

        {/* Grouped by Seller / Store */}
        <div className="space-y-8">
          {sellerGroups.map((group) => (
            <div key={group.sellerId} className="space-y-4">
              {/* Seller Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Store className="w-4 h-4 text-violet-400" />
                  <span className="uppercase tracking-wider">Merchant:</span>
                  <span className="text-white">{group.sellerName}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 font-mono">
                  Subtotal: {group.subtotal.toFixed(2)} Pi
                </div>
              </div>

              {/* Items in Group */}
              <div className="space-y-4">
                {group.items.map((item) => {
                  const isService = isServiceItem(item);
                  return (
                    <motion.div 
                      key={item.itemId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 hover:border-slate-700/80 transition-all relative group"
                    >
                      {/* Image */}
                      <div className="w-24 h-24 sm:w-20 sm:h-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shrink-0 relative flex items-center justify-center">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-600" />
                        )}
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-slate-400 border border-slate-800">
                          {isService ? 'Service' : 'Product'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          {/* Header */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-white truncate hover:text-violet-400 transition-colors cursor-pointer">
                                {item.name}
                              </h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Store className="w-3.5 h-3.5 text-violet-400" />
                                <span className="font-medium truncate">
                                  {group.sellerName}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 text-right">
                              {item.pricingMode === 'EXCHANGE' && item.localAmount && item.localCurrency ? (
                                <>
                                  <p className="text-sm font-bold text-slate-200">
                                    {formatCurrencyAmount(item.localAmount, item.localCurrency)} <span className="text-xs text-slate-500 font-normal">each</span>
                                  </p>
                                  <p className="text-xs font-bold text-violet-400">
                                    ≈ {(item.piUnitPrice ?? item.unitPrice).toFixed(2)} π
                                  </p>
                                  <p className="text-xs font-bold text-slate-300 mt-1">
                                    Subtotal: {formatCurrencyAmount(item.localAmount * item.quantity, item.localCurrency)} (≈ {((item.piUnitPrice ?? item.unitPrice) * item.quantity).toFixed(2)} π)
                                  </p>
                                </>
                              ) : item.pricingMode === 'COMMUNITY' ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-base font-black text-violet-400">
                                      {(item.communityPiAmount ?? item.unitPrice).toFixed(2)} π
                                    </p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                      Community
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-300 mt-0.5">
                                    Subtotal: {((item.communityPiAmount ?? item.unitPrice) * item.quantity).toFixed(2)} π
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-base font-black text-violet-400">
                                    {item.unitPrice} π <span className="text-xs text-slate-500 font-normal">each</span>
                                  </p>
                                  <p className="text-sm font-bold text-slate-300 mt-0.5">
                                    Subtotal: {((item.piUnitPrice ?? item.unitPrice) * item.quantity).toFixed(2)} π
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Service customization */}
                          {isService && (
                            <div className="mt-3 flex flex-wrap gap-3 p-3 bg-slate-950/45 border border-slate-800/40 rounded-xl">
                              {/* Service Date */}
                              <div className="flex-1 min-w-[120px] space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-violet-400" />
                                  <span>Preferred Date</span>
                                </label>
                                <input 
                                  type="date"
                                  value={item.serviceDate || '2026-08-01'}
                                  onChange={(e) => handleUpdateServiceDateTime(item, e.target.value, item.serviceTime || '12:00')}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-violet-500 transition-colors"
                                />
                              </div>
                              {/* Service Time */}
                              <div className="flex-1 min-w-[120px] space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-violet-400" />
                                  <span>Preferred Time</span>
                                </label>
                                <select 
                                  value={item.serviceTime || '12:00'}
                                  onChange={(e) => handleUpdateServiceDateTime(item, item.serviceDate || '2026-08-01', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                                >
                                  <option value="09:00">09:00 AM</option>
                                  <option value="10:00">10:00 AM</option>
                                  <option value="11:00">11:00 AM</option>
                                  <option value="12:00">12:00 PM</option>
                                  <option value="13:00">01:00 PM</option>
                                  <option value="14:00">02:00 PM</option>
                                  <option value="15:00">03:00 PM</option>
                                  <option value="16:00">04:00 PM</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions & Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/30">
                          <div className="flex items-center gap-3">
                            {/* Save for Later */}
                            <button 
                              onClick={() => handleSaveForLater(item)}
                              disabled={actionLoading === item.itemId}
                              className="text-xs text-slate-400 hover:text-violet-400 font-bold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Save for Later</span>
                            </button>

                            {/* Buy Now Direct */}
                            <button 
                              onClick={() => handleBuyNow(item)}
                              disabled={actionLoading === item.itemId}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Buy Now</span>
                            </button>

                            {/* Remove */}
                            <button 
                              onClick={() => handleRemoveItem(item)}
                              disabled={actionLoading === item.itemId}
                              className="text-xs text-slate-500 hover:text-rose-400 font-bold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          {/* Quantity Selector for Products */}
                          {!isService && (
                            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-850 p-1 rounded-xl shadow-inner">
                              <button 
                                onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                disabled={item.quantity <= 1 || actionLoading === item.itemId}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-black text-white font-mono">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                disabled={actionLoading === item.itemId || (item.stock !== undefined && item.quantity >= item.stock)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-6">
        <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-3xl relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-tight pb-3 border-b border-slate-800/80 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Order Summary</span>
          </h2>

          {/* Coupon Engine Box */}
          <div className="mb-6 space-y-2 p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>Coupon Code</span>
              </span>
              {appliedCoupon && (
                <button 
                  onClick={handleRemoveCoupon} 
                  className="text-[10px] text-rose-400 hover:underline uppercase"
                >
                  Remove
                </button>
              )}
            </div>

            {appliedCoupon ? (
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-black text-emerald-400">{appliedCoupon.code}</span>
                  <p className="text-[10px] text-slate-400">{appliedCoupon.description}</p>
                </div>
                <span className="font-black text-emerald-400">
                  -{summary.couponDiscount.toFixed(2)} Pi
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="e.g. PIFESTIVAL2026"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono placeholder:normal-case placeholder:font-sans focus:outline-none focus:border-violet-500"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Apply
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-[11px] text-rose-400 font-medium px-1">{couponError}</p>
            )}
          </div>

          <div className="space-y-3.5 mb-8">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Total Items</span>
              <span className="text-white font-mono font-bold">{totalItems}</span>
            </div>

            {summary.productSubtotal > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Product Subtotal</span>
                <span className="text-white font-mono font-bold">{summary.productSubtotal.toFixed(2)} Pi</span>
              </div>
            )}

            {summary.serviceSubtotal > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Service Subtotal</span>
                <span className="text-white font-mono font-bold">{summary.serviceSubtotal.toFixed(2)} Pi</span>
              </div>
            )}

            {summary.couponDiscount > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-semibold">Coupon Discount</span>
                <span className="text-emerald-400 font-mono font-bold">-{summary.couponDiscount.toFixed(2)} Pi</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Estimated Shipping</span>
              <span className="text-slate-300 font-mono font-bold">+{summary.shipping.toFixed(2)} Pi</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Tax (5%)</span>
              <span className="text-slate-300 font-mono font-bold">+{summary.tax.toFixed(2)} Pi</span>
            </div>

            {/* Local Currency Breakdown for Exchange Items */}
            {summary.hasExchangeItems && summary.localCurrencyTotals && Object.keys(summary.localCurrencyTotals).length > 0 && (
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fiat Values Breakdown</span>
                {Object.entries(summary.localCurrencyTotals).map(([code, amt]) => (
                  <div key={code} className="flex justify-between items-center text-slate-300 font-mono text-[11px]">
                    <span>{code} Total</span>
                    <span className="font-bold text-slate-200">{formatCurrencyAmount(amt, code)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* BMP Rewards Preview Badge */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>BMP Rewards Preview</span>
              </div>
              <span className="font-mono font-black text-amber-400">
                +{summary.bmpRewardsEstimate} BMP
              </span>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Grand Total</span>
              <span className="text-xl font-black text-violet-400 font-mono">{summary.grandTotal.toFixed(2)} Pi</span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={async () => {
                if (carts.length > 0) {
                  try {
                    setActionLoading('checkout');
                    const cart = carts[0];
                    cart.subtotal = summary.subtotal;
                    cart.discount = summary.couponDiscount;
                    cart.shipping = summary.shipping;
                    cart.tax = summary.tax;
                    cart.grandTotal = summary.grandTotal;
                    
                    const sessionId = await checkoutService.createSession(cart, userUid, carts.map(c => c.cartId));
                    navigate(`/checkout/${sessionId}`);
                  } catch (e) {
                    console.error('Failed to create session:', e);
                    alert('Could not initiate checkout');
                  } finally {
                    setActionLoading(null);
                  }
                }
              }}
              disabled={actionLoading === 'checkout' || !validation.isValid}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-violet-600/10 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === 'checkout' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Proceed to Checkout</span>}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => navigate('/discovery')}
              className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all border border-slate-800 cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

          {/* Secure Payment Note */}
          <div className="mt-6 p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Secured Pi Network Tx</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Payments are safely routed via standard Pi SDK escrow. Non-custodial, peer-to-peer, fully decentralized.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
