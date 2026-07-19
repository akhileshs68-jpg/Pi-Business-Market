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
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Warehouse, WarehouseLocation } from '../types';

export const warehouseService = {
  async createWarehouse(warehouse: Omit<Warehouse, 'warehouseId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getFirebaseDb();
    const warehouseId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'warehouses', warehouseId), {
      ...warehouse,
      warehouseId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return warehouseId;
  },

  async getWarehouses(businessId: string): Promise<Warehouse[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'warehouses'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Warehouse;
    });
  },

  async createLocation(location: Omit<WarehouseLocation, 'locationId'>): Promise<string> {
    const db = getFirebaseDb();
    const locationId = Math.random().toString(36).substring(2, 15);
    await setDoc(doc(db, 'warehouseLocations', locationId), {
      ...location,
      locationId
    });
    return locationId;
  },

  async getLocations(warehouseId: string): Promise<WarehouseLocation[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'warehouseLocations'), where('warehouseId', '==', warehouseId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as WarehouseLocation);
  }
};
