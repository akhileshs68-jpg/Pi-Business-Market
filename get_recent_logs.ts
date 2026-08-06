import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const config: any = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "straight-modem-gw1xt",
};

const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const fsa = process.env.FIREBASE_SERVICE_ACCOUNT;

if (gac && fs.existsSync(gac)) {
  config.credential = cert(gac);
} else if (fsa) {
  let serviceAccount: any;
  try {
    serviceAccount = typeof fsa === 'string' ? JSON.parse(fsa) : fsa;
  } catch (e) {
    serviceAccount = fsa;
  }
  config.credential = cert(serviceAccount);
}

initializeApp(config);

const db = getFirestore("ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80");

async function run() {
  try {
    console.log("=== RECENT CLIENT LOGS ===");
    const clientLogsSnap = await db.collection("clientLogs").orderBy("timestamp", "desc").limit(30).get();
    console.log(`Found ${clientLogsSnap.docs.length} client logs.`);
    for (const doc of clientLogsSnap.docs) {
      const data = doc.data();
      console.log(`[${data.timestamp}] [${data.log?.level || 'INFO'}] ${data.log?.message || JSON.stringify(data.log)}`);
      if (data.log?.details) {
        console.log("  Details:", JSON.stringify(data.log.details));
      }
    }

    console.log("\n=== RECENT PAYMENTS ===");
    const paymentsSnap = await db.collection("payments").orderBy("createdAt", "desc").limit(10).get();
    console.log(`Found ${paymentsSnap.docs.length} payments.`);
    for (const doc of paymentsSnap.docs) {
      const data = doc.data();
      console.log(`DocID: ${doc.id} => paymentId: ${data.paymentId}, status: ${data.status || data.paymentStatus}, amount: ${data.amount}, memo: ${data.memo}, buyer: ${data.metadata?.buyerUid || data.userUid || 'N/A'}`);
    }
  } catch(e: any) {
    console.error("Error reading Firestore:", e);
  }
}

run();
