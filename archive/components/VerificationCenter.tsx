/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  CheckCircle2, 
  Sparkles,
  Award,
  Globe
} from 'lucide-react';

interface VerificationCenterProps {
  user: any;
  onSave: (updates: any) => Promise<void>;
  saving: boolean;
}

export const VerificationCenter: React.FC<VerificationCenterProps> = ({
  user
}) => {
  const isPiVerified = true; // Automatically true since roles/activeRole/verified are assigned upon Pi authenticate
  
  const displayWalletAddress = (user.walletAddress && !user.walletAddress.startsWith('pi_wallet_'))
    ? user.walletAddress
    : 'No Pi Wallet connected';

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="verification-center-root">
      {/* Pi Verified Credential Card */}
      <div className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl" id="pi-verified-card">
        {/* Subtle decorative background blur */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Animated Big Badge */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/5" id="big-badge-container">
            <ShieldCheck className="w-10 h-10 animate-pulse" id="shield-check-icon" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black border-2 border-slate-900 shadow-md">
              ✓
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" id="verified-badge-label">
              <Sparkles className="w-3 h-3" />
              Verified Participant
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight" id="verified-title">✓ Pi Verified</h3>
            <p className="text-slate-400 text-xs font-semibold max-w-md leading-relaxed" id="verified-desc">
              Your identity has been authenticated through the official Pi Network credentials. You have full access to peer-to-peer trading and the Pi Business Market.
            </p>
          </div>

          {/* Sync status detail list */}
          <div className="w-full bg-slate-950/60 border border-slate-850 rounded-2xl p-5 text-left space-y-4" id="sync-details-box">
            <div className="flex items-start justify-between gap-4" id="row-username">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Pi Network Identity</span>
                <span className="text-sm font-black text-white">@{user.username || 'pioneer'}</span>
              </div>
              <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                Active Node
              </div>
            </div>

            <div className="border-t border-slate-850 pt-4 flex flex-col gap-1.5" id="row-wallet">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-violet-400" />
                Authenticated Wallet Address
              </span>
              <p className="text-xs font-mono font-bold text-slate-300 break-all bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                {displayWalletAddress}
              </p>
            </div>

            <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-xs" id="row-ledger">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-violet-400" />
                Pi Blockchain Gateway
              </span>
              <span className="text-emerald-400 font-extrabold font-mono uppercase tracking-wide">
                Mainnet Live
              </span>
            </div>
          </div>

          {/* Security Info Disclaimer */}
          <div className="flex items-center gap-2.5 p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl text-left text-[11px] text-slate-400 max-w-md leading-relaxed" id="security-disclaimer">
            <Award className="w-5 h-5 text-violet-400 shrink-0" />
            <span>
              Pi authentication establishes the highest level of network confidence. No manual paperwork, pending queues, or admin approvals are required.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
