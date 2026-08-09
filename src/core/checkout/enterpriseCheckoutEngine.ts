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
import { shippingService } from '../../services/shippingService';
import { ledgerService } from '../../services/ledgerService';
import { paymentEngine } from '../../services/wallet/paymentEngine';
import { masterWalletService } from '../../services/blockchain/masterWalletService';
import { masterLedgerService } from '../../services/blockchain/masterLedgerService';
import { auditService } from '../../services/auditService';
import { analyticsService } from '../../services/analyticsService';
import { subscriptionService } from '../../services/blockchain/subscriptionService';
import { authService } from '../../auth/authService';
import { getAbsoluteUrl } from '../../utils/urlUtils';


async function getAuthHeaders(): Promise<Record<string, string>> {
  console.log('[DEBUG_TRACE] [getAuthHeaders] ENTER (enterpriseCheckoutEngine)');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const auth = getFirebaseAuth();
    if (auth) {
      if (!auth.currentUser) {
        console.log('[DEBUG_TRACE] [getAuthHeaders] No active currentUser. Triggering signInAnonymously()...');
        try {
          const { signInAnonymously } = await import('firebase/auth');
          const cred = await signInAnonymously(auth);
          console.log('[DEBUG_TRACE] [getAuthHeaders] signInAnonymously succeeded. UID:', cred?.user?.uid);
        } catch (signInErr) {
          console.error('[DEBUG_TRACE] [getAuthHeaders] signInAnonymously error:', signInErr);
        }
      }

      if (auth.currentUser) {
        console.log('[DEBUG_TRACE] [getAuthHeaders] Firebase currentUser found. UID:', auth.currentUser.uid);
        console.log('[DEBUG_TRACE] [getAuthHeaders] Token acquisition step: calling auth.currentUser.getIdToken(true)...');
        const token = await auth.currentUser.getIdToken(true).catch((tokenErr) => {
          console.error('[DEBUG_TRACE] [getAuthHeaders] getIdToken() failed:', tokenErr);
          return null;
        });
        if (token) {
          console.log('[DEBUG_TRACE] [getAuthHeaders] Firebase token successfully acquired (len:', token.length, ')');
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('[DEBUG_TRACE] [getAuthHeaders] getIdToken() returned null or empty string');
        }
      } else {
        console.warn('[DEBUG_TRACE] [getAuthHeaders] Still no active Firebase currentUser after auth attempt');
      }
    } else {
      console.warn('[DEBUG_TRACE] [getAuthHeaders] getFirebaseAuth() returned null');
    }
  } catch (err) {
    console.error('[DEBUG_TRACE] [getAuthHeaders] Error retrieving Firebase token:', err);
  }
  console.log('[DEBUG_TRACE] [getAuthHeaders] EXIT. Has Authorization header:', !!headers['Authorization']);
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
    
    // Dynamic shipping quote based on orderItems and address/pickup method
    const quote = shippingService.calculateShippingQuote(orderItems, session.shippingAddress);
    const shipping = session.shipping !== undefined && session.shipping !== 10 ? session.shipping : quote.shippingCharge;
    const tax = session.tax || parseFloat((subtotal * 0.05).toFixed(2));
    const grandTotal = parseFloat((subtotal - discount + shipping + tax).toFixed(2));

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
    const startTimeIso = new Date().toISOString();
    console.log(`[${startTimeIso}] [PAYMENT_TRACE] [executePiTestnetPayment] ENTERED with amount: ${amount}, memo: "${memo}", sessionId: ${sessionId}`, {
      referrer: document.referrer,
      origin: window.location.origin,
      href: window.location.href,
      typeofPi: typeof (window as any).Pi,
      typeofCreatePayment: typeof (window as any).Pi?.createPayment
    });

    const requiredMetadata = ['sessionId', 'buyerId', 'sellerId', 'businessId', 'storeId', 'orderId'];
    for (const key of requiredMetadata) {
      if (!metadata[key]) {
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [executePiTestnetPayment] Missing mandatory metadata field: ${key}`);
        return {
          verified: false,
          paymentId: '',
          transactionId: '',
          amountVerified: 0,
          timestamp: new Date().toISOString(),
          errorMessage: `Missing mandatory metadata field: ${key}`
        };
      }
    }

    return new Promise(async (resolve, reject) => {
      const internalPaymentId = `PAY_PI_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Pre-flight auth state check and token acquisition test before createPayment
      try {
        const auth = getFirebaseAuth();
        console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] Pre-payment user authentication state check:`, {
          hasFirebaseAuth: !!auth,
          currentUserUid: auth?.currentUser?.uid || 'null',
          isAnonymous: auth?.currentUser?.isAnonymous || false,
          latestVerifiedPiUser: authService.getLatestVerifiedUser()?.username || 'null'
        });
        const testHeaders = await getAuthHeaders();
        console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] Pre-payment token acquisition result: Authorization attached =`, !!testHeaders['Authorization']);
      } catch (preCheckErr) {
        console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] Pre-payment auth check warning:`, preCheckErr);
      }

      piPaymentService.createPayment(
        { amount, memo, metadata: { ...metadata, sessionId, internalPaymentId } },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            const approvalTimeIso = new Date().toISOString();
            console.log(`[${approvalTimeIso}] [PAYMENT_TRACE] [onReadyForServerApproval] ENTERED for piPaymentId: ${piPaymentId}`);
            try {
              let headers: any = { 'Content-Type': 'application/json' };
              try {
                headers = await getAuthHeaders();
              } catch (authErr) {
                console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] Auth header fallback warning:`, authErr);
              }
              const augmentedMetadata = { ...metadata, sessionId, internalPaymentId };
              const url = getAbsoluteUrl('/api/payments/approve');
              console.log(`[URL_TRACE] APPROVE_URL=${url}`);
              const bodyStr = JSON.stringify({ paymentId: piPaymentId, metadata: augmentedMetadata });
              const startTime = Date.now();
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] Sending POST request to ${url}`);
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] Request body payload:`, bodyStr);

              let res: Response;
              try {
                res = await fetch(url, {
                  method: 'POST',
                  headers,
                  body: bodyStr
                });
              } catch (fetchErr: any) {
                console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] Initial fetch error:`, fetchErr, 'Retrying in 500ms...');
                await new Promise((r) => setTimeout(r, 500));
                res = await fetch(url, {
                  method: 'POST',
                  headers,
                  body: bodyStr
                });
              }

              const endTime = Date.now();
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] Response received in ${endTime - startTime}ms. Status: ${res.status} ${res.statusText}`);

              const resText = await res.text();
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] Server response body:`, resText);
              
              if (!res.ok) {
                throw new Error(`Server payment approval failed (${res.status}): ${resText}`);
              }

              let parsedRes: any = null;
              try {
                parsedRes = JSON.parse(resText);
              } catch (e) {}

              if (parsedRes && parsedRes.success === false) {
                throw new Error(`Server payment approval rejected: ${parsedRes.error || resText}`);
              }

              paymentService.updateTransactionStatus(internalPaymentId, 'Processing', piPaymentId).catch(console.error);
            } catch (err: any) {
              console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] EXCEPTION:`, err);
              reject(err);
              throw err;
            }
            console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerApproval] EXITING successfully for piPaymentId: ${piPaymentId}`);
          },
          onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
            const completionTimeIso = new Date().toISOString();
            console.log(`[${completionTimeIso}] [PAYMENT_TRACE] [onReadyForServerCompletion] ENTERED for piPaymentId: ${piPaymentId}, txid: ${txid}`);
            try {
              let headers: any = { 'Content-Type': 'application/json' };
              try {
                headers = await getAuthHeaders();
              } catch (authErr) {
                console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] Auth header fallback warning:`, authErr);
              }
              const augmentedMetadata = { ...metadata, sessionId, internalPaymentId };
              const url = getAbsoluteUrl('/api/payments/complete');
              console.log(`[URL_TRACE] COMPLETE_URL=${url}`);
              const bodyStr = JSON.stringify({ paymentId: piPaymentId, txid, metadata: augmentedMetadata });
              const startTime = Date.now();
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] Sending POST request to ${url}`);

              let res: Response;
              try {
                res = await fetch(url, {
                  method: 'POST',
                  headers,
                  body: bodyStr
                });
              } catch (fetchErr: any) {
                console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] Initial fetch error:`, fetchErr, 'Retrying in 500ms...');
                await new Promise((r) => setTimeout(r, 500));
                res = await fetch(url, {
                  method: 'POST',
                  headers,
                  body: bodyStr
                });
              }
              const endTime = Date.now();
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] Response received in ${endTime - startTime}ms. Status: ${res.status} ${res.statusText}`);

              const resText = await res.text();
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] Server response body:`, resText);

              let serverOrderId = '';
              try {
                const parsed = JSON.parse(resText);
                if (parsed && parsed.orderId) {
                  serverOrderId = parsed.orderId;
                }
              } catch (parseErr) {}

              if (!res.ok) {
                throw new Error(`Server payment completion failed (${res.status}): ${resText}`);
              }

              const finalOrderId = serverOrderId || sessionId || ('ORD_' + Math.random().toString(36).substring(2, 10).toUpperCase());

              paymentService.updateTransactionStatus(internalPaymentId, 'Completed', txid).catch(console.error);

              resolve({
                verified: true,
                paymentId: piPaymentId,
                transactionId: txid,
                walletAddress: metadata.walletAddress || 'PI_TESTNET_WAL_' + Math.random().toString(36).substring(2, 8),
                amountVerified: amount,
                timestamp: new Date().toISOString(),
                orderId: finalOrderId
              });
            } catch (err: any) {
              console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] EXCEPTION:`, err);
              reject(new Error('Server completion verification failed: ' + err.message));
              throw err;
            }
            console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onReadyForServerCompletion] EXITING for piPaymentId: ${piPaymentId}`);
          },
          onCancel: async (piPaymentId: string) => {
            console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onCancel] CALLED for piPaymentId: ${piPaymentId}`);
            reject(new Error('Payment cancelled by user.'));
          },
          onError: async (error: Error, piPaymentId: string) => {
            console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [onError] CALLED for piPaymentId: ${piPaymentId}, error:`, error);
            reject(new Error(`Pi Payment Error: ${error.message}`));
          }
        }
      );
    });
  }

  /**
   * Order Confirmation Resolver (No Polling)
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
    orderId?: string;
  }): Promise<string> {
    if (params.orderId) {
      return params.orderId;
    }
    const { transactionId, userUid } = params;
    const db = getFirebaseDb();

    console.log('[EnterpriseCheckout] Checking order status directly without polling. TxID:', transactionId);

    const existingQ = query(
      collection(db, 'orders'), 
      where('paymentTxId', '==', transactionId),
      where('userUid', '==', userUid)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const orderDocId = existingSnap.docs[0].id;
      console.info('[EnterpriseCheckout] Direct check succeeded: Order processed server-side:', orderDocId);
      return orderDocId;
    }

    throw new Error('Server-side order processing was not confirmed. Please check your order history.');
  }
}
