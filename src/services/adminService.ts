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
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  PlatformSettings, 
  FeatureFlag, 
  MaintenanceWindow, 
  SystemAnnouncement,
  SecurityPolicy
} from '../types';
import { auditService } from './auditService';

export const adminService = {
  /**
   * PLATFORM SETTINGS
   */
  async getPlatformSettings(): Promise<PlatformSettings | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'platformSettings', 'global');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
    } as PlatformSettings;
  },

  async updatePlatformSettings(actorUid: string, actorName: string, updates: Partial<PlatformSettings>): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'platformSettings', 'global');
    
    const oldSettings = await this.getPlatformSettings();
    
    await setDoc(docRef, {
      ...updates,
      settingId: 'global',
      updatedAt: serverTimestamp()
    }, { merge: true });

    await auditService.logAction(
      actorUid,
      actorName,
      'UPDATE_PLATFORM_SETTINGS',
      'platformSettings',
      'global',
      'Global platform settings updated',
      { before: oldSettings, after: updates }
    );
  },

  /**
   * FEATURE FLAGS
   */
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'featureFlags'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
      updatedAt: d.data().updatedAt instanceof Timestamp ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
    })) as FeatureFlag[];
  },

  async upsertFeatureFlag(actorUid: string, actorName: string, flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'featureFlags', flag.flagId);
    
    const updateData = {
      ...flag,
      updatedAt: serverTimestamp()
    };

    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      (updateData as any).createdAt = serverTimestamp();
    }

    await setDoc(docRef, updateData, { merge: true });

    await auditService.logAction(
      actorUid,
      actorName,
      existing.exists() ? 'UPDATE_FEATURE_FLAG' : 'CREATE_FEATURE_FLAG',
      'featureFlags',
      flag.flagId,
      `Feature flag ${flag.name} ${existing.exists() ? 'updated' : 'created'}`
    );
  },

  /**
   * MAINTENANCE WINDOWS
   */
  async getMaintenanceWindows(): Promise<MaintenanceWindow[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'maintenanceWindows'), orderBy('startTime', 'desc'), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MaintenanceWindow);
  },

  async scheduleMaintenance(actorUid: string, actorName: string, window: MaintenanceWindow): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'maintenanceWindows', window.windowId);
    await setDoc(docRef, window);

    await auditService.logAction(
      actorUid,
      actorName,
      'SCHEDULE_MAINTENANCE',
      'maintenanceWindows',
      window.windowId,
      `Maintenance scheduled: ${window.title}`
    );
  },

  /**
   * ANNOUNCEMENTS
   */
  async getAnnouncements(): Promise<SystemAnnouncement[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'systemAnnouncements'), orderBy('publishAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
    })) as SystemAnnouncement[];
  },

  async publishAnnouncement(actorUid: string, actorName: string, announcement: Omit<SystemAnnouncement, 'createdAt'>): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'systemAnnouncements', announcement.announcementId);
    await setDoc(docRef, {
      ...announcement,
      createdAt: serverTimestamp()
    });

    await auditService.logAction(
      actorUid,
      actorName,
      'PUBLISH_ANNOUNCEMENT',
      'systemAnnouncements',
      announcement.announcementId,
      `System announcement published: ${announcement.title}`
    );
  }
};
