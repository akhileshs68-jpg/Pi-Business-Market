/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { AccessRole, SecuritySession, SecurityEvent } from './types';
import { auditService } from '../services/auditService';

export const zeroTrustService = {
  async validateRole(userUid: string, requiredRoles: AccessRole[]): Promise<boolean> {
    if (!userUid) return false;
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', userUid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return false;
      const userData = userSnap.data();
      const userRoles: AccessRole[] = userData.roles || [userData.role];
      if (userRoles.includes('SuperAdmin')) return true;
      return requiredRoles.some(role => userRoles.includes(role));
    } catch (err) {
      console.error('ZeroTrust: Role validation failed', err);
      this.logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'high',
        userUid,
        details: { reason: 'Role validation exception', requiredRoles }
      });
      return false;
    }
  },

  async validateSession(userUid: string, sessionId: string): Promise<boolean> {
    if (!userUid || !sessionId) return false;
    try {
      const db = getFirebaseDb();
      const sessionRef = doc(db, 'securitySessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) return false;
      const sessionData = sessionSnap.data() as SecuritySession;
      if (sessionData.userUid !== userUid) return false;
      if (sessionData.status !== 'active') return false;
      const now = new Date();
      if (new Date(sessionData.expiresAt) < now) {
        await updateDoc(sessionRef, { status: 'expired' });
        return false;
      }
      await updateDoc(sessionRef, { lastActiveAt: serverTimestamp() });
      return true;
    } catch (err) {
      console.error('ZeroTrust: Session validation failed', err);
      return false;
    }
  },

  validatePayload(payload: any, schema: Record<string, string>): boolean {
    if (!payload) return false;
    for (const [key, type] of Object.entries(schema)) {
      if (typeof payload[key] !== type && type !== 'any') return false;
    }
    return true;
  },

  async logSecurityEvent(event: Omit<SecurityEvent, 'eventId' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const db = getFirebaseDb();
      const eventId = `SEC_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const docRef = doc(db, 'securityEvents', eventId);
      await setDoc(docRef, {
        ...event,
        eventId,
        resolved: false,
        timestamp: new Date().toISOString()
      });
      if (event.severity === 'high' || event.severity === 'critical') {
        await auditService.logAction(
          'SYSTEM',
          'Zero Trust Engine',
          event.eventType,
          'system',
          eventId,
          `Critical security event generated: ${JSON.stringify(event.details)}`,
          { severity: 'critical' }
        );
      }
    } catch (err) {
      console.error('ZeroTrust: Failed to log security event', err);
    }
  },

  async getSecurityEvents(limitCount = 50): Promise<SecurityEvent[]> {
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'securityEvents'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as SecurityEvent).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error(err);
      return [];
    }
  }
};
