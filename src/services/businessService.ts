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
  Timestamp,
  runTransaction,
  writeBatch,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Business, BusinessStatus, VerificationStatus } from '../types';
import { withRetry } from '../lib/retry';

export const businessService = {
  /**
   * Create a new business with a transaction to ensure member record is also created
   */
  async createBusiness(ownerUid: string, actorName: string, businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'rating' | 'reviewCount' | 'followers' | 'employeeCount' | 'storeCount'>): Promise<string> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const businessId = `BIZ_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const businessRef = doc(db, 'businesses', businessId);
      const memberRef = doc(db, 'businessMembers', `${businessId}_${ownerUid}`);
      
      await runTransaction(db, async (transaction) => {
        // 1. Create Business
        transaction.set(businessRef, {
          ...businessData,
          id: businessId,
          ownerUid,
          rating: 0,
          reviewCount: 0,
          followers: 0,
          employeeCount: 1,
          storeCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: actorName,
          updatedBy: actorName
        });

        // 2. Create Owner Member Record
        transaction.set(memberRef, {
          memberId: `${businessId}_${ownerUid}`,
          businessId,
          userUid: ownerUid,
          role: 'Owner',
          permissions: ['*'], // Root permissions
          status: 'active',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 3. Create Audit Log (System collection for business context)
        const logRef = doc(collection(db, 'businessAuditLogs'));
        transaction.set(logRef, {
          logId: logRef.id,
          businessId,
          actorUid: ownerUid,
          actorName,
          action: 'BUSINESS_CREATED',
          entityType: 'business',
          entityId: businessId,
          description: `Business ${businessData.businessName} initialized by ${actorName}`,
          timestamp: serverTimestamp()
        });
      });

      return businessId;
    });
  },

  async getBusiness(businessId: string): Promise<Business | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'businesses', businessId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Business;
  },

  async getMyBusinesses(userUid: string): Promise<Business[]> {
    const db = getFirebaseDb();
    // Query members first to find all businesses the user is part of
    const memberQuery = query(collection(db, 'businessMembers'), where('userUid', '==', userUid), where('status', '==', 'active'));
    const memberSnap = await getDocs(memberQuery);
    
    const businessIds = memberSnap.docs.map(d => d.data().businessId);
    if (businessIds.length === 0) return [];

    // Batch get businesses
    const businesses: Business[] = [];
    for (const id of businessIds) {
      const b = await this.getBusiness(id);
      if (b) businesses.push(b);
    }
    return businesses;
  },

  async updateBusiness(businessId: string, actorUid: string, actorName: string, updates: Partial<Business>): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const businessRef = doc(db, 'businesses', businessId);
      
      await setDoc(businessRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: actorName
      }, { merge: true });

      // Log update
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'BUSINESS_UPDATED',
        entityType: 'business',
        entityId: businessId,
        description: `Business profile updated by ${actorName}`,
        metadata: { updatedFields: Object.keys(updates) },
        timestamp: serverTimestamp()
      });
    });
  },

  async searchBusinesses(searchTerm: string, limitCount: number = 20): Promise<Business[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'businesses'),
      where('businessStatus', '==', 'active'),
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      orderBy('displayName'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
      updatedAt: d.data().updatedAt instanceof Timestamp ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
    })) as Business[];
  }
};
