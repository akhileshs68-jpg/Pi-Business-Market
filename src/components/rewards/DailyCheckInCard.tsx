/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Flame, Clock, CheckCircle2, Calendar, Award, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gamificationService, UserGamificationProfile } from '../../services/gamificationService';

interface Props {
  profile: UserGamificationProfile;
  onProfileUpdated: () => void;
}

export const DailyCheckInCard: React.FC<Props> = ({ profile, onProfileUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number; isReady: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isReady: true
  });

  // Helper to convert timestamps / ISO strings / Firestore objects safely to ms
  const getTimestampMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && 'seconds' in val && typeof val.seconds === 'number') {
      return val.seconds * 1000;
    }
    if (typeof val === 'string') {
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Calculate timer remaining
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const lastCheckIn = getTimestampMs(profile.lastCheckInTime);
      const diffMs = now - lastCheckIn;
      const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

      if (diffMs >= cooldownMs || lastCheckIn === 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, isReady: true });
      } else {
        const msLeft = cooldownMs - diffMs;
        const h = Math.floor(msLeft / (1000 * 60 * 60));
        const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((msLeft % (1000 * 60)) / 1000);
        setTimeRemaining({ hours: h, minutes: m, seconds: s, isReady: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [profile.lastCheckInTime]);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Generate client fingerprint/deviceId for anti-cheat validation
      const telemetry = {
        fingerprint: `FP_${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}_${window.screen.width}x${window.screen.height}`,
        deviceId: `DEV_${navigator.platform.replace(/[^a-zA-Z0-9]/g, '')}_${window.screen.colorDepth}`,
        ipAddress: '127.0.0.1'
      };

      const result = await gamificationService.checkIn(profile.userId, telemetry);
      
      // Fire celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessMsg(`Checked in! Earned +${result.bmpEarned} BMP (${result.streakCount}-day streak)!`);
      onProfileUpdated();
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const streakMilestones = [1, 3, 7, 15, 30, 60, 100];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Daily Streak Check-In</h3>
            <p className="text-xs font-semibold text-slate-400">Claim BMP rewards once every 24 hours & build your streak</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span className="text-sm font-black text-white">{profile.streakCount} Day Streak</span>
        </div>
      </div>

      {/* Milestone Progress Bar */}
      <div className="mb-6 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Streak Milestones</span>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {streakMilestones.map((m) => {
            const isCompleted = profile.streakCount >= m;
            const isCurrent = profile.streakCount === m;
            return (
              <div 
                key={m} 
                className={`py-2 px-1 rounded-xl border text-center transition-all ${
                  isCompleted 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <span className="block text-xs font-black">{m}D</span>
                <span className="block text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                  {m === 1 ? '+10' : m === 3 ? '+20' : m === 7 ? '+35' : m === 15 ? '+60' : m === 30 ? '+110' : m === 60 ? '+210' : '+510'} BMP
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timer & Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-3">
          <Clock className={`w-5 h-5 ${timeRemaining.isReady ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div>
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Check-In Timer</span>
            {timeRemaining.isReady ? (
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready To Claim!
              </span>
            ) : (
              <span className="text-sm font-mono font-bold text-white tracking-wider">
                {String(timeRemaining.hours).padStart(2, '0')}h : {String(timeRemaining.minutes).padStart(2, '0')}m : {String(timeRemaining.seconds).padStart(2, '0')}s
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleCheckIn}
          disabled={!timeRemaining.isReady || loading}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
            timeRemaining.isReady
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 active:scale-95 shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          {loading ? (
            'Validating Action...'
          ) : timeRemaining.isReady ? (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" /> Claim Daily BMP (+10)
            </>
          ) : (
            'Claimed Today'
          )}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
