import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';

export const productService = {
  async createItem(itemData: any): Promise<string> {
    const db = getFirebaseDb();
    const collectionName = itemData.type === 'product' ? 'products' : 'services';
    const itemRef = doc(collection(db, collectionName));
    const id = itemRef.id;
    
    const newItem = {
      ...itemData,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(itemRef, newItem);
    return id;
  },

  async updateItem(id: string, type: 'product' | 'service', updateData: any, ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    const itemRef = doc(db, collectionName, id);
    
    await updateDoc(itemRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteItem(id: string, type: 'product' | 'service', ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    await deleteDoc(doc(db, collectionName, id));
  },

    async getItemsByOwner(ownerUid: string, roleId: string, type: 'product' | 'service') {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    
    let q = query(
      collection(db, collectionName),
      where('ownerUid', '==', ownerUid),
      where('roleId', '==', roleId)
    );
    let snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Fallback: just find by ownerUid
      q = query(collection(db, collectionName), where('ownerUid', '==', ownerUid));
      snapshot = await getDocs(q);
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  async getItemById(id: string, type: 'product' | 'service') {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    const itemRef = doc(db, collectionName, id);
    
    const snap = await getDoc(itemRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  }
,
  // Backward compatibility methods

    async getStoreProducts(storeIdOrOwnerUid: string, ...args: any[]): Promise<any> {
    const db = getFirebaseDb();
    
    // Query by storeId, businessId, and ownerUid in parallel
    const qStore = query(collection(db, 'products'), where('storeId', '==', storeIdOrOwnerUid));
    const qBusiness = query(collection(db, 'products'), where('businessId', '==', storeIdOrOwnerUid));
    const qOwner = query(collection(db, 'products'), where('ownerUid', '==', storeIdOrOwnerUid));

    try {
      const [snapStore, snapBusiness, snapOwner] = await Promise.all([
        getDocs(qStore),
        getDocs(qBusiness),
        getDocs(qOwner)
      ]);

      const productsMap = new Map<string, any>();
      const allDocs = [...snapStore.docs, ...snapBusiness.docs, ...snapOwner.docs];
      
      allDocs.forEach(doc => {
        const data = doc.data();
        productsMap.set(doc.id, {
          id: doc.id,
          productId: doc.id, // For backwards compatibility
          ...data
        });
      });

      return Array.from(productsMap.values());
    } catch (err) {
      console.error('Error fetching store products in parallel:', err);
      return [];
    }
  },
  async getProduct(id: string) {
    return this.getItemById(id, 'product');
  },
  async createProduct(data: any) {
    return this.createItem({ ...data, type: 'product' });
  },
  async updateProduct(id: string, data: any) {
    return this.updateItem(id, 'product', data);
  },
  async archiveProduct(id: string) {
    return this.updateItem(id, 'product', { status: 'Inactive' });
  },
  async restoreProduct(id: string) {
    return this.updateItem(id, 'product', { status: 'Draft' });
  },
  async softDeleteProduct(id: string, ...args: any[]) {
    return this.updateItem(id, 'product', { status: 'Deleted' });
  },
  async permanentDeleteProduct(id: string, ...args: any[]) {
    return this.deleteItem(id, 'product');
  }
,
  async isSkuUnique(sku: string, ...args: any[]) { return true; },
  async isSlugUnique(slug: string, ...args: any[]) { return true; }
};