import React, { useState, useEffect } from 'react';
import { Loader2, Gift, History, PlusCircle, Coins, ArrowUpRight, ArrowDownRight, CreditCard, ShieldCheck } from 'lucide-react';
import { paymentEngine } from '../services/wallet/paymentEngine';
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { WalletTransaction } from '../services/wallet/walletTypes';

export const BmpRewardsWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const provider = paymentEngine.getProvider('bmp_rewards');
      const bal = await provider.getBalance(user.uid);
      setBalance(bal);

      const db = getFirebaseDb();
      const txQ = query(
        collection(db, 'wallet_transactions'),
        where('userId', '==', user.uid),
        where('provider', '==', 'bmp_rewards'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snap = await getDocs(txQ);
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
      setTransactions(txs);
    } catch (err) {
      console.error(err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaim = async (type: WalletTransaction['source'], amount: number, desc: string) => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return;

    setClaiming(true);
    try {
      const provider = paymentEngine.getProvider('bmp_rewards');
      await provider.credit(user.uid, amount, type, desc);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 rounded-2xl p-5 sm:p-6 text-white border border-violet-800/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-violet-300">BMP Rewards</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
             <ShieldCheck className="w-3 h-3" /> Active
          </span>
        </div>
        
        <div className="space-y-1 mb-2">
          <span className="text-[10px] text-violet-300/80 uppercase tracking-widest font-bold">Current Balance</span>
          <div className="text-4xl font-black flex items-baseline gap-2 text-white">
            {balance.toFixed(2)} <span className="text-amber-400 text-lg font-bold">BMP</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Claim Rewards Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Available Rewards</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClaim('DAILY_REWARD', 10, 'Daily Login Reward')}
            disabled={claiming}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col gap-2 transition-colors disabled:opacity-50 text-left"
          >
            <span className="text-xs font-bold text-white">Daily Check-in</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded w-max">+10 BMP</span>
          </button>
          
          <button
            onClick={() => handleClaim('SHARE', 25, 'App Share Reward')}
            disabled={claiming}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col gap-2 transition-colors disabled:opacity-50 text-left"
          >
            <span className="text-xs font-bold text-white">Share App</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded w-max">+25 BMP</span>
          </button>

          <button
            onClick={() => handleClaim('REFERRAL', 100, 'Friend Referral Bonus')}
            disabled={claiming}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col gap-2 transition-colors disabled:opacity-50 text-left"
          >
            <span className="text-xs font-bold text-white">Referral Bonus</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded w-max">+100 BMP</span>
          </button>
          
          <button
            onClick={() => handleClaim('CAMPAIGN', 50, 'Promotional Campaign Bonus')}
            disabled={claiming}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex flex-col gap-2 transition-colors disabled:opacity-50 text-left"
          >
            <span className="text-xs font-bold text-white">Campaign Bonus</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded w-max">+50 BMP</span>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Recent Transactions</h4>
        </div>
        
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {tx.type === 'CREDIT' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{tx.description}</p>
                    <p className="text-[10px] font-mono text-slate-500">{tx.source.replace('_', ' ')} • {new Date(tx.createdAt ? new Date(tx.createdAt).getTime() : Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`text-sm font-black font-mono ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
