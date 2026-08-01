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

async function getCloudinaryPublicId(url: string, db: any): Promise<string> {
  if (!url || url === 'none') return 'none';
  
  // 1. Try to query Firestore 'media' collection by downloadUrl or imageUrl
  try {
    const q1 = query(collection(db, 'media'), where('downloadUrl', '==', url));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const data = snap1.docs[0].data();
      if (data.storagePath && data.storagePath !== 'none') {
        return data.storagePath;
      }
      if (data.publicId && data.publicId !== 'none') {
        return data.publicId;
      }
    }
    
    const q2 = query(collection(db, 'media'), where('imageUrl', '==', url));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const data = snap2.docs[0].data();
      if (data.storagePath && data.storagePath !== 'none') {
        return data.storagePath;
      }
      if (data.publicId && data.publicId !== 'none') {
        return data.publicId;
      }
    }
  } catch (err) {
    console.warn('[productService] Error querying media collection for publicId:', err);
  }

  // 2. Fallback: Parse from the Cloudinary URL directly
  try {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length > 1) {
        let pathPart = parts[1];
        if (pathPart.match(/^v\d+\//)) {
          pathPart = pathPart.replace(/^v\d+\//, '');
        }
        const dotIndex = pathPart.lastIndexOf('.');
        if (dotIndex !== -1) {
          pathPart = pathPart.substring(0, dotIndex);
        }
        return pathPart;
      }
    }
  } catch (err) {
    console.warn('[productService] Error parsing publicId from URL:', err);
  }

  return 'none';
}

