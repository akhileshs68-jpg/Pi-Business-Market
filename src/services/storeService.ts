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
      verified: false,
      featured: false,
      followers: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'stores', storeId), {
      ...newStore,
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
      } as Store;
    });
  },

  /**
   * Fetches all stores owned by a user
   */
  async getOwnedStores(ownerUid: string): Promise<Store[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'stores'), 
      where('ownerUid', '==', ownerUid),
      where('status', '!=', 'deleted')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Store;
    });
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
