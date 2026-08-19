/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Loader2,
  Heart,
  ChevronRight,
  Ticket,
  Clock,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cartService } from '../../services/cartService';
import { checkoutService } from '../../services/checkoutService';
import { Cart, CartItem } from '../../types';
import { EnterpriseCartEngine } from '../../core/cart/enterpriseCartEngine';
import { ExtendedCartItem } from '../../core/cart/enterpriseCartTypes';
import { formatCurrencyAmount } from '../../services/pricing/currencyRegistry';
import { useNavigate } from 'react-router-dom';
import { getFirebaseDb } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  businessId: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, userUid, businessId }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const activeCart = await cartService.getOrCreateCart(userUid, businessId);
      let allItems = await cartService.getCartItems(activeCart.cartId);

      // Also query other user carts if any exist
      if (userUid) {
        const db = getFirebaseDb();
        const cartsQuery = query(collection(db, 'carts'), where('userUid', '==', userUid));
        const cartsSnap = await getDocs(cartsQuery);
        
        const itemPromises = cartsSnap.docs
          .filter(d => d.id !== activeCart.cartId)
          .map(d => cartService.getCartItems(d.id));

        const extraItemsArrays = await Promise.all(itemPromises);
        extraItemsArrays.forEach(arr => {
          allItems = [...allItems, ...arr];
        });
      }

      const summary = EnterpriseCartEngine.calculateCartSummary(allItems as ExtendedCartItem[]);

      setCart({
        ...activeCart,
        subtotal: summary.subtotal,
        tax: summary.tax,
        shipping: summary.shipping,
        grandTotal: summary.grandTotal
      });
      setItems(allItems);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (!cart) return;
    await cartService.updateQuantity(itemId, cart.cartId, newQty);
    fetchCart();
  };

  const handleRemove = async (itemId: string) => {
    if (!cart) return;
    await cartService.removeItem(itemId, cart.cartId);
    fetchCart();
  };

  const handleCheckout = async () => {
    if (!cart || items.length === 0) return;
    setProcessing(true);
    try {
      const sessionId = await checkoutService.createSession(cart, userUid);
      onClose();
      navigate(`/checkout/${sessionId}`);
    } catch (err) {
      console.error('Checkout failed', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-600/10 rounded-xl text-violet-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Shopping Bag</h2>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                aria-label="Close cart drawer"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retrieving your bag...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                    <ShoppingBag className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase mb-2">Bag is empty</h3>
                  <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed">Looks like you haven't added anything to your cart yet.</p>
                  <button 
                    onClick={onClose}
                    className="w-full min-h-[44px] py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.itemId} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                          }}
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                        <button 
                          onClick={() => handleRemove(item.itemId)}
                          aria-label={`Remove ${item.name} from bag`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer -mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        {item.pricingMode === 'EXCHANGE' && item.localAmount && item.localCurrency ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">
                              {formatCurrencyAmount(item.localAmount, item.localCurrency)}
                            </span>
                            <span className="text-xs font-bold text-violet-400 font-mono">
                              ≈ {(item.piUnitPrice ?? item.unitPrice).toFixed(2)} π
                            </span>
                          </div>
                        ) : item.pricingMode === 'COMMUNITY' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-violet-400 font-mono">
                              {(item.communityPiAmount ?? item.unitPrice).toFixed(2)} π
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              Community Price
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs font-black text-violet-400 font-mono">
                            {item.unitPrice} π
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                          <button 
                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-white font-mono">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            aria-label={`Save ${item.name} for later`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-violet-400 transition-colors rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" 
                            title="Save for Later"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          {item.pricingMode === 'EXCHANGE' && item.localAmount && item.localCurrency ? (
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-300">
                                {formatCurrencyAmount(item.localAmount * item.quantity, item.localCurrency)}
                              </p>
                              <p className="text-xs font-bold text-violet-400 font-mono">
                                ≈ {(item.subtotal || ((item.piUnitPrice ?? item.unitPrice) * item.quantity)).toFixed(2)} π
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-black text-violet-400 font-mono">
                              {(item.subtotal || ((item.piUnitPrice ?? item.unitPrice) * item.quantity)).toFixed(2)} π
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && cart && (
              <div className="bg-slate-950 border-t border-slate-800 flex flex-col mt-auto">
                {/* Delivery Estimate */}
                <div className="px-6 py-3 bg-violet-600/5 border-b border-slate-800/60 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                  <p className="text-xs text-slate-300 font-medium">Estimated Delivery: <span className="text-white font-bold">3-5 Business Days</span></p>
                </div>

                <div className="p-6 pb-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-white font-mono font-bold">{cart.subtotal} Pi</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-emerald-400">
                      <span>Discount</span>
                      <span className="font-mono font-bold">-0.00 Pi</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>Tax (5%)</span>
                      <span className="text-slate-300 font-mono font-bold">{cart.tax.toFixed(2)} Pi</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>Shipping</span>
                      <span className="text-slate-300 font-mono font-bold">{cart.shipping > 0 ? `${cart.shipping} Pi` : 'FREE'}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Total Amount</span>
                      <span className="text-xl font-black text-violet-400 font-mono">{cart.grandTotal.toFixed(2)} Pi</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={processing}
                    aria-label="Proceed to Checkout"
                    className="w-full min-h-[50px] py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-violet-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
