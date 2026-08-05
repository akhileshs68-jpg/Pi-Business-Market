import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const config = {
  projectId: "straight-modem-gw1xt",
};

initializeApp(config);

const db = getFirestore("ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80");
async function run() {
  try {
    const snap = await db.collection("users").get();
    console.log("Total Users in DB:", snap.docs.length);
    snap.docs.forEach(doc => {
      console.log(`DocID: ${doc.id} => uid: ${doc.data().uid}, piUid: ${doc.data().piUid}, username: ${doc.data().username}, displayName: ${doc.data().displayName}`);
    });
  } catch(e: any) {
    console.error("Error:", e);
  }
}
run();
