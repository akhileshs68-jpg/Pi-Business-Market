import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  credential: applicationDefault()
});

const db = getFirestore("ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80");

async function run() {
  try {
    const collections = await db.listCollections();
    for (const col of collections) {
      console.log('Collection:', col.id);
      const docs = await col.listDocuments();
      console.log('Docs in', col.id, ':', docs.length);
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
