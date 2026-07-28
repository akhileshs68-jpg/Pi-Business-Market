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

  async updateItem(id: string, type: 'product' | 'service', updateData: any): Promise<void> {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    const itemRef = doc(db, collectionName, id);
    
    await updateDoc(itemRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteItem(id: string, type: 'product' | 'service'): Promise<void> {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    await deleteDoc(doc(db, collectionName, id));
  },

  async getItemsByOwner(ownerUid: string, roleId: string, type: 'product' | 'service') {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    
    const q = query(
      collection(db, collectionName),
      where('ownerUid', '==', ownerUid),
      where('roleId', '==', roleId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  async getStoreProducts(storeId: string) {
    return this.getItemsByOwner(storeId, 'seller', 'product'); // roughly
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
  async softDeleteProduct(id: string) {
    return this.updateItem(id, 'product', { status: 'Deleted' });
  },
  async permanentDeleteProduct(id: string) {
    return this.deleteItem(id, 'product');
  }
};
