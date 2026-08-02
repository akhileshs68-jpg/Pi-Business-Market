/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { DataExportRequest } from './types';
import { auditService } from '../services/auditService';

export const complianceService = {
  /**
   * Request data export (GDPR / CCPA)
   */
  async requestDataExport(userUid: string, userEmail: string): Promise<string> {
    try {
      const db = getFirebaseDb();
      const requestId = `DSR_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const docRef = doc(db, 'dataExportRequests', requestId);
      
      const req: DataExportRequest = {
        requestId,
        userUid,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      await setDoc(docRef, {
        ...req,
        requestedAt: serverTimestamp()
      });

      await auditService.logAction(
        userUid,
        userEmail,
        'DATA_EXPORT_REQUESTED',
        'compliance',
        requestId,
        'User requested data export'
      );

      return requestId;
    } catch (err) {
      console.error('Compliance: Data export request failed', err);
      throw err;
    }
  },

  /**
   * Request account deletion (Right to be Forgotten)
   */
  async requestAccountDeletion(userUid: string, userEmail: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const reqId = `DEL_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const docRef = doc(db, 'accountDeletionRequests', reqId);
      
      await setDoc(docRef, {
        requestId: reqId,
        userUid,
        status: 'pending',
        requestedAt: serverTimestamp()
      });

      await auditService.logAction(
        userUid,
        userEmail,
        'ACCOUNT_DELETION_REQUESTED',
        'compliance',
        reqId,
        'User requested account deletion'
      );
    } catch (err) {
      console.error('Compliance: Account deletion request failed', err);
      throw err;
    }
  },

  /**
   * Manage Privacy Consents
   */
  async updatePrivacyConsents(userUid: string, consents: Record<string, boolean>): Promise<void> {
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, 'privacyConsents', userUid);
      
      await setDoc(docRef, {
        userUid,
        consents,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error('Compliance: Failed to update privacy consents', err);
      throw err;
    }
  }
};
