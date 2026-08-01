/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Flame, Award, ShoppingBag, Store, Users, Star, Loader2 } from 'lucide-react';
import { gamificationService, LeaderboardEntry } from '../../services/gamificationService';

export const LeaderboardView: React.FC = () => {
  const [category, setCategory] = useState<'buyers' | 'sellers' | 'referrers' | 'reviewers' | 'streaks'>('buyers');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'global'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [category, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await gamificationService.getLeaderboard(category);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    if (category === 'buyers') return 'Orders Placed';
    if (category === 'sellers') return 'Merchant Sales';
    if (category === 'referrers') return 'Friends Referred';
    if (category === 'reviewers') return 'Reviews Written';
    return 'Days Streak';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Marketplace Leaderboard
          </h3>
          <p className="text-xs text-slate-400 font-medium">Top active contributors in the Pi Business Market ecosystem</p>
        </div>

        {/* Timeframe & Category Selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-black uppercase">
            {(['daily', 'weekly', 'monthly', 'global'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeframe === tf ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {([
            { id: 'buyers', label: 'Top Buyers', icon: ShoppingBag },
            { id: 'sellers', label: 'Top Sellers', icon: Store },
            { id: 'referrers', label: 'Referrers', icon: Users },
            { id: 'reviewers', label: 'Reviewers', icon: Star },
            { id: 'streaks', label: 'Streaks', icon: Flame },
          ] as const).map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  category === cat.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Rankings...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            return (
              <div
                key={entry.userId}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : isSecond
                    ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-600/40'
                    : isThird
                    ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 border-orange-700/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isFirst
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/30'
                      : isSecond
                      ? 'bg-slate-300 text-slate-950'
                      : isThird
                      ? 'bg-orange-700 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {isFirst ? <Crown className="w-5 h-5 fill-slate-950" /> : `#${entry.rank}`}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">
                        {entry.displayName}
                      </h4>
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded">
                        Lvl {entry.level} {entry.levelName}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{entry.badgesCount} Badges</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <Flame className="w-3 h-3" /> {entry.streakCount}d Streak
                      </span>
                    </span>
                  </div>
                </div>

                {/* Metric Score */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-white">
                    {entry.score}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {getMetricLabel()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
