/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  Flag, 
  MessageSquare, 
  CheckCircle2, 
  MoreVertical,
  User,
  Clock,
  Reply
} from 'lucide-react';
import { motion } from 'motion/react';
import { Review, ReviewEntityType } from '../types';
import { reviewService } from '../services/reviewService';
import { RatingStars } from './RatingStars';
import { useAuth } from '../auth/useAuth';

interface ReviewListProps {
  entityId: string;
  entityType: ReviewEntityType;
  allowReply?: boolean;
}

export const ReviewList: React.FC<ReviewListProps> = ({ entityId, entityType, allowReply }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [entityId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getEntityReviews(entityId);
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!user) return;
    try {
      await reviewService.voteHelpful(reviewId, user.uid);
      setReviews(prev => prev.map(r => r.reviewId === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
    } catch (err) {
      console.error('Helpful vote failed', err);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!user || !replyText.trim()) return;
    try {
      await reviewService.replyToReview(reviewId, replyText, user.displayName || 'Merchant');
      setReplyText('');
      setReplyingTo(null);
      fetchReviews();
    } catch (err) {
      console.error('Reply failed', err);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-36 bg-slate-900/50 border border-slate-800 rounded-2xl" />)}
    </div>
  );

  if (reviews.length === 0) return (
    <div className="py-12 px-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
      <div className="w-12 h-12 bg-slate-800/80 rounded-xl flex items-center justify-center text-slate-500 mx-auto">
        <MessageSquare className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">No reviews yet</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">Be the first to share verified feedback and help other Pioneers.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <motion.div
          key={review.reviewId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-7 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 shadow-lg"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-slate-800 border border-slate-750 rounded-xl flex items-center justify-center text-violet-400 shrink-0">
                <User size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{review.reviewerName}</h4>
                  {review.verifiedPurchase && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[8px] font-black uppercase tracking-wider border border-emerald-500/20">
                      <CheckCircle2 size={10} /> Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <RatingStars rating={review.rating} size={13} />
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 font-mono">
                    <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <button 
              type="button"
              aria-label="Review options"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-white rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {review.title && (
              <h5 className="text-xs font-black text-white uppercase tracking-wider">{review.title}</h5>
            )}
            <p className="text-xs text-slate-300 leading-relaxed font-normal">{review.comment}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60">
            <button 
              type="button"
              onClick={() => handleHelpful(review.reviewId)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-violet-400 hover:bg-slate-800/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <ThumbsUp size={13} /> <span>Helpful ({review.helpfulCount})</span>
            </button>
            <button 
              type="button"
              className="min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-rose-400 hover:bg-slate-800/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <Flag size={13} /> <span>Report</span>
            </button>
            {allowReply && !review.reply && (
              <button 
                type="button"
                onClick={() => setReplyingTo(replyingTo === review.reviewId ? null : review.reviewId)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                <Reply size={13} /> <span>Reply</span>
              </button>
            )}
          </div>

          {review.reply && (
            <div className="mt-3 p-4.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Merchant Response</p>
                <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">{new Date(review.reply.repliedAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-300 font-normal leading-relaxed italic">"{review.reply.comment}"</p>
            </div>
          )}

          {replyingTo === review.reviewId && (
            <div className="mt-3 space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response as the merchant..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-none placeholder-slate-500"
              />
              <div className="flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="min-h-[44px] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleReply(review.reviewId)}
                  className="min-h-[44px] px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-violet-600/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                >
                  Post Reply
                </button>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};
