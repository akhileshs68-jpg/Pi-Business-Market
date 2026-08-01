/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction,
  increment
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { bmpRewardsProvider } from './wallet/providers/bmpRewardsProvider';

export interface LevelInfo {
  level: number;
  levelName: string;
  minBmp: number;
  maxBmp: number;
  multiplier: number;
  perks: string[];
  progressPercent: number;
}

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  category: 'buyer' | 'seller' | 'streak' | 'community' | 'referral';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewardBmp: number;
  targetCount: number;
  type: 'daily' | 'weekly' | 'one_time';
  category: 'view' | 'wishlist' | 'order' | 'review' | 'share' | 'profile' | 'refer';
}

export interface UserGamificationProfile {
  userId: string;
  bmpBalance: number;
  lifetimeBmp: number;
  level: number;
  levelName: string;
  streakCount: number;
  lastCheckInTime: number; // ms timestamp
  lastCheckInDate: string; // YYYY-MM-DD
  referralCode: string;
  referredBy: string | null;
  badges: string[];
  claimedMissions: string[]; // missionIds
  missionProgress: Record<string, number>; // missionId -> current count
  stats: {
    totalOrdersPlaced: number;
    totalSpentPi: number;
    totalReviewsSubmitted: number;
    totalProductsShared: number;
    totalFriendsReferred: number;
    totalSalesAsMerchant: number;
    productsPublished: number;
    accountCreatedTime: number;
  };
  updatedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  levelName: string;
  score: number; // depends on leaderboard category
  badgesCount: number;
  streakCount: number;
  rank: number;
}

// ============================================================================
// CONSTANTS & CONFIGURATIONS
// ============================================================================

export const LEVELS_CONFIG: Record<number, { levelName: string; minBmp: number; maxBmp: number; multiplier: number; perks: string[] }> = {
  1: { levelName: 'Explorer', minBmp: 0, maxBmp: 99, multiplier: 1.0, perks: ['Base 1.0x Reward Earnings', 'Standard Marketplace Access'] },
  2: { levelName: 'Trader', minBmp: 100, maxBmp: 499, multiplier: 1.05, perks: ['1.05x Reward Multiplier', 'Trader Badge Unlocked', 'Priority Order Notifications'] },
  3: { levelName: 'Merchant', minBmp: 500, maxBmp: 1499, multiplier: 1.10, perks: ['1.10x Reward Multiplier', 'Store Highlight Badge', 'Discounted Checkout Fees'] },
  4: { levelName: 'Professional', minBmp: 1500, maxBmp: 4999, multiplier: 1.20, perks: ['1.20x Reward Multiplier', 'Pro Seller Badge', 'Featured Marketplace Listing'] },
  5: { levelName: 'Business Leader', minBmp: 5000, maxBmp: 14999, multiplier: 1.35, perks: ['1.35x Reward Multiplier', 'VIP Concierge Support', 'Top Banner Showcase'] },
  6: { levelName: 'Marketplace Champion', minBmp: 15000, maxBmp: 9999999, multiplier: 1.50, perks: ['1.50x Reward Multiplier', 'Gold Champion Avatar Frame', 'Zero Commission Perk'] },
};

export const BADGES_CATALOG: Record<string, BadgeInfo> = {
  verified_buyer: { id: 'verified_buyer', name: 'Verified Buyer', description: 'Completed first verified purchase on Pi Business Market', iconName: 'ShoppingBag', color: 'text-indigo-400', category: 'buyer' },
  top_buyer: { id: 'top_buyer', name: 'Top Buyer', description: 'Completed 10+ verified purchases', iconName: 'Award', color: 'text-amber-400', category: 'buyer' },
  verified_seller: { id: 'verified_seller', name: 'Verified Seller', description: 'Published a product and achieved first merchant sale', iconName: 'Store', color: 'text-emerald-400', category: 'seller' },
  top_seller: { id: 'top_seller', name: 'Top Seller', description: 'Achieved 25+ sales on Pi Business Market', iconName: 'Crown', color: 'text-yellow-400', category: 'seller' },
  premium_merchant: { id: 'premium_merchant', name: 'Premium Merchant', description: 'Reached 50+ sales with exceptional merchant score', iconName: 'ShieldCheck', color: 'text-purple-400', category: 'seller' },
  daily_streak_3: { id: 'daily_streak_3', name: '3-Day Streak', description: 'Maintained a 3-day continuous check-in streak', iconName: 'Flame', color: 'text-orange-400', category: 'streak' },
  daily_streak_7: { id: 'daily_streak_7', name: '7-Day Streak', description: 'Maintained a 7-day continuous check-in streak', iconName: 'Zap', color: 'text-amber-500', category: 'streak' },
  daily_streak_30: { id: 'daily_streak_30', name: '30-Day Master', description: 'Maintained a 30-day continuous check-in streak', iconName: 'Sparkles', color: 'text-cyan-400', category: 'streak' },
  community_helper: { id: 'community_helper', name: 'Community Helper', description: 'Submitted 5+ verified product reviews', iconName: 'Heart', color: 'text-rose-400', category: 'community' },
  referral_master: { id: 'referral_master', name: 'Referral Master', description: 'Successfully invited 3+ friends who completed purchases', iconName: 'Users', color: 'text-blue-400', category: 'referral' },
  veteran: { id: 'veteran', name: 'Marketplace Veteran', description: 'Active member for 30+ days in the ecosystem', iconName: 'Clock', color: 'text-slate-300', category: 'community' },
};

