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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-slate-900">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Reputation Manager</h2>
          <p className="text-slate-500 font-medium text-sm">Monitor and respond to customer feedback to build trust.</p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'all' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-500 hover:text-white'
            }`}
          >
            All Feedback
          </button>
          <button
            onClick={() => setActiveTab('unreplied')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'unreplied' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Awaiting Reply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          {/* We pass allowReply=true so the merchant can respond */}
          <ReviewList entityId={businessId} entityType="business" allowReply={true} />
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Response Stats</h4>
            <div className="space-y-4">
              <StatRow label="Avg Response Time" value="4.2h" />
              <StatRow label="Response Rate" value="98%" />
              <StatRow label="Helpful Votes" value="1,240" />
            </div>
          </div>

          <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-3xl">
            <Award className="w-6 h-6 text-indigo-400 mb-3" />
            <h4 className="text-xs font-black text-white uppercase mb-1">Reputation Tip</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
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
    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-white">{value}</span>
  </div>
);
