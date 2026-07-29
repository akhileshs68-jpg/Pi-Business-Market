import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const isFirebaseConfigured = () => {
  return !!(import.meta as any).env.VITE_FIREBASE_API_KEY;
};

const useEmulator = () => (import.meta as any).env.VITE_USE_FIREBASE_EMULATOR === 'true';

export const getFirebaseApp = () => {
  if (!app) {
    const firebaseConfig = {
      apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
      authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase configuration is missing. Authentication and database features will be disabled.');
      return null as any;
    }

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (useEmulator()) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    // Auto detect long polling for restricted environments like Pi Browser
    const settings: any = {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    };

    const databaseId = (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || (import.meta as any).env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
    if (databaseId) {
      db = initializeFirestore(getFirebaseApp(), settings, databaseId);
    } else {
      db = initializeFirestore(getFirebaseApp(), settings);
    }

    if (useEmulator()) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  }
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
    if (useEmulator()) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  }
  return storage;
};

