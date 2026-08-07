import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  runTransaction,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { notificationService } from './notificationService';

export interface BmpWallet {
  userId: string;
  bmpBalance: number;
  lifetimeBmp: number;
  stakedBmp: number;
  walletAddress: string;
  dailyRewardStreak: number;
  lastDailyRewardAt?: string;
  referralCode: string;
  referredBy?: string;
  referralsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BmpTxType = 'CREDIT' | 'DEBIT';
export type BmpTxCategory = 
  | 'TRANSFER'
  | 'PURCHASE'
  | 'CASHBACK'
  | 'DAILY_REWARD'
  | 'REFERRAL'
  | 'MERCHANT_REWARD'
  | 'MINT'
  | 'BURN';

export interface BmpLedgerEntry {
  id: string;
  txId: string;
  userId: string;
  amount: number;
  type: BmpTxType;
  category: BmpTxCategory;
  description: string;
  balanceAfter: number;
  counterpartyId?: string;
  orderId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BmpSupplyMetrics {
  totalSupply: number;
  circulatingSupply: number;
  rewardsPool: number;
  totalHoldersCount: number;
  totalMinted: number;
  totalBurned: number;
  topHolders: { userId: string; walletAddress: string; balance: number }[];
}

export const bmpTokenService = {
  /**
   * Helper to format a BMP wallet address from userId
   */
  generateWalletAddress(userId: string): string {
    const clean = userId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const hashHex = Array.from(clean).reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '').slice(0, 32);
    return `bmp1${hashHex.padEnd(32, '0')}`;
  },

  /**
   * Get or initialize a user's BMP wallet
   */
  async getWallet(userId: string): Promise<BmpWallet> {
    const db = getFirebaseDb();
    const walletRef = doc(db, 'bmp_wallets', userId);
    const snap = await getDoc(walletRef);

    if (snap.exists()) {
      return snap.data() as BmpWallet;
    }

    const nowIso = new Date().toISOString();
    const walletAddress = this.generateWalletAddress(userId);
    const refCode = `BMP-${userId.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newWallet: BmpWallet = {
      userId,
      bmpBalance: 100.0, // Welcome bonus of 100 BMP
      lifetimeBmp: 100.0,
      stakedBmp: 0,
      walletAddress,
      dailyRewardStreak: 0,
      referralCode: refCode,
      referralsCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(walletRef, newWallet);

    // Initial Ledger Entry for Welcome Bonus
    const txId = `tx_welcome_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const ledgerRef = doc(db, 'bmp_ledger', txId);
    await setDoc(ledgerRef, {
      id: txId,
      txId,
      userId,
      amount: 100.0,
      type: 'CREDIT',
      category: 'DAILY_REWARD',
      description: 'Welcome Pioneer Bonus Granted',
      balanceAfter: 100.0,
      timestamp: nowIso
    });

    return newWallet;
  },

