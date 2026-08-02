/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Star,
  Loader2,
  History,
  Flame,
  Share2,
  Trophy,
  Users,
  Target,
  Gift,
  Coins,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { gamificationService, UserGamificationProfile } from '../services/gamificationService';
import { paymentEngine } from '../services/wallet/paymentEngine';
import { DailyCheckInCard } from '../components/rewards/DailyCheckInCard';
import { LevelProgressCard } from '../components/rewards/LevelProgressCard';
import { BadgesGrid } from '../components/rewards/BadgesGrid';
import { MissionsList } from '../components/rewards/MissionsList';
import { ReferralSection } from '../components/rewards/ReferralSection';
import { LeaderboardView } from '../components/rewards/LeaderboardView';
import { SocialShareModal } from '../components/rewards/SocialShareModal';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { WalletTransaction } from '../services/wallet/walletTypes';

export const CustomerRewards: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'badges' | 'referral' | 'analytics' | 'leaderboard'>('overview');
  const [shareEvents, setShareEvents] = useState<any[]>([]);
  const [shareClicks, setShareClicks] = useState<any[]>([]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const prof = await gamificationService.getUserProfile(user.uid);
      setProfile(prof);

      const db = getFirebaseDb();
      const txQ = query(
        collection(db, 'wallet_transactions'),
        where('userId', '==', user.uid)
      );
      
      const snap = await getDocs(txQ);
      const allTxs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
      const filteredTxs = allTxs
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
        .slice(0, 15);

      setTransactions(filteredTxs);

      // Fetch Real-Time Share Analytics and Security click audit logs
      try {
        const eventsQ = query(
          collection(db, 'share_events'),
          where('userId', '==', user.uid)
        );
        const eventsSnap = await getDocs(eventsQ);
        const eventsList = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShareEvents(eventsList);

        const clicksQ = query(
          collection(db, 'share_clicks'),
          where('referrerUserId', '==', user.uid)
        );
        const clicksSnap = await getDocs(clicksQ);
        const clicksList = clicksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShareClicks(clicksList);
      } catch (analyticsErr) {
        console.warn('Non-fatal share analytics load error:', analyticsErr);
      }

    } catch (err) {
      console.error('Failed to fetch rewards profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing BMP Rewards Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user}
        currentView="customer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={profile?.bmpBalance || 0}
        onWalletUpdate={fetchProfileData}
        onToggleCart={() => {}}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">BMP Rewards Ecosystem</h1>
            </div>
            <p className="text-slate-400 text-xs font-semibold">
              Action-verified marketplace rewards, streak achievements, levels, and referral perks.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShareModalOpen(true)}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-lg"
            >
              <Share2 className="w-4 h-4 text-emerald-400" /> Share & Earn BMP
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl scrollbar-none">
          {[
            { id: 'overview', label: 'Ecosystem Overview', icon: Award },
            { id: 'missions', label: 'Action Missions', icon: Target },
            { id: 'badges', label: 'Badges Wall', icon: Star },
            { id: 'referral', label: 'Referral Program', icon: Users },
            { id: 'analytics', label: 'Share Analytics', icon: TrendingUp },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && profile && (
          <div className="space-y-8">
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-300">Available Balance</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Ledger
                  </span>
                </div>

                <div className="text-4xl font-black text-white mb-2 font-mono">
                  {profile.bmpBalance.toFixed(2)} <span className="text-amber-400 text-lg font-bold">BMP</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Lifetime Earned: <strong className="text-amber-300 font-mono">{profile.lifetimeBmp} BMP</strong>
                </p>
              </div>

              {/* Level Status Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Tier</span>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase rounded">
                    Level {profile.level}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                    {profile.levelName}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Multiplier: <strong className="text-emerald-400">{gamificationService.calculateLevel(profile.lifetimeBmp).multiplier}x Earn Rate</strong>
                  </p>
                </div>
              </div>

              {/* Daily Streak Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Streak</span>
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white mb-1">
                    {profile.streakCount} <span className="text-xs text-orange-400 font-bold uppercase">Days Active</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Next check-in bonus increases with consecutive days
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Check-In Module */}
            <DailyCheckInCard profile={profile} onProfileUpdated={fetchProfileData} />

            {/* Level Progression */}
            <LevelProgressCard profile={profile} />

            {/* Action Missions Preview */}
            <MissionsList profile={profile} onProfileUpdated={fetchProfileData} />
          </div>
        )}

        {/* Tab 2: Action Missions */}
        {activeTab === 'missions' && profile && (
          <MissionsList profile={profile} onProfileUpdated={fetchProfileData} />
        )}

        {/* Tab 3: Badges Wall */}
        {activeTab === 'badges' && profile && (
          <BadgesGrid profile={profile} />
        )}

        {/* Tab 4: Referral Program */}
        {activeTab === 'referral' && profile && (
          <ReferralSection profile={profile} onProfileUpdated={fetchProfileData} />
        )}

        {/* Tab 5: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView />
        )}

        {/* Tab 6: Share Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Shared Links</p>
                <p className="text-3xl font-black text-white font-mono">{shareEvents.length}</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-wider">
                  Across {new Set(shareEvents.map(e => e.platform)).size} social channels
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Link Clicks</p>
                <p className="text-3xl font-black text-amber-400 font-mono">
                  {shareEvents.reduce((acc, e) => acc + (e.clicksCount || 0), 0)}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Verified engagement events</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Average CTR</p>
                <p className="text-3xl font-black text-sky-400 font-mono">
                  {shareEvents.length > 0
                    ? ((shareEvents.reduce((acc, e) => acc + (e.clicksCount || 0), 0) / shareEvents.length) * 100).toFixed(1)
                    : '0.0'}%
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Click-Through Rate</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">BMP Shared Bounty</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">
                  {shareEvents.reduce((acc, e) => acc + (e.rewardBmpAmount || 0), 0)}
                </p>
                <p className="text-[10px] text-emerald-400/80 font-bold mt-1 uppercase tracking-wider">Earned from sharing</p>
              </div>
            </div>

            {/* Platform Performance Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Social Channel Breakdown</h3>
                
                {shareEvents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                    No share channels tracked yet. Share products, services, or profiles to see platform breakdown.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {['whatsapp', 'telegram', 'x_twitter', 'facebook', 'linkedin', 'email', 'general'].map(plat => {
                      const count = shareEvents.filter(e => e.platform === plat).length;
                      const clicks = shareEvents.filter(e => e.platform === plat).reduce((acc, e) => acc + (e.clicksCount || 0), 0);
                      const percentage = shareEvents.length > 0 ? (count / shareEvents.length) * 100 : 0;
                      
                      if (count === 0 && clicks === 0) return null;

                      return (
                        <div key={plat} className="space-y-2.5">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                            <span className="text-slate-300">{plat.replace('_', ' ')}</span>
                            <span className="text-slate-400 font-mono">{count} Shares • {clicks} Clicks</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                plat === 'whatsapp' ? 'bg-emerald-500' :
                                plat === 'telegram' ? 'bg-sky-500' :
                                plat === 'x_twitter' ? 'bg-white' :
                                plat === 'facebook' ? 'bg-blue-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(4, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Performance Score */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Promoter Rating</h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-6">
                    This rating reflects your organic viral outreach and adherence to our zero-abuse reward safety policies.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-28 h-28 rounded-full border-4 border-amber-500/10 flex items-center justify-center mb-4 relative shadow-2xl">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent border-r-transparent animate-spin duration-3000" />
                    <span className="text-3xl font-black text-white font-mono">
                      {shareEvents.length > 0 ? Math.min(100, Math.round((shareEvents.reduce((acc, e) => acc + (e.clicksCount || 0), 0) / shareEvents.length) * 15)) : '0'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Viral Pioneer Score</h4>
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Tier: Bronze Advocate</p>
                </div>
              </div>
            </div>

            {/* Link clicks security audit logs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Link Engagement Feed</h3>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-black uppercase rounded">
                  Anti-Cheat Monitored
                </span>
              </div>
              
              {shareClicks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                  No active traffic stream detected yet. Share links on social groups to log verified visitor visits.
                </div>
              ) : (
                <div className="space-y-3">
                  {shareClicks.slice(0, 8).map((click) => (
                    <div key={click.id} className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl flex items-center justify-between hover:bg-slate-950 transition-all">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white uppercase">Inbound Visit Processed</p>
                          <p className="text-[10px] font-mono text-slate-500 uppercase truncate">
                            ID: {click.visitorId?.slice(0, 10)}... • Footprint: {click.fingerprint?.slice(0, 12) || 'Verified Browser'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-lg">
                          Verified Click
                        </span>
                        <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">
                          {click.createdAt ? new Date(click.createdAt.seconds ? click.createdAt.seconds * 1000 : new Date(click.createdAt).getTime()).toLocaleTimeString() : new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction History Ledger */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" /> Reward Transaction Ledger
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              {transactions.length} Recent Records
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-semibold">
              No reward transactions recorded yet. Complete marketplace actions to earn BMP!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:bg-slate-900/60 transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'CREDIT' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {tx.type === 'CREDIT' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white uppercase truncate">
                        {tx.description}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Source: {tx.source.replace('_', ' ')} • {new Date(tx.createdAt ? new Date(tx.createdAt).getTime() : Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black font-mono ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount} BMP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Social Share Modal */}
      {profile && (
        <SocialShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          userId={profile.userId}
          onRewardEarned={fetchProfileData}
        />
      )}
    </div>
  );
};
