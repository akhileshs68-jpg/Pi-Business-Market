import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

async function test() {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    };
    
    // Oh wait! The server runs via `npm run dev` in AI Studio. The variables ARE injected in that process!
    console.log("Key:", process.env.VITE_FIREBASE_API_KEY);
    console.log("Project:", process.env.VITE_FIREBASE_PROJECT_ID);
}
test().catch(console.error);
