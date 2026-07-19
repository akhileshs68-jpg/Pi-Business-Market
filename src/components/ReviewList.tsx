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

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-900/50 rounded-3xl" />)}
  </div>;

  if (reviews.length === 0) return (
    <div className="py-12 text-center bg-slate-900/30 border border-slate-800 rounded-[2.5rem]">
      <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-400">No reviews yet</h3>
      <p className="text-sm text-slate-500">Be the first to share your experience.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <motion.div
          key={review.reviewId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400">
                <User size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white uppercase">{review.reviewerName}</h4>
                  {review.verifiedPurchase && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                      <CheckCircle2 size={10} /> Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <RatingStars rating={review.rating} size={12} />
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                    <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <button className="p-2 text-slate-600 hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-black text-white uppercase tracking-tight">{review.title}</h5>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">{review.comment}</p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
            <button 
              onClick={() => handleHelpful(review.reviewId)}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors"
            >
              <ThumbsUp size={14} /> {review.helpfulCount} Helpful
            </button>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-rose-400 transition-colors">
              <Flag size={14} /> Report
            </button>
            {allowReply && !review.reply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === review.reviewId ? null : review.reviewId)}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
              >
                <Reply size={14} /> Reply
              </button>
            )}
          </div>

          {review.reply && (
            <div className="mt-4 p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Merchant Response</p>
                <span className="text-[8px] font-bold text-slate-600 uppercase">{new Date(review.reply.repliedAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-300 font-medium italic">"{review.reply.comment}"</p>
            </div>
          )}

          {replyingTo === review.reviewId && (
            <div className="mt-4 space-y-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response as the merchant..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-indigo-500 outline-none transition-all h-24 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleReply(review.reviewId)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
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