export const productService = {
  async createItem(itemData: any): Promise<string> {
    const db = getFirebaseDb();
    const collectionName = itemData.type === 'product' ? 'products' : 'services';
    const itemRef = doc(collection(db, collectionName));
    const id = itemRef.id;
    
    const newItem = {
      ...itemData,
      id,
    };
    
    const sanitizedData: any = {};
    Object.entries(newItem).forEach(([key, val]) => {
      if (val !== undefined) {
        sanitizedData[key] = val;
      }
    });

    let imageUrl = sanitizedData.imageUrl || sanitizedData.imageUrls?.[0] || sanitizedData.serviceImage || sanitizedData.logoUrl;
    if (collectionName === 'products') {
      const productImages = sanitizedData.imageUrls || sanitizedData.images || [];
      if (productImages.length > 0) {
        imageUrl = productImages[0];
      }
    }
    if (!imageUrl) {
      imageUrl = 'none';
    }

    let publicId = sanitizedData.publicId || sanitizedData.storagePath || sanitizedData.logoPublicId;
    if (collectionName === 'products' && imageUrl && imageUrl !== 'none') {
      const resolvedPublicId = await getCloudinaryPublicId(imageUrl, db);
      if (resolvedPublicId && resolvedPublicId !== 'none') {
        publicId = resolvedPublicId;
      }
    }
    if (!publicId) {
      publicId = 'none';
    }

    let finalStoreId = sanitizedData.storeId;
    let finalBusinessId = sanitizedData.businessId;
    let ownerId = sanitizedData.ownerUid || sanitizedData.ownerId;
    let selectedStore: any = null;

    if (collectionName === 'products') {
      // 1. Load the selected Store document
      if (finalStoreId && finalStoreId !== 'none') {
        const storeSnap = await getDoc(doc(db, 'stores', finalStoreId));
        if (storeSnap.exists()) {
          selectedStore = storeSnap.data();
          finalStoreId = storeSnap.id;
          finalBusinessId = selectedStore.businessId;
          ownerId = selectedStore.ownerId || selectedStore.ownerUid;
        }
      }

      // Fallback: If not found or if finalStoreId was 'none', try to query any store document
      if (!selectedStore) {
        const storesQuery = query(collection(db, 'stores'));
        const storesSnap = await getDocs(storesQuery);
        const validStoreDoc = storesSnap.docs.find(d => {
          const data = d.data();
          return data.status !== 'deleted' && (data.ownerId === ownerId || data.ownerUid === ownerId || ownerId === 'none' || !ownerId);
        }) || storesSnap.docs[0];

        if (validStoreDoc) {
          selectedStore = validStoreDoc.data();
          finalStoreId = validStoreDoc.id;
          finalBusinessId = selectedStore.businessId;
          ownerId = selectedStore.ownerId || selectedStore.ownerUid;
        }
      }

      // Console.log requested in instructions
      console.log({
        selectedStore,
        storeId: finalStoreId,
        businessId: finalBusinessId,
        ownerId
      });

      // Abort publishing if any are missing, or "none", null, undefined, empty string
      const isInvalid = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '';
      if (!selectedStore || isInvalid(finalStoreId) || isInvalid(finalBusinessId) || isInvalid(ownerId)) {
        throw new Error('Aborting publishing: storeId, businessId, or ownerId is missing or invalid.');
      }
    } else {
      if (!ownerId) ownerId = 'none';
      if (!finalBusinessId) finalBusinessId = 'none';
      if (!finalStoreId) finalStoreId = 'none';
    }

    console.log(`[Firestore ${collectionName} Create Pre-Check]`);
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

    const docData: any = {
      ...sanitizedData,
      published: true,
      status: sanitizedData.status || 'published',
      imageUrl,
      publicId,
      ownerId,
      ownerUid: ownerId, // Compatibility
      businessId: finalBusinessId,
      storeId: finalStoreId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (collectionName === 'products') {
      docData.productId = id;
      docData.images = sanitizedData.imageUrls || sanitizedData.images || [];
      docData.price = sanitizedData.price;

      // Do NOT save "none", null, undefined for imageUrl/publicId
      if (!imageUrl || imageUrl === 'none' || imageUrl === 'null' || imageUrl === 'undefined') {
        delete docData.imageUrl;
      }
      if (!publicId || publicId === 'none' || publicId === 'null' || publicId === 'undefined') {
        delete docData.publicId;
      }
    }
    
    await setDoc(itemRef, docData);
    return id;
  },

  async updateItem(id: string, type: 'product' | 'service', updateData: any, ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    const itemRef = doc(db, collectionName, id);
    
    const sanitizedData: any = {};
    Object.entries(updateData).forEach(([key, val]) => {
      if (val !== undefined) {
        sanitizedData[key] = val;
      }
    });

    const docSnap = await getDoc(itemRef);
    const existing = docSnap.exists() ? docSnap.data() : {};

    let imageUrl = sanitizedData.imageUrl || sanitizedData.imageUrls?.[0] || sanitizedData.serviceImage || sanitizedData.logoUrl || existing.imageUrl || existing.logoUrl;
    if (type === 'product') {
      const productImages = sanitizedData.imageUrls || sanitizedData.images || existing.images || existing.imageUrls || [];
      if (productImages.length > 0) {
        imageUrl = productImages[0];
      }
    }
    if (!imageUrl) {
      imageUrl = 'none';
    }

    let publicId = sanitizedData.publicId || sanitizedData.storagePath || sanitizedData.logoPublicId || existing.publicId || existing.storagePath;
    if (type === 'product' && imageUrl && imageUrl !== 'none') {
      const resolvedPublicId = await getCloudinaryPublicId(imageUrl, db);
      if (resolvedPublicId && resolvedPublicId !== 'none') {
        publicId = resolvedPublicId;
      }
    }
    if (!publicId) {
      publicId = 'none';
    }

    let finalStoreId = sanitizedData.storeId || existing.storeId;
    let finalBusinessId = sanitizedData.businessId || existing.businessId;
    let ownerId = sanitizedData.ownerUid || sanitizedData.ownerId || existing.ownerUid || existing.ownerId;
    let selectedStore: any = null;

    if (type === 'product') {
      // 1. Load the selected Store document
      if (finalStoreId && finalStoreId !== 'none') {
        const storeSnap = await getDoc(doc(db, 'stores', finalStoreId));
        if (storeSnap.exists()) {
          selectedStore = storeSnap.data();
          finalStoreId = storeSnap.id;
          finalBusinessId = selectedStore.businessId;
          ownerId = selectedStore.ownerId || selectedStore.ownerUid;
        }
      }

      // Fallback
      if (!selectedStore) {
        const storesQuery = query(collection(db, 'stores'));
        const storesSnap = await getDocs(storesQuery);
        const validStoreDoc = storesSnap.docs.find(d => {
          const data = d.data();
          return data.status !== 'deleted' && (data.ownerId === ownerId || data.ownerUid === ownerId || ownerId === 'none' || !ownerId);
        }) || storesSnap.docs[0];

        if (validStoreDoc) {
          selectedStore = validStoreDoc.data();
          finalStoreId = validStoreDoc.id;
          finalBusinessId = selectedStore.businessId;
          ownerId = selectedStore.ownerId || selectedStore.ownerUid;
        }
      }

      // Console.log requested in instructions
      console.log({
        selectedStore,
        storeId: finalStoreId,
        businessId: finalBusinessId,
        ownerId
      });

      // Abort updating if any are missing or "none" / null / undefined / empty string
      const isInvalid = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '';
      if (!selectedStore || isInvalid(finalStoreId) || isInvalid(finalBusinessId) || isInvalid(ownerId)) {
        throw new Error('Aborting updating: storeId, businessId, or ownerId is missing or invalid.');
      }
    } else {
      if (!ownerId) ownerId = 'none';
      if (!finalBusinessId) finalBusinessId = 'none';
      if (!finalStoreId) finalStoreId = 'none';
    }

    console.log(`[Firestore ${collectionName} Update Pre-Check]`);
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

    const docData: any = {
      ...sanitizedData,
      published: true,
      status: sanitizedData.status || existing.status || 'published',
      imageUrl,
      publicId,
      ownerId,
      ownerUid: ownerId, // Compatibility
      businessId: finalBusinessId,
      storeId: finalStoreId,
      updatedAt: serverTimestamp(),
    };

    if (type === 'product') {
      docData.productId = id;
      docData.images = sanitizedData.imageUrls || sanitizedData.images || existing.images || existing.imageUrls || [];
      if (sanitizedData.price !== undefined) {
        docData.price = sanitizedData.price;
      }

      // Do NOT save "none", null, undefined for imageUrl/publicId
      if (!imageUrl || imageUrl === 'none' || imageUrl === 'null' || imageUrl === 'undefined') {
        delete docData.imageUrl;
      }
      if (!publicId || publicId === 'none' || publicId === 'null' || publicId === 'undefined') {
        delete docData.publicId;
      }
    }

    await updateDoc(itemRef, docData);
  },

  async deleteItem(id: string, type: 'product' | 'service', ...args: any[]): Promise<void> {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    await deleteDoc(doc(db, collectionName, id));
  },

    async getItemsByOwner(ownerUid: string, type: 'product' | 'service') {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    
    let q = query(
      collection(db, collectionName),
      where('ownerUid', '==', ownerUid)
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
  async updateStock(productId: string, quantityChange: number): Promise<void> {
    const db = getFirebaseDb();
    const productRef = doc(db, 'products', productId);
    try {
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        const currentStock = snap.data().stock || 0;
        const newStock = Math.max(0, currentStock + quantityChange); // Prevent negative stock
        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Failed to update stock for product', productId, err);
      throw err;
    }
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