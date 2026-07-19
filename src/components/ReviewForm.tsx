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
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Share Your Experience</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Your feedback helps the community make better choices.</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-2 bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Overall Rating</label>
          <RatingStars rating={rating} size={32} onSelect={setRating} />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Review Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience in one line"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Detailed Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about the quality, service, or delivery..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all h-32 resize-none"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold uppercase tracking-tight">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-emerald-500">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Verified by Reputation Engine</span>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20"
          >
            {isSubmitting ? 'Posting...' : (
              <>
                Submit Review <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Aesthetic Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[120px] rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 blur-[100px] rounded-full -ml-24 -mb-24" />
    </div>
  );
};