  /**
   * Real-time live listener for a user's BMP Wallet
   */
  subscribeWallet(userId: string, callback: (wallet: BmpWallet | null) => void) {
    const db = getFirebaseDb();
    const ref = doc(db, 'bmp_wallets', userId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as BmpWallet);
      } else {
        // Auto-initialize if snap missing
        this.getWallet(userId).then(w => callback(w)).catch(() => callback(null));
      }
    }, (err) => {
      console.warn('[bmpTokenService] subscribeWallet error:', err);
      callback(null);
    });
  },

  /**
   * Real-time live listener for a user's BMP Ledger history
   */
  subscribeLedger(userId: string, callback: (entries: BmpLedgerEntry[]) => void) {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'bmp_ledger'),
      where('userId', '==', userId),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as BmpLedgerEntry[];
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(entries);
    }, (err) => {
      console.warn('[bmpTokenService] subscribeLedger error:', err);
      callback([]);
    });
  },

  /**
   * Atomic Transfer BMP Tokens between users with double-spend protection
   */
  async transferBmp(params: {
    senderId: string;
    recipientIdentifier?: string;
    recipientAddressOrUid?: string;
    amount: number;
    note?: string;
  }): Promise<{ success: boolean; txId: string; remainingBalance: number }> {
    const db = getFirebaseDb();
    const amount = Number(params.amount);
    if (!amount || amount <= 0) throw new Error('Transfer amount must be greater than 0 BMP');

    // 1. Resolve Recipient User ID
    const rawTarget = params.recipientIdentifier || params.recipientAddressOrUid || '';
    let recipientUid = rawTarget.trim();
    if (recipientUid.startsWith('bmp1')) {
      const q = query(collection(db, 'bmp_wallets'), where('walletAddress', '==', recipientUid));
      const snap = await getDocs(q);
      if (!snap.empty) recipientUid = snap.docs[0].id;
    } else if (recipientUid.includes('@')) {
      const q = query(collection(db, 'users'), where('email', '==', recipientUid.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) recipientUid = snap.docs[0].id;
    }

    if (!recipientUid || recipientUid === params.senderId) {
      throw new Error('Invalid recipient or cannot transfer BMP to yourself.');
    }

    // Ensure recipient wallet initialized
    await this.getWallet(recipientUid);

    const nowIso = new Date().toISOString();
    const txId = `tx_transfer_${Date.now()}_${Math.floor(Math.random()*10000)}`;

    // 2. Atomic Transaction Execution
    let senderRemaining = 0;
    await runTransaction(db, async (tx) => {
      const senderRef = doc(db, 'bmp_wallets', params.senderId);
      const recipientRef = doc(db, 'bmp_wallets', recipientUid);

      const senderSnap = await tx.get(senderRef);
      const recipientSnap = await tx.get(recipientRef);

      if (!senderSnap.exists()) throw new Error('Sender wallet not found');
      if (!recipientSnap.exists()) throw new Error('Recipient wallet not found');

      const senderData = senderSnap.data() as BmpWallet;
      const recipientData = recipientSnap.data() as BmpWallet;

      if (senderData.bmpBalance < amount) {
        throw new Error(`Insufficient BMP Balance. Available: ${senderData.bmpBalance.toFixed(2)} BMP, Required: ${amount} BMP`);
      }

      const newSenderBal = senderData.bmpBalance - amount;
      const newRecipientBal = recipientData.bmpBalance + amount;
      senderRemaining = newSenderBal;

      tx.update(senderRef, {
        bmpBalance: newSenderBal,
        updatedAt: nowIso
      });

      tx.update(recipientRef, {
        bmpBalance: newRecipientBal,
        lifetimeBmp: recipientData.lifetimeBmp + amount,
        updatedAt: nowIso
      });

      // Debit ledger entry for Sender
      const senderLedgerRef = doc(db, 'bmp_ledger', `${txId}_send`);
      tx.set(senderLedgerRef, {
        id: `${txId}_send`,
        txId,
        userId: params.senderId,
        amount,
        type: 'DEBIT',
        category: 'TRANSFER',
        description: `Sent ${amount} BMP to ${recipientData.walletAddress.slice(0, 8)}... (${params.note || 'Peer Transfer'})`,
        balanceAfter: newSenderBal,
        counterpartyId: recipientUid,
        timestamp: nowIso
      });

      // Credit ledger entry for Recipient
      const recipientLedgerRef = doc(db, 'bmp_ledger', `${txId}_recv`);
      tx.set(recipientLedgerRef, {
        id: `${txId}_recv`,
        txId,
        userId: recipientUid,
        amount,
        type: 'CREDIT',
        category: 'TRANSFER',
        description: `Received ${amount} BMP from ${senderData.walletAddress.slice(0, 8)}... (${params.note || 'Peer Transfer'})`,
        balanceAfter: newRecipientBal,
        counterpartyId: params.senderId,
        timestamp: nowIso
      });
    });

    // Notify Recipient
    try {
      await notificationService.notify(
        recipientUid,
        'loyalty_reward',
        'BMP Tokens Received!',
        `You received ${amount} BMP from ${params.senderId.slice(0, 8)}...`,
        { linkTo: '/wallet' }
      );
    } catch (e) {
      console.warn('Failed to notify recipient:', e);
    }

    return { success: true, txId, remainingBalance: senderRemaining };
  },

  /**
   * Claim Daily Check-In BMP Bonus
   */
  async claimDailyReward(userId: string): Promise<{ bonusAmount: number; streak: number; newBalance: number }> {
    const db = getFirebaseDb();
    const wallet = await this.getWallet(userId);

    const now = new Date();
    if (wallet.lastDailyRewardAt) {
      const lastClaim = new Date(wallet.lastDailyRewardAt);
      const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        const remainingHours = Math.ceil(24 - diffHours);
        throw new Error(`Daily reward already claimed. Please wait ${remainingHours} hours for next check-in.`);
      }
    }

    // Calculate Streak & Bonus
    let streak = wallet.dailyRewardStreak || 0;
    if (wallet.lastDailyRewardAt) {
      const lastClaim = new Date(wallet.lastDailyRewardAt);
      const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      streak = diffHours < 48 ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    const baseReward = 10.0;
    const bonusMultiplier = Math.min(streak, 7);
    const rewardAmount = baseReward + (bonusMultiplier * 2.0); // e.g. Day 1: 12 BMP, Day 7: 24 BMP

    const nowIso = now.toISOString();
    const txId = `tx_daily_${Date.now()}`;

    let newBalance = 0;
    await runTransaction(db, async (tx) => {
      const wRef = doc(db, 'bmp_wallets', userId);
      const wSnap = await tx.get(wRef);
      if (!wSnap.exists()) throw new Error('Wallet missing');
      const wData = wSnap.data() as BmpWallet;

      newBalance = wData.bmpBalance + rewardAmount;
      tx.update(wRef, {
        bmpBalance: newBalance,
        lifetimeBmp: wData.lifetimeBmp + rewardAmount,
        dailyRewardStreak: streak,
        lastDailyRewardAt: nowIso,
        updatedAt: nowIso
      });

      const lRef = doc(db, 'bmp_ledger', txId);
      tx.set(lRef, {
        id: txId,
        txId,
        userId,
        amount: rewardAmount,
        type: 'CREDIT',
        category: 'DAILY_REWARD',
        description: `Daily Check-In Bonus (Streak: ${streak} Days)`,
        balanceAfter: newBalance,
        timestamp: nowIso
      });
    });

    return { bonusAmount: rewardAmount, streak, newBalance };
  },

  /**
   * Claim Referral Code Bonus (+100 BMP for referrer and referred)
   */
  async claimReferralReward(userId: string, code: string): Promise<{ rewardAmount: number }> {
    const db = getFirebaseDb();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error('Please enter a valid referral code');

    const wallet = await this.getWallet(userId);
    if (wallet.referredBy) throw new Error('You have already claimed a referral bonus');

    // Find referrer wallet
    const q = query(collection(db, 'bmp_wallets'), where('referralCode', '==', cleanCode));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Referral code not found');

    const referrerWallet = snap.docs[0].data() as BmpWallet;
    if (referrerWallet.userId === userId) throw new Error('You cannot use your own referral code');

    const bonus = 100.0;
    const nowIso = new Date().toISOString();
    const txId = `tx_ref_${Date.now()}`;

    await runTransaction(db, async (tx) => {
      const myRef = doc(db, 'bmp_wallets', userId);
      const referrerRef = doc(db, 'bmp_wallets', referrerWallet.userId);

      const mySnap = await tx.get(myRef);
      const refSnap = await tx.get(referrerRef);

      const myData = mySnap.data() as BmpWallet;
      const refData = refSnap.data() as BmpWallet;

      const myNewBal = myData.bmpBalance + bonus;
      const refNewBal = refData.bmpBalance + bonus;

      tx.update(myRef, {
        bmpBalance: myNewBal,
        lifetimeBmp: myData.lifetimeBmp + bonus,
        referredBy: referrerWallet.userId,
        updatedAt: nowIso
      });

      tx.update(referrerRef, {
        bmpBalance: refNewBal,
        lifetimeBmp: refData.lifetimeBmp + bonus,
        referralsCount: (refData.referralsCount || 0) + 1,
        updatedAt: nowIso
      });

      // Ledger entries
      tx.set(doc(db, 'bmp_ledger', `${txId}_user`), {
        id: `${txId}_user`,
        txId,
        userId,
        amount: bonus,
        type: 'CREDIT',
        category: 'REFERRAL',
        description: `Referral Signup Bonus from Pioneer ${refData.referralCode}`,
        balanceAfter: myNewBal,
        timestamp: nowIso
      });

      tx.set(doc(db, 'bmp_ledger', `${txId}_ref`), {
        id: `${txId}_ref`,
        txId,
        userId: referrerWallet.userId,
        amount: bonus,
        type: 'CREDIT',
        category: 'REFERRAL',
        description: `Referral Reward for inviting Pioneer ${userId.slice(0, 8)}...`,
        balanceAfter: refNewBal,
        timestamp: nowIso
      });
    });

    return { rewardAmount: bonus };
  },

  /**
   * Award Cashback on Marketplace Pi purchase
   */
  async awardCashback(userId: string, orderId: string, piSpent: number): Promise<number> {
    if (!userId || !piSpent || piSpent <= 0) return 0;
    const db = getFirebaseDb();
    
    // 10 BMP earned per 1 Pi spent
    const bmpAmount = Math.round(piSpent * 10.0 * 100) / 100;
    if (bmpAmount <= 0) return 0;

    const nowIso = new Date().toISOString();
    const txId = `tx_cashback_${orderId}_${Date.now()}`;

    try {
      await runTransaction(db, async (tx) => {
        const wRef = doc(db, 'bmp_wallets', userId);
        const snap = await tx.get(wRef);
        
        let curBal = 0;
        let curLife = 0;
        if (snap.exists()) {
          const d = snap.data() as BmpWallet;
          curBal = d.bmpBalance || 0;
          curLife = d.lifetimeBmp || 0;
        }

        const newBal = curBal + bmpAmount;
        tx.set(wRef, {
          userId,
          bmpBalance: newBal,
          lifetimeBmp: curLife + bmpAmount,
          updatedAt: nowIso
        }, { merge: true });

        const lRef = doc(db, 'bmp_ledger', txId);
        tx.set(lRef, {
          id: txId,
          txId,
          userId,
          amount: bmpAmount,
          type: 'CREDIT',
          category: 'CASHBACK',
          description: `Cashback Reward for Order #${orderId.slice(-6)} (${piSpent.toFixed(2)} Pi)`,
          balanceAfter: newBal,
          orderId,
          timestamp: nowIso
        });
      });

      return bmpAmount;
    } catch (e) {
      console.warn('Failed to award cashback:', e);
      return 0;
    }
  },

  /**
   * Complete purchase paying 100% using BMP tokens
   */
  async payWithBmp(params: {
    buyerId: string;
    sellerId: string;
    amountBmp: number;
    orderId: string;
    note?: string;
  }): Promise<{ success: boolean; txId: string }> {
    const db = getFirebaseDb();
    const amount = Number(params.amountBmp);
    if (amount <= 0) throw new Error('Invalid BMP payment amount');

    await this.getWallet(params.buyerId);
    if (params.sellerId) await this.getWallet(params.sellerId);

    const nowIso = new Date().toISOString();
    const txId = `tx_pay_${params.orderId}_${Date.now()}`;

    await runTransaction(db, async (tx) => {
      const buyerRef = doc(db, 'bmp_wallets', params.buyerId);
      const sellerRef = params.sellerId ? doc(db, 'bmp_wallets', params.sellerId) : null;

      // Execute ALL READS first
      const buyerSnap = await tx.get(buyerRef);
      if (!buyerSnap.exists()) throw new Error('Buyer BMP Wallet not found');
      const sellerSnap = sellerRef ? await tx.get(sellerRef) : null;

      const buyerData = buyerSnap.data() as BmpWallet;
      if (buyerData.bmpBalance < amount) {
        throw new Error(`Insufficient BMP Token Balance. Required: ${amount} BMP, Available: ${buyerData.bmpBalance.toFixed(2)} BMP`);
      }

      // Execute ALL WRITES second
      const newBuyerBal = buyerData.bmpBalance - amount;
      tx.update(buyerRef, {
        bmpBalance: newBuyerBal,
        updatedAt: nowIso
      });

      // Debit ledger entry
      const bLedgerRef = doc(db, 'bmp_ledger', `${txId}_buyer`);
      tx.set(bLedgerRef, {
        id: `${txId}_buyer`,
        txId,
        userId: params.buyerId,
        amount,
        type: 'DEBIT',
        category: 'PURCHASE',
        description: `Purchased item(s) for Order #${params.orderId.slice(-6)} using BMP Tokens`,
        balanceAfter: newBuyerBal,
        orderId: params.orderId,
        counterpartyId: params.sellerId,
        timestamp: nowIso
      });

      // Credit Merchant if sellerId exists and seller wallet exists
      if (sellerSnap && sellerSnap.exists()) {
        const sellerData = sellerSnap.data() as BmpWallet;
        const newSellerBal = sellerData.bmpBalance + amount;
        tx.update(sellerRef!, {
          bmpBalance: newSellerBal,
          lifetimeBmp: sellerData.lifetimeBmp + amount,
          updatedAt: nowIso
        });

        tx.set(doc(db, 'bmp_ledger', `${txId}_seller`), {
          id: `${txId}_seller`,
          txId,
          userId: params.sellerId,
          amount,
          type: 'CREDIT',
          category: 'PURCHASE',
          description: `Payment received in BMP Tokens for Order #${params.orderId.slice(-6)}`,
          balanceAfter: newSellerBal,
          orderId: params.orderId,
          counterpartyId: params.buyerId,
          timestamp: nowIso
        });
      }
    });

    return { success: true, txId };
  },

  /**
   * Admin Mint BMP Tokens
   */
  async adminMintBmp(params: {
    adminId: string;
    targetUserId: string;
    amount: number;
    reason: string;
  }): Promise<{ txId: string; newBalance: number }> {
    const db = getFirebaseDb();
    const amount = Number(params.amount);
    if (!amount || amount <= 0) throw new Error('Mint amount must be greater than 0 BMP');

    await this.getWallet(params.targetUserId);
    const nowIso = new Date().toISOString();
    const txId = `tx_mint_${Date.now()}`;

    let newBalance = 0;
    await runTransaction(db, async (tx) => {
      const wRef = doc(db, 'bmp_wallets', params.targetUserId);
      const snap = await tx.get(wRef);
      const data = snap.data() as BmpWallet;

      newBalance = data.bmpBalance + amount;
      tx.update(wRef, {
        bmpBalance: newBalance,
        lifetimeBmp: data.lifetimeBmp + amount,
        updatedAt: nowIso
      });

      const lRef = doc(db, 'bmp_ledger', txId);
      tx.set(lRef, {
        id: txId,
        txId,
        userId: params.targetUserId,
        amount,
        type: 'CREDIT',
        category: 'MINT',
        description: `Admin Supply Mint: ${params.reason || 'Network Treasury Grant'}`,
        balanceAfter: newBalance,
        counterpartyId: params.adminId,
        timestamp: nowIso
      });
    });

    return { txId, newBalance };
  },

  /**
   * Admin Burn BMP Tokens
   */
  async adminBurnBmp(params: {
    adminId: string;
    targetUserId: string;
    amount: number;
    reason: string;
  }): Promise<{ txId: string; newBalance: number }> {
    const db = getFirebaseDb();
    const amount = Number(params.amount);
    if (!amount || amount <= 0) throw new Error('Burn amount must be greater than 0 BMP');

    const wallet = await this.getWallet(params.targetUserId);
    if (wallet.bmpBalance < amount) throw new Error(`Target user only has ${wallet.bmpBalance.toFixed(2)} BMP available.`);

    const nowIso = new Date().toISOString();
    const txId = `tx_burn_${Date.now()}`;

    let newBalance = 0;
    await runTransaction(db, async (tx) => {
      const wRef = doc(db, 'bmp_wallets', params.targetUserId);
      const snap = await tx.get(wRef);
      const data = snap.data() as BmpWallet;

      newBalance = data.bmpBalance - amount;
      tx.update(wRef, {
        bmpBalance: newBalance,
        updatedAt: nowIso
      });

      const lRef = doc(db, 'bmp_ledger', txId);
      tx.set(lRef, {
        id: txId,
        txId,
        userId: params.targetUserId,
        amount,
        type: 'DEBIT',
        category: 'BURN',
        description: `Admin Supply Burn: ${params.reason || 'Circulation Deflation Program'}`,
        balanceAfter: newBalance,
        counterpartyId: params.adminId,
        timestamp: nowIso
      });
    });

    return { txId, newBalance };
  },

  /**
   * Admin Token Supply Analytics
   */
  async getSupplyMetrics(): Promise<BmpSupplyMetrics> {
    const db = getFirebaseDb();
    try {
      const snap = await getDocs(collection(db, 'bmp_wallets'));
      const wallets = snap.docs.map(d => ({ userId: d.id, ...d.data() })) as BmpWallet[];

      let totalCirculating = 0;
      let totalMinted = 0;

      wallets.forEach(w => {
        totalCirculating += w.bmpBalance || 0;
        totalMinted += w.lifetimeBmp || 0;
      });

      // Get burn records from ledger
      const burnQuery = query(collection(db, 'bmp_ledger'), where('category', '==', 'BURN'));
      const burnSnap = await getDocs(burnQuery);
      let totalBurned = 0;
      burnSnap.docs.forEach(d => {
        totalBurned += d.data().amount || 0;
      });

      const topHolders = wallets
        .map(w => ({ userId: w.userId, walletAddress: w.walletAddress || 'bmp1...', balance: w.bmpBalance || 0 }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);

      return {
        totalSupply: totalMinted - totalBurned,
        circulatingSupply: totalCirculating,
        rewardsPool: 10000000.0 - totalCirculating, // 10M Max Reserve Pool
        totalHoldersCount: wallets.length,
        totalMinted,
        totalBurned,
        topHolders
      };
    } catch (e) {
      console.warn('getSupplyMetrics error:', e);
      return {
        totalSupply: 1000000,
        circulatingSupply: 250000,
        rewardsPool: 750000,
        totalHoldersCount: 1,
        totalMinted: 1000000,
        totalBurned: 0,
        topHolders: []
      };
    }
  }
};
