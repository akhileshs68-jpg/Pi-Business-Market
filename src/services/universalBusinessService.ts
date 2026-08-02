/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Business, Store, Product, Service } from '../types';
import { withRetry } from '../lib/retry';

export interface BusinessOverview {
  business: Business;
  stores: Store[];
  productsCount: number;
  servicesCount: number;
  totalOrdersCount: number;
}

export class UniversalBusinessService {
  /**
   * Retrieves full business overview including stores, products count, and services count
   */
  static async getBusinessOverview(businessId: string): Promise<BusinessOverview | null> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const bizSnap = await getDoc(doc(db, 'businesses', businessId));
      if (!bizSnap.exists()) return null;

      const bizData = bizSnap.data();
      const business: Business = {
        ...bizData,
        createdAt: bizData.createdAt instanceof Timestamp ? bizData.createdAt.toDate().toISOString() : bizData.createdAt,
        updatedAt: bizData.updatedAt instanceof Timestamp ? bizData.updatedAt.toDate().toISOString() : bizData.updatedAt,
      } as Business;

      // Query Stores
      const storesQuery = query(collection(db, 'stores'), where('businessId', '==', businessId));
      const storeSnaps = await getDocs(storesQuery);
      const stores: Store[] = storeSnaps.docs.map(d => ({
        ...d.data(),
        createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
        updatedAt: d.data().updatedAt instanceof Timestamp ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
      } as Store));

      // Count Products
      let productsCount = 0;
      try {
        const prodQuery = query(collection(db, 'products'), where('businessId', '==', businessId));
        const prodSnap = await getDocs(prodQuery);
        productsCount = prodSnap.size;
      } catch (e) {
        console.warn('Product count query failed:', e);
      }

      // Count Services
      let servicesCount = 0;
      try {
        const servQuery = query(collection(db, 'services'), where('businessId', '==', businessId));
        const servSnap = await getDocs(servQuery);
        servicesCount = servSnap.size;
      } catch (e) {
        console.warn('Services count query failed:', e);
      }

      return {
        business,
        stores,
        productsCount,
        servicesCount,
        totalOrdersCount: 0
      };
    });
  }

  /**
   * Retrieves all businesses owned by a specific user (One Account Policy)
   */
  static async getUserOwnedBusinesses(userUid: string): Promise<Business[]> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'businesses'), 
        where('ownerUid', '==', userUid),
        where('businessStatus', '==', 'active')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Business;
      });
    });
  }

  /**
   * Updates wallet addresses (Pi Wallet and BMP Reward Wallet) for a business
   */
  static async updateBusinessWallets(
    businessId: string, 
    piWalletAddress: string, 
    bmpWalletAddress: string
  ): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const ref = doc(db, 'businesses', businessId);
      await updateDoc(ref, {
        walletAddress: piWalletAddress,
        bmpWalletAddress: bmpWalletAddress,
        updatedAt: serverTimestamp()
      });
    });
  }

  /**
   * Search and filter businesses by category, industry or type
   */
  static async searchBusinesses(filters: {
    category?: string;
    industry?: string;
    businessType?: string;
    city?: string;
    limitCount?: number;
  }): Promise<Business[]> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      let qConstraints: any[] = [where('businessStatus', '==', 'active')];

      if (filters.category) {
        qConstraints.push(where('category', '==', filters.category));
      }
      if (filters.industry) {
        qConstraints.push(where('industry', '==', filters.industry));
      }
      if (filters.businessType) {
        qConstraints.push(where('businessType', '==', filters.businessType));
      }
      if (filters.city) {
        qConstraints.push(where('city', '==', filters.city));
      }

      qConstraints.push(limit(filters.limitCount || 20));

      const q = query(collection(db, 'businesses'), ...qConstraints);
      const snap = await getDocs(q);

      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Business;
      });
    });
  }

  /**
   * Retrieves orders for a specific business with optional status filter
   */
  static async getBusinessOrders(businessId: string, statusFilter?: string): Promise<any[]> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      let constraints: any[] = [where('sellerBusinessId', '==', businessId)];
      if (statusFilter && statusFilter !== 'all') {
        constraints.push(where('status', '==', statusFilter));
      }
      constraints.push(limit(30));

      try {
        const q = query(collection(db, 'orders'), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        // Fallback search by sellerId or storeId
        console.warn('Primary business order query notice:', e);
        return [];
      }
    });
  }

  /**
   * Retrieves audit logs / notifications for a business
   */
  static async getBusinessAuditLogs(businessId: string): Promise<any[]> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      try {
        const q = query(
          collection(db, 'businessAuditLogs'),
          where('businessId', '==', businessId),
          limit(10)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        return [];
      }
    });
  }
}
