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
        const newBiz: any = {
          ...businessData,
          id: businessId,
          ownerUid,
          rating: 0,
          reviewCount: 0,
          followers: 0,
          employeeCount: 1,
          storeCount: 0,
        };
        const sanitizedBiz: any = {};
        Object.entries(newBiz).forEach(([k,v]) => {
           if (v !== undefined) sanitizedBiz[k] = v;
        });
        sanitizedBiz.createdAt = serverTimestamp();
        sanitizedBiz.updatedAt = serverTimestamp();
        sanitizedBiz.createdBy = actorName;
        sanitizedBiz.updatedBy = actorName;
        
        transaction.set(businessRef, sanitizedBiz);

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

      // Trigger Business Registration BMP Reward
      try {
        const { gamificationService } = await import('./gamificationService');
        await gamificationService.processBusinessRegistrationReward(ownerUid, businessId);
      } catch (err) {
        console.warn('Failed to trigger business registration reward:', err);
      }

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
    const businessIds = new Set<string>();

    // 1. Query members to find all businesses the user is part of
    try {
      const memberQuery = query(collection(db, 'businessMembers'), where('userUid', '==', userUid), where('status', '==', 'active'));
      const memberSnap = await getDocs(memberQuery);
      memberSnap.docs.forEach(d => {
        const bId = d.data().businessId;
        if (bId) businessIds.add(bId);
      });
    } catch (e) {
      console.warn("businessMembers query failed in getMyBusinesses:", e);
    }

    // 2. Query businesses where ownerUid is the userUid directly
    try {
      const ownerQuery = query(collection(db, 'businesses'), where('ownerUid', '==', userUid));
      const ownerSnap = await getDocs(ownerQuery);
      ownerSnap.docs.forEach(d => {
        businessIds.add(d.id);
      });
    } catch (e) {
      console.warn("ownerUid query on businesses failed in getMyBusinesses:", e);
    }

    if (businessIds.size === 0) return [];

    // Batch get businesses
    const businesses: Business[] = [];
    for (const id of Array.from(businessIds)) {
      const b = await this.getBusiness(id);
      if (b && b.businessStatus !== 'archived' && b.businessStatus !== 'deleted') {
        businesses.push(b);
      }
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

      // Trigger Business Approval Reward if verified or approved
      if (updates.verificationStatus === 'Verified' || updates.verificationStatus === 'Approved') {
        try {
          const bizSnap = await getDoc(businessRef);
          if (bizSnap.exists()) {
            const bizData = bizSnap.data();
            const { gamificationService } = await import('./gamificationService');
            await gamificationService.processBusinessApprovalReward(bizData.ownerUid || actorUid, businessId);
          }
        } catch (rewardErr) {
          console.warn('Failed to trigger business approval reward:', rewardErr);
        }
      }

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
