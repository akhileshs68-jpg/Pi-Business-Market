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
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { 
  Notification, 
  EnterpriseNotificationType, 
  NotificationPriority,
  NotificationPreference
} from '../types';

export const notificationService = {
  /**
   * SEND NOTIFICATION
   * Standardized delivery engine for all app modules
   */
  async notify(
    recipientUid: string,
    type: EnterpriseNotificationType,
    title: string,
    body: string,
    options?: {
      senderUid?: string;
      entityType?: string;
      entityId?: string;
      priority?: NotificationPriority;
      linkTo?: string;
      actionUrl?: string;
      pinned?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const db = getFirebaseDb();
    const notificationId = `NOTIF_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const notificationRef = doc(db, 'notifications', notificationId);

    // Retrieve user preferences
    try {
      const prefs = await this.getPreferences(recipientUid);
      if (prefs.mutedTypes?.includes(type)) {
        console.log(`Notification ${notificationId} of type ${type} is muted by user ${recipientUid}`);
        return '';
      }
    } catch (e) {
      console.warn('Could not load user notification preferences, falling back to delivery.', e);
    }

    const link = options?.actionUrl || options?.linkTo;

    const payload: Record<string, any> = {
      notificationId,
      id: notificationId,
      recipientUid,
      type,
      title,
      body,
      message: body,
      priority: options?.priority || 'medium',
      status: 'unread',
      pinned: options?.pinned || false,
      createdAt: serverTimestamp()
    };

    if (options?.senderUid !== undefined) payload.senderUid = options.senderUid;
    if (options?.entityType !== undefined) payload.entityType = options.entityType;
    if (options?.entityId !== undefined) payload.entityId = options.entityId;
    if (link !== undefined) {
      payload.linkTo = link;
      payload.actionUrl = link;
    }
    if (options?.metadata !== undefined) payload.metadata = options.metadata;

    try {
      await setDoc(notificationRef, payload);
      return notificationId;
    } catch (e) {
      console.warn('[NotificationService] notify dispatch warning:', e);
      return notificationId;
    }
  },

  /**
   * NOTIFY SUPER ADMINS & PLATFORM OPERATORS
   */
  async notifyAdmins(
    type: EnterpriseNotificationType,
    title: string,
    body: string,
    options?: {
      senderUid?: string;
      entityType?: string;
      entityId?: string;
      priority?: NotificationPriority;
      linkTo?: string;
      actionUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<number> {
    try {
      const db = getFirebaseDb();
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('role', 'in', ['super_admin', 'admin', 'platform_admin']));
      const snap = await getDocs(q);
      
      let adminUids = snap.docs.map(d => d.id);
      if (!adminUids.includes('akhileshs68')) {
        adminUids.push('akhileshs68');
      }
      adminUids = Array.from(new Set(adminUids));

      for (const adminUid of adminUids) {
        await this.notify(adminUid, type, title, body, {
          ...options,
          priority: options?.priority || 'high'
        });
      }
      return adminUids.length;
    } catch (e) {
      console.warn('Failed notifying admins, using platform owner fallback:', e);
      await this.notify('akhileshs68', type, title, body, {
        ...options,
        priority: options?.priority || 'high'
      });
      return 1;
    }
  },

  /**
   * REAL-TIME NOTIFICATIONS
   * Subscription with priority-aware and stateful sorting
   */
  subscribeToNotifications(recipientUid: string, callback: (notifications: Notification[]) => void) {
    if (!recipientUid) {
      callback([]);
      return () => {};
    }

    const db = getFirebaseDb();
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', recipientUid)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => this.mapDocToNotification(doc));
      const getTime = (isoStr?: string) => {
        if (!isoStr) return Date.now();
        const t = new Date(isoStr).getTime();
        return isNaN(t) ? Date.now() : t;
      };

      const filteredAndSorted = notifications
        .filter(n => n.status !== 'dismissed')
        .sort((a, b) => {
          // 1. Pinned notifications on top
          const aPinned = a.pinned ? 1 : 0;
          const bPinned = b.pinned ? 1 : 0;
          if (aPinned !== bPinned) {
            return bPinned - aPinned;
          }

          // 2. Unread notifications before read/archived
          if (a.status !== b.status) {
            if (a.status === 'unread' && b.status !== 'unread') return -1;
            if (a.status !== 'unread' && b.status === 'unread') return 1;
          }

          // 3. Chronological descending
          return getTime(b.createdAt) - getTime(a.createdAt);
        })
        .slice(0, 100);
      callback(filteredAndSorted);
    }, (error) => {
      console.warn('[NotificationService] onSnapshot error:', error);
      callback([]);
    });
  },

  /**
   * ACTIONS
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        status: 'read',
        readAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[NotificationService] markAsRead warning:', e);
    }
  },

  async archiveNotification(notificationId: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        status: 'archived',
        archivedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[NotificationService] archiveNotification warning:', e);
    }
  },

  async dismissNotification(notificationId: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        status: 'dismissed',
        dismissedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[NotificationService] dismissNotification warning:', e);
    }
  },

  async togglePinNotification(notificationId: string, pinned: boolean): Promise<void> {
    try {
      const db = getFirebaseDb();
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        pinned
      });
    } catch (e) {
      console.warn('[NotificationService] togglePinNotification warning:', e);
    }
  },

  async deleteNotificationPermanently(notificationId: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (e) {
      console.warn('[NotificationService] deleteNotificationPermanently warning:', e);
    }
  },

  async markAllAsRead(recipientUid: string): Promise<void> {
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'notifications'),
        where('recipientUid', '==', recipientUid),
        where('status', '==', 'unread')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { 
          status: 'read', 
          readAt: serverTimestamp() 
        });
      });

      await batch.commit();
    } catch (e) {
      console.warn('[NotificationService] markAllAsRead warning:', e);
    }
  },

  /**
   * BROADCAST AND TARGETED NOTIFICATIONS (ADMIN CONTROLS)
   */
  async broadcastNotification(
    senderUid: string,
    type: EnterpriseNotificationType,
    title: string,
    body: string,
    options?: {
      targetRole?: string; // 'All', 'Admin', 'Seller', 'Buyer', etc.
      priority?: NotificationPriority;
      linkTo?: string;
      pinned?: boolean;
    }
  ): Promise<number> {
    const db = getFirebaseDb();
    const usersCol = collection(db, 'users');
    let targetUids: string[] = [];

    if (options?.targetRole && options.targetRole !== 'All') {
      const q = query(usersCol, where('role', '==', options.targetRole));
      const snap = await getDocs(q);
      targetUids = snap.docs.map(d => d.id);
    } else {
      const snap = await getDocs(usersCol);
      targetUids = snap.docs.map(d => d.id);
    }

    if (targetUids.length === 0) return 0;

    const batchSize = 400;
    for (let i = 0; i < targetUids.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = targetUids.slice(i, i + batchSize);
      
      chunk.forEach(uid => {
        const notificationId = `NOTIF_BCAST_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
        const ref = doc(db, 'notifications', notificationId);
        batch.set(ref, {
          notificationId,
          recipientUid: uid,
          type,
          title,
          body,
          priority: options?.priority || 'medium',
          status: 'unread',
          linkTo: options?.linkTo,
          pinned: options?.pinned || false,
          createdAt: serverTimestamp(),
          broadcastedBy: senderUid
        });
      });
      
      await batch.commit();
    }

    return targetUids.length;
  },

  /**
   * PREFERENCES
   */
  async getPreferences(userUid: string): Promise<NotificationPreference> {
    const db = getFirebaseDb();
    const prefRef = doc(db, 'notificationPreferences', userUid);
    const snap = await getDoc(prefRef);

    if (snap.exists()) {
      return snap.data() as NotificationPreference;
    }

    const defaultPrefs: NotificationPreference = {
      preferenceId: userUid,
      userUid,
      channels: {
        inApp: true,
        email: true,
        push: true
      },
      mutedTypes: [],
      updatedAt: new Date().toISOString()
    };

    await setDoc(prefRef, defaultPrefs);
    return defaultPrefs;
  },

  async updatePreferences(userUid: string, updates: Partial<NotificationPreference>): Promise<void> {
    const db = getFirebaseDb();
    const prefRef = doc(db, 'notificationPreferences', userUid);
    await updateDoc(prefRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * HELPERS
   */
  mapDocToNotification(doc: any): Notification {
    const data = doc.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
    const readAt = data.readAt instanceof Timestamp ? data.readAt.toDate().toISOString() : data.readAt;
    const body = data.body || data.message || '';
    const link = data.linkTo || data.actionUrl || '';

    return {
      ...data,
      notificationId: data.notificationId || doc.id,
      id: doc.id,
      body,
      message: body,
      linkTo: link,
      actionUrl: link,
      createdAt,
      readAt,
    } as Notification;
  }
};