export const MISSIONS_LIST: Mission[] = [
  { id: 'daily_visit', title: 'Daily Marketplace Visit', description: 'Visit the Pi Business Marketplace today', rewardBmp: 5, targetCount: 1, type: 'daily', category: 'view' },
  { id: 'daily_view_products', title: 'Product Explorer', description: 'Explore at least 5 different product listings', rewardBmp: 10, targetCount: 5, type: 'daily', category: 'view' },
  { id: 'daily_wishlist', title: 'Wishlist Curator', description: 'Add 1 item to your wishlist', rewardBmp: 10, targetCount: 1, type: 'daily', category: 'wishlist' },
  { id: 'daily_share', title: 'Social Ambassador', description: 'Share a marketplace product with friends', rewardBmp: 15, targetCount: 1, type: 'daily', category: 'share' },
  { id: 'weekly_purchase', title: 'Marketplace Patron', description: 'Complete 1 order purchase this week', rewardBmp: 50, targetCount: 1, type: 'weekly', category: 'order' },
  { id: 'weekly_review', title: 'Trusted Reviewer', description: 'Submit 1 verified product review', rewardBmp: 30, targetCount: 1, type: 'weekly', category: 'review' },
  { id: 'weekly_refer', title: 'Growth Catalyst', description: 'Invite 1 friend who completes a purchase', rewardBmp: 100, targetCount: 1, type: 'weekly', category: 'refer' },
];

