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
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Cart, CartItem, WishlistItem, SearchEntityType } from '../types';

export const cartService = {
  /**
   * CART MANAGEMENT
   */
  async getOrCreateCart(userUid: string, businessId: string): Promise<Cart> {
    const db = getFirebaseDb();
    const cartId = `${userUid}_${businessId}`;
    const cartRef = doc(db, 'carts', cartId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const data = cartSnap.data();
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Cart;
    }

    const newCart: Cart = {
      cartId,
      userUid,
      businessId,
      currency: 'Pi',
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      grandTotal: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(cartRef, {
      ...newCart,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return newCart;
  },

  async getCartItems(cartId: string): Promise<CartItem[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'cartItems'), where('cartId', '==', cartId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CartItem);
  },

  async addToCart(cartId: string, item: Omit<CartItem, 'itemId' | 'subtotal' | 'status'>): Promise<void> {
    const db = getFirebaseDb();
    const itemId = `${cartId}_${item.productId}_${item.variantId || 'base'}`;
    const itemRef = doc(db, 'cartItems', itemId);
    const itemSnap = await getDoc(itemRef);

    const subtotal = item.unitPrice * item.quantity;

    if (itemSnap.exists()) {
      const current = itemSnap.data() as CartItem;
      const newQuantity = current.quantity + item.quantity;
      await updateDoc(itemRef, {
        quantity: newQuantity,
        subtotal: item.unitPrice * newQuantity
      });
    } else {
      await setDoc(itemRef, {
        ...item,
        itemId,
        subtotal,
        status: 'active'
      });
    }

    await this.recalculateCart(cartId);
  },

  async updateQuantity(itemId: string, cartId: string, quantity: number): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'cartItems', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (itemSnap.exists()) {
      const data = itemSnap.data() as CartItem;
      if (quantity <= 0) {
        await deleteDoc(itemRef);
      } else {
        await updateDoc(itemRef, {
          quantity,
          subtotal: data.unitPrice * quantity
        });
      }
      await this.recalculateCart(cartId);
    }
  },

  async removeItem(itemId: string, cartId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'cartItems', itemId));
    await this.recalculateCart(cartId);
  },

  async clearCart(cartId: string): Promise<void> {
    const db = getFirebaseDb();
    const items = await this.getCartItems(cartId);
    const batch = writeBatch(db);
    items.forEach(item => {
      batch.delete(doc(db, 'cartItems', item.itemId));
    });
    await batch.commit();
    await this.recalculateCart(cartId);
  },

  async recalculateCart(cartId: string): Promise<void> {
    const db = getFirebaseDb();
    const items = await this.getCartItems(cartId);
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    
    // Simple tax/shipping logic for foundation
    const tax = subtotal * 0.05; // 5% tax
    const shipping = subtotal > 0 ? 10 : 0; // Flat shipping
    const grandTotal = subtotal + tax + shipping;

    await updateDoc(doc(db, 'carts', cartId), {
      subtotal,
      tax,
      shipping,
      grandTotal,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * WISHLIST MANAGEMENT
   */
  async addToWishlist(userUid: string, entityType: SearchEntityType, entityId: string): Promise<void> {
    const db = getFirebaseDb();
    const wishlistId = `${userUid}_${entityId}`;
    await setDoc(doc(db, 'wishlists', wishlistId), {
      wishlistId,
      userUid,
      entityType,
      entityId,
      createdAt: serverTimestamp()
    });
  },

  async getWishlist(userUid: string): Promise<WishlistItem[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'wishlists'), where('userUid', '==', userUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as WishlistItem);
  },

  async removeFromWishlist(wishlistId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'wishlists', wishlistId));
  }
};
