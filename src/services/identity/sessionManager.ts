/**
 * Enterprise Session & Device Manager
 * Tracks active identity sessions, device characteristics, auto-expiries, and audit logs.
 */

import { SessionInfo, DeviceInfo } from './identityTypes';
import { logger } from '../../core/logger';
import { getFirebaseDb } from '../../firebase/config';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export class SessionManager {
  /**
   * Detect client device information safely
   */
  public getClientDeviceInfo(): DeviceInfo {
    const isClient = typeof window !== 'undefined';
    const userAgent = isClient ? navigator.userAgent : 'Server/Unknown';
    const isMobile = /Mobi|Android|iPhone/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);

    return {
      deviceId: 'dev_' + Math.random().toString(36).substring(2, 12),
      deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      userAgent,
      ipAddress: '127.0.0.1', // Proxied at gateway
      lastActiveAt: new Date().toISOString()
    };
  }

  /**
   * Create an active session document for user identity
   */
  public async createSession(uid: string): Promise<SessionInfo> {
    const device = this.getClientDeviceInfo();
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 14);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const session: SessionInfo = {
      sessionId,
      uid,
      createdAt: now.toISOString(),
      expiresAt,
      device,
      status: 'active'
    };

    try {
      const db = getFirebaseDb();
      const ref = doc(db, 'sessions', sessionId);
      await setDoc(ref, {
        ...session,
        updatedAt: serverTimestamp()
      });

      logger.audit('AuthSession', `Created session ${sessionId} for user ${uid}`, uid, { device });
    } catch (e: any) {
      logger.error('SessionManager', `Failed to persist session: ${e.message}`);
    }

    return session;
  }

  /**
   * Revoke session
   */
  public async revokeSession(sessionId: string, uid: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const ref = doc(db, 'sessions', sessionId);
      await updateDoc(ref, {
        status: 'revoked',
        revokedAt: serverTimestamp()
      });

      logger.audit('AuthSession', `Revoked session ${sessionId} for user ${uid}`, uid);
    } catch (e: any) {
      logger.error('SessionManager', `Failed to revoke session: ${e.message}`);
    }
  }
}

export const sessionManager = new SessionManager();
