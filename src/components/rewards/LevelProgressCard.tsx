/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, ShieldCheck, Zap, ChevronRight, Check } from 'lucide-react';
import { gamificationService, UserGamificationProfile, LEVELS_CONFIG } from '../../services/gamificationService';

interface Props {
  profile: UserGamificationProfile;
}

export const LevelProgressCard: React.FC<Props> = ({ profile }) => {
  const levelInfo = gamificationService.calculateLevel(profile.lifetimeBmp);
  const nextLevel = levelInfo.level < 6 ? LEVELS_CONFIG[levelInfo.level + 1] : null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              Level {levelInfo.level} Tier
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Multiplier: {levelInfo.multiplier}x BMP
            </span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            {levelInfo.levelName}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Lifetime Earned: <span className="text-amber-400 font-black">{profile.lifetimeBmp} BMP</span>
          </p>
        </div>

        {nextLevel && (
          <div className="text-right bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl w-full md:w-auto">
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Tier Target</span>
            <div className="text-xs font-bold text-white uppercase flex items-center gap-1 justify-end">
              <span>{nextLevel.levelName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400">
              Need {(nextLevel.minBmp - profile.lifetimeBmp).toLocaleString()} more BMP
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Tier Progress</span>
          <span>{levelInfo.progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Unlocked Perks */}
      <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Active Tier Benefits</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {levelInfo.perks.map((perk, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
