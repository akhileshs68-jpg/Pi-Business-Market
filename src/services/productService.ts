/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Product } from '../types';

export const productService = {
  /**
   * Creates a new product
   */
  async createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getFirebaseDb();
    const productRef = doc(collection(db, 'products'));
    const productId = productRef.id;

    const newProduct: Product = {
      ...productData,
      productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(productRef, {
      ...newProduct,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return productId;
  },

  /**
   * Updates an existing product
   */
  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const db = getFirebaseDb();
    const productRef = doc(db, 'products', productId);
    
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Soft deletes a product
   */
  async softDeleteProduct(productId: string): Promise<void> {
    return this.updateProduct(productId, { status: 'deleted' });
  },

  /**
   * Gets all products for a store
   */
  async getStoreProducts(storeId: string): Promise<Product[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'products'), 
      where('storeId', '==', storeId)
    );
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        productId: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Product;
    });
    
    return products
      .filter(p => p.status !== 'deleted')
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status.localeCompare(b.status);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  /**
   * Gets a single product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        productId: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Product;
    }
    
    return null;
  },

  /**
   * Checks if a SKU is unique within a store
   */
  async isSkuUnique(storeId: string, sku: string, excludeProductId?: string): Promise<boolean> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'products'),
      where('storeId', '==', storeId),
      where('sku', '==', sku)
    );
    
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.filter(d => d.id !== excludeProductId);
    return existing.length === 0;
  },

  /**
   * Checks if a slug is unique
   */
  async isSlugUnique(productSlug: string, excludeProductId?: string): Promise<boolean> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'products'),
      where('productSlug', '==', productSlug)
    );
    
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.filter(d => d.id !== excludeProductId);
    return existing.length === 0;
  }
};
