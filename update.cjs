const fs = require('fs');
let code = fs.readFileSync('src/services/mediaService.ts', 'utf8');

code = code.replace(
`import { getFirebaseDb } from '../firebase/config';`,
`import { getFirebaseDb, getFirebaseStorage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';`
);

code = code.replace(/async uploadMedia\([\s\S]*?return asset;\n  },/g, 
`async uploadMedia(
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
    const storage = getFirebaseStorage();
    const mediaId = this.generateId();
    const extension = file.name.split('.').pop() || '';
    const storagePath = \`\${options.module}/\${ownerUid}/\${mediaId}.\${extension}\`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (options.onProgress) {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            options.onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            const asset: MediaAsset = {
              mediaId,
              ownerUid,
              businessId: options.businessId,
              storeId: options.storeId,
              module: options.module,
              fileName: this.sanitizeFileName(file.name),
              originalName: file.name,
              mimeType: file.type,
              extension,
              size: file.size,
              storagePath,
              downloadUrl,
              thumbnailUrl: downloadUrl,
              status: 'active',
              visibility: options.visibility || 'public',
              uploadedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'media', mediaId), {
              ...asset,
              uploadedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            resolve(asset);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  },`);

code = code.replace(/async deleteMedia\([\s\S]*?\} catch \(err\) \{/g,
`async deleteMedia(mediaId: string): Promise<void> {
    const db = getFirebaseDb();
    const storage = getFirebaseStorage();

    try {
      const mediaRef = doc(db, 'media', mediaId);
      const mediaDoc = await getDoc(mediaRef);

      if (!mediaDoc.exists()) {
        throw new Error('Media not found');
      }

      const asset = mediaDoc.data() as MediaAsset;

      if (asset.storagePath) {
        try {
          const storageRef = ref(storage, asset.storagePath);
          await deleteObject(storageRef);
        } catch (e) {
          console.warn('Failed to delete from Storage', e);
        }
      }

      await deleteDoc(mediaRef);
    } catch (err) {`);

fs.writeFileSync('src/services/mediaService.ts', code);
