/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { AuditLog } from '../types';

export const auditService = {
  /**
   * LOG ACTION
   * Records a security or administrative action for audit visibility
   */
  async logAction(
    actorUid: string,
    actorName: string,
    action: string,
    targetType: string,
    targetId: string,
    description: string,
    options?: {
      before?: any;
      after?: any;
      severity?: 'info' | 'warning' | 'critical';
    }
  ): Promise<string> {
    const db = getFirebaseDb();
    const logId = `AUDIT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const logRef = doc(db, 'auditLogs', logId);

    const log: AuditLog = {
      logId,
      actorUid,
      actorName,
      action,
      targetType,
      targetId,
      description,
      before: options?.before,
      after: options?.after,
      severity: options?.severity || 'info',
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(logRef, {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to record audit log', err);
    }

    return logId;
  },

  /**
   * RETRIEVE AUDIT LOGS
   */
  async getAuditLogs(filters?: { 
    actorUid?: string; 
    targetType?: string; 
    severity?: string;
  }, limitCount: number = 50): Promise<AuditLog[]> {
    const db = getFirebaseDb();
    let q = query(collection(db, 'auditLogs'));

    if (filters?.actorUid) {
      q = query(q, where('actorUid', '==', filters.actorUid));
    }
    if (filters?.targetType) {
      q = query(q, where('targetType', '==', filters.targetType));
    }

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
      } as AuditLog;
    });
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limitCount);
  }
};
