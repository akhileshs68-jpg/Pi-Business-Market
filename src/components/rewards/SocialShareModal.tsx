/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Share2, X, Copy, Check, Sparkles, Send, MessageCircle, Twitter, Facebook, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gamificationService } from '../../services/gamificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  onRewardEarned?: () => void;
}

export const SocialShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userId,
  productId = 'PI-GLOBAL-MARKET',
  productName = 'Pi Business Market - Global Pioneer Commerce',
  productImage,
  onRewardEarned
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/product/${productId}`;
  const shareText = `Check out "${productName}" on Pi Business Market! Trade with Pi Coin seamlessly.`;

  const handleSharePlatform = async (platform: string, directUrl?: string) => {
    setLoading(true);
    setMsg(null);

    try {
      if (directUrl) {
        window.open(directUrl, '_blank', 'noopener,noreferrer');
      } else if (platform === 'native' && navigator.share) {
        await navigator.share({
          title: productName,
          text: shareText,
          url: shareUrl
        });
      }

      // Process share reward in backend
      const earned = await gamificationService.processShareReward(userId, productId, platform);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setMsg(`Share verified! Earned +${earned} BMP reward.`);
      if (onRewardEarned) onRewardEarned();
    } catch (err: any) {
      setMsg(err.message || 'Share completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareUrl}\n${shareText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleSharePlatform('copy_link');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Share & Earn BMP</h3>
              <p className="text-[10px] font-bold text-emerald-400 uppercase">Earn +15 BMP per verified share</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
          {productImage ? (
            <img src={productImage} alt={productName} className="w-12 h-12 object-cover rounded-xl shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
              PI
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white truncate">{productName}</p>
            <p className="text-[10px] font-mono text-slate-500 truncate">{shareUrl}</p>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={() => handleSharePlatform('native')}
              disabled={loading}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all col-span-2"
            >
              <Share2 className="w-4 h-4" /> Native System Share
            </button>
          )}

          <button
            onClick={() => handleSharePlatform('whatsapp', `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`)}
            disabled={loading}
            className="p-3 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>

          <button
            onClick={() => handleSharePlatform('telegram', `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}
            disabled={loading}
            className="p-3 bg-blue-950/40 hover:bg-blue-950/80 border border-blue-500/30 text-blue-400 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" /> Telegram
          </button>

          <button
            onClick={() => handleSharePlatform('twitter', `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}
            disabled={loading}
            className="p-3 bg-sky-950/40 hover:bg-sky-950/80 border border-sky-500/30 text-sky-400 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all"
          >
            <Twitter className="w-4 h-4" /> X / Twitter
          </button>

          <button
            onClick={() => handleSharePlatform('facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
            disabled={loading}
            className="p-3 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 rounded-2xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all"
          >
            <Facebook className="w-4 h-4" /> Facebook
          </button>
        </div>

        {/* Copy Link */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};
