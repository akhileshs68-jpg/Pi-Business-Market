import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Send, 
  QrCode, 
  Gift, 
  TrendingUp, 
  History, 
  Sparkles, 
  Copy, 
  Check, 
  Users, 
  ShoppingBag, 
  ShieldCheck, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar
} from 'lucide-react';
import { bmpTokenService, BmpWallet, BmpLedgerEntry } from '../../services/bmpTokenService';
import { BmpTransferModal } from './BmpTransferModal';
import { BmpQrScannerModal } from './BmpQrScannerModal';

interface BmpWalletDashboardProps {
  currentUserUid: string;
}

export const BmpWalletDashboard: React.FC<BmpWalletDashboardProps> = ({ currentUserUid }) => {
  const [wallet, setWallet] = useState<BmpWallet | null>(null);
  const [ledger, setLedger] = useState<BmpLedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'ledger' | 'rewards' | 'receive'>('ledger');
  
  // Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);

  // Rewards state
  const [referralInput, setReferralInput] = useState('');
  const [rewardMsg, setRewardMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState(false);

  // Subscribe to real-time wallet & ledger
  useEffect(() => {
    if (!currentUserUid) return;

    const unsubWallet = bmpTokenService.subscribeWallet(currentUserUid, (w) => {
      setWallet(w);
    });

    const unsubLedger = bmpTokenService.subscribeLedger(currentUserUid, (entries) => {
      setLedger(entries);
    });

    return () => {
      unsubWallet();
      unsubLedger();
    };
  }, [currentUserUid]);

  const handleCopy = (text: string, type: 'address' | 'refCode') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedRefCode(true);
      setTimeout(() => setCopiedRefCode(false), 2000);
    }
  };

  const handleClaimDaily = async () => {
    setIsClaimingDaily(true);
    setRewardMsg(null);
    try {
      const res = await bmpTokenService.claimDailyReward(currentUserUid);
      setRewardMsg({
        type: 'success',
        msg: `Claimed +${res.bonusAmount.toFixed(1)} BMP Daily Check-in Bonus! (Day ${res.streak} Streak)`
      });
    } catch (err: any) {
      setRewardMsg({ type: 'error', msg: err?.message || 'Daily reward claim failed.' });
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralInput.trim()) return;
    setRewardMsg(null);
    try {
      const res = await bmpTokenService.claimReferralReward(currentUserUid, referralInput.trim());
      setRewardMsg({ type: 'success', msg: `Referral code redeemed! Received +${res.rewardAmount} BMP bonus.` });
      setReferralInput('');
    } catch (err: any) {
      setRewardMsg({ type: 'error', msg: err?.message || 'Failed to claim referral code.' });
    }
  };

  const handleScanPay = (recipient: string, amount: number) => {
    setTransferRecipient(recipient);
    setTransferAmount(amount);
    setIsTransferOpen(true);
  };

  if (!wallet) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Synchronizing BMP Token Wallet...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Balance & Address */}
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
              <Coins className="w-4 h-4" /> BMP Token Ecosystem Wallet
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-3xl md:text-5xl font-black font-mono text-white tracking-tight">
                {wallet.bmpBalance.toFixed(2)}
              </span>
              <span className="text-lg md:text-2xl font-black text-amber-400 font-mono">BMP</span>
            </div>

            {/* Wallet Address Chip */}
            <div className="inline-flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-mono truncate max-w-[180px] sm:max-w-xs">{wallet.walletAddress}</span>
              <button
                onClick={() => handleCopy(wallet.walletAddress, 'address')}
                className="text-slate-500 hover:text-white transition-colors"
              >
                {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setTransferRecipient(''); setTransferAmount(0); setIsTransferOpen(true); }}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" /> Transfer BMP
            </button>

            <button
              onClick={() => setIsQrOpen(true)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4 text-amber-400" /> Receive / Scan
            </button>

            <button
              onClick={handleClaimDaily}
              disabled={isClaimingDaily}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Claim Daily ({wallet.dailyRewardStreak || 0}d)
            </button>
          </div>

        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-amber-500/10 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime Earned</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{wallet.lifetimeBmp.toFixed(2)} BMP</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Check-in Streak</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{wallet.dailyRewardStreak || 0} Days</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Referrals Invited</span>
            <span className="font-mono font-bold text-blue-400 text-sm">{wallet.referralsCount || 0} Pioneers</span>
          </div>
        </div>

      </div>

      {/* Reward Status Banner */}
      {rewardMsg && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
          rewardMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <Gift className="w-5 h-5 shrink-0" />
          <span>{rewardMsg.msg}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            activeTab === 'ledger' ? 'border-amber-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Transaction Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            activeTab === 'rewards' ? 'border-amber-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-400" /> Reward Quests & Referrals
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {ledger.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No transactions recorded in BMP ledger yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {ledger.map((tx) => {
                const isCredit = tx.type === 'CREDIT';

                return (
                  <div key={tx.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        isCredit ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{tx.description}</span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5 font-mono">
                          <span className="uppercase text-[10px] font-bold text-slate-500">{tx.category}</span>
                          <span>• {new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm font-mono font-black block ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isCredit ? '+' : '-'}{tx.amount.toFixed(2)} BMP
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Bal: {tx.balanceAfter.toFixed(2)} BMP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWARD ENGINE */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Referral System Box */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Referral Engine (+100 BMP)
            </h3>
            <p className="text-xs text-slate-400">
              Invite new Pioneers to Pi Business Market. Both you and your friend earn 100 BMP instantly.
            </p>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Your Personal Referral Code</span>
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="font-mono font-bold text-amber-300 text-sm flex-1">{wallet.referralCode}</span>
                <button
                  onClick={() => handleCopy(wallet.referralCode, 'refCode')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1"
                >
                  {copiedRefCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
            </div>

            {/* Redeem Friend Code */}
            <form onSubmit={handleClaimReferral} className="pt-3 border-t border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase">Redeem Friend's Referral Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BMP-ABC123"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  disabled={!!wallet.referredBy}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white uppercase placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!!wallet.referredBy || !referralInput.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl uppercase transition-colors"
                >
                  Redeem
                </button>
              </div>
              {wallet.referredBy && (
                <p className="text-[10px] text-emerald-400 font-mono">✓ Referral code bonus already claimed</p>
              )}
            </form>
          </div>

          {/* Cashback & Merchant Quests */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-400" /> Automatic Cashback & Rewards
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Shopping Cashback</span>
                  <span className="text-[11px] text-slate-400">Earn 10 BMP for every 1 Pi spent on marketplace orders</span>
                </div>
                <span className="font-mono font-bold text-amber-400 shrink-0">10x BMP</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Merchant Order Bonus</span>
                  <span className="text-[11px] text-slate-400">Merchants receive +50 BMP bonus on fulfilling orders</span>
                </div>
                <span className="font-mono font-bold text-purple-400 shrink-0">+50 BMP</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Daily Check-In</span>
                  <span className="text-[11px] text-slate-400">Claim 10+ BMP every 24 hours to build your streak</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 shrink-0">+10-24 BMP</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modals */}
      <BmpTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        senderUid={currentUserUid}
        senderBalance={wallet.bmpBalance}
        initialRecipient={transferRecipient}
        initialAmount={transferAmount}
      />

      <BmpQrScannerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        walletAddress={wallet.walletAddress}
        userId={currentUserUid}
        onScanPay={handleScanPay}
      />

    </div>
  );
};
