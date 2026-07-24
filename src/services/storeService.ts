import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Store, StoreStatus } from '../types';

export const storeService = {
  /**
   * Generates a unique, URL-friendly slug for a store
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const db = getFirebaseDb();
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const q = query(collection(db, 'stores'), where('storeSlug', '==', slug));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  },

  /**
   * Creates a new store
   */
  async createStore(store: Omit<Store, 'storeId' | 'createdAt' | 'updatedAt' | 'verified' | 'featured' | 'followers' | 'rating' | 'reviewCount'>): Promise<string> {
    const db = getFirebaseDb();
    const storeId = doc(collection(db, 'stores')).id;
    
    const newStore: Store = {
      ...store,
      storeId,
      latitude: store.latitude ?? 0,
      longitude: store.longitude ?? 0,
      verified: false,
      featured: false,
      followers: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sanitize any undefined properties to avoid Firestore write errors
    const sanitizedData: Record<string, any> = {};
    Object.entries(newStore).forEach(([key, val]) => {
      if (val !== undefined) {
        sanitizedData[key] = val;
      }
    });

    await setDoc(doc(db, 'stores', storeId), {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return storeId;
  },

  /**
   * Fetches all stores for a specific business
   */
  async getStoresByBusiness(businessId: string): Promise<Store[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'stores'), 
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Store;
      })
      .filter(store => store.status !== 'deleted');
  },

  /**
   * Fetches all stores owned by a user
   */
  async getOwnedStores(ownerUid: string): Promise<Store[]> {
    if (ownerUid.startsWith('mock_')) {
      return [
        {
          storeId: 'mock_store_1',
          businessId: 'mock_biz_1',
          ownerUid,
          storeName: 'Pi Pioneers Hub',
          storeSlug: 'pi-pioneers',
          storeType: 'Online Store',
          storeCategory: 'Retail',
          description: 'The premium merchandise store for Pi Network pioneers.',
          email: 'hub@pioneers.com',
          phone: '+15550199',
          country: 'United States',
          state: 'California',
          city: 'San Francisco',
          address: '123 Pi Pioneers Way',
          latitude: 37.7749,
          longitude: -122.4194,
          openingHours: [
            { day: 'Monday', open: '09:00', close: '18:00', closed: false },
            { day: 'Tuesday', open: '09:00', close: '18:00', closed: false },
            { day: 'Wednesday', open: '09:00', close: '18:00', closed: false },
            { day: 'Thursday', open: '09:00', close: '18:00', closed: false },
            { day: 'Friday', open: '09:00', close: '18:00', closed: false },
            { day: 'Saturday', open: '10:00', close: '16:00', closed: false },
            { day: 'Sunday', open: '00:00', close: '00:00', closed: true }
          ],
          deliveryAvailable: true,
          pickupAvailable: true,
          verified: true,
          featured: true,
          status: 'active',
          logoUrl: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=150',
          coverImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
          followers: 1250,
          rating: 4.8,
          reviewCount: 36,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }

    const db = getFirebaseDb();
    const q = query(
      collection(db, 'stores'), 
      where('ownerUid', '==', ownerUid)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Store;
      })
      .filter(store => store.status !== 'deleted');
  },

  /**
   * Updates a store
   */
  async updateStore(storeId: string, updates: Partial<Store>): Promise<void> {
    const db = getFirebaseDb();
    const storeRef = doc(db, 'stores', storeId);
    
    await updateDoc(storeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Soft deletes a store
   */
  async deleteStore(storeId: string): Promise<void> {
    const db = getFirebaseDb();
    const storeRef = doc(db, 'stores', storeId);
    
    await updateDoc(storeRef, {
      status: 'deleted',
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Fetches a single store by ID
   */
  async getStore(storeId: string): Promise<Store | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'stores', storeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        storeId: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Store;
    }
    
    return null;
  }
};
