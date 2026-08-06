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


function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      const href = window.location.href;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const urlObj = new URL(href);
        // CRITICAL CHECK: If the origin contains '.pi' or 'sandbox' or is 'null', it is NOT a valid Web2 backend host.
        // Fall back to relative path so that the browser natively resolves it relative to the iframe's real Web2 HTML document URL!
        const isPiDomain = urlObj.hostname.endsWith('.pi') || 
                           urlObj.hostname.includes('sandbox.pi') || 
                           urlObj.hostname.includes('minepi.com');
        if (urlObj.origin && urlObj.origin !== 'null' && !urlObj.origin.startsWith('file:') && !isPiDomain) {
          const resolved = `${urlObj.origin}${cleanPath}`;
          console.log(`[DEBUG_TRACE] [getAbsoluteUrl] Parsed href. Origin: ${urlObj.origin}, Resolved URL: ${resolved}`);
          return resolved;
        }
      }
    }
  } catch (e) {
    console.error('[DEBUG_TRACE] [getAbsoluteUrl] Error parsing window.location.href:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      const origin = window.location.origin;
      const isPiDomain = origin.includes('.pi') || origin.includes('minepi.com');
      if (origin !== 'null' && !origin.startsWith('file:') && !isPiDomain) {
        const resolved = `${origin}${cleanPath}`;
        console.log(`[DEBUG_TRACE] [getAbsoluteUrl] Read origin. Origin: ${origin}, Resolved URL: ${resolved}`);
        return resolved;
      }
    }
  } catch (e) {
    console.error('[DEBUG_TRACE] [getAbsoluteUrl] Error reading window.location.origin:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.location && window.location.host) {
      const protocol = window.location.protocol || 'https:';
      const host = window.location.host;
      const isPiDomain = host.includes('.pi') || host.includes('minepi.com');
      if (host && !host.startsWith('file:') && !isPiDomain) {
        const resolved = `${protocol}//${host}${cleanPath}`;
        console.log(`[DEBUG_TRACE] [getAbsoluteUrl] Formed host. Origin: ${protocol}//${host}, Resolved URL: ${resolved}`);
        return resolved;
      }
    }
  } catch (e) {}

  console.warn(`[DEBUG_TRACE] [getAbsoluteUrl] All Web2 origin checks failed (or Pi domain detected). Falling back to relative path: ${cleanPath}`);
  return cleanPath;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  console.log('[DEBUG_TRACE] [getAuthHeaders] ENTER');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      console.log('[DEBUG_TRACE] [getAuthHeaders] Firebase currentUser found:', auth.currentUser.uid);
      const tokenPromise = auth.currentUser.getIdToken();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      if (token) {
        console.log('[DEBUG_TRACE] [getAuthHeaders] Firebase token successfully acquired');
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('[DEBUG_TRACE] [getAuthHeaders] Firebase ID token request timed out (1.2s timeout exceeded) or returned null');
      }
    } else {
      console.log('[DEBUG_TRACE] [getAuthHeaders] No active Firebase currentUser');
    }
  } catch (err) {
    console.error('[DEBUG_TRACE] [getAuthHeaders] Error retrieving Firebase token:', err);
  }
  console.log('[DEBUG_TRACE] [getAuthHeaders] EXIT');
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
    console.log('[DEBUG_TRACE] [executePiTestnetPayment] entering createPayment with amount:', amount, 'memo:', memo, {
      referrer: document.referrer,
      origin: window.location.origin,
      href: window.location.href,
      typeofPi: typeof (window as any).Pi,
      typeofCreatePayment: typeof (window as any).Pi?.createPayment,
      typeofCompletePayment: typeof (window as any).Pi?.completePayment
    });

    const requiredMetadata = ['sessionId', 'buyerId', 'sellerId', 'businessId', 'storeId', 'orderId'];
    for (const key of requiredMetadata) {
      if (!metadata[key]) {
        console.error(`[DEBUG_TRACE] [executePiTestnetPayment] Missing mandatory metadata field: ${key}`);
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

    return new Promise((resolve, reject) => {
      const internalPaymentId = `PAY_PI_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      piPaymentService.createPayment(
        { amount, memo, metadata: { ...metadata, sessionId, internalPaymentId } },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] ENTERED callback with piPaymentId:', piPaymentId, {
              referrer: document.referrer,
              origin: window.location.origin,
              href: window.location.href
            });
            try {
              let headers: any = { 'Content-Type': 'application/json' };
              try {
                headers = await getAuthHeaders();
              } catch (authErr) {
                console.warn('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] Auth header fallback error:', authErr);
              }
              const augmentedMetadata = { ...metadata, sessionId, internalPaymentId };
              const url = getAbsoluteUrl('/api/payments/approve');
              const bodyStr = JSON.stringify({ paymentId: piPaymentId, metadata: augmentedMetadata });
              const startTime = Date.now();
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] fetch URL:', url);
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] request body:', bodyStr);
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] IMMEDIATELY BEFORE fetch() call');

              const res = await fetch(url, {
                method: 'POST',
                headers,
                body: bodyStr
              });
              const endTime = Date.now();
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] IMMEDIATELY AFTER fetch() response received:', {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                resUrl: res.url,
                durationMs: endTime - startTime
              });

              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] IMMEDIATELY BEFORE res.text()');
              const resText = await res.text();
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] IMMEDIATELY AFTER res.text() result:', resText);
              
              if (!res.ok) {
                if (!piPaymentId.startsWith('SIM_')) {
                  throw new Error(`Server payment approval failed (${res.status}): ${resText}`);
                }
              }
              paymentService.updateTransactionStatus(internalPaymentId, 'Processing', piPaymentId).catch(console.error);
            } catch (err: any) {
              console.error('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] Exception:', err);
              if (piPaymentId.startsWith('SIM_')) {
                paymentService.updateTransactionStatus(internalPaymentId, 'Processing', piPaymentId).catch(console.error);
              } else {
                reject(err);
                throw err;
              }
            }
            console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerApproval] EXITING callback for piPaymentId:', piPaymentId);
          },
          onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
            console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] ENTERED callback with piPaymentId:', piPaymentId, 'txid:', txid, {
              referrer: document.referrer,
              origin: window.location.origin,
              href: window.location.href
            });
            try {
              let headers: any = { 'Content-Type': 'application/json' };
              try {
                headers = await getAuthHeaders();
              } catch (authErr) {
                console.warn('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] Auth header fallback error:', authErr);
              }
              const augmentedMetadata = { ...metadata, sessionId, internalPaymentId };
              const url = getAbsoluteUrl('/api/payments/complete');
              const bodyStr = JSON.stringify({ paymentId: piPaymentId, txid, metadata: augmentedMetadata });
              const startTime = Date.now();
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] fetch URL:', url);
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] request body:', bodyStr);
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] IMMEDIATELY BEFORE fetch() call');

              const res = await fetch(url, {
                method: 'POST',
                headers,
                body: bodyStr
              });
              const endTime = Date.now();
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] IMMEDIATELY AFTER fetch() response received:', {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                resUrl: res.url,
                durationMs: endTime - startTime
              });

              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] IMMEDIATELY BEFORE res.text()');
              const resText = await res.text();
              console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] IMMEDIATELY AFTER res.text() result:', resText);

              let serverOrderId = '';
              try {
                const parsed = JSON.parse(resText);
                if (parsed && parsed.orderId) {
                  serverOrderId = parsed.orderId;
                }
              } catch (parseErr) {
                console.warn('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] JSON parse fail:', parseErr);
              }

              if (!res.ok) {
                if (!piPaymentId.startsWith('SIM_')) {
                  throw new Error(`Server payment completion failed (${res.status}): ${resText}`);
                }
              }

              const finalOrderId = serverOrderId || sessionId || ('ORD_' + Math.random().toString(36).substring(2, 10).toUpperCase());

              paymentService.updateTransactionStatus(internalPaymentId, 'Completed', txid).catch(console.error);

              // Check window.Pi.completePayment existence / execution logging
              if (typeof (window as any).Pi?.completePayment === 'function') {
                console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] typeof window.Pi.completePayment is function');
              } else {
                console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] typeof window.Pi.completePayment:', typeof (window as any).Pi?.completePayment);
              }

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
              console.error('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] Exception:', err);
              if (piPaymentId.startsWith('SIM_')) {
                paymentService.updateTransactionStatus(internalPaymentId, 'Completed', txid).catch(console.error);
                resolve({
                  verified: true,
                  paymentId: piPaymentId,
                  transactionId: txid,
                  walletAddress: metadata.walletAddress || 'PI_TESTNET_WAL_' + Math.random().toString(36).substring(2, 8),
                  amountVerified: amount,
                  timestamp: new Date().toISOString(),
                  orderId: sessionId || ('ORD_' + Math.random().toString(36).substring(2, 10).toUpperCase())
                });
              } else {
                reject(new Error('Server completion verification failed: ' + err.message));
                throw err;
              }
            }
            console.log('[DEBUG_TRACE] [executePiTestnetPayment.onReadyForServerCompletion] EXITING callback for piPaymentId:', piPaymentId);
          },
          onCancel: async (piPaymentId: string) => {
            console.log('[DEBUG_TRACE] [executePiTestnetPayment] onCancel with piPaymentId:', piPaymentId);
            reject(new Error('Payment cancelled by user.'));
          },
          onError: async (error: Error, piPaymentId: string) => {
            console.error('[DEBUG_TRACE] [executePiTestnetPayment] onError with piPaymentId:', piPaymentId, 'error:', error);
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
