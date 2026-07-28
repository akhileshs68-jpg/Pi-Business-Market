import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'products'), limit(5));
  const productsSnap = await getDocs(q);
  const prods = productsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
  console.log("Products count:", prods.length);
  if(prods.length > 0) {
    console.log("Sample product keys:", Object.keys(prods[0]));
    console.log("Sample product 0 name/title field:", prods[0].productName || prods[0].title || prods[0].name);
    console.log("Sample product 0 category:", prods[0].category);
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
