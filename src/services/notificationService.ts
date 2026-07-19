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
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
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
      entityType?: string;
      entityId?: string;
      priority?: NotificationPriority;
      linkTo?: string;
    }
  ): Promise<string> {
    const db = getFirebaseDb();
    const notificationId = `NOTIF_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const notificationRef = doc(db, 'notifications', notificationId);

    // Check preferences before sending (future: logic to skip if muted)
    // For now, we always record in-app notifications

    const newNotification: Notification = {
      notificationId,
      recipientUid,
      type,
      title,
      body,
      entityType: options?.entityType,
      entityId: options?.entityId,
      priority: options?.priority || 'medium',
      status: 'unread',
      linkTo: options?.linkTo,
      createdAt: new Date().toISOString()
    };

    await setDoc(notificationRef, {
      ...newNotification,
      createdAt: serverTimestamp()
    });

    return notificationId;
  },

  /**
   * REAL-TIME NOTIFICATIONS
   * Subscription for the Navbar bell and Inbox
   */
  subscribeToNotifications(recipientUid: string, callback: (notifications: Notification[]) => void) {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', recipientUid),
      where('status', '!=', 'dismissed'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => this.mapDocToNotification(doc));
      callback(notifications);
    });
  },

  /**
   * ACTIONS
   */
  async markAsRead(notificationId: string): Promise<void> {
    const db = getFirebaseDb();
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'read',
      readAt: serverTimestamp()
    });
  },

  async markAllAsRead(recipientUid: string): Promise<void> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', recipientUid),
      where('status', '==', 'unread')
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { 
        status: 'read', 
        readAt: serverTimestamp() 
      });
    });

    await batch.commit();
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
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      readAt: data.readAt instanceof Timestamp ? data.readAt.toDate().toISOString() : data.readAt,
    } as Notification;
  }
};
