import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const config = {
  projectId: "straight-modem-gw1xt",
};

initializeApp(config);

const db = getFirestore("ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80");
async function run() {
  try {
    const snap = await db.collection("products").limit(1).get();
    console.log("Docs:", snap.docs.length);
  } catch(e: any) {
    console.error("Error:", e);
  }
}
run();
