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
  updateDoc,
  writeBatch,
  Timestamp,
  increment,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { 
  CustomerProfile, 
  CustomerTimelineEvent, 
  CustomerNote, 
  CustomerTag,
  TimelineEventType
} from '../types';

export const crmService = {
  /**
   * GET OR CREATE CUSTOMER PROFILE
   * Ensures a customer profile exists for a user-business pair
   */
  async getOrCreateCustomer(userUid: string, businessId: string, displayName: string, email: string): Promise<CustomerProfile> {
    const db = getFirebaseDb();
    const customerId = `${businessId}_${userUid}`;
    const customerRef = doc(db, 'customers', customerId);
    
    const snap = await getDoc(customerRef);
    if (snap.exists()) {
      // Update last visit
      await updateDoc(customerRef, {
        lastVisitAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return this.mapDocToCustomer(await getDoc(customerRef));
    }

    const newCustomer: Partial<CustomerProfile> = {
      customerId,
      userUid,
      businessId,
      displayName,
      email,
      status: 'active',
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(customerRef, {
      ...newCustomer,
      lastVisitAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return this.mapDocToCustomer(await getDoc(customerRef));
  },

  /**
   * RECORD ACTIVITY
   */
  async recordActivity(
    customerId: string, 
    businessId: string, 
    type: TimelineEventType, 
    title: string, 
    description: string,
    referenceId?: string,
    points?: number,
    amount?: number
  ): Promise<void> {
    const db = getFirebaseDb();
    const eventId = `EVT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const eventRef = doc(db, 'customerTimeline', eventId);

    await setDoc(eventRef, {
      eventId,
      customerId,
      businessId,
      type,
      title,
      description,
      referenceId,
      points,
      amount,
      createdAt: serverTimestamp()
    });

    // If order or payment, update customer aggregates
    if (amount && amount > 0) {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        totalOrders: increment(1),
        totalSpent: increment(amount),
        lastOrderAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },

  /**
   * RETRIEVAL
   */
  async getBusinessCustomers(businessId: string): Promise<CustomerProfile[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'customers'), 
      where('businessId', '==', businessId)
    );
    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => this.mapDocToCustomer(doc));
    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  },

  async getCustomerTimeline(customerId: string): Promise<CustomerTimelineEvent[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'customerTimeline'),
      where('customerId', '==', customerId)
    );
    const snapshot = await getDocs(q);
    const timeline = snapshot.docs.map(doc => this.mapDocToEvent(doc));
    return timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
  },

  /**
   * NOTES & TAGS
   */
  async addNote(customerId: string, businessId: string, authorUid: string, authorName: string, content: string): Promise<void> {
    const db = getFirebaseDb();
    const noteId = `NOTE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    await setDoc(doc(db, 'customerNotes', noteId), {
      noteId,
      customerId,
      businessId,
      authorUid,
      authorName,
      content,
      createdAt: serverTimestamp()
    });
  },

  async getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'customerNotes'),
      where('customerId', '==', customerId)
    );
    const snapshot = await getDocs(q);
    const notes = snapshot.docs.map(doc => this.mapDocToNote(doc));
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * HELPERS
   */
  mapDocToCustomer(doc: any): CustomerProfile {
    const data = doc.data();
    return {
      ...data,
      lastVisitAt: data.lastVisitAt instanceof Timestamp ? data.lastVisitAt.toDate().toISOString() : data.lastVisitAt,
      lastOrderAt: data.lastOrderAt instanceof Timestamp ? data.lastOrderAt.toDate().toISOString() : data.lastOrderAt,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as CustomerProfile;
  },

  mapDocToEvent(doc: any): CustomerTimelineEvent {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    } as CustomerTimelineEvent;
  },

  mapDocToNote(doc: any): CustomerNote {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    } as CustomerNote;
  }
};
