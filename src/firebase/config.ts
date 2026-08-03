import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, getFirestore as _getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const getRawConfig = () => {
  const envKey = (import.meta as any).env.VITE_FIREBASE_API_KEY;
  if (envKey) {
    return {
      apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
      authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
    };
  }
  return {
    apiKey: firebaseAppletConfig.apiKey,
    authDomain: firebaseAppletConfig.authDomain,
    projectId: firebaseAppletConfig.projectId,
    storageBucket: firebaseAppletConfig.storageBucket,
    messagingSenderId: firebaseAppletConfig.messagingSenderId,
    appId: firebaseAppletConfig.appId,
    firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId,
  };
};

export const isFirebaseConfigured = () => {
  const cfg = getRawConfig();
  return !!(cfg.apiKey && cfg.projectId);
};

export const getFirebaseApp = () => {
  if (!app) {
    const firebaseConfig = getRawConfig();
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase configuration is missing.');
      return null as any;
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
};

export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  if (!app) throw new Error('Firebase Auth unavailable');
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
};

export const getFirebaseDb = () => {
  const app = getFirebaseApp();
  if (!app) throw new Error('Firebase Firestore unavailable');
  if (!db) {
    const rawCfg = getRawConfig();
    const databaseId = rawCfg.firestoreDatabaseId;
    try {
      if (databaseId && typeof databaseId === 'string' && databaseId.trim().length > 0) {
        db = initializeFirestore(app, { experimentalForceLongPolling: true }, databaseId);
      } else {
        db = initializeFirestore(app, { experimentalForceLongPolling: true });
      }
      console.log("[Firebase Config] Firestore initialized with experimentalForceLongPolling. Database ID:", databaseId || "(default)");
    } catch (err) {
      console.warn("[Firebase Config] initializeFirestore failed, falling back to _getFirestore:", err);
      if (databaseId && typeof databaseId === 'string' && databaseId.trim().length > 0) {
        db = _getFirestore(app, databaseId);
      } else {
        db = _getFirestore(app);
      }
    }
  }
  return db;
};

export const getFirebaseStorage = () => {
  const app = getFirebaseApp();
  if (!app) throw new Error('Firebase Storage unavailable');
  if (!storage) {
    storage = getStorage(app);
  }
  return storage;
};

