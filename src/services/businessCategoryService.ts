/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { BusinessCategory } from '../types';

export const businessCategoryService = {
  async getCategories(parentId?: string): Promise<BusinessCategory[]> {
    const db = getFirebaseDb();
    const constraints = [where('isActive', '==', true)];
    if (parentId) {
      constraints.push(where('parentId', '==', parentId));
    } else {
      // In a real app, you might have a flag for root categories
      // For now we assume no parentId means root
      constraints.push(where('parentId', '==', null));
    }

    const q = query(collection(db, 'businessCategories'), ...constraints);
    const snap = await getDocs(q);
    const categories = snap.docs.map(d => d.data() as BusinessCategory);
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getAllCategories(): Promise<BusinessCategory[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businessCategories'), where('isActive', '==', true));
    const snap = await getDocs(q);
    const categories = snap.docs.map(d => d.data() as BusinessCategory);
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }
};
