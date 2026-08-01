import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({
        projectId: "ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80"
    });
}
const db = getFirestore();

(async () => {
  const snapshot = await db.collection("products").limit(1).get();
  snapshot.forEach(doc => console.log(doc.id, doc.data()));
})();
