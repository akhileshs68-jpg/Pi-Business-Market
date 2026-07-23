const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const app = initializeApp({ projectId: "test-project" });
const db = getFirestore(app);

try {
  const ref = doc(db, 'businesses', undefined);
  console.log("Success");
} catch (e) {
  console.log("Error:", e.message);
}
