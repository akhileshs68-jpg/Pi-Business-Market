/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Copy, Check, Gift, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { gamificationService, UserGamificationProfile } from '../../services/gamificationService';

interface Props {
  profile: UserGamificationProfile;
  onProfileUpdated: () => void;
}

export const ReferralSection: React.FC<Props> = ({ profile, onProfileUpdated }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const referralLink = `${window.location.origin}/?ref=${profile.referralCode}`;

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await gamificationService.bindReferralCode(profile.userId, inputCode.trim());
      setSuccessMsg('Referral code linked successfully! Complete your first order to unlock bonus rewards.');
      setInputCode('');
      onProfileUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply referral code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              Growth Ecosystem
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Action Rewards
            </span>
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Anti-Fraud Referral Program
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Invite friends to Pi Business Market. Both of you earn BMP when they complete their first purchase!
          </p>
        </div>

        {/* Stats badge */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-right w-full md:w-auto">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Friends Referred</span>
          <div className="text-2xl font-black text-blue-400">{profile.stats?.totalFriendsReferred || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Share your code */}
        <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl space-y-4">
          <span className="block text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" /> Your Referral Code
          </span>

          <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 p-3 rounded-xl">
            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
              {profile.referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(profile.referralCode, 'code')}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
              {referralLink}
            </span>
            <button
              onClick={() => copyToClipboard(referralLink, 'link')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied Link' : 'Copy Link'}
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-medium space-y-1 pt-1 border-t border-slate-800/60">
            <p>🎁 You receive <strong className="text-emerald-400">+100 BMP</strong> per friend after their 1st completed order.</p>
            <p>🌟 Your friend receives <strong className="text-amber-400">+25 BMP</strong> welcome bonus.</p>
          </div>
        </div>

        {/* Enter a code */}
        <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="block text-xs font-black text-white uppercase tracking-wider mb-2">
              Have a Referral Code?
            </span>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              If a friend invited you to Pi Business Market, enter their code below to bind your referral reward.
            </p>

            {profile.referredBy ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Referral Code Linked to Account</span>
              </div>
            ) : (
              <form onSubmit={handleApplyCode} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BMP-ABCD1234"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputCode.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    {loading ? 'Binding...' : 'Apply'}
                  </button>
                </div>
              </form>
            )}

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold">
                {successMsg}
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-4 pt-2 border-t border-slate-800">
            🔒 Anti-Fraud System Active: Self-referrals & fake accounts are automatically blocked.
          </div>
        </div>
      </div>
    </div>
  );
};
