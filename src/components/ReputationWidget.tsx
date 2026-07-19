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

  if (loading) return <div className="h-48 bg-slate-900/50 rounded-[2.5rem] animate-pulse" />;

  if (!score) return (
    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] flex items-center gap-6">
      <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600">
        <Activity size={32} />
      </div>
      <div>
        <h4 className="text-sm font-black text-white uppercase">Building Reputation</h4>
        <p className="text-xs text-slate-500 font-medium">Be the first to provide feedback for this {entityType}.</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Reputation Score</span>
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <div className="flex items-end gap-3">
            <h3 className="text-5xl font-black text-white leading-none">{score.overallRating.toFixed(1)}</h3>
            <div className="pb-1">
              <RatingStars rating={score.overallRating} size={18} className="mb-1" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{score.reviewCount} Total Reviews</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Trust Score</p>
            <p className="text-2xl font-black text-white">{score.trustScore}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase">{score.verifiedReviewCount}</p>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Verified</p>
          </div>
        </div>
        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase">{score.responseRate || 100}%</p>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Response</p>
          </div>
        </div>
      </div>

      {/* Decorative SVG Pattern */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 text-indigo-600/5 group-hover:text-indigo-600/10 transition-colors">
        <Award size={200} strokeWidth={0.5} />
      </div>
    </div>
  );
};
