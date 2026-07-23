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
import { ProductVariant, VariantGroup, VariantOption, Product } from '../types';

export const variantService = {
  /**
   * VARIANT GROUP MANAGEMENT
   */
  async createVariantGroup(group: Omit<VariantGroup, 'groupId'>): Promise<string> {
    const db = getFirebaseDb();
    const groupId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'variantGroups', groupId), { ...group, groupId });
    return groupId;
  },

  async getVariantGroups(productId: string): Promise<VariantGroup[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'variantGroups'), 
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map(doc => doc.data() as VariantGroup);
    return groups.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  /**
   * VARIANT OPTION MANAGEMENT
   */
  async createVariantOption(option: Omit<VariantOption, 'optionId'>): Promise<string> {
    const db = getFirebaseDb();
    const optionId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'variantOptions', optionId), { ...option, optionId });
    return optionId;
  },

  async getVariantOptions(productId: string): Promise<VariantOption[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'variantOptions'), 
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const options = snapshot.docs.map(doc => doc.data() as VariantOption);
    return options.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  /**
   * PRODUCT VARIANT MANAGEMENT
   */
  async createVariants(variants: Omit<ProductVariant, 'variantId' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    for (const v of variants) {
      const variantId = Math.random().toString(36).substring(2, 15);
      const vRef = doc(db, 'productVariants', variantId);
      batch.set(vRef, {
        ...v,
        variantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  },

  async getVariants(productId: string): Promise<ProductVariant[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'productVariants'), 
      where('productId', '==', productId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        variantId: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as ProductVariant;
    });
  },

  async updateVariant(variantId: string, updates: Partial<ProductVariant>): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'productVariants', variantId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteVariant(variantId: string): Promise<void> {
    const db = getFirebaseDb();
    // Soft delete
    await updateDoc(doc(db, 'productVariants', variantId), {
      status: 'deleted',
      updatedAt: serverTimestamp()
    });
  },

  /**
   * SKU GENERATION ENGINE
   */
  generateSKU(productName: string, attributes: Record<string, string>, prefix?: string): string {
    const pPart = productName.substring(0, 3).toUpperCase();
    const attrPart = Object.values(attributes)
      .map(v => v.substring(0, 2).toUpperCase())
      .join('-');
    const randPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    let sku = `${pPart}-${attrPart}-${randPart}`;
    if (prefix) sku = `${prefix}-${sku}`;
    
    return sku.replace(/[^A-Z0-9-]/g, '');
  },

  /**
   * MATRIX GENERATOR
   * Generates all combinations of options
   */
  generateMatrix(groups: VariantGroup[], options: VariantOption[]): Record<string, string>[] {
    const optionsByGroup = groups.map(g => 
      options.filter(o => o.groupId === g.groupId)
    );

    const combinations: Record<string, string>[] = [{}];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const groupOptions = optionsByGroup[i];
      const newCombinations: Record<string, string>[] = [];

      for (const combination of combinations) {
        for (const option of groupOptions) {
          newCombinations.push({
            ...combination,
            [group.name]: option.value
          });
        }
      }

      if (groupOptions.length > 0) {
        combinations.length = 0;
        combinations.push(...newCombinations);
      }
    }

    return combinations;
  },

  /**
   * DUPLICATE DETECTION
   */
  async checkDuplicateSKU(sku: string): Promise<boolean> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'productVariants'), where('sku', '==', sku));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
};
