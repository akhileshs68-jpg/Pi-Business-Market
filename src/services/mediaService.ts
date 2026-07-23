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
    const asset: MediaAsset = {
      mediaId,
      ownerUid,
      businessId: options.businessId,
      storeId: options.storeId,
      module: options.module,
      fileName: this.sanitizeFileName(file.name),
      originalName: file.name,
      mimeType: file.type,
      extension: cloudinaryData.format || file.name.split('.').pop() || '',
      size: cloudinaryData.bytes || file.size,
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      storagePath: cloudinaryData.public_id || cloudinaryData.publicId, // Store Cloudinary public_id here
      downloadUrl: cloudinaryData.secure_url || cloudinaryData.secureUrl,
      thumbnailUrl: (cloudinaryData.secure_url || cloudinaryData.secureUrl).replace('/upload/', '/upload/c_thumb,w_200,h_200,g_face,q_auto,f_auto/'),
      status: 'active',
      visibility: options.visibility || 'public',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Save metadata to Firestore
    await setDoc(doc(db, 'media', mediaId), {
      ...asset,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

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
