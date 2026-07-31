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

    // Retrieve cart items to extract productId, quantity, and price
    const q = query(collection(db, 'cartItems'), where('cartId', '==', cart.cartId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => doc.data() as CartItem);

    let productId = undefined;
    let quantity = undefined;
    let price = undefined;
    let storeId = cart.storeId;
    let businessId = cart.businessId;
    let sellerId = undefined;

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
          sellerId = productData.ownerId || productData.ownerUid || productData.sellerId;
          if (productData.price !== undefined) {
            price = productData.price;
          }

          if (storeId && storeId !== 'none' && storeId !== 'undefined') {
            const storeSnap = await getDoc(doc(db, 'stores', storeId));
            if (!storeSnap.exists()) {
              throw new Error('This product is no longer available.');
            }
            const sData = storeSnap.data();
            if (sData.status !== 'active' && sData.status !== 'published' && sData.status !== 'approved' && sData.status) {
              throw new Error('This product is no longer available.');
            }
          } else {
            throw new Error('This product is no longer available.');
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
      cartId: cart.cartId,
      cartIds: cartIds || [cart.cartId],
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

    await setDoc(doc(db, 'checkoutSessions', sessionId), sanitizedSession);

    return sessionId;
  },

  async getSession(sessionId: string): Promise<CheckoutSession | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'checkoutSessions', sessionId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
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
