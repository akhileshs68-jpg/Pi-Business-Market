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
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { getAbsoluteUrl } from '../utils/urlUtils';
import { logger } from '../core/logger';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';
import { PiBusinessMarketDB } from './storage';

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

export type PaymentStatus =
  | 'draft'
  | 'pending_payment'
  | 'verified'
  | 'failed'
  | 'refunded';

export type CtaType = 
  | 'shop_now'
  | 'visit_store'
  | 'book_service'
  | 'learn_more';

export type AdPricingTier =
  | 'standard_banner'
  | 'flash_sale_banner'
  | 'featured_store'
  | 'sponsored_ad';

export interface AdPricingRates {
  standard_banner: number;
  flash_sale_banner: number;
  featured_store: number;
  sponsored_ad: number;
}

export const DEFAULT_AD_PRICING_RATES: AdPricingRates = {
  standard_banner: 5,
  flash_sale_banner: 10,
  featured_store: 12,
  sponsored_ad: 8
};

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
  paymentStatus?: PaymentStatus;
  paymentTxId?: string;
  paymentAmountPi?: number;
  paymentMode?: 'TESTNET' | 'MAINNET';
  durationDays?: number;
  adPricingTier?: AdPricingTier;
  rejectionReason?: string;
  adminPriority?: number;
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
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const { authService } = await import('../auth/authService');

    const liveUser = authService.getLatestVerifiedUser();
    const storedUser = PiBusinessMarketDB.getCurrentUser();

    // Collect all valid identity tokens/UIDs for the currently authenticated user
    const validUserUids = new Set<string>();
    if (currentUser?.uid) validUserUids.add(currentUser.uid);
    if (liveUser?.piUid) validUserUids.add(liveUser.piUid);
    if (liveUser?.uid) validUserUids.add(liveUser.uid);
    if (storedUser?.piUid) validUserUids.add(storedUser.piUid);
    if (storedUser?.uid) validUserUids.add(storedUser.uid);

    // Dynamic resolution of canonical Pi UIDs to handle any identity mapping discrepancies
    try {
      const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
      const canonicalUids = await Promise.all(
        Array.from(validUserUids).map(uid => getCanonicalRewardUserId(uid))
      );
      canonicalUids.forEach(uid => {
        if (uid) validUserUids.add(uid);
      });
    } catch (err) {
      console.warn('[Ad Workspace Auth] Canonical UID pre-resolution failed:', err);
    }

    // Force merchantId to be one of the authenticated user's valid UIDs to prevent identity spoofing
    if (!validUserUids.has(campaignData.merchantId) && campaignData.merchantId) {
      // If there is still a mismatch, try resolving merchantId as well
      try {
        const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
        const canonicalMerchantId = await getCanonicalRewardUserId(campaignData.merchantId);
        if (!validUserUids.has(canonicalMerchantId)) {
          throw new Error('Unauthorized: merchantId spoofing detected.');
        }
      } catch (err) {
        throw new Error('Unauthorized: merchantId spoofing detected.');
      }
    }

    // Verify businessId belongs to the merchant
    const bizRef = doc(db, 'businesses', campaignData.businessId);
    const bizSnap = await getDoc(bizRef);
    if (!bizSnap.exists()) {
      throw new Error('Business not found');
    }
    const bizData = bizSnap.data();

    const bizOwnerUids = [
      bizData.ownerUid,
      bizData.ownerId,
      bizData.userId,
      bizData.sellerId,
      bizData.createdByUid,
      bizData.createdBy,
      bizData.uid
    ].filter(Boolean);

    let isOwner = bizOwnerUids.some(ownerId => validUserUids.has(ownerId));

    const isSuperAdmin = (liveUser?.platformRole === 'superadmin' || liveUser?.platformRole === 'admin') ||
                         (storedUser?.platformRole === 'superadmin' || storedUser?.platformRole === 'admin') ||
                         Array.from(validUserUids).some(id => id === 'akhileshs68' || id === 'sys_admin');

    // Check businessMembers as a fallback
    let isMember = isOwner || isSuperAdmin;
    if (!isMember) {
      for (const userUid of Array.from(validUserUids)) {
        const qMember = query(
          collection(db, 'businessMembers'),
          where('businessId', '==', campaignData.businessId),
          where('userUid', '==', userUid),
          where('status', '==', 'active')
        );
        const memberSnap = await getDocs(qMember);
        if (!memberSnap.empty) {
          isMember = true;
          break;
        }
      }
    }

    if (!isMember) {
      throw new Error('Unauthorized: You do not have permissions over this business workspace.');
    }

    // Form Validation (Phase 6)
    const validCampaignTypes = [
      'featured_product', 'featured_store', 'featured_business', 'featured_service',
      'festival', 'flash_sale', 'limited_offer', 'new_launch', 'grand_opening',
      'sponsored_ad', 'community_announcement', 'pi_ecosystem'
    ];
    if (!validCampaignTypes.includes(campaignData.campaignType)) {
      throw new Error(`Invalid Campaign Type: ${campaignData.campaignType}`);
    }

    if (!campaignData.campaignTitle || !campaignData.campaignTitle.trim()) {
      throw new Error('Campaign title is required.');
    }

    if (!campaignData.shortDescription || !campaignData.shortDescription.trim()) {
      throw new Error('Campaign short description is required.');
    }

    if (!campaignData.bannerImage || !campaignData.bannerImage.trim() || !campaignData.bannerImage.startsWith('http')) {
      throw new Error('A valid banner image URL is required.');
    }

    const duration = campaignData.durationDays || 0;
    if (!Number.isInteger(duration) || duration <= 0 || duration > 30) {
      throw new Error(`Invalid duration: ${duration} Days. Duration must be between 1 and 30 days.`);
    }

    const tier = campaignData.adPricingTier || 'standard_banner';
    const rates = await this.getAdPricingRates();
    const expectedRate = rates[tier] || DEFAULT_AD_PRICING_RATES[tier];
    
    // Total calculation validation
    const expectedTotal = expectedRate * duration;
    if (Math.abs((campaignData.budgetPi || 0) - expectedTotal) > 0.01) {
      throw new Error(`Budget calculation mismatch: Expected ${expectedTotal} Pi, got ${campaignData.budgetPi} Pi.`);
    }

    // Verify Asset References (Ensure merchants can only advertise their own products/stores/services)
    if (campaignData.campaignType === 'featured_store' && campaignData.storeId) {
      const storeRef = doc(db, 'stores', campaignData.storeId);
      const storeSnap = await getDoc(storeRef);
      if (!storeSnap.exists() || storeSnap.data().businessId !== campaignData.businessId) {
        throw new Error('Unauthorized or invalid Store reference.');
      }
    } else if (campaignData.campaignType === 'featured_product' && campaignData.targetRoute) {
      const match = campaignData.targetRoute.match(/\/product\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const prodId = match[1];
        const prodRef = doc(db, 'products', prodId);
        const prodSnap = await getDoc(prodRef);
        if (!prodSnap.exists() || prodSnap.data().businessId !== campaignData.businessId) {
          throw new Error('Unauthorized or invalid Product reference.');
        }
      }
    } else if (campaignData.campaignType === 'featured_service' && campaignData.targetRoute) {
      const match = campaignData.targetRoute.match(/\/service\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const servId = match[1];
        const servRef = doc(db, 'services', servId);
        const servSnap = await getDoc(servRef);
        if (!servSnap.exists() || servSnap.data().businessId !== campaignData.businessId) {
          throw new Error('Unauthorized or invalid Service reference.');
        }
      }
    }

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

    // Sanitize newCampaign payload to strip any keys with 'undefined' values,
    // protecting Firestore setDoc from throwing "Unsupported field value: undefined" errors.
    const sanitizedCampaign: Record<string, any> = {};
    Object.keys(newCampaign).forEach(key => {
      const val = (newCampaign as any)[key];
      if (val !== undefined) {
        sanitizedCampaign[key] = val;
      }
    });

    const ref = doc(db, 'campaigns', id);
    await setDoc(ref, {
      ...sanitizedCampaign,
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
   * Get dynamic platform Ad Pricing Rates from Firestore or fallback to defaults
   */
  public async getAdPricingRates(): Promise<AdPricingRates> {
    try {
      const db = getFirebaseDb();
      const ref = doc(db, 'platformSettings', 'ad_pricing');
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().rates) {
        return { ...DEFAULT_AD_PRICING_RATES, ...snap.data().rates };
      }
    } catch (err) {
      console.warn('Failed to load ad pricing rates, using defaults:', err);
    }
    return DEFAULT_AD_PRICING_RATES;
  }

  /**
   * Update platform Ad Pricing Rates (Super Admin / Authorized Platform Admin only)
   */
  public async updateAdPricingRates(rates: Partial<AdPricingRates>, adminUid: string): Promise<void> {
    const db = getFirebaseDb();
    
    // Ensure Firebase Auth session exists for Firestore Security Rules
    const auth = getFirebaseAuth();
    if (auth && !auth.currentUser) {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn('Firebase Auth anonymous sign in warning during rate update:', authErr);
      }
    }

    const { authService } = await import('../auth/authService');
    const liveUser = authService.getLatestVerifiedUser();

    // Verify admin authority from trusted backend user state or live verified session
    let userData: any = liveUser || null;
    const effectiveUid = auth?.currentUser?.uid || adminUid;
    
    if (!userData && effectiveUid) {
      try {
        const userRef = doc(db, 'users', effectiveUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userData = userSnap.data();
        }
      } catch (err) {
        console.warn('Could not fetch user document for admin verify:', err);
      }
    }

    const isAuthorizedAdmin = userData && (
      userData.platformRole === 'superadmin' || 
      userData.platformRole === 'admin' || 
      userData.role === 'Admin' || 
      userData.role === 'Super Admin' ||
      (Array.isArray(userData.roles) && (userData.roles.includes('superadmin') || userData.roles.includes('admin') || userData.roles.includes('Admin') || userData.roles.includes('Super Admin')))
    );
    
    if (!isAuthorizedAdmin) {
      throw new Error('Unauthorized: Only platform administrators can modify rate cards.');
    }

    // Sanitize rates object to ensure no undefined values or NaNs are written to Firestore
    const sanitizedRates: Record<string, number> = {};
    if (rates && typeof rates === 'object') {
      Object.keys(rates).forEach(key => {
        const val = (rates as any)[key];
        if (typeof val === 'number' && !isNaN(val)) {
          sanitizedRates[key] = val;
        } else if (val !== undefined && val !== null) {
          const num = Number(val);
          if (!isNaN(num)) sanitizedRates[key] = num;
        }
      });
    }

    const actorIdentifier = liveUser?.piUid || auth?.currentUser?.uid || adminUid || 'unknown';

    const ref = doc(db, 'platformSettings', 'ad_pricing');
    await setDoc(ref, {
      rates: sanitizedRates,
      updatedAt: serverTimestamp(),
      updatedBy: actorIdentifier
    }, { merge: true });

    try {
      const logRef = doc(collection(db, 'adminAuditLogs'));
      await setDoc(logRef, {
        action: 'UPDATE_AD_PRICING_RATES',
        actorUid: actorIdentifier,
        newRates: sanitizedRates,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Audit log creation warning:', err);
    }
  }

  /**
   * Mark campaign payment as verified after successful Pi Payment SDK transaction
   */
  public async verifyCampaignPayment(
    campaignId: string, 
    txid: string, 
    paymentMode: 'TESTNET' | 'MAINNET', 
    amountPi: number
  ): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, 'campaigns', campaignId);
    
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Campaign not found');
    }
    const camp = snap.data() as Campaign;
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required');
    }
    
    // Security verification: check if caller owns the campaign or is admin
    const { authService } = await import('../auth/authService');

    const liveUser = authService.getLatestVerifiedUser();
    const storedUser = PiBusinessMarketDB.getCurrentUser();

    const validUserUids = new Set<string>();
    if (currentUser?.uid) validUserUids.add(currentUser.uid);
    if (liveUser?.piUid) validUserUids.add(liveUser.piUid);
    if (liveUser?.uid) validUserUids.add(liveUser.uid);
    if (storedUser?.piUid) validUserUids.add(storedUser.piUid);
    if (storedUser?.uid) validUserUids.add(storedUser.uid);

    // Dynamic resolution of canonical Pi UIDs to handle any identity mapping discrepancies
    try {
      const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
      const canonicalUids = await Promise.all(
        Array.from(validUserUids).map(uid => getCanonicalRewardUserId(uid))
      );
      canonicalUids.forEach(uid => {
        if (uid) validUserUids.add(uid);
      });
    } catch (err) {
      console.warn('[Ad Payment Auth] Canonical UID pre-resolution failed:', err);
    }

    let isOwner = validUserUids.has(camp.merchantId);
    if (!isOwner && camp.merchantId) {
      try {
        const { getCanonicalRewardUserId } = await import('./rewards/rewardIdentityResolver');
        const canonicalMerchantId = await getCanonicalRewardUserId(camp.merchantId);
        isOwner = validUserUids.has(canonicalMerchantId);
      } catch (err) {}
    }
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;
    const isSystemAdmin = Array.from(validUserUids).some(id => id === 'sys_admin' || id === 'akhileshs68') ||
                          (userData && (userData.platformRole === 'superadmin' || userData.platformRole === 'admin' || userData.role === 'Admin' || userData.role === 'Super Admin')) ||
                          (liveUser && (liveUser.platformRole === 'superadmin' || liveUser.platformRole === 'admin')) ||
                          (storedUser && (storedUser.platformRole === 'superadmin' || storedUser.platformRole === 'admin'));
    
    if (!isOwner && !isSystemAdmin) {
      throw new Error('Unauthorized: You do not have permissions over this campaign payment.');
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await currentUser.getIdToken(true);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = getAbsoluteUrl(`/api/campaigns/${campaignId}/verify-payment`);
    const body = JSON.stringify({
      paymentId: txid,
      txid,
      amountPi,
      currency: 'Pi'
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    const resText = await response.text();
    if (!response.ok) {
      let errMsg = 'Payment could not be verified. Please try again.';
      try {
        const parsed = JSON.parse(resText);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch (e) {}
      throw new Error(errMsg);
    }
  }

  /**
   * Helper to resolve the canonical user profile document for authorization checks,
   * properly following pointer documents (Firebase Auth UID -> canonical Pi UID).
   */
  private async resolveCanonicalUserData(uid: string): Promise<Record<string, any> | null> {
    if (!uid) return null;
    const db = getFirebaseDb();
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;
      
      const data = userSnap.data();
      if (data && data.pointer === true) {
        const canonicalPiUid = data.targetPiUid || data.piUid;
        if (!canonicalPiUid || canonicalPiUid === uid) {
          return null;
        }
        const canonicalRef = doc(db, 'users', canonicalPiUid);
        const canonicalSnap = await getDoc(canonicalRef);
        if (!canonicalSnap.exists()) {
          return null;
        }
        return canonicalSnap.data();
      }
      
      return data;
    } catch (err) {
      console.warn('[CampaignService] Failed to resolve canonical user data for uid:', uid, err);
      return null;
    }
  }

  /**
   * Admin updates campaign status (Approve, Reject, Pause, Resume, Expire)
   */
  public async updateCampaignStatus(
    campaignId: string, 
    status: CampaignStatus, 
    adminUid: string,
    rejectionReason?: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, 'campaigns', campaignId);
    
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Campaign not found');
    }
    const camp = snap.data() as Campaign;
    
    // 1. Resolve canonical user & check administrator privileges
    const userData = await this.resolveCanonicalUserData(adminUid);
    const isSystemAdmin = adminUid === 'sys_admin' || 
                          adminUid === 'akhileshs68' ||
                          (userData && (
                            userData.platformRole === 'superadmin' || 
                            userData.platformRole === 'admin' || 
                            userData.role === 'Admin' || 
                            userData.role === 'Super Admin' ||
                            (Array.isArray(userData.roles) && (
                              userData.roles.includes('superadmin') || 
                              userData.roles.includes('admin') || 
                              userData.roles.includes('Admin') || 
                              userData.roles.includes('Super Admin')
                            ))
                          ));

    // 2. Check if the caller is the merchant owner of this campaign
    let isOwner = camp.merchantId === adminUid;
    if (!isOwner && camp.merchantId) {
      try {
        const userRef = doc(db, 'users', adminUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.pointer && (uData.targetPiUid === camp.merchantId || uData.piUid === camp.merchantId)) {
            isOwner = true;
          }
        }
      } catch (e) {}
    }
    
    // 3. Authorization branching: Super Admin > Merchant Owner
    if (isSystemAdmin) {
      // Platform administrator can execute all moderation status transitions
      // (pending -> active, pending -> rejected, paused, active, expired, etc.)
    } else if (isOwner) {
      // If caller is non-admin merchant owner, enforce strict state machine rules
      if (status === 'active') {
        if (camp.status !== 'paused') {
          throw new Error('Unauthorized: Merchants can only reactivate campaigns that are currently paused.');
        }
        if (camp.paymentStatus !== 'verified') {
          throw new Error('Unauthorized: Campaign cannot be activated without verified payment.');
        }
      } else if (status === 'paused') {
        if (camp.status !== 'active') {
          throw new Error('Unauthorized: Only active campaigns can be paused by merchants.');
        }
      } else if (status === 'expired') {
        // Archiving / self-deletion is allowed
      } else {
        throw new Error(`Unauthorized: Merchants cannot transition campaign status to ${status}.`);
      }
    } else {
      throw new Error('Unauthorized: Only administrators or campaign owners can update this status.');
    }

    const updatePayload: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'active') {
      updatePayload.isVerified = true;
    }

    if (rejectionReason) {
      updatePayload.rejectionReason = rejectionReason;
    }

    await updateDoc(ref, updatePayload);

    // Notify merchant owner
    try {
      if (camp.merchantId) {
        const reasonMsg = status === 'rejected' && rejectionReason ? ` Reason: ${rejectionReason}` : '';
        await notificationService.notify(
          camp.merchantId,
          'marketing_alert',
          `Campaign Status: ${status.toUpperCase()}`,
          `Your campaign "${camp.campaignTitle || 'Ad'}" status has been updated to ${status.toUpperCase()}.${reasonMsg}`,
          { entityId: campaignId, entityType: 'campaign', linkTo: '/business/campaigns' }
        );
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
        rejectionReason: rejectionReason || null,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Audit log creation warning:', err);
    }

    logger.audit('CampaignService', `Admin/Owner ${adminUid} updated campaign ${campaignId} status to ${status}`, adminUid);
  }

  /**
   * Admin pins or unpins a campaign
   */
  public async togglePinCampaign(campaignId: string, isPinned: boolean, adminUid: string): Promise<void> {
    const db = getFirebaseDb();
    
    // Verify admin authority with pointer resolution
    const userData = await this.resolveCanonicalUserData(adminUid);
    const isSystemAdmin = adminUid === 'sys_admin' || 
                          adminUid === 'akhileshs68' ||
                          (userData && (
                            userData.platformRole === 'superadmin' || 
                            userData.platformRole === 'admin' || 
                            userData.role === 'Admin' || 
                            userData.role === 'Super Admin' ||
                            (Array.isArray(userData.roles) && (
                              userData.roles.includes('superadmin') || 
                              userData.roles.includes('admin') || 
                              userData.roles.includes('Admin') || 
                              userData.roles.includes('Super Admin')
                            ))
                          ));
    
    if (!isSystemAdmin) {
      throw new Error('Unauthorized: Only platform administrators can pin campaigns.');
    }

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
