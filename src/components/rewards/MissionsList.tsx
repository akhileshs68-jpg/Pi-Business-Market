/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Target, CheckCircle2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MISSIONS_LIST, Mission, UserGamificationProfile, gamificationService } from '../../services/gamificationService';

interface Props {
  profile: UserGamificationProfile;
  onProfileUpdated: () => void;
}

export const MissionsList: React.FC<Props> = ({ profile, onProfileUpdated }) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');

  const claimedSet = new Set(profile.claimedMissions || []);

  const handleClaim = async (mission: Mission) => {
    setClaimingId(mission.id);
    setErrorMsg(null);

    try {
      await gamificationService.claimMissionReward(profile.userId, mission.id);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });

      onProfileUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim mission reward');
    } finally {
      setClaimingId(null);
    }
  };

  const filteredMissions = MISSIONS_LIST.filter(m => m.type === tab);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" /> Action-Verified Missions
          </h3>
          <p className="text-xs text-slate-400 font-medium">Earn BMP by performing real marketplace actions</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setTab('daily')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === 'daily'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Missions
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Challenges
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        {filteredMissions.map((mission) => {
          const isClaimed = claimedSet.has(mission.id);
          const currentCount = profile.missionProgress?.[mission.id] || 0;
          const isCompleted = currentCount >= mission.targetCount;
          const progressPercent = Math.min(100, Math.round((currentCount / mission.targetCount) * 100));

          return (
            <div
              key={mission.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isClaimed
                  ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                  : isCompleted
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">
                    {mission.title}
                  </h4>
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-black uppercase">
                    +{mission.rewardBmp} BMP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {mission.description}
                </p>

                {/* Progress bar */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {currentCount} / {mission.targetCount}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full sm:w-auto shrink-0">
                {isClaimed ? (
                  <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                  </span>
                ) : isCompleted ? (
                  <button
                    onClick={() => handleClaim(mission)}
                    disabled={claimingId === mission.id}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    {claimingId === mission.id ? 'Claiming...' : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-slate-950" /> Claim Reward
                      </>
                    )}
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-slate-900 text-slate-500 border border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center block">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
