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
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { BusinessDocument, VerificationStatus } from '../types';
import { withRetry } from '../lib/retry';

export const businessVerificationService = {
  async uploadDocument(businessId: string, actorUid: string, actorName: string, docData: Omit<BusinessDocument, 'documentId' | 'uploadedAt' | 'version' | 'status'>): Promise<string> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const documentId = `DOC_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const docRef = doc(db, 'businessDocuments', documentId);
      
      const newDoc: BusinessDocument = {
        ...docData,
        documentId,
        version: 1,
        status: 'under_review',
        uploadedAt: new Date().toISOString()
      };

      await setDoc(docRef, {
        ...newDoc,
        uploadedAt: serverTimestamp()
      });

      // Audit Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'document',
        entityId: documentId,
        description: `Business document (${docData.type}) uploaded by ${actorName}`,
        timestamp: serverTimestamp()
      });

      return documentId;
    });
  },

  async getBusinessDocuments(businessId: string): Promise<BusinessDocument[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businessDocuments'), where('businessId', '==', businessId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      uploadedAt: d.data().uploadedAt instanceof Timestamp ? d.data().uploadedAt.toDate().toISOString() : d.data().uploadedAt,
    })) as BusinessDocument[];
  },

  async updateVerificationStatus(businessId: string, actorUid: string, actorName: string, status: VerificationStatus, reason?: string): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const businessRef = doc(db, 'businesses', businessId);
      
      await updateDoc(businessRef, {
        verificationStatus: status,
        updatedAt: serverTimestamp(),
        updatedBy: actorName
      });

      // Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'VERIFICATION_STATUS_UPDATED',
        entityType: 'business',
        entityId: businessId,
        description: `Verification status changed to ${status} by ${actorName}. Reason: ${reason || 'N/A'}`,
        timestamp: serverTimestamp()
      });
    });
  },

  async deleteDocument(businessId: string, documentId: string, actorUid: string, actorName: string): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const docRef = doc(db, 'businessDocuments', documentId);
      await deleteDoc(docRef);

      // Audit Log
      const logRef = doc(collection(db, 'businessAuditLogs'));
      await setDoc(logRef, {
        logId: logRef.id,
        businessId,
        actorUid,
        actorName,
        action: 'DOCUMENT_DELETED',
        entityType: 'document',
        entityId: documentId,
        description: `Business document (${documentId}) deleted by ${actorName}`,
        timestamp: serverTimestamp()
      });
    });
  }
};
