const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('businesses').limit(1).get();
  if (!snapshot.empty) {
    console.log('BIZ_ID:', snapshot.docs[0].id);
  } else {
    console.log('No businesses found.');
  }
  process.exit(0);
}

run();
