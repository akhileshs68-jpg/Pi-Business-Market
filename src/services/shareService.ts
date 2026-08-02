/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { gamificationService } from './gamificationService';

export type ShareEntityType = 
  | 'product' 
  | 'store' 
  | 'business' 
  | 'service' 
  | 'category' 
  | 'campaign' 
  | 'referral'
  | 'coupon'
  | 'order'
  | 'professional_profile'
  | 'marketplace'
  | 'home_promotion'
  | 'festival_campaign';

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
  createdAt: any;
  shareDate: string;
  clicksCount: number;
  conversionsCount: number;
  rewarded: boolean;
  rewardBmpAmount: number;
  
  // Advanced deep link and analytics fields
  productId?: string;
  serviceId?: string;
  businessId?: string;
  storeId?: string;
  campaignId?: string;
  couponId?: string;
  orderId?: string;
  referralCode?: string;
  trackingId?: string;
  sourcePlatform?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  // Auditing fields
  deviceId?: string;
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
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
   * Generate Smart Share URL with dynamic deep linking parameters
   */
  generateShareUrl(
    entityType: ShareEntityType, 
    entityId: string, 
    userId?: string, 
    platform: string = 'general',
    additionalParams: Record<string, string> = {}
  ): { shareUrl: string; shareId: string } {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pibusinessmarket.app';
    const shareId = `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    let path = '/';
    const params = new URLSearchParams();

    // Preserve original IDs explicitly based on the shared entity to form a strict deep-link path
    switch (entityType) {
      case 'product': 
        path = `/product/${entityId}`; 
        params.set('productId', entityId);
        break;
      case 'store': 
        path = `/store/${entityId}`; 
        params.set('storeId', entityId);
        break;
      case 'business': 
        path = `/business/${entityId}`; 
        params.set('businessId', entityId);
        break;
      case 'service': 
        path = `/service/${entityId}`; 
        params.set('serviceId', entityId);
        break;
      case 'category': 
        path = `/marketplace?category=${encodeURIComponent(entityId)}`; 
        break;
      case 'campaign': 
        path = `/campaign/${entityId}`; 
        params.set('campaignId', entityId);
        break;
      case 'coupon':
        path = `/marketplace?coupon=${encodeURIComponent(entityId)}`;
        params.set('couponId', entityId);
        break;
      case 'order':
        path = `/orders?orderId=${encodeURIComponent(entityId)}`;
        params.set('orderId', entityId);
        break;
      case 'professional_profile':
        path = `/profile/${entityId}`;
        params.set('professionalId', entityId);
        break;
      case 'marketplace':
        path = `/marketplace`;
        break;
      case 'home_promotion':
        path = `/?promo=${encodeURIComponent(entityId)}`;
        params.set('promoId', entityId);
        break;
      case 'festival_campaign':
        path = `/campaign/${entityId}?festival=true`;
        params.set('campaignId', entityId);
        break;
      case 'referral': 
        path = `/?ref=${userId || 'pioneer'}`; 
        break;
    }

    // Set referral and affiliate code tracking
    if (userId) {
      params.set('ref', userId);
      params.set('referralCode', userId);
    }

    // Generate smart identifiers
    params.set('shareId', shareId);
    params.set('trackingId', shareId);
    params.set('sourcePlatform', platform);

    // Standard UTM parameters for Enterprise Campaign Tracking & Attribution
    params.set('utm_source', platform);
    params.set('utm_medium', 'social_share');
    params.set('utm_campaign', `pi_growth_${entityType}`);
    params.set('utm_content', entityId);

    // Append any additional parameters passed
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

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
    shareId: string,
    telemetry: any = {}
  ): Promise<void> {
    const db = getFirebaseDb();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Parse individual IDs if they are included in the URL params for analytics indexation
    const params = new URL(shareUrl).searchParams;
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
      rewarded: true, // sharing is automatically logged as verified once checks pass
      rewardBmpAmount: 15,
      createdAt: serverTimestamp(),

      // Smart Deep Link Parameters preserved for high-speed indexing & querying
      productId: params.get('productId') || (entityType === 'product' ? entityId : null),
      serviceId: params.get('serviceId') || (entityType === 'service' ? entityId : null),
      businessId: params.get('businessId') || (entityType === 'business' ? entityId : null),
      storeId: params.get('storeId') || (entityType === 'store' ? entityId : null),
      campaignId: params.get('campaignId') || (entityType === 'campaign' ? entityId : null),
      couponId: params.get('couponId') || (entityType === 'coupon' ? entityId : null),
      orderId: params.get('orderId') || (entityType === 'order' ? entityId : null),
      referralCode: params.get('ref') || userId,
      trackingId: shareId,
      sourcePlatform: platform,
      utmSource: platform,
      utmMedium: 'social_share',
      utmCampaign: `pi_growth_${entityType}`,

      // Anti-cheat client metadata captured server-side
      deviceId: telemetry.deviceId || null,
      fingerprint: telemetry.fingerprint || null,
      ipAddress: telemetry.ipAddress || null,
      userAgent: telemetry.userAgent || null
    });
  },

  /**
   * Track visitor link click with high-security anti-cheat validation
   */
  async trackShareClick(shareId: string, visitorId: string, telemetry: any = {}): Promise<boolean> {
    if (!shareId) return false;
    const db = getFirebaseDb();

    try {
      const shareDocRef = doc(db, 'share_events', shareId);
      const shareSnap = await getDoc(shareDocRef);

      if (!shareSnap.exists()) return false;

      const shareData = shareSnap.data();

      // Trigger multi-step strict validation on Anti-Cheat engine
      const { antiCheatEngine } = await import('./rewards/antiCheatEngine');
      await antiCheatEngine.validateShareClick(shareData.userId, visitorId, telemetry);

      // Prevent double counting of click by the same visitor on this share link
      const qDupClick = query(
        collection(db, 'share_clicks'),
        where('shareId', '==', shareId),
        where('visitorId', '==', visitorId)
      );
      const snapDupClick = await getDocs(qDupClick);
      if (!snapDupClick.empty) {
        console.warn('[Anti-Cheat] Double-visitor engagement click detected. Reward bypassed to prevent farming.');
        return false;
      }

      // Record visitor click inside a dedicated collections table
      const clickDocRef = doc(collection(db, 'share_clicks'));
      await setDoc(clickDocRef, {
        shareId,
        referrerUserId: shareData.userId,
        visitorId,
        ipAddress: telemetry.ipAddress || '127.0.0.1',
        fingerprint: telemetry.fingerprint || null,
        userAgent: telemetry.userAgent || null,
        createdAt: serverTimestamp()
      });

      // Increment click count on share event
      await setDoc(shareDocRef, {
        clicksCount: increment(1)
      }, { merge: true });

      // Trigger verified engagement reward to the original referrer
      await gamificationService.processVerifiedShareReward(
        shareData.userId, 
        shareData.entityId, 
        shareData.platform, 
        shareId,
        telemetry
      );

      return true;
    } catch (err) {
      console.warn('Click tracking security bypass or failure:', err);
      return false;
    }
  }
};
