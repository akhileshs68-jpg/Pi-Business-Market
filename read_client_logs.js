import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  let projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  let databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!projectId) projectId = config.projectId;
    if (!databaseId) databaseId = config.firestoreDatabaseId || config.databaseId;
  }

  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fsa = process.env.FIREBASE_SERVICE_ACCOUNT;

  let app;
  if (gac && fs.existsSync(gac)) {
    app = initializeApp({
      credential: cert(gac),
      projectId: projectId || undefined
    });
  } else if (fsa) {
    let serviceAccount = typeof fsa === 'string' ? JSON.parse(fsa) : fsa;
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId || undefined
    });
  } else {
    // try default app
    app = initializeApp({
      projectId: projectId || undefined
    });
  }

  const db = databaseId ? getFirestore(databaseId) : getFirestore();
  console.log('Querying clientLogs...');
  const snapshot = await db.collection('clientLogs').orderBy('timestamp', 'desc').limit(50).get();
  console.log(`Found ${snapshot.size} client logs.`);
  
  const logs = [];
  snapshot.forEach(doc => {
    logs.push({ id: doc.id, ...doc.data() });
  });

  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error);
