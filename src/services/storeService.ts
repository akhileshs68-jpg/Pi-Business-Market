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
import { businessService } from './businessService';

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
   * Fetches all stores owned by a user or associated with user's businesses
   */
    async getOwnedStores(ownerUid: string): Promise<Store[]> {
    if (ownerUid.startsWith('mock_')) {
      // Return mock data for demo purposes, but for real users we want real data.
    }
    const db = getFirebaseDb();
    const storesMap = new Map<string, Store>();

    // 1. Fetch stores by ownerUid
    try {
      let qOwner = query(
        collection(db, 'stores'), 
        where('ownerUid', '==', ownerUid)
      );
      let snapshotOwner = await getDocs(qOwner);
      
      // Legacy fallback: checking 'userId' if 'ownerUid' didn't match (just in case)
      if (snapshotOwner.empty) {
        qOwner = query(collection(db, 'stores'), where('userId', '==', ownerUid));
        snapshotOwner = await getDocs(qOwner);
      }
      // Or sellerId
      if (snapshotOwner.empty) {
        qOwner = query(collection(db, 'stores'), where('sellerId', '==', ownerUid));
        snapshotOwner = await getDocs(qOwner);
      }

      snapshotOwner.docs.forEach(doc => {
        const data = doc.data();
        const store: Store = {
          ...data,
          storeId: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Store;
        if (store.status !== 'deleted') {
          storesMap.set(store.storeId, store);
        }
      });
    } catch (err) {
      console.warn('Query stores by ownerUid error:', err);
    }

    // 2. Fetch stores by user's businesses
    try {
      const qBizProfile = query(collection(db, 'businesses'), where('ownerUid', '==', ownerUid));
      const bizSnap = await getDocs(qBizProfile);
      
      for (const docSnap of bizSnap.docs) {
        const bizData = docSnap.data();
        const bizId = docSnap.id;
        
        const qBizStores = query(
          collection(db, 'stores'),
          where('businessId', '==', bizId)
        );
        const snapshotBiz = await getDocs(qBizStores);
        
        // If the business has no stores, map the business itself as a store (Legacy fallback)
        if (snapshotBiz.empty && !storesMap.has(bizId)) {
          const store: Store = {
             storeId: bizId,
             businessId: bizId,
             ownerUid: ownerUid,
             storeName: bizData.businessName || bizData.displayName || 'My Store',
             storeSlug: bizData.businessSlug || bizId.toLowerCase(),
             storeType: bizData.businessType || 'Online Store',
             storeCategory: bizData.category || 'Retail',
             description: bizData.description || '',
             email: bizData.email || '',
             phone: bizData.phone || '',
             country: bizData.country || '',
             state: bizData.state || '',
             city: bizData.city || '',
             address: bizData.address || '',
             latitude: bizData.latitude || 0,
             longitude: bizData.longitude || 0,
             openingHours: [],
             deliveryAvailable: true,
             pickupAvailable: true,
             verified: false,
             featured: false,
             status: bizData.status || 'active',
             logoUrl: bizData.logoUrl || '',
             coverImageUrl: bizData.coverImageUrl || '',
             followers: bizData.followers || 0,
             rating: bizData.rating || 0,
             reviewCount: bizData.reviewCount || 0,
             createdAt: bizData.createdAt instanceof Timestamp ? bizData.createdAt.toDate().toISOString() : bizData.createdAt,
             updatedAt: bizData.updatedAt instanceof Timestamp ? bizData.updatedAt.toDate().toISOString() : bizData.updatedAt
          };
          storesMap.set(bizId, store);
        } else {
          snapshotBiz.docs.forEach(d => {
            const data = d.data();
            const store: Store = {
              ...data,
              storeId: d.id,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            } as Store;
            if (store.status !== 'deleted') {
              storesMap.set(store.storeId, store);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Query stores by business error:', err);
    }
    
    return Array.from(storesMap.values());
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
