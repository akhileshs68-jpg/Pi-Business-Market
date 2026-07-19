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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cartService } from '../../services/cartService';
import { checkoutService } from '../../services/checkoutService';
import { Cart, CartItem } from '../../types';
import { useNavigate } from 'react-router-dom';

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
      const cartItems = await cartService.getCartItems(activeCart.cartId);
      setCart(activeCart);
      setItems(cartItems);
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
                <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Shopping Bag</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Retrieving your bag...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-12">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase mb-2">Bag is empty</h3>
                  <p className="text-xs text-slate-500 font-medium mb-8">Looks like you haven't added anything to your cart yet.</p>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.itemId} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white truncate uppercase">{item.name}</h4>
                        <button 
                          onClick={() => handleRemove(item.itemId)}
                          className="p-1 text-slate-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] font-black text-indigo-400 mb-3 uppercase tracking-widest">
                        {item.unitPrice} Pi
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                          <button 
                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-black text-white">{item.subtotal} Pi</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && cart && (
              <div className="p-6 bg-slate-950 border-t border-slate-800">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-white">{cart.subtotal} Pi</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Tax (5%)</span>
                    <span className="text-white">{cart.tax.toFixed(2)} Pi</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-white">{cart.shipping} Pi</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-black text-white uppercase tracking-widest">Total Amount</span>
                    <span className="text-xl font-black text-white">{cart.grandTotal.toFixed(2)} Pi</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
