/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Gift, 
  ShieldCheck, 
  Star,
  Loader2,
  ArrowRight,
  History,
  Activity,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { loyaltyService } from '../services/loyaltyService';
import { LoyaltyAccount, LoyaltyTransaction, LoyaltyTier } from '../types';

export const CustomerRewards: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const businessId = 'PI-CORP-001'; // Simulated context

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const acc = await loyaltyService.getOrCreateAccount(user!.uid, businessId);
      setAccount(acc);
      const trx = await loyaltyService.getTransactions(acc.accountId);
      setTransactions(trx);
    } catch (err) {
      console.error('Failed to fetch loyalty data', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'diamond': return 'text-cyan-400';
      case 'platinum': return 'text-slate-300';
      case 'gold': return 'text-amber-400';
      case 'silver': return 'text-slate-400';
      default: return 'text-orange-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Retrieving Loyalty Account Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="customer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Rewards & Benefits</h1>
          </div>
          <p className="text-slate-500 font-medium">Track your Pi loyalty points, tier status, and exclusive marketplace rewards.</p>
        </div>

        {/* Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-[3rem] p-10 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Verified Loyalty Member</span>
                </div>
                <h2 className="text-6xl font-black text-white mb-2 leading-none">{account?.pointsBalance || 0}</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Available Points to Redeem</p>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <button className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/5">
                  Browse Rewards
                </button>
                <div className="flex items-center gap-2 text-indigo-400">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Earning 10pts / Pi</span>
                </div>
              </div>
            </div>
            <Gift className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 text-white/5 group-hover:text-white/10 transition-all pointer-events-none" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center">
            <div className={`w-20 h-20 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center mb-6 shadow-2xl ${getTierColor(account?.tier || 'bronze')}`}>
              <Star size={32} />
            </div>
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${getTierColor(account?.tier || 'bronze')}`}>
              {account?.tier || 'Bronze'}
            </h3>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Tier Status</p>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-indigo-500" style={{ width: '45%' }} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">3,450 more pts to Silver</p>
          </div>
        </div>

        {/* History */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <History className="w-5 h-5 text-indigo-400" /> Transaction History
            </h3>
            <button className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-all">View All</button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
            {transactions.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-slate-500 font-medium">No transactions found yet. Start shopping to earn points!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {transactions.map((trx) => (
                  <div key={trx.transactionId} className="p-8 flex items-center justify-between hover:bg-slate-800/20 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        trx.type === 'earn' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {trx.type === 'earn' ? <TrendingUp size={20} /> : <Gift size={20} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">
                          {trx.type === 'earn' ? 'Order Earnings' : 'Reward Redemption'}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {trx.referenceType} #{trx.referenceId.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xl font-black ${trx.type === 'earn' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trx.type === 'earn' ? '+' : '-'}{trx.points}
                      </p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase">
                        {new Date(trx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
