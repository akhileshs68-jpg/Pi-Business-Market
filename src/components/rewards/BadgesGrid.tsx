/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, 
  ShoppingBag, 
  Store, 
  Crown, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Sparkles, 
  Heart, 
  Users, 
  Clock,
  Lock
} from 'lucide-react';
import { BADGES_CATALOG, BadgeInfo, UserGamificationProfile } from '../../services/gamificationService';

interface Props {
  profile: UserGamificationProfile;
}

export const BadgesGrid: React.FC<Props> = ({ profile }) => {
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller' | 'streak' | 'community' | 'referral'>('all');

  const userBadges = new Set(profile.badges || []);

  const getIcon = (iconName: string, colorClass: string, isUnlocked: boolean) => {
    const props = { className: `w-6 h-6 ${isUnlocked ? colorClass : 'text-slate-600'}` };
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag {...props} />;
      case 'Store': return <Store {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Heart': return <Heart {...props} />;
      case 'Users': return <Users {...props} />;
      case 'Clock': return <Clock {...props} />;
      default: return <Award {...props} />;
    }
  };

  const badgeList = Object.values(BADGES_CATALOG);
  const filteredBadges = badgeList.filter(b => filter === 'all' || b.category === filter);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" /> Achievement Badges Wall
          </h3>
          <p className="text-xs text-slate-400 font-medium">Unlocked ({userBadges.size} / {badgeList.length}) verified reputation badges</p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'buyer', 'seller', 'streak', 'community', 'referral'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isUnlocked = userBadges.has(badge.id);

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative overflow-hidden ${
                isUnlocked
                  ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600 shadow-md'
                  : 'bg-slate-950/30 border-slate-800/40 opacity-60'
              }`}
            >
              <div className={`p-3 rounded-xl border shrink-0 ${
                isUnlocked 
                  ? 'bg-slate-900 border-slate-700' 
                  : 'bg-slate-900/40 border-slate-800'
              }`}>
                {getIcon(badge.iconName, badge.color, isUnlocked)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={`text-xs font-black uppercase truncate ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    {badge.name}
                  </h4>
                  {isUnlocked ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest rounded">
                      Earned
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] font-medium text-slate-400 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
