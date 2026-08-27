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
import { getFirebaseDb, getFirebaseAuth } from '../firebase/config';
import { notificationService } from './notificationService';

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

function removeUndefinedFields(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // Preserve special non-plain objects like FieldValue, Timestamp, Date
  if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array' && !Array.isArray(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .map(item => removeUndefinedFields(item))
      .filter(item => item !== undefined);
  }
  const cleanObj: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      const cleaned = removeUndefinedFields(val);
      if (cleaned !== undefined) {
        cleanObj[key] = cleaned;
      }
    }
  }
  return cleanObj;
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

    // Sanitize image fields inside sanitizedData
    if (sanitizedData.imageUrl) sanitizedData.imageUrl = sanitizeImageField(sanitizedData.imageUrl);
    if (sanitizedData.mainImage) sanitizedData.mainImage = sanitizeImageField(sanitizedData.mainImage);
    if (sanitizedData.serviceImage) sanitizedData.serviceImage = sanitizeImageField(sanitizedData.serviceImage);
    if (sanitizedData.logoUrl) sanitizedData.logoUrl = sanitizeImageField(sanitizedData.logoUrl);
    if (sanitizedData.imageUrls) sanitizedData.imageUrls = sanitizeImageField(sanitizedData.imageUrls);
    if (sanitizedData.images) sanitizedData.images = sanitizeImageField(sanitizedData.images);

    let imageUrl = sanitizedData.imageUrl || sanitizedData.imageUrls?.[0] || sanitizedData.serviceImage || sanitizedData.logoUrl;
    if (collectionName === 'products') {
      const productImages = sanitizedData.imageUrls || sanitizedData.images || [];
      if (productImages.length > 0) {
        imageUrl = productImages[0];
      }
    }
    
    const defaultPlaceholder = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
    imageUrl = sanitizeImageField(imageUrl);
    if (!imageUrl) {
      imageUrl = defaultPlaceholder;
    }

    let publicId = sanitizedData.publicId || sanitizedData.storagePath || sanitizedData.logoPublicId;
    if (collectionName === 'products' && imageUrl && imageUrl !== defaultPlaceholder) {
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
    let ownerId = sanitizedData.ownerUid || sanitizedData.ownerId || sanitizedData.sellerId || sanitizedData.merchantId || sanitizedData.createdBy || sanitizedData.createdByUid;
    let selectedStore: any = null;

    const isInvalid = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '' || val === 'unknown';

    // 1. Resolve ownerId if missing
    if (isInvalid(ownerId)) {
      try {
        const auth = getFirebaseAuth();
        if (auth?.currentUser?.uid) {
          const { authService } = await import('../auth/authService');
          ownerId = authService.getLatestVerifiedUser()?.piUid || auth.currentUser.uid;
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Load the selected Store document
    if (!isInvalid(finalStoreId)) {
      const storeSnap = await getDoc(doc(db, 'stores', finalStoreId));
      if (storeSnap.exists()) {
        selectedStore = storeSnap.data();
        finalStoreId = storeSnap.id;
        if (isInvalid(finalBusinessId)) finalBusinessId = selectedStore.businessId;
        if (isInvalid(ownerId)) ownerId = selectedStore.ownerId || selectedStore.ownerUid;
      }
    }

    // Fallback Store lookup if needed
    if (!selectedStore) {
      const storesQuery = query(collection(db, 'stores'));
      const storesSnap = await getDocs(storesQuery);
      const validStoreDoc = storesSnap.docs.find(d => {
        const data = d.data();
        return data.status !== 'deleted' && !isInvalid(ownerId) && (data.ownerId === ownerId || data.ownerUid === ownerId || data.userId === ownerId || data.sellerId === ownerId);
      });

      if (validStoreDoc) {
        selectedStore = validStoreDoc.data();
        finalStoreId = validStoreDoc.id;
        if (isInvalid(finalBusinessId)) finalBusinessId = selectedStore.businessId;
        if (isInvalid(ownerId)) ownerId = selectedStore.ownerId || selectedStore.ownerUid;
      } else {
        throw new Error("Please select or create your store before adding a product.");
      }
    }

    // Fallback Business lookup if businessId still invalid
    if (isInvalid(finalBusinessId)) {
      const bizQuery = query(collection(db, 'businesses'));
      const bizSnap = await getDocs(bizQuery);
      const validBizDoc = bizSnap.docs.find(d => {
        const data = d.data();
        return data.status !== 'deleted' && !isInvalid(ownerId) && (data.ownerUid === ownerId || data.ownerId === ownerId || data.userId === ownerId);
      });

      if (validBizDoc) {
        finalBusinessId = validBizDoc.id;
        const bData = validBizDoc.data() as any;
        if (isInvalid(ownerId)) ownerId = bData.ownerUid || bData.ownerId;
      } else {
        throw new Error("Please select or create your business before adding a product.");
      }
    }

    console.log({
      selectedStore,
      storeId: finalStoreId,
      businessId: finalBusinessId,
      ownerId
    });

    if (!selectedStore || isInvalid(finalStoreId) || isInvalid(finalBusinessId) || isInvalid(ownerId)) {
      throw new Error('Aborting publishing: storeId, businessId, or ownerId is missing or invalid.');
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
      ownerUid: ownerId,
      sellerId: ownerId,
      merchantId: ownerId,
      createdBy: ownerId,
      createdByUid: ownerId,
      businessId: finalBusinessId,
      storeId: finalStoreId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (collectionName === 'products') {
      docData.productId = id;
      docData.images = sanitizedData.imageUrls || sanitizedData.images || [];
      docData.price = sanitizedData.price;

      if (!docData.imageUrl || docData.imageUrl === 'none' || docData.imageUrl === 'null' || docData.imageUrl === 'undefined') {
        docData.imageUrl = defaultPlaceholder;
      }
      if (!publicId || publicId === 'none' || publicId === 'null' || publicId === 'undefined') {
        delete docData.publicId;
      }
      if (docData.images) {
        docData.images = docData.images.map((img: any) => sanitizeImageField(img)).filter(Boolean);
        if (docData.images.length === 0) {
          docData.images = [defaultPlaceholder];
        }
      }
    }
    
    const cleanDocData = removeUndefinedFields(docData);
    await setDoc(itemRef, cleanDocData);

    try {
      if (ownerId) {
        await notificationService.notify(
          ownerId,
          'marketplace_update',
          `${itemData.type === 'service' ? 'Service' : 'Product'} Created`,
          `Your ${itemData.type === 'service' ? 'service offering' : 'product listing'} "${sanitizedData.title || 'Item'}" was created successfully.`,
          { entityId: id, entityType: itemData.type || 'product', linkTo: itemData.type === 'service' ? '/services' : '/marketplace' }
        );
      }
      if (sanitizedData.approvalStatus === 'pending' || sanitizedData.status === 'pending') {
        await notificationService.notifyAdmins(
          'admin_notice',
          `New ${itemData.type === 'service' ? 'Service' : 'Product'} Pending Moderation`,
          `New listing "${sanitizedData.title || 'Item'}" submitted for administrative review.`,
          { entityId: id, entityType: itemData.type || 'product', linkTo: '/admin-console' }
        );
      }
    } catch (notifErr) {
      console.warn('Product/Service creation notification warning:', notifErr);
    }

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

    // Sanitize image fields inside sanitizedData
    if (sanitizedData.imageUrl) sanitizedData.imageUrl = sanitizeImageField(sanitizedData.imageUrl);
    if (sanitizedData.mainImage) sanitizedData.mainImage = sanitizeImageField(sanitizedData.mainImage);
    if (sanitizedData.serviceImage) sanitizedData.serviceImage = sanitizeImageField(sanitizedData.serviceImage);
    if (sanitizedData.logoUrl) sanitizedData.logoUrl = sanitizeImageField(sanitizedData.logoUrl);
    if (sanitizedData.imageUrls) sanitizedData.imageUrls = sanitizeImageField(sanitizedData.imageUrls);
    if (sanitizedData.images) sanitizedData.images = sanitizeImageField(sanitizedData.images);

    const docSnap = await getDoc(itemRef);
    const existing = docSnap.exists() ? docSnap.data() : {};

    let imageUrl = sanitizedData.imageUrl || sanitizedData.imageUrls?.[0] || sanitizedData.serviceImage || sanitizedData.logoUrl || existing.imageUrl || existing.logoUrl;
    if (type === 'product') {
      const productImages = sanitizedData.imageUrls || sanitizedData.images || existing.images || existing.imageUrls || [];
      if (productImages.length > 0) {
        imageUrl = productImages[0];
      }
    }
    
    const defaultPlaceholder = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
    imageUrl = sanitizeImageField(imageUrl);
    if (!imageUrl) {
      imageUrl = defaultPlaceholder;
    }

    let publicId = sanitizedData.publicId || sanitizedData.storagePath || sanitizedData.logoPublicId || existing.publicId || existing.storagePath;
    if (type === 'product' && imageUrl && imageUrl !== defaultPlaceholder) {
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
    let ownerId = sanitizedData.ownerUid || sanitizedData.ownerId || sanitizedData.sellerId || sanitizedData.merchantId || existing.ownerUid || existing.ownerId || existing.sellerId;
    let selectedStore: any = null;

    const isInvalid = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '' || val === 'unknown';

    // 1. Resolve ownerId if missing
    if (isInvalid(ownerId)) {
      try {
        const auth = getFirebaseAuth();
        if (auth?.currentUser?.uid) {
          const { authService } = await import('../auth/authService');
          ownerId = authService.getLatestVerifiedUser()?.piUid || auth.currentUser.uid;
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Load the selected Store document
    if (!isInvalid(finalStoreId)) {
      const storeSnap = await getDoc(doc(db, 'stores', finalStoreId));
      if (storeSnap.exists()) {
        selectedStore = storeSnap.data();
        finalStoreId = storeSnap.id;
        if (isInvalid(finalBusinessId)) finalBusinessId = selectedStore.businessId;
        if (isInvalid(ownerId)) ownerId = selectedStore.ownerId || selectedStore.ownerUid;
      }
    }

    // Fallback Store lookup if needed
    if (!selectedStore) {
      const storesQuery = query(collection(db, 'stores'));
      const storesSnap = await getDocs(storesQuery);
      const validStoreDoc = storesSnap.docs.find(d => {
        const data = d.data();
        return data.status !== 'deleted' && !isInvalid(ownerId) && (data.ownerId === ownerId || data.ownerUid === ownerId || data.userId === ownerId || data.sellerId === ownerId);
      });

      if (validStoreDoc) {
        selectedStore = validStoreDoc.data();
        finalStoreId = validStoreDoc.id;
        if (isInvalid(finalBusinessId)) finalBusinessId = selectedStore.businessId;
        if (isInvalid(ownerId)) ownerId = selectedStore.ownerId || selectedStore.ownerUid;
      } else {
        throw new Error("Please select or create your store before updating a product.");
      }
    }

    // Fallback Business lookup if businessId still invalid
    if (isInvalid(finalBusinessId)) {
      const bizQuery = query(collection(db, 'businesses'));
      const bizSnap = await getDocs(bizQuery);
      const validBizDoc = bizSnap.docs.find(d => {
        const data = d.data();
        return data.status !== 'deleted' && !isInvalid(ownerId) && (data.ownerUid === ownerId || data.ownerId === ownerId || data.userId === ownerId);
      });

      if (validBizDoc) {
        finalBusinessId = validBizDoc.id;
        const bData = validBizDoc.data() as any;
        if (isInvalid(ownerId)) ownerId = bData.ownerUid || bData.ownerId;
      } else {
        throw new Error("Please select or create your business before updating a product.");
      }
    }

    console.log({
      selectedStore,
      storeId: finalStoreId,
      businessId: finalBusinessId,
      ownerId
    });

    if (!selectedStore || isInvalid(finalStoreId) || isInvalid(finalBusinessId) || isInvalid(ownerId)) {
      throw new Error('Aborting updating: storeId, businessId, or ownerId is missing or invalid.');
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
      ownerUid: ownerId,
      sellerId: ownerId,
      merchantId: ownerId,
      createdBy: ownerId,
      createdByUid: ownerId,
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

      if (!docData.imageUrl || docData.imageUrl === 'none' || docData.imageUrl === 'null' || docData.imageUrl === 'undefined') {
        docData.imageUrl = defaultPlaceholder;
      }
      if (!publicId || publicId === 'none' || publicId === 'null' || publicId === 'undefined') {
        delete docData.publicId;
      }
      if (docData.images) {
        docData.images = docData.images.map((img: any) => sanitizeImageField(img)).filter(Boolean);
        if (docData.images.length === 0) {
          docData.images = [defaultPlaceholder];
        }
      }
    }

    const cleanDocData = removeUndefinedFields(docData);
    await updateDoc(itemRef, cleanDocData);
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
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        docId: doc.id,
        productId: data.productId || doc.id
      } as any;
    });
  },

  async getItemById(id: string, type: 'product' | 'service') {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    
    // 1. Direct document lookup by Firestore Document ID
    try {
      const itemRef = doc(db, collectionName, id);
      const snap = await getDoc(itemRef);
      if (snap.exists()) {
        const data = snap.data();
        return { ...data, id: snap.id, docId: snap.id, productId: data.productId || snap.id };
      }
    } catch (e) {
      console.warn(`[productService] Direct getDoc by document ID (${id}) failed, attempting field fallback:`, e);
    }

    // 2. Fallback query by 'productId' field
    try {
      const qProductId = query(collection(db, collectionName), where('productId', '==', id));
      const snapProductId = await getDocs(qProductId);
      if (!snapProductId.empty) {
        const d = snapProductId.docs[0];
        const data = d.data();
        return { ...data, id: d.id, docId: d.id, productId: data.productId || d.id };
      }
    } catch (e) {
      console.warn(`[productService] Query by productId field (${id}) failed:`, e);
    }

    // 3. Fallback query by 'id' field
    try {
      const qId = query(collection(db, collectionName), where('id', '==', id));
      const snapId = await getDocs(qId);
      if (!snapId.empty) {
        const d = snapId.docs[0];
        const data = d.data();
        return { ...data, id: d.id, docId: d.id, productId: data.productId || d.id };
      }
    } catch (e) {
      console.warn(`[productService] Query by id field (${id}) failed:`, e);
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
          ...data,
          id: doc.id,
          docId: doc.id,
          productId: data.productId || doc.id
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
    return this.updateItem(id, 'product', { status: 'archived' });
  },
  async restoreProduct(id: string) {
    return this.updateItem(id, 'product', { status: 'published' });
  },
  async softDeleteProduct(id: string, ...args: any[]) {
    return this.updateItem(id, 'product', { status: 'deleted' });
  },
  async permanentDeleteProduct(id: string, ...args: any[]) {
    return this.deleteItem(id, 'product');
  }
,
  async isSkuUnique(sku: string, ...args: any[]) { return true; },
  async isSlugUnique(slug: string, ...args: any[]) { return true; }
};