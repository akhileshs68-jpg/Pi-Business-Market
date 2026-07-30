import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);

async function check() {
  const b = await getDocs(collection(db, 'businesses'));
  b.docs.forEach(d => console.log('BIZ:', d.id, d.data()));
  
  const s = await getDocs(collection(db, 'stores'));
  s.docs.forEach(d => console.log('STORE:', d.id, d.data()));
  
  const p = await getDocs(collection(db, 'products'));
  p.docs.forEach(d => console.log('PROD:', d.id, d.data()));
  
  process.exit(0);
}
check();
