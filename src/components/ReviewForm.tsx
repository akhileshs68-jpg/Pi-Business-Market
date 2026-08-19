/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Star, 
  Send, 
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { ReviewEntityType } from '../types';
import { reviewService } from '../services/reviewService';
import { RatingStars } from './RatingStars';
import { useAuth } from '../auth/useAuth';

interface ReviewFormProps {
  entityId: string;
  entityType: ReviewEntityType;
  businessId?: string; // Optional but recommended
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  entityId, 
  entityType, 
  businessId = 'PI-CORP-001',
  orderId, 
  onSuccess, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !comment.trim()) {
      setError('Please fill in both title and comment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reviewService.submitReview({
        entityType,
        entityId,
        businessId,
        orderId,
        reviewerUid: user.uid,
        reviewerName: user.displayName || 'Anonymous User',
        rating,
        title,
        comment,
        verifiedPurchase: !!orderId
      });
      
      onSuccess?.();
    } catch (err) {
      console.error('Review submission failed', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl">
      <div className="flex justify-between items-start relative z-10 gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Share Your Experience</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Your feedback helps the community make informed choices.</p>
        </div>
        {onCancel && (
          <button 
            type="button"
            aria-label="Cancel review"
            onClick={onCancel} 
            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Overall Rating</label>
          <RatingStars rating={rating} size={24} onSelect={setRating} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Review Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience in one line..."
            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Detailed Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about the item quality, communication, and delivery speed..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-none"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold">
            <AlertCircle size={16} className="shrink-0" /> <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={18} className="shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider">Verified by Reputation Engine</span>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-violet-600/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            {isSubmitting ? 'Posting...' : (
              <>
                Submit Review <Send size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
