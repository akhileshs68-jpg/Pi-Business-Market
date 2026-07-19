import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { BusinessProfile, BusinessProfileStatus } from '../types';

export const businessService = {
  /**
   * Generates a unique, URL-friendly slug from a business name
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const db = getFirebaseDb();
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/--+/g, '-')      // Replace multiple - with single -
      .trim();

    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const q = query(collection(db, 'businessProfiles'), where('businessSlug', '==', slug));
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
   * Creates a new business profile
   */
  async createBusiness(profile: Omit<BusinessProfile, 'businessId' | 'createdAt' | 'updatedAt' | 'verified' | 'featured' | 'rating' | 'followers'>): Promise<string> {
    const db = getFirebaseDb();
    const businessId = doc(collection(db, 'businessProfiles')).id;
    
    const newProfile: BusinessProfile = {
      ...profile,
      businessId,
      verified: false,
      featured: false,
      rating: 0,
      followers: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'businessProfiles', businessId), {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return businessId;
  },

  /**
   * Fetches all businesses owned by a specific user
   */
  async getOwnedBusinesses(ownerUid: string): Promise<BusinessProfile[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'businessProfiles'), 
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
      } as BusinessProfile;
    });
  },

  /**
   * Fetches a single business profile by ID
   */
  async getBusiness(businessId: string): Promise<BusinessProfile | null> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'businessProfiles', businessId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return null;
    
    const data = snap.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as BusinessProfile;
  },

  /**
   * Updates an existing business profile
   */
  async updateBusiness(businessId: string, updates: Partial<BusinessProfile>): Promise<void> {
    const db = getFirebaseDb();
    const businessRef = doc(db, 'businessProfiles', businessId);
    
    await updateDoc(businessRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Soft deletes a business profile
   */
  async deleteBusiness(businessId: string): Promise<void> {
    const db = getFirebaseDb();
    const businessRef = doc(db, 'businessProfiles', businessId);
    
    await updateDoc(businessRef, {
      status: 'deleted',
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Validates if a business name is available (optional check before submission)
   */
  async isBusinessNameAvailable(name: string): Promise<boolean> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businessProfiles'), where('businessName', '==', name));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  }
};
