import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'test-proj' });
console.log('App init done. getApps length:', getApps().length);

async function run() {
  try {
    console.log('Calling verifyIdToken...');
    await getAuth().verifyIdToken('invalid-token');
  } catch (e: any) {
    console.log('verifyIdToken error:', e.message);
  }

  try {
    console.log('Calling firestore get...');
    await getFirestore().collection('test').doc('test').get();
  } catch (e: any) {
    console.log('firestore get error:', e.message);
  }
}
run();
