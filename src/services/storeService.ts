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
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { Store, StoreStatus } from '../types';
import { businessService } from './businessService';

function sanitizeImageField(val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();
    if (
      !trimmed ||
      lower === 'none' ||
      lower === 'undefined' ||
      lower === 'null' ||
      lower === 'placeholder' ||
      lower === '[object object]' ||
      lower.startsWith('blob:')
    ) {
      return '';
    }
    return trimmed;
  }
  if (Array.isArray(val)) {
    return val
      .map(item => sanitizeImageField(item))
      .filter(item => typeof item === 'string' && item !== '');
  }
  return val;
}

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

    // Sanitize image fields in sanitizedData
    if (sanitizedData.logoUrl) sanitizedData.logoUrl = sanitizeImageField(sanitizedData.logoUrl);
    if (sanitizedData.imageUrl) sanitizedData.imageUrl = sanitizeImageField(sanitizedData.imageUrl);
    if (sanitizedData.coverImageUrl) sanitizedData.coverImageUrl = sanitizeImageField(sanitizedData.coverImageUrl);

    const defaultLogo = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
    const defaultCover = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500';

    const imageUrl = sanitizedData.logoUrl || sanitizedData.imageUrl || defaultLogo;
    const publicId = sanitizedData.logoPublicId || sanitizedData.publicId || 'none';
    
    let ownerId = sanitizedData.ownerUid || 'none';
    const isInvalid = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '' || val === 'unknown';
    if (isInvalid(ownerId)) {
      try {
        const auth = getFirebaseAuth();
        if (auth?.currentUser?.uid) {
          ownerId = auth.currentUser.uid;
        }
      } catch (e) {}
    }

    let finalBusinessId = sanitizedData.businessId || 'none';
    if (isInvalid(finalBusinessId)) {
      try {
        const bizQuery = query(collection(db, 'businesses'));
        const bizSnap = await getDocs(bizQuery);
        const validBizDoc = bizSnap.docs.find(d => {
          const bData = d.data();
          return bData.status !== 'deleted' && (bData.ownerUid === ownerId || bData.ownerId === ownerId);
        }) || bizSnap.docs[0];

        if (validBizDoc) {
          finalBusinessId = validBizDoc.id;
        }
      } catch (e) {}
    }
    const finalStoreId = storeId;

    console.log('[Firestore Store Write Pre-Check]');
    console.log('uid:', ownerId);
    console.log('businessId:', finalBusinessId);
    console.log('storeId:', finalStoreId);
    console.log('ownerId:', ownerId);
    console.log('cloudinary.secure_url:', imageUrl);
    console.log('cloudinary.public_id:', publicId);

    if (
      ownerId === undefined ||
      finalBusinessId === undefined ||
      finalStoreId === undefined ||
      imageUrl === undefined ||
      publicId === undefined
    ) {
      throw new Error('Aborting Firestore write: required field is undefined.');
    }

    const docData = {
      ...sanitizedData,
      published: true,
      status: sanitizedData.status || 'active',
      imageUrl,
      logoUrl: sanitizedData.logoUrl || defaultLogo,
      coverImageUrl: sanitizedData.coverImageUrl || defaultCover,
      publicId,
      ownerId,
      businessId: finalBusinessId,
      storeId: finalStoreId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'stores', storeId), docData);

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
          storeId: data.storeId || doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Store;
      })
      .filter(store => store.status !== 'deleted');
  },

  /**
   * Fetches all stores owned by a user or associated with user's businesses
   */
    async getOwnedStores(ownerUid: string): Promise<Store[]> {
    const db = getFirebaseDb();
    const storesMap = new Map<string, Store>();

    // 1. Fetch stores by ownerUid, userId, sellerId in parallel
    try {
      const qOwner = query(collection(db, 'stores'), where('ownerUid', '==', ownerUid));
      const qUser = query(collection(db, 'stores'), where('userId', '==', ownerUid));
      const qSeller = query(collection(db, 'stores'), where('sellerId', '==', ownerUid));

      const [snapOwner, snapUser, snapSeller] = await Promise.all([
        getDocs(qOwner),
        getDocs(qUser),
        getDocs(qSeller)
      ]);

      const allDocs = [...snapOwner.docs, ...snapUser.docs, ...snapSeller.docs];
      allDocs.forEach(doc => {
        const data = doc.data();
        const store: Store = {
          ...data,
          storeId: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Store;
        const statusStr = (store.status as any) || '';
        if (statusStr !== 'deleted' && statusStr !== 'Deleted') {
          storesMap.set(store.storeId, store);
        }
      });
    } catch (err) {
      console.warn('Query stores by ownerUid/userId/sellerId error:', err);
    }

    // 2. Fetch stores by user's businesses
    try {
      const qBizProfile = query(collection(db, 'businesses'), where('ownerUid', '==', ownerUid));
      const bizSnap = await getDocs(qBizProfile);
      
      const bizDocs = [...bizSnap.docs];

      // Also find businesses where the user is a member
      try {
        const memberQuery = query(collection(db, 'businessMembers'), where('userUid', '==', ownerUid), where('status', '==', 'active'));
        const memberSnap = await getDocs(memberQuery);
        for (const memberDoc of memberSnap.docs) {
          const bizId = memberDoc.data().businessId;
          if (bizId) {
            const bizDocSnap = await getDoc(doc(db, 'businesses', bizId));
            if (bizDocSnap.exists() && !bizDocs.some(d => d.id === bizId)) {
              bizDocs.push(bizDocSnap);
            }
          }
        }
      } catch (memErr) {
        console.warn('businessMembers query failed in getOwnedStores:', memErr);
      }
      
      for (const docSnap of bizDocs) {
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
            const statusStr = (store.status as any) || '';
            if (statusStr !== 'deleted' && statusStr !== 'Deleted') {
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
    
    const sanitizedData: any = {};
    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined) sanitizedData[key] = val;
    });

    // Sanitize image fields in sanitizedData
    if (sanitizedData.logoUrl) sanitizedData.logoUrl = sanitizeImageField(sanitizedData.logoUrl);
    if (sanitizedData.imageUrl) sanitizedData.imageUrl = sanitizeImageField(sanitizedData.imageUrl);
    if (sanitizedData.coverImageUrl) sanitizedData.coverImageUrl = sanitizeImageField(sanitizedData.coverImageUrl);

    const docSnap = await getDoc(storeRef);
    const existing = docSnap.exists() ? docSnap.data() : {};

    const defaultLogo = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
    const defaultCover = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500';

    const imageUrl = sanitizedData.logoUrl || sanitizedData.imageUrl || existing.logoUrl || existing.imageUrl || defaultLogo;
    const publicId = sanitizedData.logoPublicId || sanitizedData.publicId || existing.logoPublicId || existing.publicId || 'none';
    
    let ownerId = sanitizedData.ownerUid || existing.ownerUid || existing.ownerId || 'none';
    const isInvalid = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '' || val === 'unknown';
    if (isInvalid(ownerId)) {
      try {
        const auth = getFirebaseAuth();
        if (auth?.currentUser?.uid) {
          ownerId = auth.currentUser.uid;
        }
      } catch (e) {}
    }

    let finalBusinessId = sanitizedData.businessId || existing.businessId || 'none';
    if (isInvalid(finalBusinessId)) {
      try {
        const bizQuery = query(collection(db, 'businesses'));
        const bizSnap = await getDocs(bizQuery);
        const validBizDoc = bizSnap.docs.find(d => {
          const bData = d.data();
          return bData.status !== 'deleted' && (bData.ownerUid === ownerId || bData.ownerId === ownerId);
        }) || bizSnap.docs[0];

        if (validBizDoc) {
          finalBusinessId = validBizDoc.id;
        }
      } catch (e) {}
    }
    const finalStoreId = storeId;

    console.log('[Firestore Store Update Pre-Check]');
    console.log('uid:', ownerId);
    console.log('businessId:', finalBusinessId);
    console.log('storeId:', finalStoreId);
    console.log('ownerId:', ownerId);
    console.log('cloudinary.secure_url:', imageUrl);
    console.log('cloudinary.public_id:', publicId);

    if (
      ownerId === undefined ||
      finalBusinessId === undefined ||
      finalStoreId === undefined ||
      imageUrl === undefined ||
      publicId === undefined
    ) {
      throw new Error('Aborting Firestore write: required field is undefined.');
    }

    const docData = {
      ...sanitizedData,
      imageUrl,
      logoUrl: sanitizedData.logoUrl || existing.logoUrl || defaultLogo,
      coverImageUrl: sanitizedData.coverImageUrl || existing.coverImageUrl || defaultCover,
      publicId,
      ownerId,
      businessId: finalBusinessId,
      storeId: finalStoreId,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(storeRef, docData);
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
