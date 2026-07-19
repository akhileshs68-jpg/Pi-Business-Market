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
  deleteDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Category, AttributeGroup, ProductAttribute, CategoryAttributeMapping } from '../types';

export const catalogService = {
  /**
   * CATEGORY MANAGEMENT
   */
  async createCategory(category: Omit<Category, 'categoryId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getFirebaseDb();
    const categoryId = Math.random().toString(36).substring(2, 15);
    
    await setDoc(doc(db, 'categories', categoryId), {
      ...category,
      categoryId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return categoryId;
  },

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'categories', categoryId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getCategories(): Promise<Category[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        categoryId: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Category;
    });
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const db = getFirebaseDb();
    // Soft delete is preferred in enterprise systems
    await updateDoc(doc(db, 'categories', categoryId), {
      status: 'archived',
      updatedAt: serverTimestamp()
    });
  },

  /**
   * ATTRIBUTE GROUP MANAGEMENT
   */
  async createAttributeGroup(group: Omit<AttributeGroup, 'groupId'>): Promise<string> {
    const db = getFirebaseDb();
    const groupId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'attributeGroups', groupId), { ...group, groupId });
    return groupId;
  },

  async getAttributeGroups(): Promise<AttributeGroup[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'attributeGroups'), orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AttributeGroup);
  },

  /**
   * ATTRIBUTE MANAGEMENT
   */
  async createAttribute(attribute: Omit<ProductAttribute, 'attributeId'>): Promise<string> {
    const db = getFirebaseDb();
    const attributeId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'attributes', attributeId), { ...attribute, attributeId });
    return attributeId;
  },

  async getAttributesByGroup(groupId: string): Promise<ProductAttribute[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'attributes'), 
      where('groupId', '==', groupId),
      orderBy('displayOrder', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ProductAttribute);
  },

  async getAllAttributes(): Promise<ProductAttribute[]> {
    const db = getFirebaseDb();
    const snapshot = await getDocs(collection(db, 'attributes'));
    return snapshot.docs.map(doc => doc.data() as ProductAttribute);
  },

  /**
   * CATEGORY ATTRIBUTE MAPPING
   */
  async mapAttributeToCategory(mapping: Omit<CategoryAttributeMapping, 'mappingId'>): Promise<void> {
    const db = getFirebaseDb();
    const mappingId = `${mapping.categoryId}_${mapping.attributeId}`;
    await setDoc(doc(db, 'categoryAttributes', mappingId), { ...mapping, mappingId });
  },

  async getCategoryAttributes(categoryId: string): Promise<ProductAttribute[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'categoryAttributes'), 
      where('categoryId', '==', categoryId),
      orderBy('displayOrder', 'asc')
    );
    const mappingSnapshot = await getDocs(q);
    const mappings = mappingSnapshot.docs.map(doc => doc.data() as CategoryAttributeMapping);
    
    if (mappings.length === 0) return [];

    // Batch fetch attributes for performance
    const attributeIds = mappings.map(m => m.attributeId);
    const attributes: ProductAttribute[] = [];
    
    for (const id of attributeIds) {
      const attrDoc = await getDoc(doc(db, 'attributes', id));
      if (attrDoc.exists()) {
        attributes.push(attrDoc.data() as ProductAttribute);
      }
    }
    
    return attributes;
  },

  /**
   * UTILITIES
   */
  async isSlugUnique(slug: string, collectionName: string, idField: string, currentId?: string): Promise<boolean> {
    const db = getFirebaseDb();
    const q = query(collection(db, collectionName), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return true;
    if (currentId && snapshot.docs.length === 1 && snapshot.docs[0].id === currentId) return true;
    
    return false;
  }
};
