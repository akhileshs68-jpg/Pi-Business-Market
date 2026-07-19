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
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Service, ServicePackage, ServiceAvailability } from '../types';

export const serviceMarketplaceService = {
  /**
   * SERVICE MANAGEMENT
   */
  async createService(service: Omit<Service, 'serviceId' | 'createdAt' | 'updatedAt' | 'rating' | 'featured'>): Promise<string> {
    const db = getFirebaseDb();
    const serviceId = Math.random().toString(36).substring(2, 15);
    
    // Ensure slug uniqueness (simplified for this module)
    const slug = service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);

    await setDoc(doc(db, 'services', serviceId), {
      ...service,
      serviceId,
      slug,
      featured: false,
      rating: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return serviceId;
  },

  async getServices(businessId: string): Promise<Service[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'services'), 
      where('businessId', '==', businessId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Service;
    });
  },

  async updateService(serviceId: string, updates: Partial<Service>): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'services', serviceId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteService(serviceId: string): Promise<void> {
    const db = getFirebaseDb();
    // Soft delete
    await updateDoc(doc(db, 'services', serviceId), {
      status: 'deleted',
      updatedAt: serverTimestamp()
    });
  },

  /**
   * PACKAGE MANAGEMENT
   */
  async createPackage(pkg: Omit<ServicePackage, 'packageId'>): Promise<string> {
    const db = getFirebaseDb();
    const packageId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'servicePackages', packageId), { ...pkg, packageId });
    return packageId;
  },

  async getPackages(serviceId: string): Promise<ServicePackage[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'servicePackages'), where('serviceId', '==', serviceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ServicePackage);
  },

  /**
   * AVAILABILITY MANAGEMENT
   */
  async updateAvailability(availability: Omit<ServiceAvailability, 'availabilityId'>): Promise<void> {
    const db = getFirebaseDb();
    const availabilityId = availability.serviceId || availability.businessId;
    await setDoc(doc(db, 'serviceAvailability', availabilityId), {
      ...availability,
      availabilityId
    });
  },

  async getAvailability(id: string): Promise<ServiceAvailability | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'serviceAvailability', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as ServiceAvailability : null;
  }
};
