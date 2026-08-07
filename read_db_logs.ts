import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

function getDbInstance() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.log('firebase-applet-config.json does not exist');
    return null;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const projectId = config.projectId;
  const databaseId = config.firestoreDatabaseId || config.databaseId;

  if (getApps().length === 0) {
    initializeApp({
      projectId: projectId,
    });
  }

  console.log(`Using Project ID: ${projectId}, Database ID: ${databaseId}`);
  return getFirestore(databaseId);
}

async function run() {
  const db = getDbInstance();
  if (!db) return;

  console.log('=== Firestore paymentDebugLogs ===');
  const snap1 = await db.collection('paymentDebugLogs').orderBy('timestamp', 'desc').limit(50).get();
  console.log('Count:', snap1.size);
  snap1.docs.forEach(doc => {
    const d = doc.data();
    console.log(`[${d.timestamp}] [${d.source}] [${d.level}] ${d.eventName} (paymentId: ${d.paymentId || 'N/A'}, corrId: ${d.correlationId || 'N/A'})`);
    if (d.error) console.log('  Error:', d.error);
    if (d.requestBody) console.log('  ReqBody:', JSON.stringify(d.requestBody));
    if (d.responseBody) console.log('  ResBody:', JSON.stringify(d.responseBody));
  });

  console.log('\n=== Firestore clientLogs ===');
  const snap2 = await db.collection('clientLogs').orderBy('timestamp', 'desc').limit(50).get();
  console.log('Count:', snap2.size);
  snap2.docs.forEach(doc => {
    const d = doc.data();
    const l = d.log || {};
    console.log(`[${d.timestamp}] [Client] ${l.message || l}`);
    if (l.details) console.log('  Details:', JSON.stringify(l.details));
  });
}

run().catch(console.error);
