import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, initializeFirestore } from 'firebase/firestore';
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

const app = initializeApp(config);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, configData.firestoreDatabaseId);

async function run() {
  try {
    console.log("=== RECENT CLIENT LOGS ===");
    const clientLogsRef = collection(db, 'clientLogs');
    const logsQuery = query(clientLogsRef, orderBy('timestamp', 'desc'), limit(40));
    const clientLogsSnap = await getDocs(logsQuery);
    console.log(`Found ${clientLogsSnap.docs.length} client logs.`);
    for (const doc of clientLogsSnap.docs) {
      const data = doc.data();
      const log = data.log || {};
      console.log(`[${data.timestamp || 'N/A'}] [${log.level || 'INFO'}] ${log.message || JSON.stringify(log)}`);
      if (log.details) {
        console.log("  Details:", JSON.stringify(log.details));
      }
    }

    console.log("\n=== RECENT PAYMENTS ===");
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(paymentsRef, orderBy('createdAt', 'desc'), limit(20));
    const paymentsSnap = await getDocs(paymentsQuery);
    console.log(`Found ${paymentsSnap.docs.length} payments.`);
    for (const doc of paymentsSnap.docs) {
      const data = doc.data();
      console.log(`DocID: ${doc.id} => paymentId: ${data.paymentId || 'N/A'}, status: ${data.status || data.paymentStatus || 'N/A'}, amount: ${data.amount || 'N/A'}, memo: ${data.memo || 'N/A'}, buyer: ${data.userUid || data.buyerId || 'N/A'}`);
    }

    console.log("\n=== RECENT ORDERS ===");
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(10));
    const ordersSnap = await getDocs(ordersQuery);
    console.log(`Found ${ordersSnap.docs.length} orders.`);
    for (const doc of ordersSnap.docs) {
      const data = doc.data();
      console.log(`OrderID: ${doc.id} => status: ${data.status || 'N/A'}, grandTotal: ${data.grandTotal || 'N/A'}, items: ${data.items ? data.items.length : 0}, txid: ${data.paymentTxId || data.txid || 'N/A'}`);
    }
    
    process.exit(0);
  } catch (e: any) {
    console.error("Error running get_recent_logs:", e);
    process.exit(1);
  }
}

run();
