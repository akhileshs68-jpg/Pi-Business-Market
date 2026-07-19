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
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  AnalyticsEvent, 
  BusinessMetrics, 
  SystemMetrics,
  AnalyticsEventType
} from '../types';

export const analyticsService = {
  /**
   * TRACK EVENT
   * Records an immutable event in the analytics pipeline
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'eventId' | 'createdAt'>): Promise<string> {
    const db = getFirebaseDb();
    const eventId = `EVT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const eventRef = doc(db, 'analyticsEvents', eventId);

    const newEvent: AnalyticsEvent = {
      ...event,
      eventId,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(eventRef, {
        ...newEvent,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to track analytics event', err);
    }

    return eventId;
  },

  /**
   * FETCH BUSINESS METRICS
   * Retrieves aggregated KPIs for a specific business
   */
  async getBusinessMetrics(businessId: string, limitCount: number = 30): Promise<BusinessMetrics[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'businessMetrics'),
      where('businessId', '==', businessId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToBusinessMetrics(doc));
  },

  /**
   * FETCH SYSTEM METRICS
   * Retrieves platform-wide health and growth metrics
   */
  async getSystemMetrics(limitCount: number = 30): Promise<SystemMetrics[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'systemMetrics'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToSystemMetrics(doc));
  },

  /**
   * HELPERS
   */
  mapDocToBusinessMetrics(doc: any): BusinessMetrics {
    const data = doc.data();
    return {
      ...data,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as BusinessMetrics;
  },

  mapDocToSystemMetrics(doc: any): SystemMetrics {
    const data = doc.data();
    return {
      ...data,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as SystemMetrics;
  }
};
