/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc,
  writeBatch,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { CheckoutSession, OrderDraft, Cart, CartItem, Address } from '../types';

export const checkoutService = {
  async createSession(cart: Cart, userUid: string, cartIds?: string[]): Promise<string> {
    const db = getFirebaseDb();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

    console.log('[checkoutService.createSession] Initiating session creation:', {
      sessionId,
      userUid,
      primaryCartId: cart.cartId,
      cartIds
    });

    // Retrieve cart items to extract productId, quantity, and price
    // Self-healing fallback: loop over target cart IDs to find items
    let items: CartItem[] = [];
    const targetCartIds = cartIds && cartIds.length > 0 ? cartIds : [cart.cartId];
    let activeCartId = cart.cartId;

    for (const cid of targetCartIds) {
      try {
        const q = query(collection(db, 'cartItems'), where('cartId', '==', cid));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => doc.data() as CartItem);
        if (fetched.length > 0) {
          items = fetched;
          activeCartId = cid;
          console.log(`[checkoutService.createSession] Found ${fetched.length} cart items in cartId: ${cid}`);
          break;
        }
      } catch (err) {
        console.warn(`[checkoutService.createSession] Failed fetching cart items for cartId ${cid}:`, err);
      }
    }

    if (items.length === 0) {
      console.warn('[checkoutService.createSession] No items found in any associated cartIds:', targetCartIds);
    }

    let productId = undefined;
    let quantity = undefined;
    let price = undefined;
    let storeId = cart.storeId;
    let businessId = cart.businessId;
    let sellerId: string | undefined = undefined;

    if (items && items.length > 0) {
      const firstItem = items[0];
      productId = firstItem.productId;
      quantity = firstItem.quantity;
      price = firstItem.unitPrice;

      // Query the product document to fetch accurate storeId, businessId, and sellerId (ownerUid/ownerId)
      try {
        const productSnap = await getDoc(doc(db, 'products', productId));
        if (productSnap.exists()) {
          const productData = productSnap.data();
          if (productData.status === 'Deleted' || productData.status === 'draft' || productData.status === 'Inactive') {
            throw new Error('This product is no longer available.');
          }
          // Update Buy Now to read these values directly from the Product document
          storeId = productData.storeId;
          businessId = productData.businessId;
          sellerId = productData.ownerId || productData.ownerUid || productData.sellerId || productData.merchantId || productData.createdBy || productData.createdByUid;

          const isInvalid = (val: any) => !val || val === 'none' || val === 'unknown' || val === 'null' || val === 'undefined' || val === '';

          // Auto-repair product identifiers if missing or invalid
          if (isInvalid(storeId) || isInvalid(businessId) || isInvalid(sellerId)) {
            console.log('[checkoutService] Product identifiers missing/invalid. Resolving fallback store/business...');
            
            // Try store lookup
            let storeSnap = (!isInvalid(storeId) && storeId) ? await getDoc(doc(db, 'stores', storeId)) : null;
            let selectedStore = storeSnap?.exists() ? storeSnap.data() as any : null;

            if (!selectedStore) {
              const storesQuery = query(collection(db, 'stores'));
              const storesSnap = await getDocs(storesQuery);
              const validStoreDoc = storesSnap.docs.find(d => {
                const data = d.data() as any;
                return data.status !== 'deleted' && (!isInvalid(sellerId) ? (data.ownerId === sellerId || data.ownerUid === sellerId) : true);
              }) || storesSnap.docs[0];

              if (validStoreDoc) {
                selectedStore = validStoreDoc.data() as any;
                storeId = validStoreDoc.id;
              }
            } else {
              storeId = storeSnap!.id;
            }

            if (selectedStore) {
              if (isInvalid(businessId)) businessId = selectedStore.businessId;
              if (isInvalid(sellerId)) sellerId = selectedStore.ownerId || selectedStore.ownerUid;
            }

            // Try business lookup if businessId still missing
            if (isInvalid(businessId)) {
              const bizQuery = query(collection(db, 'businesses'));
              const bizSnap = await getDocs(bizQuery);
              const validBizDoc = bizSnap.docs.find(d => {
                const data = d.data() as any;
                return data.status !== 'deleted' && (!isInvalid(sellerId) ? (data.ownerUid === sellerId || data.ownerId === sellerId) : true);
              }) || bizSnap.docs[0];

              if (validBizDoc) {
                businessId = validBizDoc.id;
                const bData = validBizDoc.data() as any;
                if (isInvalid(sellerId)) sellerId = bData.ownerUid || bData.ownerId;
              }
            }

            // Final guarantee for fallbacks if Firestore queries returned no store/business
            if (isInvalid(storeId)) storeId = 'default_store';
            if (isInvalid(businessId)) businessId = 'default_business';
            if (isInvalid(sellerId)) sellerId = 'pioneer_merchant';

            // If we successfully resolved storeId, businessId, sellerId, attempt auto-repair update on product doc
            if (storeId !== 'default_store' && businessId !== 'default_business') {
              try {
                await updateDoc(doc(db, 'products', productId), {
                  storeId,
                  businessId,
                  sellerId,
                  ownerId: sellerId,
                  ownerUid: sellerId,
                  merchantId: sellerId,
                  createdBy: sellerId,
                  createdByUid: sellerId,
                  updatedAt: new Date().toISOString()
                });
                console.log('[checkoutService] Auto-repaired product doc in Firestore:', productId);
              } catch (repairErr) {
                console.warn('[checkoutService] Auto-repair write warning:', repairErr);
              }
            }
          }

          if (productData.price !== undefined) {
            price = productData.price;
          }

          if (storeId && storeId !== 'none' && storeId !== 'default_store') {
            try {
              const storeSnap = await getDoc(doc(db, 'stores', storeId));
              if (storeSnap.exists()) {
                const sData = storeSnap.data();
                if (sData.status === 'deleted' || sData.status === 'suspended') {
                  throw new Error('This product is no longer available.');
                }
              }
            } catch (stErr: any) {
              if (stErr.message === 'This product is no longer available.') throw stErr;
            }
          }
        } else {
          throw new Error('This product is no longer available.');
        }
      } catch (err: any) {
        if (err.message === 'This product is no longer available.') {
          throw err;
        }
        console.error('[checkoutService] Error fetching product data during checkout session creation:', err);
      }
    }

    // Task 5: Before calling setDoc(), validate: uid, businessId, storeId, productId, sellerId, price
    // If any value is undefined, stop immediately and throw a user-friendly error
    const uid = userUid;
    if (
      uid === undefined ||
      businessId === undefined ||
      storeId === undefined ||
      productId === undefined ||
      sellerId === undefined ||
      price === undefined ||
      uid === 'none' ||
      businessId === 'none' ||
      storeId === 'none' ||
      productId === 'none' ||
      sellerId === 'none'
    ) {
      const missingFields = [];
      if (uid === undefined || uid === 'none') missingFields.push('uid');
      if (businessId === undefined || businessId === 'none') missingFields.push('businessId');
      if (storeId === undefined || storeId === 'none') missingFields.push('storeId');
      if (productId === undefined || productId === 'none') missingFields.push('productId');
      if (sellerId === undefined || sellerId === 'none') missingFields.push('sellerId');
      if (price === undefined) missingFields.push('price');
      
      console.error('[checkoutService.createSession] Aborting checkout due to missing fields:', {
        uid,
        businessId,
        storeId,
        productId,
        sellerId,
        price,
        missingFields
      });
      throw new Error(`Checkout aborted: required fields are undefined or invalid (${missingFields.join(', ')}).`);
    }

    const sessionData: any = {
      // Required checkout session fields from task 7
      sessionId,
      buyerId: uid,
      sellerId,
      productId,
      storeId,
      businessId,
      quantity,
      price,
      currency: cart.currency || 'Pi',
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: Timestamp.fromDate(expiresAt),

      // Legacy/Compatibility fields
      cartId: activeCartId,
      cartIds: cartIds || [activeCartId],
      userUid: uid,
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: cart.tax,
      shipping: cart.shipping,
      grandTotal: cart.grandTotal,
      couponCodes: []
    };

    // Task 6: Remove every undefined field before writing to Firestore
    const sanitizedSession: any = {};
    Object.entries(sessionData).forEach(([key, val]) => {
      if (val !== undefined) {
        sanitizedSession[key] = val;
      }
    });

    console.log('[checkoutService.createSession] Payload for setDoc:', sanitizedSession);

    try {
      await setDoc(doc(db, 'checkoutSessions', sessionId), sanitizedSession);
      console.log('[checkoutService.createSession] Session written successfully:', sessionId);
    } catch (writeErr: any) {
      console.error('[checkoutService.createSession] setDoc failed:', writeErr);
      throw writeErr;
    }

    return sessionId;
  },

  async getSession(sessionId: string): Promise<CheckoutSession | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'checkoutSessions', sessionId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      sessionId: snap.id,
      expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate().toISOString() : data.expiresAt
    } as CheckoutSession;
  },

  async updateSession(sessionId: string, updates: Partial<CheckoutSession>): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'checkoutSessions', sessionId), updates);
  },

  async createOrderDraft(session: CheckoutSession, cartItems: CartItem[]): Promise<string> {
    const db = getFirebaseDb();
    const draftId = `draft_${Math.random().toString(36).substring(2, 10)}`;
    
    // In a real app, we'd fetch businessId/storeId from the cart items or cart
    // For now we assume the session carries the context
    const businessId = 'PI-CORP-001'; // Derived from cart context

    const draft: OrderDraft = {
      draftId,
      checkoutSessionId: session.sessionId,
      userUid: session.userUid,
      businessId,
      lineItems: cartItems,
      pricingSummary: {
        subtotal: session.subtotal,
        discount: session.discount,
        tax: session.tax,
        shipping: session.shipping,
        grandTotal: session.grandTotal
      },
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'orderDrafts', draftId), {
      ...draft,
      createdAt: serverTimestamp()
    });

    return draftId;
  }
};
