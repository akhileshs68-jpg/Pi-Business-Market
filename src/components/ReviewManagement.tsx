/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react';
import { Review, ReviewStatus } from '../types';
import { reviewService } from '../services/reviewService';
import { ReviewList } from './ReviewList';

interface ReviewManagementProps {
  businessId: string;
}

export const ReviewManagement: React.FC<ReviewManagementProps> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unreplied'>('all');
  
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-900">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-1">Reputation Manager</h2>
          <p className="text-slate-400 font-medium text-xs">Monitor and respond to customer feedback to build verified trust.</p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`min-h-[44px] px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
              activeTab === 'all' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unreplied')}
            className={`min-h-[44px] px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
              activeTab === 'unreplied' 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Awaiting Reply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {/* We pass allowReply=true so the merchant can respond */}
          <ReviewList entityId={businessId} entityType="business" allowReply={true} />
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Response Stats</h4>
            <div className="space-y-4">
              <StatRow label="Avg Response Time" value="4.2h" />
              <StatRow label="Response Rate" value="98%" />
              <StatRow label="Helpful Votes" value="1,240" />
            </div>
          </div>

          <div className="p-6 bg-violet-600/5 border border-violet-500/20 rounded-2xl">
            <Award className="w-6 h-6 text-violet-400 mb-3" />
            <h4 className="text-xs font-black text-white uppercase mb-1">Reputation Tip</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Businesses that respond to reviews within 24 hours see a 15% higher trust score on average.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    <span className="text-xs font-black text-white font-mono">{value}</span>
  </div>
);
