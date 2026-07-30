import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';

export const businessProfileService = {
    async getProfile(ownerUid: string, roleId: string) {
    const db = getFirebaseDb();
    
    // First try the legacy way just in case
    let q = query(
      collection(db, 'businesses'),
      where('ownerUid', '==', ownerUid),
      where('businessType', '==', roleId)
    );
    let snap = await getDocs(q);
    
    if (snap.empty) {
      // Fallback: Just find ANY business owned by this user
      q = query(
        collection(db, 'businesses'),
        where('ownerUid', '==', ownerUid)
      );
      snap = await getDocs(q);
    }
    
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    
    // Also check legacy businessProfiles collection just in case
    const legacyQ = query(collection(db, 'businessProfiles'), where('ownerUid', '==', ownerUid));
    const legacySnap = await getDocs(legacyQ);
    if (!legacySnap.empty) {
      return { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() };
    }

    return null;
  },

  async getProfileById(businessId: string) {
    const db = getFirebaseDb();
    
    // Determine preferred collection based on pathname
    const isStorePath = typeof window !== 'undefined' && window.location.pathname.includes('/store/');
    const collectionsToTry = isStorePath ? ['stores', 'businesses'] : ['businesses', 'stores'];
    
    for (const collectionName of collectionsToTry) {
      console.log(`[businessProfileService] Querying Firestore: collection="${collectionName}", documentId="${businessId}"`);
      const docRef = doc(db, collectionName, businessId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        console.log(`[businessProfileService] Document found in collection "${collectionName}":`, data);
        
        // If it was found in "stores" collection, adapt store-specific fields for the profile UI
        if (collectionName === 'stores') {
          return {
            id: snap.id,
            businessName: data.storeName || data.businessName || 'Unnamed Store',
            category: data.storeCategory || data.category || 'Store',
            businessType: 'seller', // Store corresponds to 'seller' role config
            ...data
          } as any;
        }
        
        return { id: snap.id, ...data } as any;
      }
    }
    
    console.warn(`[businessProfileService] Document NOT found in any collection for id: ${businessId}`);
    return null;
  },

  async saveProfile(ownerUid: string, roleId: string, data: any, publish: boolean = false) {
    const db = getFirebaseDb();
    const profile = await this.getProfile(ownerUid, roleId);
    const businessId = profile ? profile.id : doc(collection(db, 'businesses')).id;
    
    const docRef = doc(db, 'businesses', businessId);
    
    const status = publish ? 'published' : ((profile as any)?.status || 'draft');
    const published = publish ? true : ((profile as any)?.published || false);

    // Ensure all required fields exist and are never undefined
    const imageUrl = data.logoUrl || data.imageUrl || (profile as any)?.logoUrl || (profile as any)?.imageUrl || 'none';
    const publicId = data.logoPublicId || data.publicId || (profile as any)?.logoPublicId || (profile as any)?.publicId || 'none';
    const finalBusinessId = businessId;
    const finalStoreId = data.storeId || (profile as any)?.storeId || 'none';
    const ownerId = ownerUid;

    // Print Pre-Check Logs
    console.log('[Firestore Business Write Pre-Check]');
    console.log('uid:', ownerUid);
    console.log('businessId:', finalBusinessId);
    console.log('storeId:', finalStoreId);
    console.log('ownerId:', ownerId);
    console.log('cloudinary.secure_url:', imageUrl);
    console.log('cloudinary.public_id:', publicId);

    // Abort if any required value is undefined
    if (
      ownerUid === undefined ||
      finalBusinessId === undefined ||
      finalStoreId === undefined ||
      ownerId === undefined ||
      imageUrl === undefined ||
      publicId === undefined
    ) {
      throw new Error('Aborting Firestore write: required field is undefined.');
    }

    const updateData = {
      ownerUid,
      businessType: roleId,
      status,
      published,
      updatedAt: serverTimestamp(),
      imageUrl,
      publicId,
      ownerId,
      businessId: finalBusinessId,
      storeId: finalStoreId,
      ...data
    };

    if (!profile) {
      updateData.createdAt = serverTimestamp();
    }

    await setDoc(docRef, updateData, { merge: true });
    return businessId;
  }
};
