/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Store,
  ShieldCheck,
  Truck,
  Download,
  Eye,
  Plus,
  Minus,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Product, Review } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedAttributes: Record<string, string>) => void;
  onInstantCheckout: (product: Product, quantity: number, selectedAttributes: Record<string, string>) => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  onInstantCheckout
}: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  useEffect(() => {
    // Record listing view views
    PiBusinessMarketDB.incrementProductViews(product.id);
    setReviews(PiBusinessMarketDB.getReviewsByProduct(product.id));

    // Preset default attributes
    if (product.attributes && product.attributes.length > 0) {
      const defaults: Record<string, string> = {};
      product.attributes.forEach((attr) => {
        if (attr.options.length > 0) {
          defaults[attr.name] = attr.options[0];
        }
      });
      setSelectedAttributes(defaults);
    }
  }, [product.id]);

  const handleAttributeChange = (name: string, val: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [name]: val }));
  };

  const handleIncrement = () => {
    if (product.isDigital) return; // digital has infinite stock
    setQuantity((prev) => Math.min(product.stock, prev + 1));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-in flex flex-col md:flex-row relative">
        
        {/* DISMISS MOBILE TRIGGER */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-10 p-2 bg-slate-900/95 backdrop-blur-sm rounded-full text-slate-400 hover:text-slate-200 transition-all cursor-pointer border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COMPONENT: IMAGE CAROUSEL & VISUALS */}
        <div className="w-full md:w-1/2 bg-slate-950 relative flex items-center justify-center min-h-[300px] md:min-h-full">
          <img 
            src={product.imageUrls[0]} 
            alt={product.title} 
            className="w-full h-full object-cover max-h-[450px] md:max-h-none opacity-90"
          />
          {product.isDigital && (
            <div className="absolute top-6 left-6 px-3 py-1 bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md">
              Instant Access File
            </div>
          )}
        </div>

        {/* RIGHT COMPONENT: METADATA & OPERATIONS */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between text-left">
          
          <div>
            {/* BRAND HEADER LINE */}
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2 font-semibold select-none">
              <Store className="w-4.5 h-4.5 text-slate-500" />
              <span>Storefront: {product.storeName}</span>
              <span>•</span>
              <span className="capitalize">{product.category.replace('_', ' ')}</span>
            </div>

            <h3 className="font-sans font-extrabold text-2xl text-slate-100 tracking-tight leading-snug">
              {product.title}
            </h3>

            {/* WALLET VAL PRICE */}
            <div className="flex items-baseline gap-2 mt-3 select-none">
              <span className="text-3xl font-mono font-bold text-slate-200 tracking-tight">
                {product.pricePi}
              </span>
              <span className="text-violet-400 font-extrabold text-lg">π coins</span>
              <span className="text-slate-500 text-xs font-semibold ml-2 font-mono">
                (~{product.views + 1} views)
              </span>
            </div>

            {/* RATING HIGHLIGHTS */}
            <div className="flex items-center gap-2 mt-2 select-none">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4.5 h-4.5 ${star <= product.averageRating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {product.averageRating.toFixed(1)} rating ({reviews.length} reviews)
              </span>
            </div>

            {/* TAB SELECTORS: DETAILS VS REVIEWS */}
            <div className="flex border-b border-slate-800 my-5 select-none gap-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'details' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Detailed Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'reviews' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Customer Reviews ({reviews.length})
              </button>
            </div>

            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-line bg-slate-950 p-3.5 rounded-2xl border border-slate-850 max-h-48 overflow-y-auto">
                  {product.description}
                </p>

                {/* DYNAMIC VARIATION CONTROLLER SELECTORS */}
                {product.attributes && product.attributes.length > 0 && (
                  <div className="space-y-3.5 select-none">
                    {product.attributes.map((attr) => (
                      <div key={attr.name}>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Select {attr.name}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {attr.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAttributeChange(attr.name, opt)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                selectedAttributes[attr.name] === opt
                                  ? 'bg-violet-600 text-white border-violet-600'
                                  : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-800'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No reviews submitted for this item yet.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="border-b border-slate-800/60 pb-3 text-left">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-300">@{r.buyerUsername}</span>
                        <span className="text-slate-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-455 mt-2">"{r.comment}"</p>
                      {r.merchantResponse && (
                        <div className="bg-violet-500/10 border-l-2 border-violet-500 p-2.5 rounded-r-lg text-[10px] mt-2 italic text-slate-300">
                          <span className="font-bold text-violet-400 not-italic block mb-0.5">Merchant reply:</span>
                          "{r.merchantResponse}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* CHECKOUT OPERATIONAL COMPONENT CONTROLS */}
          <div className="border-t border-slate-800 pt-5 mt-6 space-y-4">
            
            {/* QUANTITY ROW CONTROLS */}
            {!product.isDigital && (
              <div className="flex items-center justify-between select-none">
                <div>
                  <span className="text-xs font-bold text-slate-300">Quantity Selection</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Available Stock: {product.stock} units</p>
                </div>

                {product.stock > 0 ? (
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-1 font-mono">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="p-1 text-slate-400 hover:bg-slate-800 disabled:opacity-30 rounded-lg cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-200 px-2 min-w-4 text-center">{quantity}</span>
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock}
                      className="p-1 text-slate-400 hover:bg-slate-800 disabled:opacity-30 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-red-400 bg-red-950/10 border border-red-950/25 px-3 py-1 rounded-lg uppercase tracking-wider">
                    Sold Out
                  </span>
                )}
              </div>
            )}

            {/* ACTION TRIGGERS */}
            {product.stock > 0 || product.isDigital ? (
              <div className="grid grid-cols-2 gap-3 select-none">
                <button
                  onClick={() => onAddToCart(product, quantity, selectedAttributes)}
                  className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  Add to Cart
                </button>
                <button
                  onClick={() => onInstantCheckout(product, quantity, selectedAttributes)}
                  className="py-2.5 px-4 bg-violet-600 text-white hover:bg-violet-500 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  Instant Pi Buy
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider select-none cursor-not-allowed border border-slate-850"
              >
                Out of Stock
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium select-none">
              <ShieldCheck className="w-4 h-4 text-emerald-450" />
              <span>P2P Blockchain Escrow Protection Active</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
