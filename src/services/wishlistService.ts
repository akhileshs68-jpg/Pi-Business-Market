/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { withRetry } from '../lib/retry';

const LOCAL_WISHLIST_KEY = 'pi_marketplace_wishlist';
const LOCAL_COMPARE_KEY = 'pi_marketplace_compare';

export class WishlistService {
  /**
   * Get wishlist items (array of entity IDs)
   */
  static getLocalWishlist(): string[] {
    try {
      const stored = localStorage.getItem(LOCAL_WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Toggle item in wishlist (local + firestore if user logged in)
   */
  static async toggleWishlist(entityId: string, userUid?: string): Promise<boolean> {
    const list = this.getLocalWishlist();
    const exists = list.includes(entityId);
    let updated: string[];

    if (exists) {
      updated = list.filter(id => id !== entityId);
    } else {
      updated = [...list, entityId];
    }

    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage wishlist save failed', e);
    }

    if (userUid) {
      try {
        await withRetry(async () => {
          const db = getFirebaseDb();
          const ref = doc(db, 'userWishlists', userUid);
          if (exists) {
            await updateDoc(ref, { items: arrayRemove(entityId), updatedAt: serverTimestamp() });
          } else {
            await setDoc(ref, { items: arrayUnion(entityId), updatedAt: serverTimestamp() }, { merge: true });
          }
        });
      } catch (e) {
        console.warn('Firestore wishlist sync failed', e);
      }
    }

    return !exists;
  }

  /**
   * Get compare items (array of entity IDs, max 4)
   */
  static getLocalCompare(): string[] {
    try {
      const stored = localStorage.getItem(LOCAL_COMPARE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Toggle compare item
   */
  static toggleCompare(entityId: string): { inCompare: boolean; compareList: string[] } {
    const list = this.getLocalCompare();
    const exists = list.includes(entityId);
    let updated: string[];

    if (exists) {
      updated = list.filter(id => id !== entityId);
    } else {
      if (list.length >= 4) {
        // Max 4 items allowed for compare
        updated = [...list.slice(1), entityId];
      } else {
        updated = [...list, entityId];
      }
    }

    try {
      localStorage.setItem(LOCAL_COMPARE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage compare save failed', e);
    }

    return { inCompare: !exists, compareList: updated };
  }
}
