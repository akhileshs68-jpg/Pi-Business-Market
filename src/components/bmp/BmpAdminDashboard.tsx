import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Flame, 
  PlusCircle, 
  ShieldCheck, 
  Users, 
  Activity, 
  TrendingUp, 
  Lock, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { bmpTokenService, BmpSupplyMetrics } from '../../services/bmpTokenService';

interface BmpAdminDashboardProps {
  adminUid: string;
}

export const BmpAdminDashboard: React.FC<BmpAdminDashboardProps> = ({ adminUid }) => {
  const [metrics, setMetrics] = useState<BmpSupplyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mint / Burn State
  const [targetUser, setTargetUser] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [actionType, setActionType] = useState<'MINT' | 'BURN'>('MINT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await bmpTokenService.getSupplyMetrics();
      setMetrics(data);
    } catch (e) {
      console.warn('Failed to load supply metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleExecuteSupplyAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const numAmt = Number(amount);
    if (!targetUser.trim()) {
      setStatusMessage({ type: 'error', msg: 'Please specify target user ID.' });
      return;
    }
    if (!numAmt || numAmt <= 0) {
      setStatusMessage({ type: 'error', msg: 'Amount must be greater than 0 BMP.' });
      return;
    }

    setIsProcessing(true);
    try {
      if (actionType === 'MINT') {
        const res = await bmpTokenService.adminMintBmp({
          adminId: adminUid,
          targetUserId: targetUser.trim(),
          amount: numAmt,
          reason: reason.trim() || 'Admin Treasury Distribution'
        });
        setStatusMessage({ type: 'success', msg: `Successfully minted ${numAmt} BMP to ${targetUser.slice(0, 8)}... (New Bal: ${res.newBalance.toFixed(2)} BMP)` });
      } else {
        const res = await bmpTokenService.adminBurnBmp({
          adminId: adminUid,
          targetUserId: targetUser.trim(),
          amount: numAmt,
          reason: reason.trim() || 'Circulation Deflation Program'
        });
        setStatusMessage({ type: 'success', msg: `Successfully burned ${numAmt} BMP from ${targetUser.slice(0, 8)}... (New Bal: ${res.newBalance.toFixed(2)} BMP)` });
      }

      setTargetUser('');
      setAmount('');
      setReason('');
      loadMetrics();
    } catch (err: any) {
      console.error('Supply action error:', err);
      setStatusMessage({ type: 'error', msg: err?.message || 'Failed to execute token supply operation.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">BMP Token Treasury & Supply Control</h2>
            <p className="text-xs text-slate-400">
              Tokenomics governance, mint/burn actions, and network ledger auditing
            </p>
          </div>
        </div>

        <button
          onClick={loadMetrics}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Ledger
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Minted</span>
          <span className="text-lg font-mono font-bold text-amber-400 mt-1 block">
            {metrics?.totalMinted.toLocaleString() || '0'} BMP
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Circulating Supply</span>
          <span className="text-lg font-mono font-bold text-emerald-400 mt-1 block">
            {metrics?.circulatingSupply.toLocaleString() || '0'} BMP
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Burned</span>
          <span className="text-lg font-mono font-bold text-rose-400 mt-1 block">
            {metrics?.totalBurned.toLocaleString() || '0'} BMP
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Token Holders</span>
          <span className="text-lg font-mono font-bold text-blue-400 mt-1 block">
            {metrics?.totalHoldersCount || 0} Wallets
          </span>
        </div>
      </div>

      {/* Main Grid: Mint/Burn Form + Top Holders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mint / Burn Form */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" /> Supply Controller
            </h3>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActionType('MINT')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  actionType === 'MINT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mint Tokens
              </button>
              <button
                type="button"
                onClick={() => setActionType('BURN')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  actionType === 'BURN' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Burn Tokens
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              <Activity className="w-4 h-4 shrink-0" />
              <span>{statusMessage.msg}</span>
            </div>
          )}

          <form onSubmit={handleExecuteSupplyAction} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target User ID / Wallet Address
              </label>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                placeholder="User UID or bmp1 address"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount to {actionType} (BMP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="100.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Reason / Governance Log
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Ecosystem Grant / Deflationary Sinking"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg ${
                actionType === 'MINT' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {isProcessing ? 'Executing Transaction...' : `Confirm ${actionType} Execution`}
            </button>
          </form>
        </div>

        {/* Top Token Holders Leaderboard */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Top BMP Token Holders
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Real-time Ranking</span>
          </div>

          <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto pr-1">
            {metrics?.topHolders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No token holders found.</div>
            ) : (
              metrics?.topHolders.map((h, index) => (
                <div key={h.userId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-mono font-bold text-slate-500">{index + 1}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{h.userId.slice(0, 10)}...</span>
                      <span className="text-[10px] font-mono text-slate-500 block truncate">{h.walletAddress}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-400 shrink-0">{h.balance.toFixed(2)} BMP</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
