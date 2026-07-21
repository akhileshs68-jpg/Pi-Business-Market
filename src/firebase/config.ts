import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const isFirebaseConfigured = () => {
  return !!(import.meta as any).env.VITE_FIREBASE_API_KEY;
};

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

    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase configuration is missing. Please use the Firebase setup tool in the AI Studio sidebar to provision your project.');
    }

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    // Force Long Polling to handle Pi Browser's restricted webview
    db = initializeFirestore(getFirebaseApp(), {
      experimentalAutoDetectLongPolling: true,
    });
  }
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
};

