/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { MediaAsset, MediaModule, MediaVisibility } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/png', 
  'image/jpeg', 
  'image/jpg', 
  'image/webp', 
  'image/svg+xml',
  'application/pdf'
];

export const mediaService = {
  /**
   * Sanitizes a filename
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },

  /**
   * Generates a unique ID
   */
  generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  /**
   * Validates a file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Allowed: PNG, JPG, WEBP, SVG, PDF.' };
    }

    return { valid: true };
  },

  /**
   * Uploads a file to backend and saves metadata to Firestore
   */
  async uploadMedia(
    file: File,
    ownerUid: string,
    options: {
      module: MediaModule;
      businessId?: string;
      storeId?: string;
      visibility?: MediaVisibility;
      customMetadata?: Record<string, string>;
      onProgress?: (progress: number) => void;
    }
  ): Promise<MediaAsset> {
    const { valid, error } = this.validateFile(file);
    if (!valid) throw new Error(error);

    const db = getFirebaseDb();
    const mediaId = this.generateId();

    // Determine businessId and storeId
    let resolvedBusinessId = options.businessId;
    let resolvedStoreId = options.storeId;

    // 1. If options.businessId is not provided, attempt to resolve it from the global window objects if available
    if (typeof window !== 'undefined') {
      const globalStore = (window as any).__currentStoreProfile;
      if (globalStore) {
        if (!resolvedBusinessId) {
          resolvedBusinessId = globalStore.businessId || (globalStore.storeId ? undefined : globalStore.id);
        }
        if (!resolvedStoreId) {
          resolvedStoreId = globalStore.storeId || (globalStore.storeId ? globalStore.id : undefined);
        }
      }
      
      const globalBusiness = (window as any).__currentBusinessProfile;
      if (globalBusiness && !resolvedBusinessId) {
        resolvedBusinessId = globalBusiness.businessId || globalBusiness.id;
      }
    }

    // 2. Fallback: If options.storeId exists but options.businessId doesn't, try to fetch the store to get its businessId!
    if (!resolvedBusinessId && resolvedStoreId && resolvedStoreId !== 'none') {
      try {
        const storeDoc = await getDoc(doc(db, 'stores', resolvedStoreId));
        if (storeDoc.exists()) {
          resolvedBusinessId = storeDoc.data()?.businessId;
        }
      } catch (err) {
        console.warn('[mediaService] Failed to resolve businessId from storeId:', err);
      }
    }

    // 2b. Universal lookup: If we have an ownerUid, try resolving businessId and storeId from their active store/business if either is missing or invalid
    const isInvalidVal = (val: any) => !val || val === 'none' || val === 'undefined' || val === 'null' || val === '' || val === 'unknown';
    if (ownerUid && (isInvalidVal(resolvedBusinessId) || isInvalidVal(resolvedStoreId))) {
      try {
        // Query stores owned by this ownerUid
        const storesQuery = query(collection(db, 'stores'));
        const storesSnap = await getDocs(storesQuery);
        const validStoreDoc = storesSnap.docs.find(d => {
          const sData = d.data();
          return sData.status !== 'deleted' && (sData.ownerId === ownerUid || sData.ownerUid === ownerUid);
        }) || storesSnap.docs[0];

        if (validStoreDoc) {
          if (isInvalidVal(resolvedStoreId)) {
            resolvedStoreId = validStoreDoc.id;
          }
          if (isInvalidVal(resolvedBusinessId)) {
            resolvedBusinessId = validStoreDoc.data()?.businessId;
          }
        }

        // If still businessId is invalid, try business lookup
        if (isInvalidVal(resolvedBusinessId)) {
          const bizQuery = query(collection(db, 'businesses'));
          const bizSnap = await getDocs(bizQuery);
          const validBizDoc = bizSnap.docs.find(d => {
            const bData = d.data();
            return bData.status !== 'deleted' && (bData.ownerUid === ownerUid || bData.ownerId === ownerUid);
          }) || bizSnap.docs[0];

          if (validBizDoc) {
            resolvedBusinessId = validBizDoc.id;
          }
        }
      } catch (err) {
        console.warn('[mediaService] Failed to fallback resolve business/store:', err);
      }
    }

    // 3. Check if we are in an editing/managing context where businessId MUST be present.
    const businessRelatedModules: MediaModule[] = ['businesses', 'stores', 'products', 'services', 'jobs', 'documents'];
    const isEditingOrManaging = typeof window !== 'undefined' && (
      window.location.pathname.includes('/store/') || 
      window.location.pathname.includes('/store-dashboard') ||
      window.location.pathname.includes('/business/')
    );

    // If businessId cannot be resolved for business/store-related modules in editing context,
    // stop the save operation and throw a validation error.
    if (!resolvedBusinessId && businessRelatedModules.includes(options.module) && isEditingOrManaging) {
      throw new Error('Business ID is required to upload media. Operation stopped.');
    }
    
    // 1. Prepare Form Data for Backend
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', options.module);
    
    // 2. Upload to Backend API
    let response;
    try {
      response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(percentCompleted);
          }
        }
      });
    } catch (error: any) {
      const backendError = error.response?.data?.error || error.response?.data?.details || error.message;
      throw new Error(backendError || 'Upload failed');
    }

    const cloudinaryData = response.data;
    if (!cloudinaryData.success) {
      throw new Error(cloudinaryData.error || 'Upload failed');
    }

    // 3. Prepare Metadata
    const imageUrl = cloudinaryData.secure_url || cloudinaryData.secureUrl;
    const publicId = cloudinaryData.public_id || cloudinaryData.publicId;
    const ownerId = ownerUid;
    const finalBusinessId = resolvedBusinessId || 'none';
    const finalStoreId = resolvedStoreId || 'none';

    // 5. Before every Firestore write print:
    console.log('[Firestore Write Pre-Check]');
    console.log('uid:', ownerUid);
    console.log('businessId:', finalBusinessId);
    console.log('storeId:', finalStoreId);
    console.log('ownerId:', ownerId);
    console.log('cloudinary.secure_url:', imageUrl);
    console.log('cloudinary.public_id:', publicId);

    // 6. Abort save if any required value is undefined
    if (
      ownerUid === undefined ||
      finalBusinessId === undefined ||
      finalStoreId === undefined ||
      ownerId === undefined ||
      imageUrl === undefined ||
      publicId === undefined
    ) {
      console.error('[mediaService] Aborting Firestore write because a required value is undefined!');
      throw new Error('Aborting Firestore write because a required value is undefined.');
    }

    const asset: MediaAsset = {
      mediaId,
      ownerUid,
      businessId: finalBusinessId,
      storeId: finalStoreId,
      module: options.module,
      fileName: this.sanitizeFileName(file.name),
      originalName: file.name,
      mimeType: file.type,
      extension: cloudinaryData.format || file.name.split('.').pop() || '',
      size: cloudinaryData.bytes || file.size,
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      storagePath: publicId, // Store Cloudinary public_id here
      downloadUrl: imageUrl,
      thumbnailUrl: imageUrl.replace('/upload/', '/upload/c_thumb,w_200,h_200,g_face,q_auto,f_auto/'),
      status: 'active',
      visibility: options.visibility || 'public',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Save metadata to Firestore (making sure we never write undefined and fields exist)
    const rawPayload: Record<string, any> = {
      ...asset,
      imageUrl,
      publicId,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const sanitizedPayload: Record<string, any> = {};
    Object.entries(rawPayload).forEach(([key, val]) => {
      if (val !== undefined) {
        sanitizedPayload[key] = val;
      }
    });

    console.log('[Media Upload Save Trace]', {
      businessId: sanitizedPayload.businessId,
      storeId: sanitizedPayload.storeId,
      ownerId: sanitizedPayload.ownerId,
      'documentRef.id': mediaId
    });

    // 8. If Firestore save fails, do NOT leave orphan Cloudinary assets. Delete the uploaded Cloudinary asset or report it.
    try {
      await setDoc(doc(db, 'media', mediaId), sanitizedPayload);
    } catch (firestoreError: any) {
      console.error('[mediaService] Firestore write failed! Initiating cleanup of orphan Cloudinary asset:', publicId);
      try {
        await axios.delete(`/api/upload/${encodeURIComponent(publicId)}`);
        console.log('[mediaService] Successfully deleted orphan Cloudinary asset from backend.');
      } catch (deleteError) {
        console.error('[mediaService] Failed to clean up orphan Cloudinary asset from backend:', deleteError);
      }
      throw new Error(`Firestore save failed: ${firestoreError.message || String(firestoreError)}. Orphan Cloudinary asset was cleaned up.`);
    }

    return asset;
  },

  /**
   * Fetches media assets by module and owner
   */
  async getMediaByOwner(ownerUid: string, module?: MediaModule): Promise<MediaAsset[]> {
    const db = getFirebaseDb();
    let q = query(
      collection(db, 'media'), 
      where('ownerUid', '==', ownerUid),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    let assets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate().toISOString() : data.uploadedAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as MediaAsset;
    });

    if (module) {
      assets = assets.filter(a => a.module === module);
    }

    return assets.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  /**
   * Deletes a media asset (Soft delete or full delete based on requirement, here doing full)
   */
  async deleteMedia(mediaId: string): Promise<void> {
    const db = getFirebaseDb();
    
    try {
      const mediaRef = doc(db, 'media', mediaId);
      const mediaDoc = await getDoc(mediaRef);
      
      if (!mediaDoc.exists()) {
        throw new Error('Media not found');
      }

      const asset = mediaDoc.data() as MediaAsset;

      // Delete from Cloudinary backend
      if (asset.storagePath) {
        try {
          await axios.delete(`/api/upload/${encodeURIComponent(asset.storagePath)}`);
        } catch (e) {
          console.warn('Failed to delete from Cloudinary via backend', e);
        }
      }
      
      // Delete from Firestore
      await deleteDoc(mediaRef);
    } catch (err) {
      console.error('Delete media failed', err);
      throw err;
    }
  }
};
