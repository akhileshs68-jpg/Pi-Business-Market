/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShoppingBag,
  Star,
  CheckCircle,
  Truck,
  Download,
  X,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { Order, OrderStatus, Review } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface OrderTrackerProps {
  buyerUid: string;
  buyerUsername: string;
  onNavigate: (view: string, params?: any) => void;
}

export default function OrderTracker({
  buyerUid,
  buyerUsername,
  onNavigate
}: OrderTrackerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Review submission form states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewProductTitle, setReviewProductTitle] = useState('');
  const [reviewStoreId, setReviewStoreId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    refreshOrders();
  }, [buyerUid]);

  const refreshOrders = () => {
    const list = PiBusinessMarketDB.getOrdersByBuyer(buyerUid);
    setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleOpenReview = (productId: string, productTitle: string, storeId: string) => {
    setReviewProductId(productId);
    setReviewProductTitle(productTitle);
    setReviewStoreId(storeId);
    setReviewRating(5);
    setReviewComment('');
    setReviewSuccess(false);
    setIsReviewModalOpen(true);
  };

  const handlePublishReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    PiBusinessMarketDB.createReview({
      productId: reviewProductId,
      productTitle: reviewProductTitle,
      storeId: reviewStoreId,
      buyerUid,
      buyerUsername,
      rating: reviewRating,
      comment: reviewComment
    });

    setReviewSuccess(true);
    setTimeout(() => {
      setIsReviewModalOpen(false);
      refreshOrders();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-left">
      
      {/* HEADER BAR */}
      <div className="flex items-center gap-3 mb-6 select-none">
        <button
          onClick={() => onNavigate('marketplace')}
          className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-sans font-bold text-xl text-slate-950 tracking-tight leading-none">Your Purchase Node History</h2>
          <p className="text-slate-400 text-xs mt-1.5">Track shipping nodes, download files, and write consensus reviews.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl py-16 text-center text-slate-400 select-none shadow-sm">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-sans font-bold text-slate-800">No Historical Orders Found</h3>
          <p className="text-xs max-w-xs mx-auto mt-1 leading-normal">
            Your transactions portfolio is empty. Explore items inside the main marketplace feed to execute payments.
          </p>
          <button
            onClick={() => onNavigate('marketplace')}
            className="mt-5 py-2 px-4 bg-slate-950 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT LIST PANEL */}
          <div className="lg:col-span-1 space-y-3.5 select-none max-h-[70vh] overflow-y-auto pr-1">
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`p-4 border rounded-2xl cursor-pointer text-left transition-all flex flex-col justify-between h-32 ${
                  selectedOrder?.id === o.id
                    ? 'border-violet-600 bg-violet-50/20 ring-1 ring-violet-500/10'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-slate-800 truncate block max-w-[120px]">{o.id}</span>
                    <span className="text-slate-400 font-medium">
                      {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 line-clamp-1 mt-1.5">{o.items[0].title}</span>
                  {o.items.length > 1 && (
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">and {o.items.length - 1} other item(s)</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] border-t border-slate-50 pt-2.5 mt-2.5">
                  <span className="font-mono font-bold text-violet-700">{o.totalPi} π</span>
                  
                  {/* COMPRESSED STATUS */}
                  {o.status === OrderStatus.PREPARING && (
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 font-bold uppercase rounded-md text-[8px]">Preparing</span>
                  )}
                  {o.status === OrderStatus.SHIPPED && (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 font-bold uppercase rounded-md text-[8px]">Shipped</span>
                  )}
                  {o.status === OrderStatus.COMPLETED && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold uppercase rounded-md text-[8px]">Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT VIEW DETAILS PANEL */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* RECEIPT HEADER */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-50 select-none">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Transactional Invoice</span>
                    <h3 className="font-mono text-sm font-bold text-slate-800 mt-1">{selectedOrder.id}</h3>
                    <p className="text-[11px] mt-1.5 text-slate-500 font-medium">
                      Merchant: <span className="font-bold text-slate-700">{selectedOrder.storeName}</span>
                    </p>
                  </div>

                  <span className="text-base font-mono font-bold text-slate-900">
                    {selectedOrder.totalPi.toFixed(2)} <span className="text-violet-700 font-extrabold">π</span>
                  </span>
                </div>

                {/* ANIMATED PROGRESS LOGISTICS TRACKS */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl select-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-4">Consensus Logistics Status</span>
                  
                  <div className="flex items-center justify-between relative">
                    {/* Line behind */}
                    <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-slate-200"></div>
                    
                    {/* States node items */}
                    {[
                      { label: 'P2P Paid', status: OrderStatus.PREPARING },
                      { label: 'Preparing', status: OrderStatus.PREPARING },
                      { label: 'Shipped', status: OrderStatus.SHIPPED },
                      { label: 'Completed', status: OrderStatus.COMPLETED }
                    ].map((stepNode, i) => {
                      const isDone = 
                        (stepNode.status === OrderStatus.PREPARING && selectedOrder.status !== OrderStatus.CANCELLED) ||
                        (stepNode.status === OrderStatus.SHIPPED && (selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.COMPLETED)) ||
                        (stepNode.status === OrderStatus.COMPLETED && selectedOrder.status === OrderStatus.COMPLETED);

                      return (
                        <div key={i} className="flex flex-col items-center gap-1.5 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                            isDone 
                              ? 'bg-violet-700 text-white border-violet-700 shadow-sm'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                            {isDone ? <CheckCircle className="w-4.5 h-4.5" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <span className={`text-[9px] font-bold tracking-tight ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                            {stepNode.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PRODUCTS LIST */}
                <div className="space-y-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block select-none">Items list</span>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border border-slate-50 overflow-hidden flex-shrink-0 shadow-inner">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">{item.title}</span>
                          {Object.entries(item.selectedAttributes).map(([k, v]) => (
                            <span key={k} className="text-[10px] text-slate-400 font-medium mr-2">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-500 font-semibold select-none">
                        {item.quantity} × {item.pricePi} π
                      </span>
                    </div>
                  ))}
                </div>

                {/* SHIPPING LOGISTICS & ACTIONS ROWS */}
                <div className="border-t border-slate-150 pt-5 flex flex-col md:flex-row justify-between gap-5 text-xs text-slate-600">
                  {selectedOrder.shippingAddress ? (
                    <div className="text-left font-medium max-w-sm">
                      <span className="font-bold text-slate-700 block mb-1">Logistics Destination:</span>
                      <p className="font-bold text-slate-800">{selectedOrder.shippingAddress.fullName}</p>
                      <p>{selectedOrder.shippingAddress.streetAddress}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.postalCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-emerald-950 font-medium text-left">
                      <span className="font-bold block text-emerald-800">Virtual Delivery Protocol</span>
                      This order consisted of digital items. Retrieve downloads below anytime.
                    </div>
                  )}

                  {/* LOGISTICS & REVIEW BUTTON HANDLERS */}
                  <div className="flex flex-col gap-2.5 md:self-end select-none">
                    {selectedOrder.isDigital && (
                      <a
                        href={selectedOrder.items[0].productId ? '#' : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Download file successfully generated!');
                        }}
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download Digital Files
                      </a>
                    )}

                    {selectedOrder.status === OrderStatus.COMPLETED && (
                      <button
                        onClick={() => handleOpenReview(
                          selectedOrder.items[0].productId,
                          selectedOrder.items[0].title,
                          selectedOrder.storeId
                        )}
                        className="flex items-center justify-center gap-1 px-4 py-2 border border-slate-250 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        Write Consensus Review
                      </button>
                    )}

                    {selectedOrder.blockchainTxId && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">
                        Tx Hash: {selectedOrder.blockchainTxId.substring(0, 18)}...
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-3xl py-24 text-center text-slate-400 select-none">
                <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                <h3 className="font-sans font-bold text-slate-800">No Order Selected</h3>
                <p className="text-xs max-w-xs mx-auto mt-1 leading-normal">
                  Select any historical transactional record on the left pane to explore full blockchain invoice detail blocks.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==============================================
          MODULAR MODAL: SUBMIT CUSTOMER REVIEW
          ============================================== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-start mb-4 select-none">
              <div>
                <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                  Publish Consensus Review
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold">Product: "{reviewProductTitle}"</p>
              </div>
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {!reviewSuccess ? (
              <form onSubmit={handlePublishReview} className="space-y-4">
                
                {/* STARS RATING INPUT SELECTOR */}
                <div className="select-none">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Score Rating Score</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Comments *</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-violet-600 bg-white"
                    placeholder="Describe your delivery velocity, product specifications, or checkouts experiences..."
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50 select-none">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-900 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Publish Review
                  </button>
                </div>

              </form>
            ) : (
              <div className="py-8 text-center space-y-4 select-none">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 block">Review Ledger Seeded!</span>
                  <p className="text-[11px] text-slate-400 mt-1">Thank you. Your feedback updates merchant rating index files in real-time.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
