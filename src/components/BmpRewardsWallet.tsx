/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Gift, History, Coins, ArrowUpRight, ArrowDownRight, ShieldCheck, Flame, ShoppingBag, Award, Users, Share2, Star } from 'lucide-react';
import { paymentEngine } from '../services/wallet/paymentEngine';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { WalletTransaction } from '../services/wallet/walletTypes';
import { gamificationService, UserGamificationProfile } from '../services/gamificationService';
import { DailyCheckInCard } from './rewards/DailyCheckInCard';

export const BmpRewardsWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Get Balance (auto-creates wallet doc if missing)
      try {
        const provider = paymentEngine.getProvider('bmp_rewards');
        const bal = await provider.getBalance(user.uid);
        setBalance(bal || 0);
      } catch (balErr) {
        console.warn('Error loading balance:', balErr);
      }

      // 2. Get Gamification Profile (auto-creates profile if missing)
      try {
        const userProf = await gamificationService.getUserProfile(user.uid);
        setProfile(userProf);
      } catch (profErr) {
        console.warn('Error loading gamification profile:', profErr);
      }

      // 3. Query wallet_transactions safely (single field filter to avoid missing index errors)
      try {
        const db = getFirebaseDb();
        const txQ = query(
          collection(db, 'wallet_transactions'),
          where('userId', '==', user.uid)
        );
        
        const snap = await getDocs(txQ);
        const allUserTxs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
        
        // Filter and sort in memory to guarantee zero composite index requirements
        const filteredTxs = allUserTxs
          .filter(tx => tx.provider === 'bmp_rewards' || tx.walletId === `${user.uid}_bmp_rewards`)
          .sort((a, b) => {
            const getTs = (val: any) => {
              if (!val) return 0;
              if (typeof val === 'object' && 'seconds' in val) return val.seconds * 1000;
              if (typeof val === 'number') return val;
              return new Date(val).getTime() || 0;
            };
            return getTs(b.createdAt) - getTs(a.createdAt);
          })
          .slice(0, 20);

        setTransactions(filteredTxs);
      } catch (txErr) {
        console.warn('Error loading wallet transactions:', txErr);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error in loadData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-950 rounded-3xl p-6 text-white border border-amber-500/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-300">BMP Rewards Ledger</span>
          </div>
          {profile && (
            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Lvl {profile.level} {profile.levelName}
            </span>
          )}
        </div>
        
        <div className="space-y-1 mb-2">
          <span className="text-[10px] text-amber-300/80 uppercase tracking-widest font-black">Available Reward Balance</span>
          <div className="text-4xl sm:text-5xl font-black flex items-baseline gap-2 text-white">
            {balance.toFixed(2)} <span className="text-amber-400 text-xl font-bold">BMP</span>
          </div>
        </div>

        {profile && (
          <div className="mt-4 pt-4 border-t border-amber-500/10 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Lifetime Earned: <strong className="text-amber-300 font-mono">{profile.lifetimeBmp} BMP</strong></span>
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4 fill-orange-400" /> {profile.streakCount}d Streak
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Daily Check-In Module */}
      {profile && (
        <DailyCheckInCard profile={profile} onProfileUpdated={loadData} />
      )}

      {/* How to Earn BMP (Action-Based Verification) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Verified Earning Methods</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Marketplace Purchases</p>
              <p className="text-[10px] font-medium text-emerald-400">10 BMP per 1 Pi Spent</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Verified Reviews</p>
              <p className="text-[10px] font-medium text-amber-400">+25 BMP per review</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Friend Referral</p>
              <p className="text-[10px] font-medium text-blue-400">+100 BMP upon friend 1st order</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Social Share</p>
              <p className="text-[10px] font-medium text-emerald-400">+15 BMP per share</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">BMP Transaction History</h4>
        </div>
        
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium py-4 text-center">No BMP reward transactions recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {tx.type === 'CREDIT' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{tx.description}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      {tx.source.replace('_', ' ')} • {new Date(tx.createdAt ? new Date(tx.createdAt).getTime() : Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-black font-mono shrink-0 ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount} BMP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
