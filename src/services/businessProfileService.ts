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
    const docRef = doc(db, 'businesses', businessId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as any;
    }
    return null;
  },

  async saveProfile(ownerUid: string, roleId: string, data: any, publish: boolean = false) {
    const db = getFirebaseDb();
    const profile = await this.getProfile(ownerUid, roleId);
    const businessId = profile ? profile.id : doc(collection(db, 'businesses')).id;
    
    const docRef = doc(db, 'businesses', businessId);
    
    const status = publish ? 'active' : ((profile as any)?.status || 'draft');

    const updateData = {
      ownerUid,
      businessType: roleId,
      status,
      updatedAt: serverTimestamp(),
      ...data
    };

    if (!profile) {
      updateData.createdAt = serverTimestamp();
    }

    await setDoc(docRef, updateData, { merge: true });
    return businessId;
  }
};
