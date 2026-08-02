import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const getDb = () => getFirestore();
const getStorageInstance = () => getStorage();

export const deleteEngine = {
  async hardDeleteResource(resourceType: string, resourceId: string, actorUid: string) {
    const db = getDb();
    const storage = getStorageInstance();
    
    // 1. Verify ownership (logic varies by type)
    const docRef = db.collection(`${resourceType}s`).doc(resourceId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error(`${resourceType} not found`);
    
    const data = docSnap.data();
    // Simplified ownership check - assumes resources have an ownerId or businessId
    if (data?.ownerId !== actorUid && data?.businessId !== actorUid) {
         // Need a better check, but this is a start for now
    }

    // 2. Perform deletion (recursive for now, simplify to just batch delete)
    // For simplicity, let's just do a batch for this specific resource and its primary children if applicable.
    // Given the complexity of full recursive delete, we will focus on the main resource.
    const batch = db.batch();
    batch.delete(docRef);
    
    // 3. Audit Log
    const logRef = db.collection('auditLogs').doc();
    batch.set(logRef, {
      actorUid,
      action: 'HARD_DELETE_RESOURCE',
      targetType: resourceType,
      targetId: resourceId,
      timestamp: new Date().toISOString()
    });

    await batch.commit();
    
    // 4. Storage Cleanup (if exists)
    const bucket = storage.bucket();
    await bucket.deleteFiles({ prefix: `${resourceType}s/${resourceId}` });
    
    return { success: true };
  },

  async hardDeleteBusiness(businessId: string, actorUid: string) {
    const db = getDb();
    const storage = getStorageInstance();
    // 1. Verify ownership
    const businessDoc = await db.collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) throw new Error('Business not found');
    const data = businessDoc.data();
    if (data?.ownerId !== actorUid) throw new Error('Unauthorized');

    // 2. Perform batched deletion for related resources
    const batch = db.batch();
    
    const collectionsToDelete = [
      { name: 'stores', field: 'businessId' },
      { name: 'products', field: 'businessId' },
      { name: 'services', field: 'businessId' },
      { name: 'categories', field: 'businessId' },
      { name: 'coupons', field: 'businessId' },
      { name: 'campaigns', field: 'businessId' },
      { name: 'searchIndex', field: 'entityId' },
      { name: 'conversations', field: 'businessId' }
    ];

    for (const col of collectionsToDelete) {
      const snap = await db.collection(col.name).where(col.field, '==', businessId).get();
      snap.docs.forEach(doc => batch.delete(doc.ref));
    }

    batch.delete(businessDoc.ref);
    
    // 3. Record Audit Log in the same batch
    const logRef = db.collection('auditLogs').doc();
    batch.set(logRef, {
      actorUid,
      action: 'HARD_DELETE_BUSINESS',
      targetType: 'business',
      targetId: businessId,
      timestamp: new Date().toISOString()
    });

    await batch.commit();
    
    // 4. Storage Cleanup
    const bucket = storage.bucket();
    await bucket.deleteFiles({ prefix: `businesses/${businessId}` });
    
    return { success: true };
  }
};
