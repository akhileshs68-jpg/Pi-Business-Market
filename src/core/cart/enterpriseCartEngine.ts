/**
 * Enterprise Shopping Cart Engine
 * Pi Business Market
 */

import { getFirebaseDb } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ExtendedCartItem, 
  CartSellerGroup, 
  CartCoupon, 
  CartPriceSummary, 
  CartValidationResult, 
  CartValidationIssue 
} from './enterpriseCartTypes';
import { checkoutService } from '../../services/checkoutService';
import { cartService } from '../../services/cartService';

export const SAMPLE_COUPONS: CartCoupon[] = [
  {
    code: 'PIFESTIVAL2026',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 20,
    maxDiscountAmount: 50,
    description: '10% off on orders above 20 Pi for Pi Festival 2026'
  },
  {
    code: 'PIONEER15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 50,
    description: '15% off for Pi Pioneers on orders over 50 Pi'
  },
  {
    code: 'FREEPI5',
    discountType: 'fixed',
    discountValue: 5,
    minOrderAmount: 15,
    description: 'Flat 5 Pi off on minimum purchase of 15 Pi'
  }
];

export class EnterpriseCartEngine {
  private static undoStack: Map<string, ExtendedCartItem> = new Map();

  /**
   * Group cart items by Seller / Store for multi-seller checkout routing
   */
  static groupItemsBySeller(items: ExtendedCartItem[]): CartSellerGroup[] {
    const groupsMap = new Map<string, CartSellerGroup>();

    items.forEach((item) => {
      const sellerKey = item.storeId || item.businessId || item.ownerId || 'default_seller';
      const sellerName = item.sellerName || item.storeName || item.businessName || 'Pi Pioneer Merchant';

      if (!groupsMap.has(sellerKey)) {
        groupsMap.set(sellerKey, {
          sellerId: sellerKey,
          sellerName,
          businessId: item.businessId || 'unknown_business',
          storeId: item.storeId || 'unknown_store',
          storeName: item.storeName || sellerName,
          items: [],
          subtotal: 0,
          productSubtotal: 0,
          serviceSubtotal: 0,
          tax: 0,
          shipping: 0,
          grandTotal: 0
        });
      }

      const group = groupsMap.get(sellerKey)!;
      group.items.push(item);

      const itemTotal = item.unitPrice * item.quantity;
      group.subtotal += itemTotal;

      if (item.type === 'service' || (item.name && item.name.toLowerCase().includes('service'))) {
        group.serviceSubtotal += itemTotal;
      } else {
        group.productSubtotal += itemTotal;
      }
    });

    // Calculate group taxes and shipping
    groupsMap.forEach((group) => {
      group.tax = group.subtotal * 0.05; // 5% tax
      group.shipping = group.productSubtotal > 0 ? 5 : 0; // Flat 5 Pi shipping if products present
      group.grandTotal = group.subtotal + group.tax + group.shipping;
    });

    return Array.from(groupsMap.values());
  }

