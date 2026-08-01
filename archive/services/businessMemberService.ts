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
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { BusinessMember, BusinessRole } from '../types';
import { withRetry } from '../lib/retry';

export const businessMemberService = {
  async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businessMembers'), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      joinedAt: d.data().joinedAt instanceof Timestamp ? d.data().joinedAt.toDate().toISOString() : d.data().joinedAt,
      updatedAt: d.data().updatedAt instanceof Timestamp ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
    })) as BusinessMember[];
  },

  async updateMemberRole(businessId: string, memberId: string, actorUid: string, actorName: string, newRole: BusinessRole): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const memberRef = doc(db, 'businessMembers', memberId);
      
      await setDoc(memberRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Audit Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'MEMBER_ROLE_UPDATED',
        entityType: 'member',
        entityId: memberId,
        description: `Member role updated to ${newRole} by ${actorName}`,
        timestamp: serverTimestamp()
      });
    });
  },

  async updateMember(
    businessId: string, 
    memberId: string, 
    actorUid: string, 
    actorName: string, 
    updates: {
      role?: BusinessRole;
      title?: string;
      department?: string;
      status?: 'active' | 'suspended';
      permissions?: string[];
    }
  ): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const memberRef = doc(db, 'businessMembers', memberId);
      
      await setDoc(memberRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Audit Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'MEMBER_UPDATED',
        entityType: 'member',
        entityId: memberId,
        description: `Member details updated by ${actorName}`,
        timestamp: serverTimestamp()
      });
    });
  },

  async removeMember(businessId: string, memberId: string, actorUid: string, actorName: string): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const memberRef = doc(db, 'businessMembers', memberId);
      const memberSnap = await getDoc(memberRef);
      if (!memberSnap.exists()) throw new Error('Member not found');
      
      const memberData = memberSnap.data() as BusinessMember;
      if (memberData.role === 'Owner') throw new Error('Cannot remove the business owner');

      await deleteDoc(memberRef);

      // Audit Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'MEMBER_REMOVED',
        entityType: 'member',
        entityId: memberId,
        description: `Member ${memberData.userUid} removed from business by ${actorName}`,
        timestamp: serverTimestamp()
      });
    });
  }
};
