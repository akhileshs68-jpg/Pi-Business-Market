import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/datastore'
    });
    const client = await auth.getClient();
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const dbId = process.env.VITE_FIREBASE_DATABASE_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents`;
    const res = await client.request({ url });
    console.log(res.data);
  } catch(e) {
    console.error(e);
  }
}
run();
