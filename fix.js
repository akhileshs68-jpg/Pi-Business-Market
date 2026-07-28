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
const settings = {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
};
const db = initializeFirestore(app, settings); // DEFAULT DATABASE

async function check() {
  const p = await getDocs(collection(db, 'businessProfiles'));
  console.log('businessProfiles:', p.size);
  p.docs.forEach(d => console.log('BP:', d.id, d.data()));

  const b = await getDocs(collection(db, 'businesses'));
  console.log('businesses:', b.size);
  b.docs.forEach(d => console.log('BIZ:', d.id, d.data()));
  
  const s = await getDocs(collection(db, 'stores'));
  console.log('stores:', s.size);
  s.docs.forEach(d => console.log('STORE:', d.id, d.data()));
  
  const prod = await getDocs(collection(db, 'products'));
  console.log('products:', prod.size);
  prod.docs.forEach(d => console.log('PROD:', d.id, d.data()));
  
  process.exit(0);
}
check();
