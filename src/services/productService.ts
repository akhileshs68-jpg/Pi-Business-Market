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
    if (storeId.startsWith('mock_')) {
      return [
        {
          productId: 'mock_prod_1',
          storeId,
          businessId: 'mock_biz_1',
          ownerUid: 'mock_owner',
          sku: 'PI-TSHIRT-001',
          productName: 'Pi Branded T-Shirt',
          productSlug: 'pi-branded-t-shirt',
          shortDescription: 'The official premium Pi Network logo T-shirt.',
          description: 'High-quality 100% cotton t-shirt with the official Pi Network logo.',
          brand: 'PiNetwork',
          type: 'physical',
          category: 'Apparel',
          subCategory: 'Shirts',
          tags: ['pi', 'merch', 'tshirt'],
          price: 15,
          comparePrice: 20,
          currency: 'USD',
          taxClass: 'Standard',
          stock: 150,
          stockStatus: 'in_stock',
          minOrderQty: 1,
          maxOrderQty: 10,
          featured: true,
          status: 'published',
          visibility: 'public',
          seoTitle: 'Pi Branded T-Shirt',
          seoDescription: 'The official premium Pi Network logo T-shirt.',
          mainImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
          imageUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          productId: 'mock_prod_2',
          storeId,
          businessId: 'mock_biz_1',
          ownerUid: 'mock_owner',
          sku: 'PI-CAP-002',
          productName: 'Pi Pioneer Cap',
          productSlug: 'pi-pioneer-cap',
          shortDescription: 'A stylish baseball cap for Pi pioneers.',
          description: 'A stylish, adjustable baseball cap for Pi pioneers.',
          brand: 'PiNetwork',
          type: 'physical',
          category: 'Apparel',
          subCategory: 'Caps',
          tags: ['pi', 'merch', 'cap'],
          price: 8,
          comparePrice: 12,
          currency: 'USD',
          taxClass: 'Standard',
          stock: 85,
          stockStatus: 'in_stock',
          minOrderQty: 1,
          maxOrderQty: 5,
          featured: true,
          status: 'published',
          visibility: 'public',
          seoTitle: 'Pi Pioneer Cap',
          seoDescription: 'A stylish baseball cap for Pi pioneers.',
          mainImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
          imageUrls: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }

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
