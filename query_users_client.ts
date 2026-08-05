import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';
import * as fs from 'fs';

const configData = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const config = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
};

console.log("Using Config Project ID:", config.projectId);
console.log("Using Database ID:", configData.firestoreDatabaseId);

const app = initializeApp(config);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, configData.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log("Total Users:", snap.docs.length);
    snap.docs.forEach(d => {
      console.log(`Doc ID: ${d.id} =>`, JSON.stringify(d.data()));
    });
  } catch (err: any) {
    console.error("Client fetch error:", err.message);
  }
  process.exit(0);
}
run();