  /**
   * Calculate complete pricing summary across all items, discounts, and coupons
   */
  static calculateCartSummary(items: ExtendedCartItem[], appliedCoupon?: CartCoupon): CartPriceSummary {
    let productSubtotal = 0;
    let serviceSubtotal = 0;

    items.forEach((item) => {
      const itemPrice = (item.unitPrice || item.price || 0) * (item.quantity || 1);
      if (item.type === 'service' || (item.name && item.name.toLowerCase().includes('service'))) {
        serviceSubtotal += itemPrice;
      } else {
        productSubtotal += itemPrice;
      }
    });

    const subtotal = productSubtotal + serviceSubtotal;

    let couponDiscount = 0;
    if (appliedCoupon && subtotal >= (appliedCoupon.minOrderAmount || 0)) {
      if (appliedCoupon.discountType === 'percentage') {
        couponDiscount = (subtotal * appliedCoupon.discountValue) / 100;
        if (appliedCoupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscountAmount);
        }
      } else {
        couponDiscount = appliedCoupon.discountValue;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const tax = discountedSubtotal * 0.05; // 5% standard tax
    const shipping = productSubtotal > 0 ? 10 : 0; // Shipping only applies if physical products exist
    const grandTotal = discountedSubtotal + tax + shipping;

    // Estimate BMP Rewards (e.g. 10% of grandTotal credited in BMP rewards)
    const bmpRewardsEstimate = Math.floor(grandTotal * 10);

    return {
      productSubtotal,
      serviceSubtotal,
      subtotal,
      couponDiscount,
      appliedCoupon,
      shipping,
      tax,
      grandTotal,
      bmpRewardsEstimate,
      piTestnetAmount: Number(grandTotal.toFixed(4)),
      currency: 'π'
    };
  }

  /**
   * Validate coupon code against system campaign registry
   */
  static async validateCoupon(code: string, currentSubtotal: number): Promise<{ coupon?: CartCoupon; error?: string }> {
    const cleanCode = code.trim().toUpperCase();
    
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'coupons'), where('code', '==', cleanCode), where('active', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return { error: 'Invalid or expired coupon code.' };
      }
      
      const docData = snap.docs[0].data();
      
      if (docData.minOrderValue && currentSubtotal < docData.minOrderValue) {
        return { error: `Coupon requires minimum order of ${docData.minOrderValue} Pi.` };
      }
      
      if (docData.usedCount >= docData.maxUses) {
         return { error: 'Coupon usage limit reached.' };
      }

      const coupon: CartCoupon = {
        code: docData.code,
        discountType: docData.discountType === 'percentage' ? 'percentage' : 'fixed',
        discountValue: docData.discountValue,
        minOrderAmount: docData.minOrderValue,
        description: `${docData.discountType === 'percentage' ? docData.discountValue + '% off' : docData.discountValue + ' Pi off'} (Enterprise)`
      };
      
      return { coupon };
    } catch (err) {
      console.warn('Coupon validation error', err);
      return { error: 'Could not validate coupon at this time.' };
    }
  }

  /**
   * Validate cart items inventory & status
   */
  static validateCartItems(items: ExtendedCartItem[]): CartValidationResult {
    const issues: CartValidationIssue[] = [];

    items.forEach((item) => {
      if (item.stock !== undefined && item.stock <= 0) {
        issues.push({
          itemId: item.itemId,
          itemName: item.name || 'Product',
          type: 'out_of_stock',
          message: `${item.name} is currently out of stock.`
        });
      } else if (item.stock !== undefined && item.quantity > item.stock) {
        issues.push({
          itemId: item.itemId,
          itemName: item.name || 'Product',
          type: 'max_exceeded',
          message: `Only ${item.stock} units available for ${item.name}.`,
          suggestedQty: item.stock
        });
      }

      if (item.minOrderQty && item.quantity < item.minOrderQty) {
        issues.push({
          itemId: item.itemId,
          itemName: item.name || 'Product',
          type: 'min_not_met',
          message: `Minimum order quantity for ${item.name} is ${item.minOrderQty}.`,
          suggestedQty: item.minOrderQty
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Save item for Undo feature
   */
  static saveForUndo(userUid: string, item: ExtendedCartItem): void {
    this.undoStack.set(userUid, item);
  }

  /**
   * Restore last removed item
   */
  static async restoreUndoItem(userUid: string): Promise<boolean> {
    const lastItem = this.undoStack.get(userUid);
    if (!lastItem) return false;

    try {
      const activeCart = await cartService.getOrCreateCart(userUid, lastItem.businessId || 'unknown');
      await cartService.addToCart(activeCart.cartId, {
        cartId: activeCart.cartId,
        productId: lastItem.productId,
        name: lastItem.name,
        unitPrice: lastItem.unitPrice,
        quantity: lastItem.quantity,
        currency: lastItem.currency || 'Pi',
        imageUrl: lastItem.imageUrl,
        variantId: lastItem.variantId
      });
      this.undoStack.delete(userUid);
      return true;
    } catch (err) {
      console.error('Failed to restore undo item:', err);
      return false;
    }
  }

  /**
   * Buy Now Direct Checkout
   */
  static async createBuyNowSession(
    userUid: string,
    item: {
      productId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      imageUrl?: string;
      businessId?: string;
      storeId?: string;
      type?: string;
    }
  ): Promise<string> {
    const tempCart = await cartService.getOrCreateCart(userUid, item.businessId || 'buy_now_biz');
    await cartService.addToCart(tempCart.cartId, {
      cartId: tempCart.cartId,
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      currency: 'Pi',
      imageUrl: item.imageUrl
    });

    return await checkoutService.createSession(tempCart, userUid, [tempCart.cartId]);
  }
}
