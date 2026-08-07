import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  console.log("Fetching clientLogs from Firestore using client SDK...");
  try {
    const q = query(collection(db, 'clientLogs'));
    const snap = await getDocs(q);
    console.log(`Successfully fetched ${snap.size} documents.`);
    const docs = [];
    snap.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    // Sort manually by timestamp desc in memory to handle any missing index issues
    docs.sort((a, b) => {
      const ta = a.recordedEntry?.timestamp || a.timestamp || '';
      const tb = b.recordedEntry?.timestamp || b.timestamp || '';
      return tb.localeCompare(ta);
    });
    console.log(JSON.stringify(docs.slice(0, 30), null, 2));
  } catch (err) {
    console.error("Error fetching clientLogs:", err);
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
