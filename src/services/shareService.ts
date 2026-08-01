/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { gamificationService } from './gamificationService';

export type ShareEntityType = 'product' | 'store' | 'business' | 'service' | 'category' | 'campaign' | 'referral';

export interface ShareTargetConfig {
  id: string;
  name: string;
  iconName: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  getShareUrl: (url: string, title: string, text: string) => string;
}

export interface ShareEventRecord {
  shareId: string;
  userId: string;
  entityType: ShareEntityType;
  entityId: string;
  platform: string;
  shareUrl: string;
  createdAt: string;
  clicksCount: number;
  conversionsCount: number;
  rewarded: boolean;
  rewardBmpAmount: number;
}

export const SHARE_TARGETS: ShareTargetConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    iconName: 'MessageCircle',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/40 hover:bg-emerald-900/60',
    borderClass: 'border-emerald-500/30',
    getShareUrl: (url, title, text) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    iconName: 'MessageSquare',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-950/40 hover:bg-teal-900/60',
    borderClass: 'border-teal-500/30',
    getShareUrl: (url, title, text) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
  },
  {
    id: 'telegram',
    name: 'Telegram',
    iconName: 'Send',
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-950/40 hover:bg-sky-900/60',
    borderClass: 'border-sky-500/30',
    getShareUrl: (url, title, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  {
    id: 'facebook',
    name: 'Facebook',
    iconName: 'Facebook',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40 hover:bg-blue-900/60',
    borderClass: 'border-blue-500/30',
    getShareUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    id: 'messenger',
    name: 'FB Messenger',
    iconName: 'MessageCircle',
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-950/40 hover:bg-indigo-900/60',
    borderClass: 'border-indigo-500/30',
    getShareUrl: (url) => `fb-messenger://share?link=${encodeURIComponent(url)}`
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    iconName: 'Twitter',
    colorClass: 'text-slate-200',
    bgClass: 'bg-slate-800/60 hover:bg-slate-700/80',
    borderClass: 'border-slate-600/40',
    getShareUrl: (url, title, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    iconName: 'Linkedin',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-950/40 hover:bg-cyan-900/60',
    borderClass: 'border-cyan-500/30',
    getShareUrl: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  {
    id: 'instagram',
    name: 'Instagram',
    iconName: 'Instagram',
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-950/40 hover:bg-pink-900/60',
    borderClass: 'border-pink-500/30',
    getShareUrl: (url) => `https://instagram.com`
  },
  {
    id: 'threads',
    name: 'Threads',
    iconName: 'AtSign',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/40 hover:bg-purple-900/60',
    borderClass: 'border-purple-500/30',
    getShareUrl: (url, title, text) => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`
  },
  {
    id: 'discord',
    name: 'Discord',
    iconName: 'Disc',
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-950/40 hover:bg-violet-900/60',
    borderClass: 'border-violet-500/30',
    getShareUrl: (url) => `https://discord.com/channels/@me`
  },
  {
    id: 'signal',
    name: 'Signal',
    iconName: 'Shield',
    colorClass: 'text-blue-300',
    bgClass: 'bg-blue-900/40 hover:bg-blue-800/60',
    borderClass: 'border-blue-400/30',
    getShareUrl: (url, title, text) => `sgnl://send?text=${encodeURIComponent(`${text}\n${url}`)}`
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    iconName: 'Smartphone',
    colorClass: 'text-yellow-300',
    bgClass: 'bg-yellow-950/40 hover:bg-yellow-900/60',
    borderClass: 'border-yellow-500/30',
    getShareUrl: (url) => `snapchat://creativeKitWebShare?url=${encodeURIComponent(url)}`
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    iconName: 'ExternalLink',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-950/40 hover:bg-red-900/60',
    borderClass: 'border-red-500/30',
    getShareUrl: (url, title) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`
  },
  {
    id: 'reddit',
    name: 'Reddit',
    iconName: 'ExternalLink',
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-950/40 hover:bg-orange-900/60',
    borderClass: 'border-orange-500/30',
    getShareUrl: (url, title) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
  },
  {
    id: 'email',
    name: 'Email',
    iconName: 'Mail',
    colorClass: 'text-amber-300',
    bgClass: 'bg-amber-950/40 hover:bg-amber-900/60',
    borderClass: 'border-amber-500/30',
    getShareUrl: (url, title, text) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\nLink: ${url}`)}`
  },
  {
    id: 'sms',
    name: 'SMS',
    iconName: 'Smartphone',
    colorClass: 'text-emerald-300',
    bgClass: 'bg-emerald-950/40 hover:bg-emerald-900/60',
    borderClass: 'border-emerald-500/30',
    getShareUrl: (url, title, text) => `sms:?body=${encodeURIComponent(`${text} ${url}`)}`
  }
];

export const shareService = {
  /**
   * Generate Smart Share URL with tracking parameters
   */
  generateShareUrl(entityType: ShareEntityType, entityId: string, userId?: string, platform: string = 'general'): { shareUrl: string; shareId: string } {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pibusinessmarket.app';
    const shareId = `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    let path = '/';
    switch (entityType) {
      case 'product': path = `/product/${entityId}`; break;
      case 'store': path = `/store/${entityId}`; break;
      case 'business': path = `/business/${entityId}`; break;
      case 'service': path = `/service/${entityId}`; break;
      case 'category': path = `/marketplace?category=${encodeURIComponent(entityId)}`; break;
      case 'campaign': path = `/campaign/${entityId}`; break;
      case 'referral': path = `/?ref=${userId || 'pioneer'}`; break;
    }

    const params = new URLSearchParams();
    if (userId) params.set('ref', userId);
    params.set('shareId', shareId);
    params.set('utm_source', platform);
    params.set('utm_medium', 'social_share');
    params.set('utm_campaign', 'pi_rewards');

    const shareUrl = `${origin}${path}${path.includes('?') ? '&' : '?'}${params.toString()}`;
    return { shareUrl, shareId };
  },

  /**
   * Record share event in Firestore
   */
  async recordShareEvent(
    userId: string, 
    entityType: ShareEntityType, 
    entityId: string, 
    platform: string, 
    shareUrl: string, 
    shareId: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const ref = doc(db, 'share_events', shareId);
    await setDoc(ref, {
      shareId,
      userId,
      entityType,
      entityId,
      platform,
      shareUrl,
      shareDate: todayStr,
      clicksCount: 0,
      conversionsCount: 0,
      rewarded: false,
      rewardBmpAmount: 0,
      createdAt: serverTimestamp()
    });
  },

  /**
   * Track visitor link click with anti-cheat validation
   */
  async trackShareClick(shareId: string, visitorId: string, ipHash?: string): Promise<boolean> {
    if (!shareId) return false;
    const db = getFirebaseDb();

    try {
      const shareDocRef = doc(db, 'share_events', shareId);
      const shareSnap = await getDoc(shareDocRef);

      if (!shareSnap.exists()) return false;

      const shareData = shareSnap.data();

      // Anti-cheat rule 1: Do not reward self-clicks
      if (shareData.userId === visitorId) {
        console.warn('[Anti-Cheat] Self-click detected. Click recorded, reward suppressed.');
        return false;
      }

      // Record visitor click
      const clickDocRef = doc(collection(db, 'share_clicks'));
      await setDoc(clickDocRef, {
        shareId,
        referrerUserId: shareData.userId,
        visitorId,
        ipHash: ipHash || 'anonymous',
        createdAt: serverTimestamp()
      });

      // Increment click count on share event
      await setDoc(shareDocRef, {
        clicksCount: increment(1)
      }, { merge: true });

      // Trigger verified reward if threshold met and not yet rewarded
      if (!shareData.rewarded) {
        await gamificationService.processVerifiedShareReward(shareData.userId, shareData.entityId, shareData.platform, shareId);
        await setDoc(shareDocRef, {
          rewarded: true,
          rewardBmpAmount: 15
        }, { merge: true });
      }

      return true;
    } catch (err) {
      console.warn('Failed to track share click:', err);
      return false;
    }
  }
};
