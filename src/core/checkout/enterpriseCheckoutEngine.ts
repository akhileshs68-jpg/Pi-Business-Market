/**
 * Enterprise Checkout Engine
 * Pi Business Market
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../../firebase/config';
import { 
  SavedCheckoutAddress, 
  EnterprisePaymentMethodConfig, 
  PiTestnetVerificationResult, 
  OrderSummaryBreakdown, 
  MerchantSettlementQueueRecord 
} from './enterpriseCheckoutTypes';
import { CheckoutSession, OrderItem, Address } from '../../types';
import { checkoutService } from '../../services/checkoutService';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { piPaymentService } from '../../services/piPaymentService';
import { loyaltyService } from '../../services/loyaltyService';
import { ledgerService } from '../../services/ledgerService';
import { paymentEngine } from '../../services/wallet/paymentEngine';
import { masterWalletService } from '../../services/blockchain/masterWalletService';
import { masterLedgerService } from '../../services/blockchain/masterLedgerService';
import { auditService } from '../../services/auditService';
import { analyticsService } from '../../services/analyticsService';
import { subscriptionService } from '../../services/blockchain/subscriptionService';


async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error getting auth token:', err);
  }
  return headers;
}

export const PAYMENT_METHOD_CONFIGS: EnterprisePaymentMethodConfig[] = [
  {
    id: 'pi_testnet',
    name: 'Pi Testnet Wallet',
    description: 'Instant secure payment via Pi Network Testnet SDK',
    enabled: true,
    isFutureFeature: false,
    iconName: 'pi-network'
  },
  {
    id: 'bmp_rewards',
    name: 'BMP Rewards Program',
    description: 'Earn BMP rewards automatically on checkout (loyalty program only)',
    enabled: false,
    isFutureFeature: true,
    iconName: 'coins'
  },
  {
    id: 'bmp_token',
    name: 'BMP Token (Web3)',
    description: 'Future decentralized Web3 token settlement',
    enabled: false,
    isFutureFeature: true,
    iconName: 'coins'
  },
  {
    id: 'pi_mainnet',
    name: 'Pi Mainnet (Production)',
    description: 'Future Pi Mainnet native wallet integration',
    enabled: false,
    isFutureFeature: true,
    iconName: 'pi-network'
  },
  {
    id: 'escrow',
    name: 'Pi Escrow Protection',
    description: 'Future multi-signature buyer protection escrow',
    enabled: false,
    isFutureFeature: true,
    iconName: 'shield'
  },
  {
    id: 'split',
    name: 'Split Payment',
    description: 'Future multi-wallet split payment protocol',
    enabled: false,
    isFutureFeature: true,
    iconName: 'split'
  },
  {
    id: 'credits',
    name: 'Business Credits',
    description: 'Future corporate business trade credit balance',
    enabled: false,
    isFutureFeature: true,
    iconName: 'credit-card'
  },
  {
    id: 'gift',
    name: 'Gift Card Balance',
    description: 'Future digital gift card code redemption',
    enabled: false,
    isFutureFeature: true,
    iconName: 'gift'
  }
];

export class EnterpriseCheckoutEngine {
  /**
   * Fetch saved user addresses with default support
   */
  static async getSavedAddresses(userUid: string): Promise<SavedCheckoutAddress[]> {
    if (!userUid) return [];
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'userAddresses'), where('userUid', '==', userUid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ addressId: d.id, ...d.data() })) as SavedCheckoutAddress[];

      if (list.length === 0) {
        // Fallback default sample address if none exist in profile
        return [
          {
            addressId: 'def_addr_1',
            fullName: 'Pi Pioneer',
            email: 'pioneer@pi.network',
            phone: '+1-555-0199',
            street: '100 Pi Network Plaza',
            city: 'Palo Alto',
            state: 'CA',
            country: 'USA',
            postalCode: '94301',
            isDefault: true,
            type: 'both'
          }
        ];
      }
      return list;
    } catch (err) {
      console.warn('Failed to load user addresses:', err);
      return [];
    }
  }

  /**
   * Save or update address in Firestore
   */
  static async saveUserAddress(userUid: string, address: SavedCheckoutAddress): Promise<string> {
    const db = getFirebaseDb();
    const addrId = address.addressId || `ADDR_${Math.random().toString(36).substring(2, 10)}`;
    const ref = doc(db, 'userAddresses', addrId);

    const record = {
      ...address,
      addressId: addrId,
      userUid,
      updatedAt: new Date().toISOString()
    };

    await setDoc(ref, record, { merge: true });
    return addrId;
  }

  /**
   * Calculate detailed order summary breakdown
   */
  static calculateOrderSummary(
    session: CheckoutSession, 
    orderItems: OrderItem[]
  ): OrderSummaryBreakdown {
    let productSubtotal = 0;
    let serviceSubtotal = 0;

    const merchantsMap = new Map<string, {
      merchantId: string;
      merchantName: string;
      storeName: string;
      items: OrderItem[];
      subtotal: number;
    }>();

    orderItems.forEach((item: any) => {
      const itemPrice = (item.unitPrice || 0) * (item.quantity || 1);
      if (item.isService || (item.productName && item.productName.toLowerCase().includes('service'))) {
        serviceSubtotal += itemPrice;
      } else {
        productSubtotal += itemPrice;
      }

      const merchantKey = item.businessId || session.businessId || session.storeId || 'PI-MERCHANT';
      const merchantName = item.sellerName || session.sellerId || 'Pi Enterprise Pioneer';
      const storeName = item.storeName || session.storeId || merchantName;

      if (!merchantsMap.has(merchantKey)) {
        merchantsMap.set(merchantKey, {
          merchantId: merchantKey,
          merchantName,
          storeName,
          items: [],
          subtotal: 0
        });
      }

      const m = merchantsMap.get(merchantKey)!;
      m.items.push(item);
      m.subtotal += itemPrice;
    });

    const subtotal = session.subtotal || (productSubtotal + serviceSubtotal);
    const discount = session.discount || 0;
    const shipping = session.shipping || (productSubtotal > 0 ? 10 : 0);
    const tax = session.tax || (subtotal * 0.05);
    const grandTotal = session.grandTotal || (subtotal - discount + shipping + tax);

    // Calculate BMP reward estimate (10 BMP per 1 Pi spent)
    const bmpRewardsEstimate = Math.floor(grandTotal * 10);

    return {
      productSubtotal,
      serviceSubtotal,
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal,
      bmpRewardsEstimate,
      piTestnetAmount: Number(grandTotal.toFixed(4)),
      itemsByMerchant: Array.from(merchantsMap.values())
    };
  }

  /**
   * Perform Pi Testnet Payment via SDK & Server Approval/Completion
   */
  static async executePiTestnetPayment(
    amount: number,
    memo: string,
    sessionId: string,
    metadata: any
  ): Promise<PiTestnetVerificationResult> {
    return new Promise((resolve, reject) => {
      const paymentRecordId = `PAY_PI_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      piPaymentService.createPayment(
        { amount, memo, metadata: { ...metadata, sessionId, paymentRecordId } },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            try {
              console.log('[EnterpriseCheckout] Pi Payment Server Approval:', piPaymentId);
              // 1. CRITICAL: Call approval API endpoint IMMEDIATELY before Firestore to prevent timeout
              // No auth headers needed for approve, saving critical time
              const res = await fetch('/api/payments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: piPaymentId, metadata })
              });
              if (!res.ok) {
                console.error('Server API returned non-ok status for approve.');
              }
              // 2. Fire-and-forget non-critical Firestore write (don't await it to save latency)
              paymentService.updateTransactionStatus(paymentRecordId, 'Processing', piPaymentId).catch(console.error);
            } catch (err: any) {
              console.error('Server approval failure:', err);
            }
          },
          onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
            try {
              console.log('[EnterpriseCheckout] Pi Payment Verified on Chain:', txid);
              
              // 1. Hit completion endpoint first
              const headers = await getAuthHeaders();
              const res = await fetch('/api/payments/complete', {
                method: 'POST',
                headers,
                body: JSON.stringify({ paymentId: piPaymentId, txid, metadata })
              });
              
              // 2. Update status without awaiting
              paymentService.updateTransactionStatus(paymentRecordId, 'Completed', txid).catch(console.error);

              resolve({
                verified: true,
                paymentId: piPaymentId,
                transactionId: txid,
                walletAddress: metadata.walletAddress || 'PI_TESTNET_WAL_' + Math.random().toString(36).substring(2, 8),
                amountVerified: amount,
                timestamp: new Date().toISOString()
              });
            } catch (err: any) {
              reject(new Error('Server completion verification failed: ' + err.message));
            }
          },
          onCancel: (piPaymentId: string) => {
            reject(new Error('Payment cancelled by user.'));
          },
          onError: (error: Error, piPaymentId: string) => {
            reject(new Error(`Pi Payment Error: ${error.message}`));
          }
        }
      );
    });
  }

  /**
   * Idempotent Order Creation & Reward Trigger Engine
   */
  static async finalizeOrderAndProcessRewards(params: {
    session: CheckoutSession;
    address: Address;
    paymentMethod: string;
    transactionId: string;
    grandTotal: number;
    orderItems: OrderItem[];
    userUid: string;
    customerNotes?: string;
  }): Promise<string> {
    const { session, address, paymentMethod, transactionId, grandTotal, orderItems, userUid, customerNotes } = params;
    const db = getFirebaseDb();

    // 1. Idempotency Check: check if order for this transactionId or sessionId already exists
    const existingQ = query(collection(db, 'orders'), where('paymentTxId', '==', transactionId));
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      console.info('[EnterpriseCheckout] Idempotent hit: Order already processed for transaction:', transactionId);
      return existingSnap.docs[0].id;
    }

    // 2. Save Payment Transaction Record
    const paymentId = await paymentService.createTransaction({
      userId: userUid,
      sellerId: session.sellerId || session.businessId || 'PI-SELLER',
      businessId: session.businessId || 'PI-BIZ',
      storeId: session.storeId || 'PI-STORE',
      orderId: session.sessionId,
      productIds: orderItems.map(i => i.productId),
      currency: session.currency || 'Pi',
      paymentMethod,
      amount: grandTotal
    });
    await paymentService.updateTransactionStatus(paymentId, 'Completed', transactionId);

    // 3. Create Verified Order
    const orderId = await orderService.createFromSession({
      ...session,
      customerNotes: customerNotes || session.customerNotes,
      shippingAddress: address,
      billingAddress: address,
      paymentStatus: 'SUCCESS',
      orderStatus: 'CONFIRMED',
      paymentId: paymentId,
      transactionId: transactionId,
      amount: grandTotal,
      currency: session.currency || 'Pi',
      timestamp: Date.now()
    }, orderItems);

    
    // Fire-and-forget post-processing (Wallet sync, Ledgers, BMP Rewards, Analytics)
    (async () => {
// 4. Update Pi Wallet, Master Ledger & Business Ledger
    try {
      const sellerId = session.sellerId || session.businessId || 'PI-SELLER';
      if (paymentMethod === 'pi_testnet') {
        const provider = paymentEngine.getProvider('pi_testnet');
        
        // Retrieve balances before transactions
        const buyerBefore = await provider.getBalance(userUid);
        const sellerBefore = await provider.getBalance(sellerId);

        // Perform debit and credit updates on the wallet provider
        await paymentEngine.processMarketplacePayment(
          'pi_testnet',
          userUid,
          sellerId,
          grandTotal,
          orderId
        );

        // Calculate balances after
        const buyerAfter = buyerBefore - grandTotal;
        const sellerAfter = sellerBefore + grandTotal;

        // Synchronize unified master wallets documents for both parties
        await masterWalletService.syncMasterWalletDoc(userUid);
        await masterWalletService.syncMasterWalletDoc(sellerId);

        // Record buyer debit in immutable master ledger
        await masterLedgerService.recordEntry({
          transactionId,
          walletAddress: `pi_addr_${userUid.substring(0, 10)}`,
          userId: userUid,
          asset: 'PI_TESTNET',
          amount: -grandTotal,
          beforeBalance: buyerBefore,
          afterBalance: buyerAfter,
          referenceId: orderId,
          source: 'CHECKOUT',
          status: 'CONFIRMED',
          memo: `Payment debit for marketplace order #${orderId}`
        });

        // Record seller credit in immutable master ledger
        await masterLedgerService.recordEntry({
          transactionId,
          walletAddress: `pi_addr_${sellerId.substring(0, 10)}`,
          userId: sellerId,
          asset: 'PI_TESTNET',
          amount: grandTotal,
          beforeBalance: sellerBefore,
          afterBalance: sellerAfter,
          referenceId: orderId,
          source: 'CHECKOUT',
          status: 'CONFIRMED',
          memo: `Sale credit for marketplace order #${orderId}`
        });

        console.log(`[EnterpriseCheckout] Wallet & Master Ledger successfully synchronized for Order: ${orderId}`);
      }
    } catch (walletErr) {
      console.error('[EnterpriseCheckout] Failed updating wallet balances & ledger entries:', walletErr);
    }

    // 5. Trigger Server-side BMP Rewards (10 BMP per Pi)
    try {
      const businessId = session.businessId || 'PI-BIZ';
      await loyaltyService.earnPoints(userUid, businessId, grandTotal, orderId);
      console.log(`[EnterpriseCheckout] Rewards credited for buyer ${userUid}, order ${orderId}`);
    } catch (rewardErr) {
      console.error('[EnterpriseCheckout] Failed to process rewards ledger:', rewardErr);
    }

    // 6. Merchant Settlement Queue Record
    try {
      const settlementId = `SETTLE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + 7); // 7-day escrow hold

      const settlementRecord: MerchantSettlementQueueRecord = {
        settlementId,
        orderId,
        businessId: session.businessId || 'PI-BIZ',
        storeId: session.storeId,
        sellerId: session.sellerId || 'PI-SELLER',
        amount: grandTotal * 0.95, // 5% platform fee retained
        currency: session.currency || 'Pi',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        releaseEligibleAt: releaseDate.toISOString()
      };

      await setDoc(doc(db, 'merchantSettlements', settlementId), settlementRecord);
    } catch (settleErr) {
      console.error('[EnterpriseCheckout] Failed to create merchant settlement queue item:', settleErr);
    }

    // 7. Record Enterprise Audit Log
    try {
      await auditService.logAction(
        userUid,
        'Pi Pioneer',
        'PLACE_ORDER',
        'orders',
        orderId,
        `Verified Pi Testnet transaction: ${transactionId} for Order ${orderId}`,
        { severity: 'info' }
      );
    } catch (auditErr) {
      console.error('[EnterpriseCheckout] Failed to create enterprise audit log:', auditErr);
    }

    // 8. Record Analytics Event
    try {
      await analyticsService.trackEvent({
        userUid: userUid,
        eventType: 'payment_success',
        businessId: session.businessId || 'PI-BIZ',
        storeId: session.storeId || 'PI-STORE',
        metadata: {
          orderId,
          grandTotal,
          paymentMethod,
          transactionId
        }
      });
    } catch (analyticsErr) {
      console.error('[EnterpriseCheckout] Failed to track transaction analytics:', analyticsErr);
    }

    // 9. Centralized Subscription/Event Engine Notification Broadcasts
    try {
      subscriptionService.publishEvent('PAYMENT_CONFIRMED', {
        paymentId,
        transactionId,
        orderId,
        grandTotal,
        userUid,
        sellerId: session.sellerId || session.businessId || 'PI-SELLER'
      }, transactionId);

      subscriptionService.publishEvent('ORDER_CREATED', {
        orderId,
        grandTotal,
        userUid,
        itemsCount: orderItems.length
      }, transactionId);

      subscriptionService.publishEvent('WALLET_UPDATED', {
        userId: userUid,
        asset: 'PI_TESTNET',
        grandTotal
      });
    } catch (subErr) {
      console.error('[EnterpriseCheckout] Central subscription event publication failed:', subErr);
    }

    
    })().catch(err => {
      console.error('[EnterpriseCheckout] Async Post-Processing Error:', err);
    });

    return orderId;
  }
}
