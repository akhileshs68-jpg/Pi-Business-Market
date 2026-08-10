/**
 * Pi Business Market - Enterprise Campaign & Advertisement Engine
 * Manages merchant promotional campaigns, banner ads, flash sales, and ad performance analytics.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseDb } from '../firebase/config';
import { logger } from '../core/logger';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

export type CampaignType = 
  | 'featured_product'
  | 'featured_store'
  | 'featured_business'
  | 'featured_service'
  | 'festival'
  | 'flash_sale'
  | 'limited_offer'
  | 'new_launch'
  | 'grand_opening'
  | 'sponsored_ad'
  | 'community_announcement'
  | 'pi_ecosystem';

export type CampaignStatus = 
  | 'pending'
  | 'active'
  | 'paused'
  | 'rejected'
  | 'completed'
  | 'expired';

export type CtaType = 
  | 'shop_now'
  | 'visit_store'
  | 'book_service'
  | 'learn_more';

export interface Campaign {
  id: string;
  merchantId: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  storeId?: string;
  storeName?: string;
  campaignTitle: string;
  shortDescription: string;
  campaignType: CampaignType;
  bannerImage: string;
  bgClass?: string;
  targetRoute: string;
  offerBadge?: string;
  discountPercent?: number;
  isVerified?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  ctaType: CtaType;
  impressions: number;
  clicks: number;
  ctr: number;
  budgetPi?: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_BANNER_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_pi_mainnet_launch',
    merchantId: 'sys_admin',
    businessId: 'sys_pi_network',
    businessName: 'Pi Ecosystem Foundation',
    businessLogo: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=120',
    campaignTitle: 'Pi Commerce Festival 2026',
    shortDescription: '100% Consensus Pi Payments across 10,000+ Verified Stores Worldwide',
    campaignType: 'pi_ecosystem',
    bannerImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
    bgClass: 'from-violet-950 via-indigo-900 to-slate-950',
    targetRoute: '/marketplace',
    offerBadge: 'Consensus Approved',
    discountPercent: 30,
    isVerified: true,
    isPinned: true,
    isFeatured: true,
    status: 'active',
    startDate: new Date().toISOString(),
    ctaType: 'shop_now',
    impressions: 14200,
    clicks: 3100,
    ctr: 21.8,
    budgetPi: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'camp_tech_flash_sale',
    merchantId: 'merchant_01',
    businessId: 'bus_alpha_tech',
    businessName: 'Alpha Electronics Hub',
    businessLogo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120',
    storeName: 'Alpha Flagship Store',
    campaignTitle: 'Flash Tech Expo - Up to 40% Off',
    shortDescription: 'Laptops, Smart Devices & Crypto Mining Accessories paid exclusively in Pi',
    campaignType: 'flash_sale',
    bannerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    bgClass: 'from-blue-950 via-cyan-950 to-slate-950',
    targetRoute: '/marketplace',
    offerBadge: 'Flash Sale Live',
    discountPercent: 40,
    isVerified: true,
    isPinned: false,
    isFeatured: true,
    status: 'active',
    startDate: new Date().toISOString(),
    ctaType: 'shop_now',
    impressions: 8900,
    clicks: 1850,
    ctr: 20.7,
    budgetPi: 250,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'camp_global_logistics',
    merchantId: 'merchant_02',
    businessId: 'bus_pioneer_freight',
    businessName: 'Pioneer Global Freight & Escrow',
    businessLogo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120',
    campaignTitle: 'Cross-Border Pi Shipping Services',
    shortDescription: 'Door-to-door verified delivery & smart escrow contract protection for every order',
    campaignType: 'featured_service',
    bannerImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800',
    bgClass: 'from-amber-950 via-orange-950 to-slate-950',
    targetRoute: '/services',
    offerBadge: 'Zero Escrow Fee',
    discountPercent: 15,
    isVerified: true,
    isPinned: false,
    isFeatured: true,
    status: 'active',
    startDate: new Date().toISOString(),
    ctaType: 'book_service',
    impressions: 6400,
    clicks: 1120,
    ctr: 17.5,
    budgetPi: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'camp_bmp_rewards_boost',
    merchantId: 'sys_admin',
    businessId: 'sys_bmp_vault',
    businessName: 'BMP Rewards Network',
    businessLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120',
    campaignTitle: '2X BMP Token Staking Bonus',
    shortDescription: 'Earn 2x BMP utility tokens on every purchase completed today with Pioneer Wallet',
    campaignType: 'community_announcement',
    bannerImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    bgClass: 'from-emerald-950 via-teal-950 to-slate-950',
    targetRoute: '/rewards',
    offerBadge: 'Double Points',
    discountPercent: 50,
    isVerified: true,
    isPinned: true,
    isFeatured: true,
    status: 'active',
    startDate: new Date().toISOString(),
    ctaType: 'learn_more',
    impressions: 11500,
    clicks: 2900,
    ctr: 25.2,
    budgetPi: 300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class CampaignService {
  /**
   * Sanitizes and validates target URLs to prevent open redirects or protocol attacks
   */
  public sanitizeTargetRoute(route?: string): string {
    if (!route || typeof route !== 'string') return '/marketplace';
    const clean = route.trim();
    if (/^(javascript|data|vbscript|file):/i.test(clean)) {
      return '/marketplace';
    }
    if (clean.startsWith('/') || /^https?:\/\//i.test(clean)) {
      return clean;
    }
    return `/${clean}`;
  }

  /**
   * Get all active campaigns for the Home Page Slider and Featured sections
   */
  public async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'campaigns'),
        where('status', '==', 'active')
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Seed default initial campaigns to Firestore asynchronously
        this.seedDefaultCampaigns().catch(err => console.warn('Seeding campaigns warning:', err));
        return DEFAULT_BANNER_CAMPAIGNS.map(c => ({
          ...c,
          targetRoute: this.sanitizeTargetRoute(c.targetRoute)
        }));
      }

      const now = new Date().toISOString();

      const list: Campaign[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          merchantId: data.merchantId || '',
          businessId: data.businessId || '',
          businessName: data.businessName || 'Verified Merchant',
          businessLogo: data.businessLogo,
          storeId: data.storeId,
          storeName: data.storeName,
          campaignTitle: data.campaignTitle || data.title || 'Special Promotion',
          shortDescription: data.shortDescription || data.description || '',
          campaignType: data.campaignType || 'sponsored_ad',
          bannerImage: data.bannerImage || data.imageUrl || data.image || '',
          bgClass: data.bgClass || 'from-violet-950 via-indigo-900 to-slate-950',
          targetRoute: this.sanitizeTargetRoute(data.targetRoute),
          offerBadge: data.offerBadge || 'Special Offer',
          discountPercent: data.discountPercent || 0,
          isVerified: data.isVerified ?? true,
          isPinned: !!data.isPinned,
          isFeatured: !!data.isFeatured,
          status: data.status || 'active',
          startDate: data.startDate || new Date().toISOString(),
          endDate: data.endDate,
          ctaType: data.ctaType || 'shop_now',
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          ctr: data.ctr || 0,
          budgetPi: data.budgetPi || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      });

      // Filter out future scheduled or expired campaigns
      const validCampaigns = list.filter(c => {
        if (c.startDate && c.startDate > now) return false;
        if (c.endDate && c.endDate < now) return false;
        return true;
      });

      // Sort pinned campaigns first, then featured, then by impressions
      return validCampaigns.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.impressions - a.impressions;
      });
    } catch (e: any) {
      console.warn('Error fetching campaigns, using fallback defaults:', e);
      return DEFAULT_BANNER_CAMPAIGNS.map(c => ({
        ...c,
        targetRoute: this.sanitizeTargetRoute(c.targetRoute)
      }));
    }
  }

  /**
   * Merchant creates a campaign
   */
  public async createCampaign(
    campaignData: Omit<Campaign, 'id' | 'impressions' | 'clicks' | 'ctr' | 'createdAt' | 'updatedAt'>
  ): Promise<Campaign> {
    const db = getFirebaseDb();
    const id = `camp_${Math.random().toString(36).substring(2, 12)}`;
    const now = new Date().toISOString();

    const newCampaign: Campaign = {
      ...campaignData,
      targetRoute: this.sanitizeTargetRoute(campaignData.targetRoute),
      id,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      createdAt: now,
      updatedAt: now
    };

    const ref = doc(db, 'campaigns', id);
    await setDoc(ref, {
      ...newCampaign,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.audit('CampaignService', `Created campaign ${id} for business ${campaignData.businessName}`, campaignData.merchantId, { campaignType: campaignData.campaignType });

    try {
      if (campaignData.merchantId) {
        await notificationService.notify(
          campaignData.merchantId,
          'marketing_alert',
          'Campaign Created',
          `Your campaign "${campaignData.campaignTitle}" has been created and submitted for review.`,
          { entityId: id, entityType: 'campaign', linkTo: '/business/campaigns' }
        );
      }
      await notificationService.notifyAdmins(
        'marketing_alert',
        'New Campaign Submitted',
        `New campaign "${campaignData.campaignTitle}" submitted by ${campaignData.businessName}.`,
        { entityId: id, entityType: 'campaign', linkTo: '/admin-console' }
      );
    } catch (notifErr) {
      console.warn('Campaign creation notification warning:', notifErr);
    }

    return newCampaign;
  }

  /**
   * Admin updates campaign status (Approve, Reject, Pause, Resume, Expire)
   */
  public async updateCampaignStatus(campaignId: string, status: CampaignStatus, adminUid: string): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, 'campaigns', campaignId);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp()
    });

    // Notify merchant owner
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const camp = snap.data();
        if (camp.merchantId) {
          await notificationService.notify(
            camp.merchantId,
            'marketing_alert',
            `Campaign Status: ${status.toUpperCase()}`,
            `Your campaign "${camp.campaignTitle || 'Ad'}" status has been updated to ${status.toUpperCase()}.`,
            { entityId: campaignId, entityType: 'campaign', linkTo: '/business/campaigns' }
          );
        }
      }
    } catch (notifErr) {
      console.warn('Campaign status update notification warning:', notifErr);
    }

    // Write immutable admin audit log
    try {
      const logRef = doc(collection(db, 'adminAuditLogs'));
      await setDoc(logRef, {
        action: 'UPDATE_CAMPAIGN_STATUS',
        actorUid: adminUid,
        targetId: campaignId,
        newStatus: status,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Audit log creation warning:', err);
    }

    logger.audit('CampaignService', `Admin ${adminUid} updated campaign ${campaignId} status to ${status}`, adminUid);
  }

  /**
   * Admin pins or unpins a campaign
   */
  public async togglePinCampaign(campaignId: string, isPinned: boolean, adminUid: string): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, 'campaigns', campaignId);
    await updateDoc(ref, {
      isPinned,
      updatedAt: serverTimestamp()
    });

    // Write immutable admin audit log
    try {
      const logRef = doc(collection(db, 'adminAuditLogs'));
      await setDoc(logRef, {
        action: 'TOGGLE_CAMPAIGN_PIN',
        actorUid: adminUid,
        targetId: campaignId,
        isPinned,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Audit log creation warning:', err);
    }

    logger.audit('CampaignService', `Admin ${adminUid} set isPinned=${isPinned} for campaign ${campaignId}`, adminUid);
  }

  /**
   * Track ad impression
   */
  public async trackImpression(campaignId: string): Promise<void> {
    try {
      const auth = getAuth();
      const db = getFirebaseDb();
      const ref = doc(db, 'campaigns', campaignId);
      await updateDoc(ref, {
        impressions: increment(1)
      });
      analyticsService.trackEvent({
        eventType: 'banner_view' as any,
        userUid: auth.currentUser?.uid || 'anonymous',
        metadata: { campaignId }
      }).catch(() => {});
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Track ad click
   */
  public async trackClick(campaignId: string): Promise<void> {
    try {
      const auth = getAuth();
      const db = getFirebaseDb();
      const ref = doc(db, 'campaigns', campaignId);
      await updateDoc(ref, {
        clicks: increment(1)
      });
      analyticsService.trackEvent({
        eventType: 'banner_click' as any,
        userUid: auth.currentUser?.uid || 'anonymous',
        metadata: { campaignId }
      }).catch(() => {});
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Super Admin fetches all campaigns regardless of status for moderation
   */
  public async getAllCampaignsForAdmin(): Promise<Campaign[]> {
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'campaigns'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return DEFAULT_BANNER_CAMPAIGNS;
      }

      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          merchantId: data.merchantId || '',
          businessId: data.businessId || '',
          businessName: data.businessName || 'Merchant Partner',
          businessLogo: data.businessLogo,
          storeId: data.storeId,
          storeName: data.storeName,
          campaignTitle: data.campaignTitle || data.title || 'Campaign',
          shortDescription: data.shortDescription || data.description || '',
          campaignType: data.campaignType || 'sponsored_ad',
          bannerImage: data.bannerImage || data.imageUrl || data.image || '',
          bgClass: data.bgClass || 'from-violet-950 via-indigo-900 to-slate-950',
          targetRoute: data.targetRoute || '/marketplace',
          offerBadge: data.offerBadge || 'Special Offer',
          discountPercent: data.discountPercent || 0,
          isVerified: data.isVerified ?? true,
          isPinned: !!data.isPinned,
          isFeatured: !!data.isFeatured,
          status: data.status || 'pending',
          startDate: data.startDate || new Date().toISOString(),
          endDate: data.endDate,
          ctaType: data.ctaType || 'shop_now',
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          ctr: data.ctr || 0,
          budgetPi: data.budgetPi || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      });
    } catch (e) {
      console.warn('Failed fetching campaigns for admin, returning default list:', e);
      return DEFAULT_BANNER_CAMPAIGNS;
    }
  }

  /**
   * Merchant fetches their own campaigns
   */
  public async getCampaignsByMerchant(merchantId: string): Promise<Campaign[]> {
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'campaigns'),
        where('merchantId', '==', merchantId)
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];

      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          merchantId: data.merchantId || merchantId,
          businessId: data.businessId || '',
          businessName: data.businessName || 'Business',
          campaignTitle: data.campaignTitle || '',
          shortDescription: data.shortDescription || '',
          campaignType: data.campaignType || 'sponsored_ad',
          bannerImage: data.bannerImage || '',
          targetRoute: data.targetRoute || '/marketplace',
          status: data.status || 'pending',
          startDate: data.startDate || new Date().toISOString(),
          ctaType: data.ctaType || 'shop_now',
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          ctr: data.ctr || 0,
          budgetPi: data.budgetPi || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Track ad conversion (e.g. sale resulting from ad click)
   */
  public async trackConversion(campaignId: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const ref = doc(db, 'campaigns', campaignId);
      await updateDoc(ref, {
        conversions: increment(1)
      });
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Seed default campaigns into Firestore
   */
  private async seedDefaultCampaigns(): Promise<void> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        return; // Do not try to seed campaigns if not signed in, prevents missing permission error
      }
      const db = getFirebaseDb();
      for (const camp of DEFAULT_BANNER_CAMPAIGNS) {
        const ref = doc(db, 'campaigns', camp.id);
        const docSnap = await getDoc(ref);
        if (!docSnap.exists()) {
          await setDoc(ref, {
            ...camp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      console.warn('Failed seeding default campaigns:', e);
    }
  }
}

export const campaignService = new CampaignService();
