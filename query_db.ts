import dotenv from 'dotenv';
dotenv.config();

// MOCK import.meta.env
(globalThis as any).import = {
  meta: {
    env: {
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      VITE_FIREBASE_DATABASE_ID: process.env.VITE_FIREBASE_DATABASE_ID,
    }
  }
};

import { getFirebaseDb } from './src/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  const db = getFirebaseDb();
  const bSnap = await getDocs(collection(db, 'businesses'));
  console.log('Businesses:');
  bSnap.forEach(doc => console.log(doc.id, doc.data().businessName));
}
main().catch(console.error);
