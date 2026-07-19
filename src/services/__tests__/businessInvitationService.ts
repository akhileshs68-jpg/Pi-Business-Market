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
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { BusinessInvitation, BusinessRole } from '../types';
import { withRetry } from '../lib/retry';

export const businessInvitationService = {
  async inviteMember(businessId: string, actorUid: string, actorName: string, invite: { email?: string; phone?: string; piUsername?: string; role: BusinessRole }): Promise<string> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const invitationId = `INV_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const inviteRef = doc(db, 'businessInvitations', invitationId);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const invitationData: BusinessInvitation = {
        invitationId,
        businessId,
        ...invite,
        status: 'pending',
        invitedBy: actorName,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      };

      await setDoc(inviteRef, {
        ...invitationData,
        createdAt: serverTimestamp()
      });

      // Audit Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'MEMBER_INVITED',
        entityType: 'invitation',
        entityId: invitationId,
        description: `Invitation sent to ${invite.email || invite.piUsername || invite.phone} as ${invite.role}`,
        timestamp: serverTimestamp()
      });

      return invitationId;
    });
  },

  async getBusinessInvitations(businessId: string): Promise<BusinessInvitation[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businessInvitations'), where('businessId', '==', businessId), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
    })) as BusinessInvitation[];
  },

  async acceptInvitation(invitationId: string, userUid: string, actorName: string): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const inviteRef = doc(db, 'businessInvitations', invitationId);
      
      await runTransaction(db, async (transaction) => {
        const inviteSnap = await transaction.get(inviteRef);
        if (!inviteSnap.exists()) throw new Error('Invitation not found');
        
        const inviteData = inviteSnap.data() as BusinessInvitation;
        if (inviteData.status !== 'pending') throw new Error('Invitation is no longer pending');
        if (new Date(inviteData.expiresAt) < new Date()) throw new Error('Invitation has expired');

        const businessId = inviteData.businessId;
        const memberId = `${businessId}_${userUid}`;
        const memberRef = doc(db, 'businessMembers', memberId);

        // 1. Update Invitation
        transaction.update(inviteRef, { status: 'accepted', updatedAt: serverTimestamp() });

        // 2. Create Member
        transaction.set(memberRef, {
          memberId,
          businessId,
          userUid,
          role: inviteData.role,
          permissions: [], // Default based on role in a real app
          status: 'active',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 3. Log
        const logRef = doc(collection(db, 'businessAuditLogs'));
        transaction.set(logRef, {
          logId: logRef.id,
          businessId,
          actorUid: userUid,
          actorName,
          action: 'INVITATION_ACCEPTED',
          entityType: 'invitation',
          entityId: invitationId,
          description: `Invitation accepted by ${actorName}`,
          timestamp: serverTimestamp()
        });
      });
    });
  }
};
