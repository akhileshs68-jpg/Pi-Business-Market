import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';

async function run() {
  try {
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/datastore' });
    const client = await auth.getClient();
    const projectId = 'straight-modem-gw1xt';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
    const res = await client.request({ url });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e.message);
  }
}
run();