export const gamificationService = {
  /**
   * Helper: Calculate level details from lifetime BMP
   */
  calculateLevel(lifetimeBmp: number): LevelInfo {
    let currentLvl = 1;
    for (let lvl = 6; lvl >= 1; lvl--) {
      if (lifetimeBmp >= LEVELS_CONFIG[lvl].minBmp) {
        currentLvl = lvl;
        break;
      }
    }

    const cfg = LEVELS_CONFIG[currentLvl];
    const min = cfg.minBmp;
    const max = cfg.maxBmp;
    const range = max - min;
    const currentInLevel = Math.max(0, lifetimeBmp - min);
    const progressPercent = range > 0 ? Math.min(100, Math.round((currentInLevel / range) * 100)) : 100;

    return {
      level: currentLvl,
      levelName: cfg.levelName,
      minBmp: min,
      maxBmp: max,
      multiplier: cfg.multiplier,
      perks: cfg.perks,
      progressPercent
    };
  },

  /**
   * Helper: Generate unique referral code
   */
  generateReferralCode(userId: string): string {
    const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const prefix = cleanId.substring(0, 4);
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `BMP-${prefix.length >= 4 ? prefix : 'PI'}${random}`;
  },

  /**
   * GET OR INITIALIZE USER GAMIFICATION PROFILE
   */
  async getUserProfile(userId: string): Promise<UserGamificationProfile> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'user_gamification', userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as any;
      const walletBal = await bmpRewardsProvider.getBalance(userId);
      const lifetimeBmp = data.lifetimeBmp || walletBal || 0;
      const levelInfo = this.calculateLevel(lifetimeBmp);

      const profile: UserGamificationProfile = {
        userId,
        bmpBalance: walletBal,
        lifetimeBmp,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        streakCount: data.streakCount || 0,
        lastCheckInTime: data.lastCheckInTime || 0,
        lastCheckInDate: data.lastCheckInDate || '',
        referralCode: data.referralCode || this.generateReferralCode(userId),
        referredBy: data.referredBy || null,
        badges: data.badges || [],
        claimedMissions: data.claimedMissions || [],
        missionProgress: data.missionProgress || {},
        stats: {
          totalOrdersPlaced: data.stats?.totalOrdersPlaced || 0,
          totalSpentPi: data.stats?.totalSpentPi || 0,
          totalReviewsSubmitted: data.stats?.totalReviewsSubmitted || 0,
          totalProductsShared: data.stats?.totalProductsShared || 0,
          totalFriendsReferred: data.stats?.totalFriendsReferred || 0,
          totalSalesAsMerchant: data.stats?.totalSalesAsMerchant || 0,
          productsPublished: data.stats?.productsPublished || 0,
          accountCreatedTime: data.stats?.accountCreatedTime || Date.now()
        },
        updatedAt: new Date().toISOString()
      };

      // Check for auto-assigned badges
      this.evaluateBadges(profile);

      return profile;
    }

    // Initialize new profile
    const walletBal = await bmpRewardsProvider.getBalance(userId);
    const newReferralCode = this.generateReferralCode(userId);
    const newProfile: UserGamificationProfile = {
      userId,
      bmpBalance: walletBal,
      lifetimeBmp: walletBal,
      level: 1,
      levelName: 'Explorer',
      streakCount: 0,
      lastCheckInTime: 0,
      lastCheckInDate: '',
      referralCode: newReferralCode,
      referredBy: null,
      badges: [],
      claimedMissions: [],
      missionProgress: { daily_visit: 1 },
      stats: {
        totalOrdersPlaced: 0,
        totalSpentPi: 0,
        totalReviewsSubmitted: 0,
        totalProductsShared: 0,
        totalFriendsReferred: 0,
        totalSalesAsMerchant: 0,
        productsPublished: 0,
        accountCreatedTime: Date.now()
      },
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, {
      ...newProfile,
      updatedAt: serverTimestamp()
    });

    return newProfile;
  },

  /**
   * DAILY CHECK-IN (Strict 24h & Anti-Fraud Timestamp Validation)
   */
  async checkIn(userId: string): Promise<{
    newBalance: number;
    streakCount: number;
    bmpEarned: number;
    levelUp: boolean;
    newLevelName?: string;
    newBadges: string[];
  }> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'user_gamification', userId);

    let bmpEarned = 10; // Base daily reward
    let newStreak = 1;
    let levelUp = false;
    let newLevelName = '';
    const newBadges: string[] = [];

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const nowMs = Date.now();
      const todayStr = new Date().toISOString().split('T')[0];

      let lastCheckInTime = 0;
      let currentStreak = 0;
      let lifetimeBmp = 0;
      let existingBadges: string[] = [];
      let stats = {
        totalOrdersPlaced: 0,
        totalSpentPi: 0,
        totalReviewsSubmitted: 0,
        totalProductsShared: 0,
        totalFriendsReferred: 0,
        totalSalesAsMerchant: 0,
        productsPublished: 0,
        accountCreatedTime: Date.now()
      };

      if (snap.exists()) {
        const data = snap.data();
        lastCheckInTime = data.lastCheckInTime || 0;
        currentStreak = data.streakCount || 0;
        lifetimeBmp = data.lifetimeBmp || 0;
        existingBadges = data.badges || [];
        if (data.stats) stats = { ...stats, ...data.stats };

        // ANTI-FRAUD VERIFICATION
        const diffMs = nowMs - lastCheckInTime;
        const hoursPassed = diffMs / (1000 * 60 * 60);

        if (hoursPassed < 24) {
          const msRemaining = Math.ceil((24 * 60 * 60 * 1000) - diffMs);
          const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));
          const minsLeft = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
          throw new Error(`Daily check-in already claimed! Next check-in available in ${hoursLeft}h ${minsLeft}m.`);
        }

        // STREAK LOGIC
        if (hoursPassed <= 48) {
          newStreak = currentStreak + 1;
        } else {
          newStreak = 1; // Reset streak if missed 24h window
        }
      }

      // Calculate streak bonus
      let bonus = 0;
      if (newStreak === 3) bonus = 10;
      else if (newStreak === 7) bonus = 25;
      else if (newStreak === 15) bonus = 50;
      else if (newStreak === 30) bonus = 100;
      else if (newStreak === 60) bonus = 200;
      else if (newStreak === 100) bonus = 500;

      bmpEarned += bonus;

      // Check level progression
      const oldLevel = this.calculateLevel(lifetimeBmp).level;
      const newLifetime = lifetimeBmp + bmpEarned;
      const newLevelInfo = this.calculateLevel(newLifetime);

      if (newLevelInfo.level > oldLevel) {
        levelUp = true;
        newLevelName = newLevelInfo.levelName;
      }

      // Check streak badges
      if (newStreak >= 3 && !existingBadges.includes('daily_streak_3')) {
        existingBadges.push('daily_streak_3');
        newBadges.push('daily_streak_3');
      }
      if (newStreak >= 7 && !existingBadges.includes('daily_streak_7')) {
        existingBadges.push('daily_streak_7');
        newBadges.push('daily_streak_7');
      }
      if (newStreak >= 30 && !existingBadges.includes('daily_streak_30')) {
        existingBadges.push('daily_streak_30');
        newBadges.push('daily_streak_30');
      }

      // Save gamification state
      transaction.set(docRef, {
        userId,
        lifetimeBmp: newLifetime,
        level: newLevelInfo.level,
        levelName: newLevelInfo.levelName,
        streakCount: newStreak,
        lastCheckInTime: nowMs,
        lastCheckInDate: todayStr,
        badges: existingBadges,
        stats,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    // Credit BMP wallet transaction
    await bmpRewardsProvider.credit(
      userId, 
      bmpEarned, 
      'DAILY_REWARD', 
      `Daily Check-In Reward (Day ${newStreak})`
    );

    const newBalance = await bmpRewardsProvider.getBalance(userId);

    return {
      newBalance,
      streakCount: newStreak,
      bmpEarned,
      levelUp,
      newLevelName,
      newBadges
    };
  },

  /**
   * PROCESS VERIFIED MARKETPLACE PURCHASE REWARD
   */
  async processOrderReward(userId: string, businessId: string, orderId: string, grandTotalPi: number): Promise<number> {
    const db = getFirebaseDb();
    
    // Idempotency check in wallet_transactions
    const qTx = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      where('referenceId', '==', orderId),
      where('source', '==', 'MARKETPLACE_ORDER')
    );
    const snapTx = await getDocs(qTx);
    if (!snapTx.empty) return 0; // Already rewarded

    // 10 BMP per 1 Pi spent (Minimum 10 BMP)
    const baseReward = Math.max(10, Math.floor(grandTotalPi * 10));

    // Credit buyer wallet
    await bmpRewardsProvider.credit(
      userId,
      baseReward,
      'MARKETPLACE_ORDER',
      `Order #${orderId.slice(0, 8)} Purchase Reward`,
      orderId
    );

    // Update buyer stats & achievement milestones
    const profileRef = doc(db, 'user_gamification', userId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(profileRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const currentOrders = (data.stats?.totalOrdersPlaced || 0) + 1;
      const currentSpent = (data.stats?.totalSpentPi || 0) + grandTotalPi;
      const existingBadges = data.badges || [];

      let achievementBonus = 0;
      // Milestone rewards
      if (currentOrders === 1) achievementBonus += 50; // First Order
      if (currentOrders === 5) achievementBonus += 150;
      if (currentOrders === 10) achievementBonus += 300;
      if (currentOrders === 25) achievementBonus += 750;
      if (currentOrders === 50) achievementBonus += 1500;
      if (currentOrders === 100) achievementBonus += 3000;

      if (currentOrders >= 1 && !existingBadges.includes('verified_buyer')) {
        existingBadges.push('verified_buyer');
      }
      if (currentOrders >= 10 && !existingBadges.includes('top_buyer')) {
        existingBadges.push('top_buyer');
      }

      const totalEarned = baseReward + achievementBonus;
      const newLifetime = (data.lifetimeBmp || 0) + totalEarned;
      const levelInfo = this.calculateLevel(newLifetime);

      transaction.update(profileRef, {
        lifetimeBmp: newLifetime,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        badges: existingBadges,
        'stats.totalOrdersPlaced': currentOrders,
        'stats.totalSpentPi': currentSpent,
        'missionProgress.weekly_purchase': increment(1),
        updatedAt: serverTimestamp()
      });

      if (achievementBonus > 0) {
        await bmpRewardsProvider.credit(
          userId,
          achievementBonus,
          'CAMPAIGN',
          `Order Milestone Achievement Bonus (${currentOrders} Orders)`,
          orderId
        );
      }
    });

    // Check if user was referred and this is their 1st purchase -> trigger referral bonus!
    await this.verifyAndRewardReferral(userId);

    return baseReward;
  },

  /**
   * PROCESS VERIFIED PRODUCT REVIEW REWARD
   */
  async processReviewReward(userId: string, productId: string, orderId: string, reviewId: string): Promise<number> {
    const db = getFirebaseDb();

    // Idempotency check
    const qTx = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      where('referenceId', '==', reviewId)
    );
    const snapTx = await getDocs(qTx);
    if (!snapTx.empty) return 0;

    const rewardBmp = 25; // 25 BMP per verified review

    await bmpRewardsProvider.credit(
      userId,
      rewardBmp,
      'CAMPAIGN',
      `Verified Product Review Reward`,
      reviewId
    );

    const profileRef = doc(db, 'user_gamification', userId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(profileRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const newCount = (data.stats?.totalReviewsSubmitted || 0) + 1;
      const existingBadges = data.badges || [];

      if (newCount >= 5 && !existingBadges.includes('community_helper')) {
        existingBadges.push('community_helper');
      }

      const newLifetime = (data.lifetimeBmp || 0) + rewardBmp;
      const levelInfo = this.calculateLevel(newLifetime);

      transaction.update(profileRef, {
        lifetimeBmp: newLifetime,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        badges: existingBadges,
        'stats.totalReviewsSubmitted': newCount,
        'missionProgress.weekly_review': increment(1),
        updatedAt: serverTimestamp()
      });
    });

    return rewardBmp;
  },

  /**
   * REAL SOCIAL SHARING REWARD WITH ANTI-FRAUD
   */
  async processShareReward(userId: string, productId: string, platform: string): Promise<number> {
    const db = getFirebaseDb();
    const todayStr = new Date().toISOString().split('T')[0];

    // Anti-fraud: Rate limit - max 3 shares rewarded per day
    const sharesRef = collection(db, 'share_events');
    const qShares = query(
      sharesRef,
      where('userId', '==', userId),
      where('shareDate', '==', todayStr)
    );
    const snapShares = await getDocs(qShares);

    if (snapShares.size >= 3) {
      throw new Error('Daily share reward limit reached (3/3). Shares are logged, but daily BMP bonus is maxed out today.');
    }

    // Log verified share event
    const shareDocRef = doc(sharesRef);
    await setDoc(shareDocRef, {
      userId,
      productId,
      platform,
      shareDate: todayStr,
      createdAt: serverTimestamp()
    });

    const rewardBmp = 15;
    await bmpRewardsProvider.credit(
      userId,
      rewardBmp,
      'SHARE',
      `Product Share Reward (${platform})`,
      productId
    );

    const profileRef = doc(db, 'user_gamification', userId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(profileRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const newShares = (data.stats?.totalProductsShared || 0) + 1;
      const newLifetime = (data.lifetimeBmp || 0) + rewardBmp;
      const levelInfo = this.calculateLevel(newLifetime);

      transaction.update(profileRef, {
        lifetimeBmp: newLifetime,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        'stats.totalProductsShared': newShares,
        'missionProgress.daily_share': increment(1),
        updatedAt: serverTimestamp()
      });
    });

    return rewardBmp;
  },

  /**
   * REFERRAL PROGRAM: BIND REFERRAL CODE
   */
  async bindReferralCode(userId: string, referralCode: string): Promise<boolean> {
    const db = getFirebaseDb();
    const cleanCode = referralCode.trim().toUpperCase();

    // Query profile with this referral code
    const q = query(
      collection(db, 'user_gamification'),
      where('referralCode', '==', cleanCode),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error('Invalid referral code. Please check and try again.');
    }

    const referrerDoc = snap.docs[0];
    const referrerId = referrerDoc.id;

    // ANTI-FRAUD SELF REFERRAL GUARD
    if (referrerId === userId) {
      throw new Error('Self-referrals are strictly prohibited.');
    }

    const userProfileRef = doc(db, 'user_gamification', userId);
    const userSnap = await getDoc(userProfileRef);

    if (userSnap.exists() && userSnap.data().referredBy) {
      throw new Error('Referral code has already been applied to this account.');
    }

    await setDoc(userProfileRef, {
      userId,
      referredBy: referrerId,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  },

  /**
   * REFERRAL PROGRAM: VERIFY AND REWARD (Triggered on 1st verified purchase)
   */
  async verifyAndRewardReferral(referredUserId: string): Promise<boolean> {
    const db = getFirebaseDb();
    const profileRef = doc(db, 'user_gamification', referredUserId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) return false;
    const data = profileSnap.data();
    const referrerId = data.referredBy;

    if (!referrerId) return false;

    // Check if referral reward was already granted for this referred user
    const qTx = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', referrerId),
      where('referenceId', '==', `REF_${referredUserId}`)
    );
    const snapTx = await getDocs(qTx);
    if (!snapTx.empty) return false; // Already rewarded

    // Reward Referrer (+100 BMP)
    const referrerReward = 100;
    await bmpRewardsProvider.credit(
      referrerId,
      referrerReward,
      'REFERRAL',
      `Friend Referral Bonus`,
      `REF_${referredUserId}`
    );

    // Reward Referred Friend (+25 BMP Welcome Bonus)
    const friendReward = 25;
    await bmpRewardsProvider.credit(
      referredUserId,
      friendReward,
      'REFERRAL',
      `Referral Welcome Bonus`,
      `WELCOME_${referredUserId}`
    );

    // Update Referrer stats & badges
    const referrerRef = doc(db, 'user_gamification', referrerId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(referrerRef);
      if (!snap.exists()) return;

      const rData = snap.data();
      const newRefers = (rData.stats?.totalFriendsReferred || 0) + 1;
      const existingBadges = rData.badges || [];

      if (newRefers >= 3 && !existingBadges.includes('referral_master')) {
        existingBadges.push('referral_master');
      }

      const newLifetime = (rData.lifetimeBmp || 0) + referrerReward;
      const levelInfo = this.calculateLevel(newLifetime);

      transaction.update(referrerRef, {
        lifetimeBmp: newLifetime,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        badges: existingBadges,
        'stats.totalFriendsReferred': newRefers,
        'missionProgress.weekly_refer': increment(1),
        updatedAt: serverTimestamp()
      });
    });

    return true;
  },

  /**
   * CLAIM MISSION REWARD
   */
  async claimMissionReward(userId: string, missionId: string): Promise<number> {
    const db = getFirebaseDb();
    const mission = MISSIONS_LIST.find(m => m.id === missionId);
    if (!mission) throw new Error('Invalid mission');

    const profileRef = doc(db, 'user_gamification', userId);
    let rewardBmp = mission.rewardBmp;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(profileRef);
      if (!snap.exists()) throw new Error('Profile not found');

      const data = snap.data();
      const claimedMissions = data.claimedMissions || [];

      if (claimedMissions.includes(missionId)) {
        throw new Error('Mission reward already claimed!');
      }

      const progress = data.missionProgress?.[missionId] || 0;
      if (progress < mission.targetCount) {
        throw new Error(`Mission requirements not completed (${progress}/${mission.targetCount})`);
      }

      claimedMissions.push(missionId);
      const newLifetime = (data.lifetimeBmp || 0) + rewardBmp;
      const levelInfo = this.calculateLevel(newLifetime);

      transaction.update(profileRef, {
        lifetimeBmp: newLifetime,
        level: levelInfo.level,
        levelName: levelInfo.levelName,
        claimedMissions,
        updatedAt: serverTimestamp()
      });
    });

    await bmpRewardsProvider.credit(
      userId,
      rewardBmp,
      'CAMPAIGN',
      `Completed Mission: ${mission.title}`,
      missionId
    );

    return rewardBmp;
  },

  /**
   * TRACK ACTIVITY PROGRESS FOR MISSIONS
   */
  async trackActivity(userId: string, activityType: 'view' | 'wishlist' | 'share' | 'profile'): Promise<void> {
    const db = getFirebaseDb();
    const profileRef = doc(db, 'user_gamification', userId);

    const missionMap: Record<string, string> = {
      view: 'daily_view_products',
      wishlist: 'daily_wishlist',
      share: 'daily_share',
      profile: 'daily_visit'
    };

    const targetMissionId = missionMap[activityType];
    if (!targetMissionId) return;

    try {
      await updateDoc(profileRef, {
        [`missionProgress.${targetMissionId}`]: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      // Profile might not exist yet
    }
  },

  /**
   * EVALUATE BADGES
   */
  evaluateBadges(profile: UserGamificationProfile): string[] {
    const currentBadges = new Set(profile.badges || []);
    const stats = profile.stats;

    if (stats.totalOrdersPlaced >= 1) currentBadges.add('verified_buyer');
    if (stats.totalOrdersPlaced >= 10) currentBadges.add('top_buyer');
    if (stats.totalSalesAsMerchant >= 1) currentBadges.add('verified_seller');
    if (stats.totalSalesAsMerchant >= 25) currentBadges.add('top_seller');
    if (stats.totalSalesAsMerchant >= 50) currentBadges.add('premium_merchant');
    if (stats.totalReviewsSubmitted >= 5) currentBadges.add('community_helper');
    if (stats.totalFriendsReferred >= 3) currentBadges.add('referral_master');
    if (profile.streakCount >= 3) currentBadges.add('daily_streak_3');
    if (profile.streakCount >= 7) currentBadges.add('daily_streak_7');
    if (profile.streakCount >= 30) currentBadges.add('daily_streak_30');

    // Marketplace Veteran: >30 days account age
    const ageDays = (Date.now() - (stats.accountCreatedTime || Date.now())) / (1000 * 60 * 60 * 24);
    if (ageDays >= 30) currentBadges.add('veteran');

    profile.badges = Array.from(currentBadges);
    return profile.badges;
  },

  /**
   * FETCH LEADERBOARD
   */
  async getLeaderboard(category: 'buyers' | 'sellers' | 'referrers' | 'reviewers' | 'streaks'): Promise<LeaderboardEntry[]> {
    const db = getFirebaseDb();

    let fieldPath = 'lifetimeBmp';
    if (category === 'buyers') fieldPath = 'stats.totalOrdersPlaced';
    if (category === 'sellers') fieldPath = 'stats.totalSalesAsMerchant';
    if (category === 'referrers') fieldPath = 'stats.totalFriendsReferred';
    if (category === 'reviewers') fieldPath = 'stats.totalReviewsSubmitted';
    if (category === 'streaks') fieldPath = 'streakCount';

    try {
      const q = query(
        collection(db, 'user_gamification'),
        orderBy(fieldPath, 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return this.getFallbackLeaderboard(category);
      }

      return snap.docs.map((docSnap, index) => {
        const data = docSnap.data();
        let score = 0;
        if (category === 'buyers') score = data.stats?.totalOrdersPlaced || 0;
        else if (category === 'sellers') score = data.stats?.totalSalesAsMerchant || 0;
        else if (category === 'referrers') score = data.stats?.totalFriendsReferred || 0;
        else if (category === 'reviewers') score = data.stats?.totalReviewsSubmitted || 0;
        else if (category === 'streaks') score = data.streakCount || 0;

        return {
          userId: docSnap.id,
          displayName: `User_${docSnap.id.substring(0, 6)}`,
          level: data.level || 1,
          levelName: data.levelName || 'Explorer',
          score,
          badgesCount: (data.badges || []).length,
          streakCount: data.streakCount || 0,
          rank: index + 1
        };
      });
    } catch (err) {
      return this.getFallbackLeaderboard(category);
    }
  },

  getFallbackLeaderboard(category: string): LeaderboardEntry[] {
    return [
      { userId: 'USR-001', displayName: 'PiPioneer_Alpha', level: 5, levelName: 'Business Leader', score: 142, badgesCount: 8, streakCount: 45, rank: 1 },
      { userId: 'USR-002', displayName: 'GlobalTrader_Pro', level: 4, levelName: 'Professional', score: 98, badgesCount: 6, streakCount: 28, rank: 2 },
      { userId: 'USR-003', displayName: 'EmpowerMerchant', level: 4, levelName: 'Professional', score: 76, badgesCount: 5, streakCount: 19, rank: 3 },
      { userId: 'USR-004', displayName: 'Satoshi_Store', level: 3, levelName: 'Merchant', score: 51, badgesCount: 4, streakCount: 14, rank: 4 },
      { userId: 'USR-005', displayName: 'Pi_Champion_99', level: 3, levelName: 'Merchant', score: 38, badgesCount: 3, streakCount: 11, rank: 5 },
    ];
  }
};
