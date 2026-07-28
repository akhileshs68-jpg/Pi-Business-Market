import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, process.env.VITE_FIREBASE_DATABASE_ID);

async function check() {
  try {
    const bp = await getDocs(collection(db, 'businessProfiles'));
    console.log('businessProfiles count:', bp.size);
    bp.docs.forEach(d => console.log('BP', d.id, d.data().ownerUid, d.data().businessType, d.data().roleId));
    
    const b = await getDocs(collection(db, 'businesses'));
    console.log('businesses count:', b.size);
    b.docs.forEach(d => console.log('B', d.id, d.data().ownerUid, d.data().businessType, d.data().roleId));
    
    const s = await getDocs(collection(db, 'stores'));
    console.log('stores count:', s.size);
    s.docs.forEach(d => console.log('S', d.id, d.data().ownerUid, d.data().businessId));

    const p = await getDocs(collection(db, 'products'));
    console.log('products count:', p.size);
    p.docs.forEach(d => console.log('P', d.id, d.data().ownerUid, d.data().businessId));
  } catch(e) {
    console.error(e);
  }
}
check();
