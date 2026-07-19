/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable
} from 'firebase/storage';
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
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { getFirebaseStorage, getFirebaseDb } from '../firebase/config';
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
   * Sanitizes a filename to prevent path traversal and other issues
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
   * Uploads a file and saves metadata
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
    }
  ): Promise<MediaAsset> {
    const { valid, error } = this.validateFile(file);
    if (!valid) throw new Error(error);

    const storage = getFirebaseStorage();
    const db = getFirebaseDb();
    
    const mediaId = this.generateId();
    const sanitizedName = this.sanitizeFileName(file.name);
    const extension = sanitizedName.split('.').pop() || '';
    const storagePath = `${options.module}/${ownerUid}/${mediaId}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    // Prepare Metadata
    const asset: MediaAsset = {
      mediaId,
      ownerUid,
      businessId: options.businessId,
      storeId: options.storeId,
      module: options.module,
      fileName: sanitizedName,
      originalName: file.name,
      mimeType: file.type,
      extension,
      size: file.size,
      storagePath,
      downloadUrl,
      status: 'active',
      visibility: options.visibility || 'public',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Extract image dimensions if possible
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await this.getImageDimensions(file);
        asset.width = dimensions.width;
        asset.height = dimensions.height;
      } catch (e) {
        console.warn('Failed to extract image dimensions', e);
      }
    }

    // Save metadata to Firestore
    await setDoc(doc(db, 'media', mediaId), {
      ...asset,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return asset;
  },

  /**
   * Helper to get image dimensions
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
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

    if (module) {
      q = query(q, where('module', '==', module));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        mediaId: doc.id,
        uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate().toISOString() : data.uploadedAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as MediaAsset;
    });
  },

  /**
   * Deletes a media asset
   */
  async deleteMedia(mediaId: string): Promise<void> {
    const db = getFirebaseDb();
    const storage = getFirebaseStorage();
    
    const docRef = doc(db, 'media', mediaId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) throw new Error('Media asset not found');
    
    const asset = docSnap.data() as MediaAsset;
    
    // Delete from Storage
    try {
      const storageRef = ref(storage, asset.storagePath);
      await deleteObject(storageRef);
    } catch (e) {
      console.warn('Failed to delete from storage, might already be gone', e);
    }
    
    // Delete from Firestore (or soft delete)
    await deleteDoc(docRef);
  },

  /**
   * Formats file size
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
};
