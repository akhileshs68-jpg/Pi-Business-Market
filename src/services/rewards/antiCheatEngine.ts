/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

export interface AntiCheatTelemetry {
  deviceId?: string;
  fingerprint?: string;
  userAgent?: string;
  isVpn?: boolean;
  ipAddress?: string;
  timezone?: string;
  locale?: string;
}

export interface AntiCheatAuditLog {
  logId: string;
  userId: string;
  action: string;
  reason: string;
  telemetry: AntiCheatTelemetry;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: any;
}

export class AntiCheatEngine {
  /**
   * Validate Daily Check-In Rate Limits & Time Validation
   */
  public async validateDailyCheckIn(userId: string, telemetry: AntiCheatTelemetry = {}): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'user_gamification', userId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return;

    const data = snap.data();
    const lastCheckInTime = data.lastCheckInTime || 0;
    const nowMs = Date.now();
    const diffMs = nowMs - lastCheckInTime;
    const hoursPassed = diffMs / (1000 * 60 * 60);

    // Strict 24 Hour Lock
    if (hoursPassed < 24) {
      const msRemaining = Math.ceil((24 * 60 * 60 * 1000) - diffMs);
      const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));
      const minsLeft = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      await this.logViolation(userId, 'DAILY_CHECKIN', `Re-entry attempt too early. ${hoursLeft}h ${minsLeft}m remaining.`, telemetry, 'WARNING');
      throw new Error(`Daily check-in already claimed! Next check-in available in ${hoursLeft}h ${minsLeft}m.`);
    }

    // Check device / fingerprint sharing (prevent same device checking in multiple accounts)
    if (telemetry.fingerprint) {
      const q = query(
        collection(db, 'user_gamification'),
        where('lastFingerprint', '==', telemetry.fingerprint)
      );
      const docsSnap = await getDocs(q);
      
      // Let's check how many accounts checked in within last 24h on this device
      let recentDeviceUsers = 0;
      docsSnap.forEach(d => {
        const data = d.data();
        if (data && data.userId !== userId) {
          const lastTime = data.lastCheckInTime || 0;
          if (nowMs - lastTime < 24 * 60 * 60 * 1000) {
            recentDeviceUsers++;
          }
        }
      });

      if (recentDeviceUsers >= 2) {
        await this.logViolation(userId, 'DAILY_CHECKIN', 'Device abuse: Multiple account check-ins from same device footprint.', telemetry, 'CRITICAL');
        throw new Error('Device validation failed. Multiple accounts cannot claim rewards from the same device within 24 hours.');
      }
    }
  }

  /**
   * Validate Social Sharing Rate Limits
   */
  public async validateSocialShare(userId: string, telemetry: AntiCheatTelemetry = {}): Promise<void> {
    const db = getFirebaseDb();
    const todayStr = new Date().toISOString().split('T')[0];

    // VPN or Bot check
    if (telemetry.isVpn || telemetry.userAgent?.toLowerCase().includes('bot') || telemetry.userAgent?.toLowerCase().includes('headless')) {
      await this.logViolation(userId, 'SOCIAL_SHARE_BOT_VPN', 'Suspicious request flagged: Bot or VPN environment.', telemetry, 'CRITICAL');
      throw new Error('Security policy violation: Anonymous proxies, VPNs, or automated bots are prohibited from earning rewards.');
    }

    const sharesRef = collection(db, 'share_events');
    const qShares = query(
      sharesRef,
      where('userId', '==', userId),
      where('shareDate', '==', todayStr)
    );
    const snapShares = await getDocs(qShares);

    // Limit sharing to 3 per day
    if (snapShares.size >= 3) {
      await this.logViolation(userId, 'SOCIAL_SHARE', 'Daily share reward limit exceeded (3/3).', telemetry, 'INFO');
      throw new Error('Daily share reward limit reached (3/3). Shares are logged, but daily BMP bonus is maxed out today.');
    }
  }

  /**
   * Validate Share Click for Anti-Cheat
   */
  public async validateShareClick(userId: string, visitorId: string, telemetry: AntiCheatTelemetry = {}): Promise<void> {
    const db = getFirebaseDb();

    // 1. Prevent self-rewards
    if (userId === visitorId) {
      await this.logViolation(userId, 'SHARE_CLICK_SELF', 'Attempted to earn engagement reward on self-click.', telemetry, 'WARNING');
      throw new Error('Self-clicks cannot earn rewards.');
    }

    // 2. Headless/bot detection & VPN detection
    if (telemetry.isVpn || telemetry.userAgent?.toLowerCase().includes('bot') || telemetry.userAgent?.toLowerCase().includes('headless')) {
      await this.logViolation(userId, 'SHARE_CLICK_BOT_VPN', 'Click came from automated bot or VPN/proxy.', telemetry, 'CRITICAL');
      throw new Error('Security policy: Automation bots/VPNs are prohibited.');
    }

    // 3. Multi-account device abuse: Check if this visitor has clicked links of different referrers within 24 hours on the same fingerprint
    if (telemetry.fingerprint) {
      const qFingerprint = query(
        collection(db, 'share_clicks'),
        where('fingerprint', '==', telemetry.fingerprint),
        where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      );
      const snapFingerprint = await getDocs(qFingerprint);
      
      const distinctReferrers = new Set<string>();
      snapFingerprint.forEach(doc => {
        const d = doc.data();
        if (d.referrerUserId) distinctReferrers.add(d.referrerUserId);
      });

      if (distinctReferrers.size >= 3) {
        await this.logViolation(userId, 'SHARE_DEVICE_FARMING', `Fingerprint clicked ${distinctReferrers.size} distinct referrers in 24h. Flagged as reward farming.`, telemetry, 'CRITICAL');
        throw new Error('Device flagged for suspicious activity (referral farming).');
      }
    }
  }

  /**
   * Validate Product/Service Reviews (Verify purchase + Rate limiting)
   */
  public async validateReview(userId: string, productId: string, orderId: string, telemetry: AntiCheatTelemetry = {}): Promise<void> {
    const db = getFirebaseDb();

    // 1. Order ownership & verified delivery check
    if (!orderId) {
      await this.logViolation(userId, 'REVIEW_REWARD', 'Attempted review reward without order ID', telemetry, 'WARNING');
      throw new Error('Verification failed. Reviews must be attached to a verified purchase order.');
    }

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      await this.logViolation(userId, 'REVIEW_REWARD', `Order ${orderId} does not exist`, telemetry, 'CRITICAL');
      throw new Error('Verification failed. Associated order was not found.');
    }

    const orderData = orderSnap.data();
    const orderBuyer = orderData.buyerId || orderData.userUid;

    if (orderBuyer !== userId) {
      await this.logViolation(userId, 'REVIEW_REWARD', `User is not the buyer of order ${orderId}`, telemetry, 'CRITICAL');
      throw new Error('Verification failed. You must be the verified buyer of this product to earn rewards.');
    }

    // Check if order is completed / delivered
    const status = (orderData.orderStatus || orderData.currentStatus || '').toLowerCase();
    if (!['completed', 'delivered', 'escrow_released', 'shipped'].includes(status)) {
      await this.logViolation(userId, 'REVIEW_REWARD', `Attempted review reward on incomplete order status: ${status}`, telemetry, 'WARNING');
      throw new Error('Verification failed. You can only review products from delivered or completed orders.');
    }

    // 2. Daily Limit check (max 5 review rewards per day)
    const todayStr = new Date().toISOString().split('T')[0];
    const qTx = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      where('source', '==', 'CAMPAIGN'),
      where('createdAt', '>=', new Date(todayStr))
    );
    const txSnap = await getDocs(qTx);
    let reviewCount = 0;
    txSnap.forEach(doc => {
      if (doc.data().description?.toLowerCase().includes('review')) {
        reviewCount++;
      }
    });

    if (reviewCount >= 5) {
      await this.logViolation(userId, 'REVIEW_REWARD', 'Review rewards cap of 5 reached for today.', telemetry, 'INFO');
      throw new Error('Daily verified review reward limit reached (5/5). Review submitted successfully, but BMP bonus is maxed out today.');
    }
  }

  /**
   * Validate Referral Authenticity (Self-referral prevention & device duplication check)
   */
  public async validateReferral(userId: string, referrerId: string, telemetry: AntiCheatTelemetry = {}): Promise<void> {
    const db = getFirebaseDb();

    if (userId === referrerId) {
      await this.logViolation(userId, 'REFERRAL_BIND', 'Self-referral attempt detected.', telemetry, 'CRITICAL');
      throw new Error('Self-referrals are strictly prohibited.');
    }

    // Check if referrer exists
    const rRef = doc(db, 'user_gamification', referrerId);
    const rSnap = await getDoc(rRef);
    if (!rSnap.exists()) {
      await this.logViolation(userId, 'REFERRAL_BIND', `Referrer ${referrerId} does not exist.`, telemetry, 'WARNING');
      throw new Error('Invalid referral code.');
    }

    // Check device / fingerprint overlap (same device for referrer and referred friend is highly suspicious)
    if (telemetry.fingerprint) {
      const referrerFingerprint = rSnap.data().lastFingerprint;
      if (referrerFingerprint === telemetry.fingerprint) {
        await this.logViolation(userId, 'REFERRAL_BIND', `Device fingerprint matches referrer ${referrerId} (Device abuse).`, telemetry, 'CRITICAL');
        throw new Error('Device validation failed. Creating multiple accounts on the same device to farm referral rewards is prohibited.');
      }
    }
  }

  /**
   * Log Violation to Firestore Audit Logs
   */
  public async logViolation(
    userId: string,
    action: string,
    reason: string,
    telemetry: AntiCheatTelemetry = {},
    severity: AntiCheatAuditLog['severity'] = 'INFO'
  ): Promise<void> {
    const db = getFirebaseDb();
    const logId = `aclog_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const log: AntiCheatAuditLog = {
      logId,
      userId,
      action,
      reason,
      telemetry,
      severity,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'anti_cheat_audit_logs', logId), log);
      console.warn(`[AntiCheatEngine] Logged ${severity} violation for User ${userId}: ${reason}`);
    } catch (err) {
      console.error('[AntiCheatEngine] Failed to write audit log:', err);
    }
  }
}

export const antiCheatEngine = new AntiCheatEngine();
