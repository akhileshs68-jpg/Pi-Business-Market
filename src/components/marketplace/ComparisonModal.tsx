/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Scale, 
  ShoppingBag, 
  Zap, 
  Building2, 
  Store, 
  Briefcase, 
  Check, 
  ShieldCheck, 
  Star, 
  MapPin, 
  ExternalLink,
  Trash2
} from 'lucide-react';
import { SearchIndexEntry } from '../../types';
import { RatingStars } from '../RatingStars';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SearchIndexEntry[];
  onRemoveItem: (entityId: string) => void;
  onClearAll: () => void;
  onNavigate: (url: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearAll,
  onNavigate
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getEntityLink = (entry: SearchIndexEntry) => {
    switch (entry.entityType) {
      case 'product': return `/product/${entry.entityId}`;
      case 'service': return `/service/${entry.entityId}`;
      case 'job': return `/jobs/${entry.metadata?.slug || entry.entityId}`;
      case 'business': return `/business/${entry.entityId}`;
      case 'store': return `/store/${entry.entityId}`;
      default: return '#';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'product': return <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />;
      case 'service': return <Zap className="w-3.5 h-3.5 text-violet-400" />;
      case 'business': return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'store': return <Store className="w-3.5 h-3.5 text-indigo-400" />;
      case 'job': return <Briefcase className="w-3.5 h-3.5 text-rose-400" />;
      default: return <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparison-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-[#0a0f1c] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="comparison-modal-title" className="text-lg font-black text-white uppercase tracking-tight">
                    Product &amp; Service Comparison
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comparing {items.length} of max 4 selected items
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear All</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  aria-label="Close comparison modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comparison Body */}
            <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl w-fit mx-auto text-slate-500">
                    <Scale className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">No Items Selected</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click the scale icon on any product or service card to add it to this side-by-side comparison matrix.
                  </p>
                  <button
                    onClick={onClose}
                    className="min-h-[44px] px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto pb-4">
                  <div className="grid gap-4 min-w-[600px]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(240px, 1fr))` }}>
                    {items.map((item) => {
                      const rating = item.metadata?.rating;
                      const reviewCount = item.metadata?.reviewCount;
                      const seller = item.metadata?.seller || item.metadata?.merchantName || 'Verified Merchant';
                      const isVerified = item.metadata?.isVerified || item.featured;
                      const imageUrl = item.metadata?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

                      return (
                        <div 
                          key={item.entityId} 
                          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative space-y-4"
                        >
                          {/* Remove button */}
                          <button
                            onClick={() => onRemoveItem(item.entityId)}
                            className="min-h-[36px] min-w-[36px] absolute top-3 right-3 z-10 flex items-center justify-center p-1.5 bg-black/60 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/60 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                            title="Remove from comparison"
                            aria-label={`Remove ${item.title} from comparison`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Image & Title */}
                          <div className="space-y-3">
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                              <img 
                                src={imageUrl} 
                                alt={item.title} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                                }}
                              />
                              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] font-black uppercase text-white">
                                {getEntityIcon(item.entityType)}
                                <span>{item.entityType}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider block mb-0.5">
                                {item.metadata?.category || item.entityType}
                              </span>
                              <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                {item.title}
                              </h3>
                            </div>
                          </div>

                          {/* Key Attributes List */}
                          <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                            {/* Price */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Price</span>
                              <div className="text-right">
                                {item.price !== undefined ? (
                                  <span className="text-sm font-black text-white">
                                    {item.price} <span className="text-violet-400 font-bold">π</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Custom Quote</span>
                                )}
                              </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rating</span>
                              <div className="flex items-center gap-1">
                                {rating ? (
                                  <>
                                    <RatingStars rating={rating} size={11} />
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {rating} {reviewCount ? `(${reviewCount})` : ''}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-medium">New Listing</span>
                                )}
                              </div>
                            </div>

                            {/* Provider / Merchant */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Merchant</span>
                              <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]" title={seller}>
                                {seller}
                              </span>
                            </div>

                            {/* Verification */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trust</span>
                              <div className="flex items-center gap-1">
                                {isVerified ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Standard</span>
                                )}
                              </div>
                            </div>

                            {/* Escrow Protection */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Escrow</span>
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Protected
                              </span>
                            </div>

                            {/* Location */}
                            {item.location && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</span>
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-slate-500" /> {item.location}
                                </span>
                              </div>
                            )}

                            {/* Description preview */}
                            <div className="pt-2 border-t border-slate-800/60">
                              <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                                {item.description || 'No additional description provided.'}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-3">
                            <button
                              onClick={() => {
                                onClose();
                                onNavigate(getEntityLink(item));
                              }}
                              className="w-full min-h-[44px] px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                            >
                              <span>View Details</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span className="text-[11px]">
                Tip: You can compare up to 4 listings simultaneously to evaluate pricing, ratings, and merchant credibility.
              </span>
              <button
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                Close Comparison
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
