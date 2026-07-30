import { initializeFirestore } from "firebase/firestore";
try {
  initializeFirestore(null, {});
} catch (e) {
  console.log(e.name, e.message);
}
