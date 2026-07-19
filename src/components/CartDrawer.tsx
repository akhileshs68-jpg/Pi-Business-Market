/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Product } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
  selectedAttributes: Record<string, string>;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (idx: number, newQty: number) => void;
  onRemoveItem: (idx: number) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalPi = items.reduce((sum, item) => sum + item.product.pricePi * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md animate-slide-in">
            <div className="flex h-full flex-col overflow-y-scroll bg-slate-900 shadow-2xl border-l border-slate-800 text-left">
              
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-5 h-5 text-violet-400" />
                  Your Active Shopping Bag ({items.length})
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ITEMS BODY */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {items.length === 0 ? (
                  <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <ShoppingBag className="w-10 h-10 text-slate-600" />
                    <span className="font-sans font-bold text-slate-300 text-sm">Your Bag is Empty</span>
                    <p className="text-xs max-w-xs leading-normal">Browse through verified products and add items to begin transactions.</p>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 pb-4 border-b border-slate-800/60">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 shadow-inner">
                        <img src={item.product.imageUrls[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <span className="text-xs font-bold text-slate-200 line-clamp-1 leading-tight">{item.product.title}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.selectedAttributes).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5 text-slate-400 font-semibold font-mono">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2.5">
                          {/* COUNT */}
                          {!item.product.isDigital ? (
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-0.5 font-mono text-xs">
                              <button
                                onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                                className="p-0.5 text-slate-400 hover:bg-slate-800 rounded"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-slate-200 min-w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                                className="p-0.5 text-slate-400 hover:bg-slate-800 rounded"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                              Digital Access
                            </span>
                          )}

                          {/* DELETE */}
                          <button
                            onClick={() => onRemoveItem(idx)}
                            className="p-1 rounded text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs font-bold text-slate-200">
                        {(item.product.pricePi * item.quantity).toFixed(1)} π
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* FOOTER CHECKOUT AREA */}
              {items.length > 0 && (
                <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-5 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-400">Subtotal Purchase Price</span>
                    <span className="text-xl font-mono font-bold text-violet-400">
                      {totalPi.toFixed(2)} π
                    </span>
                  </div>

                  <button
                    onClick={onCheckout}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Proceed to Pi Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-450" />
                    <span>Transactions protected by decentralized nodes.</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
