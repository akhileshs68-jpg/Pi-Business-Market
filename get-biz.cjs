const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

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
