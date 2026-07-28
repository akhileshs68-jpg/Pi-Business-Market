const admin = require('firebase-admin');
const { readFileSync } = require('fs');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));
} catch (e) {
  console.log('No service account file, falling back to local credentials/REST or empty config');
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseId: 'ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80'
  });
} else {
  // If no service account, use process.env or fallback
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  try {
    const snapshot = await db.collection('stores').get();
    console.log(`Found ${snapshot.size} stores:`);
    snapshot.forEach(doc => {
      console.log('Store ID:', doc.id, 'Data:', JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
  }
  process.exit(0);
}

run();
