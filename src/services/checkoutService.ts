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
  async createSession(cart: Cart, userUid: string): Promise<string> {
    const db = getFirebaseDb();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

    const session: CheckoutSession = {
      sessionId,
      cartId: cart.cartId,
      userUid,
      currency: cart.currency,
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: cart.tax,
      shipping: cart.shipping,
      grandTotal: cart.grandTotal,
      couponCodes: [],
      status: 'pending',
      expiresAt: expiresAt.toISOString()
    };

    await setDoc(doc(db, 'checkoutSessions', sessionId), {
      ...session,
      expiresAt: Timestamp.fromDate(expiresAt)
    });

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
