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
import { resolveProductPricing, resolveVariantPricing } from './pricing/pricingCompatibility';
import { shippingService } from './shippingService';

function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      clean[key] = null;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      clean[key] = sanitizeFirestoreData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const cartService = {
  /**
   * CART MANAGEMENT
   */
  async getOrCreateCart(userUid: string, businessId: string = 'unknown_business'): Promise<Cart> {
    const db = getFirebaseDb();
    const safeBusinessId = businessId || 'unknown_business';
    const cartId = `${userUid}_${safeBusinessId}`;
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
      businessId: safeBusinessId,
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
    
    // Extract userId from cartId (format: userUid_businessId)
    const userId = cartId.split('_')[0];

    // Fetch product to get latest details and stock
    const productRef = doc(db, 'products', item.productId);
    const productSnap = await getDoc(productRef);
    let ownerId = 'none';
    let businessId = 'none';
    let storeId = 'none';
    let stock = 999;
    const isInvalid = (val: any) => !val || val === 'none' || val === 'unknown' || val === 'null' || val === 'undefined' || val === '';
    
    if (productSnap.exists()) {
      const pData = productSnap.data();
      ownerId = pData.ownerUid || pData.ownerId || pData.sellerId || pData.merchantId || pData.createdBy || 'none';
      businessId = pData.businessId || 'none';
      storeId = pData.storeId || 'none';
      stock = pData.stock !== undefined ? pData.stock : 999;

      if (pData.status === 'Deleted' || pData.status === 'draft' || pData.status === 'Inactive') {
        throw new Error('This product is no longer available.');
      }

      // 1. Resolve storeId and businessId safely without unbounded collection queries
      if (isInvalid(storeId) && !isInvalid(businessId)) {
        storeId = businessId;
      }
      if (isInvalid(businessId)) {
        const cartBizId = cartId.split('_')[1];
        businessId = item.businessId || (cartBizId && cartBizId !== 'unknown_business' ? cartBizId : 'default_business');
      }
      if (isInvalid(storeId)) {
        storeId = item.storeId || businessId || 'default_store';
      }
    }

    const requestedQty = Math.max(1, Math.min(item.quantity || 1, stock));

    // Resolve central pricing metadata if not already provided
    let pricingMode = item.pricingMode;
    let localCurrency = item.localCurrency;
    let localAmount = item.localAmount;
    let communityPiAmount = item.communityPiAmount;
    let piUnitPrice = item.piUnitPrice ?? item.unitPrice;
    let pricingRateUsed = item.pricingRateUsed;
    let pricingRateSource = item.pricingRateSource;
    let pricingRateTimestamp = item.pricingRateTimestamp;

    if (!pricingMode && productSnap.exists()) {
      const pData = productSnap.data();
      let resolvedPricing;
      if (item.variantId && pData.variants) {
        const vMatch = pData.variants.find((v: any) => v.variantId === item.variantId || v.id === item.variantId);
        if (vMatch) {
          resolvedPricing = await resolveVariantPricing(vMatch, pData);
        } else {
          resolvedPricing = await resolveProductPricing(pData);
        }
      } else {
        resolvedPricing = await resolveProductPricing(pData);
      }

      pricingMode = resolvedPricing.mode;
      localCurrency = resolvedPricing.localCurrency ?? undefined;
      localAmount = resolvedPricing.localAmount ?? undefined;
      communityPiAmount = resolvedPricing.mode === 'COMMUNITY' ? (resolvedPricing.piAmount ?? undefined) : undefined;
      piUnitPrice = resolvedPricing.piAmount ?? item.unitPrice;
      pricingRateUsed = resolvedPricing.rateUsed ?? undefined;
      pricingRateSource = resolvedPricing.rateSource ?? undefined;
      pricingRateTimestamp = resolvedPricing.rateTimestamp ?? undefined;
    }

    if (!pricingMode) {
      pricingMode = 'LEGACY_PI';
    }

    const effectiveUnitPrice = piUnitPrice ?? item.unitPrice;

    if (itemSnap.exists()) {
      const current = itemSnap.data() as CartItem;
      const newQuantity = Math.min(current.quantity + requestedQty, stock);
      await updateDoc(itemRef, sanitizeFirestoreData({
        quantity: newQuantity,
        unitPrice: effectiveUnitPrice,
        piUnitPrice: effectiveUnitPrice,
        subtotal: effectiveUnitPrice * newQuantity,
        stock: stock,
        ownerId,
        ownerUid: ownerId,
        sellerId: ownerId,
        merchantId: ownerId,
        businessId,
        storeId,
        pricingMode,
        localCurrency: localCurrency ?? current.localCurrency ?? null,
        localAmount: localAmount ?? current.localAmount ?? null,
        communityPiAmount: communityPiAmount ?? current.communityPiAmount ?? null,
        pricingRateUsed: pricingRateUsed ?? current.pricingRateUsed ?? null,
        pricingRateSource: pricingRateSource ?? current.pricingRateSource ?? null,
        pricingRateTimestamp: pricingRateTimestamp ?? current.pricingRateTimestamp ?? null,
        updatedAt: new Date().toISOString()
      }));
    } else {
      await setDoc(itemRef, sanitizeFirestoreData({
        ...item,
        itemId,
        id: itemId,
        userId,
        ownerId,
        ownerUid: ownerId,
        sellerId: ownerId,
        merchantId: ownerId,
        businessId,
        storeId,
        productName: item.name,
        price: effectiveUnitPrice,
        unitPrice: effectiveUnitPrice,
        piUnitPrice: effectiveUnitPrice,
        currency: item.currency || 'Pi',
        quantity: requestedQty,
        stock: stock,
        subtotal: effectiveUnitPrice * requestedQty,
        status: 'active',
        pricingMode,
        localCurrency: localCurrency || null,
        localAmount: localAmount ?? null,
        communityPiAmount: communityPiAmount ?? null,
        pricingRateUsed: pricingRateUsed ?? null,
        pricingRateSource: pricingRateSource || null,
        pricingRateTimestamp: pricingRateTimestamp || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }

    await this.recalculateCart(cartId);
  },

  async updateQuantity(itemId: string, cartId: string, quantity: number): Promise<void> {
    const db = getFirebaseDb();
    const itemRef = doc(db, 'cartItems', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (itemSnap.exists()) {
      const data = itemSnap.data() as CartItem;
      const maxStock = data.stock || 999;
      const unitPrice = data.piUnitPrice ?? data.unitPrice ?? data.price ?? 0;
      if (quantity <= 0) {
        await deleteDoc(itemRef);
      } else {
        const safeQty = Math.min(quantity, maxStock);
        await updateDoc(itemRef, {
          quantity: safeQty,
          subtotal: unitPrice * safeQty,
          updatedAt: new Date().toISOString()
        });
      }
      await this.recalculateCart(cartId);
    }
  },

  /**
   * Merge guest cart items into logged-in user cart
   */
  async mergeGuestCart(guestUid: string, userUid: string): Promise<void> {
    if (!guestUid || !userUid || guestUid === userUid) return;
    const db = getFirebaseDb();
    try {
      const cartsQuery = query(collection(db, 'carts'), where('userUid', '==', guestUid));
      const cartsSnap = await getDocs(cartsQuery);

      for (const cDoc of cartsSnap.docs) {
        const guestCart = cDoc.data() as Cart;
        const guestItems = await this.getCartItems(guestCart.cartId);
        
        if (guestItems.length > 0) {
          const userCart = await this.getOrCreateCart(userUid, guestCart.businessId);
          for (const item of guestItems) {
            await this.addToCart(userCart.cartId, {
              cartId: userCart.cartId,
              productId: item.productId,
              name: item.name || item.productName || 'Product',
              unitPrice: item.unitPrice || item.price || 0,
              quantity: item.quantity,
              currency: item.currency || 'Pi',
              imageUrl: item.imageUrl,
              variantId: item.variantId
            });
          }
        }
        await this.clearCart(guestCart.cartId);
        await deleteDoc(cDoc.ref);
      }
    } catch (err) {
      console.warn('Failed to merge guest cart:', err);
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
    
    // Dynamic tax & shipping logic
    const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% tax
    const quote = shippingService.calculateShippingQuote(items);
    const shipping = quote.shippingCharge;
    const grandTotal = parseFloat((subtotal + tax + shipping).toFixed(2));

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
