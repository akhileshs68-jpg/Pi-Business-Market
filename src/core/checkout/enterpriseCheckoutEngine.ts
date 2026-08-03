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
    console.log('[EnterpriseCheckout] Payment Created - Starting executePiTestnetPayment. Amount:', amount, 'Session:', sessionId);
    return new Promise((resolve, reject) => {
      const paymentRecordId = `PAY_PI_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      piPaymentService.createPayment(
        { amount, memo, metadata: { ...metadata, sessionId, paymentRecordId } },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            console.log('[EnterpriseCheckout] Approval Callback Entered for Pi Payment ID:', piPaymentId);
            try {
              console.log('[EnterpriseCheckout] Approve Request Started...');
              let headers: any = { 'Content-Type': 'application/json' };
              try {
                headers = await getAuthHeaders();
              } catch (authErr) {
                console.warn('[EnterpriseCheckout] Auth header retrieval fallback:', authErr);
              }
              const augmentedMetadata = { ...metadata, sessionId, paymentRecordId };
              const res = await fetch('/api/payments/approve', {
                method: 'POST',
                headers,
                body: JSON.stringify({ paymentId: piPaymentId, metadata: augmentedMetadata })
              });
              const resText = await res.text();
              console.log('[EnterpriseCheckout] Approve Response status:', res.status, 'body:', resText);
              
              if (!res.ok) {
                console.error('[EnterpriseCheckout] Server API returned non-ok status for approve:', res.status, resText);
                if (!piPaymentId.startsWith('SIM_')) {
                  throw new Error(`Server payment approval failed (${res.status}): ${resText}`);
                }
              }
              console.log('[EnterpriseCheckout] Approval Callback Finished.');
              paymentService.updateTransactionStatus(paymentRecordId, 'Processing', piPaymentId).catch(console.error);
            } catch (err: any) {
              console.error('[EnterpriseCheckout] Server approval failure:', err);
              if (piPaymentId.startsWith('SIM_')) {
                console.warn('[EnterpriseCheckout] Simulated payment approval fallback on network error.');
                paymentService.updateTransactionStatus(paymentRecordId, 'Processing', piPaymentId).catch(console.error);
              } else {
                reject(err);
                throw err;
              }
            }
          },
          onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
            console.log('[EnterpriseCheckout] Completion Callback Entered. Payment ID:', piPaymentId, 'TxID:', txid);
            try {
              console.log('[EnterpriseCheckout] Completion Request Started...');
              let headers: any = { 'Content-Type': 'application/json' };
              try {
                headers = await getAuthHeaders();
              } catch (authErr) {
                console.warn('[EnterpriseCheckout] Auth header retrieval fallback:', authErr);
              }
              const augmentedMetadata = { ...metadata, sessionId, paymentRecordId };
              const res = await fetch('/api/payments/complete', {
                method: 'POST',
                headers,
                body: JSON.stringify({ paymentId: piPaymentId, txid, metadata: augmentedMetadata })
              });
              const resText = await res.text();
              console.log('[EnterpriseCheckout] Complete Response status:', res.status, 'body:', resText);

              let serverOrderId = '';
              try {
                const parsed = JSON.parse(resText);
                if (parsed && parsed.orderId) {
                  serverOrderId = parsed.orderId;
                }
              } catch (parseErr) {
                console.warn('[EnterpriseCheckout] Failed to parse complete response as JSON:', parseErr);
              }

              if (!res.ok) {
                if (!piPaymentId.startsWith('SIM_')) {
                  throw new Error(`Server payment completion failed (${res.status}): ${resText}`);
                }
              }

              console.log('[EnterpriseCheckout] Completion Finished.');
              paymentService.updateTransactionStatus(paymentRecordId, 'Completed', txid).catch(console.error);

              resolve({
                verified: true,
                paymentId: piPaymentId,
                transactionId: txid,
                walletAddress: metadata.walletAddress || 'PI_TESTNET_WAL_' + Math.random().toString(36).substring(2, 8),
                amountVerified: amount,
                timestamp: new Date().toISOString(),
                orderId: serverOrderId
              });
            } catch (err: any) {
              console.error('[EnterpriseCheckout] Server completion verification failure:', err);
              if (piPaymentId.startsWith('SIM_')) {
                console.warn('[EnterpriseCheckout] Simulated payment completion fallback on network error.');
                paymentService.updateTransactionStatus(paymentRecordId, 'Completed', txid).catch(console.error);
                resolve({
                  verified: true,
                  paymentId: piPaymentId,
                  transactionId: txid,
                  walletAddress: metadata.walletAddress || 'PI_TESTNET_WAL_' + Math.random().toString(36).substring(2, 8),
                  amountVerified: amount,
                  timestamp: new Date().toISOString()
                });
              } else {
                reject(new Error('Server completion verification failed: ' + err.message));
                throw err;
              }
            }
          },
          onCancel: async (piPaymentId: string) => {
            console.log('[EnterpriseCheckout] Payment Cancelled by user. Payment ID:', piPaymentId);
            reject(new Error('Payment cancelled by user.'));
          },
          onError: async (error: Error, piPaymentId: string) => {
            console.error('[EnterpriseCheckout] Payment Error:', error, 'Payment ID:', piPaymentId);
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
    const { transactionId } = params;
    const db = getFirebaseDb();

    console.log('[EnterpriseCheckout] Polling for server-side order confirmation. TxID:', transactionId);

    // Poll Firestore up to 12 times (6 seconds total) to let the server-side payment completion process the write securely
    let orderDocId = '';
    for (let attempt = 0; attempt < 12; attempt++) {
      const existingQ = query(
        collection(db, 'orders'), 
        where('paymentTxId', '==', transactionId),
        where('userUid', '==', params.userUid)
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        orderDocId = existingSnap.docs[0].id;
        console.info('[EnterpriseCheckout] Idempotent hit: Order successfully processed server-side:', orderDocId);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (orderDocId) {
      return orderDocId;
    }

    throw new Error('Server-side order processing timed out. Please check your order history.');
  }
}
