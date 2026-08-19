/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Users, 
  Star,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ReputationScore, ReviewEntityType } from '../types';
import { reviewService } from '../services/reviewService';
import { RatingStars } from './RatingStars';

interface ReputationWidgetProps {
  entityId: string;
  entityType: ReviewEntityType;
}

export const ReputationWidget: React.FC<ReputationWidgetProps> = ({ entityId, entityType }) => {
  const [score, setScore] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, [entityId]);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getEntityReputation(entityId);
      setScore(data);
    } catch (err) {
      console.error('Failed to fetch reputation', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-48 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />;

  if (!score) return (
    <div className="p-6 sm:p-8 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-5">
      <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
        <Activity size={28} />
      </div>
      <div>
        <h4 className="text-xs font-black text-white uppercase tracking-wider">Building Reputation</h4>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Be the first to provide verified feedback for this {entityType}.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 relative overflow-hidden group shadow-xl">
      <div className="flex items-start justify-between relative z-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Reputation Score</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <h3 className="text-4xl sm:text-5xl font-black text-white leading-none font-mono">{score.overallRating.toFixed(1)}</h3>
            <div className="pb-0.5">
              <RatingStars rating={score.overallRating} size={16} className="mb-1" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{score.reviewCount} Total Reviews</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Trust Score</p>
            <p className="text-xl sm:text-2xl font-black text-white font-mono">{score.trustScore}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white font-mono truncate">{score.verifiedReviewCount}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">Verified Purchases</p>
          </div>
        </div>
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg shrink-0">
            <TrendingUp size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white font-mono truncate">{score.responseRate || 100}%</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">Response Rate</p>
          </div>
        </div>
      </div>

      {/* Subtle decorative background icon */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 text-violet-600/5 group-hover:text-violet-600/10 transition-colors pointer-events-none">
        <Award size={180} strokeWidth={0.5} />
      </div>
    </div>
  );
};
