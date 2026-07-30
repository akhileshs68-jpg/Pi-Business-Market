import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';
import config from './firebase-applet-config.json' with { type: 'json' };

try {
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  console.log("DB instance:", !!db);
  // test collection
  collection(db, 'test');
  console.log("Collection works!");
} catch (e) {
  console.error(e);
}
