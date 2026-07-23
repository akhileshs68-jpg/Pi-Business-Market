const fs = require('fs');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

let envContent = fs.readFileSync('.env', 'utf8');
envContent = envContent.replace('VITE_FIREBASE_API_KEY=', `VITE_FIREBASE_API_KEY="${config.apiKey}"`);
envContent = envContent.replace('VITE_FIREBASE_AUTH_DOMAIN=', `VITE_FIREBASE_AUTH_DOMAIN="${config.authDomain}"`);
envContent = envContent.replace('VITE_FIREBASE_PROJECT_ID=', `VITE_FIREBASE_PROJECT_ID="${config.projectId}"`);
envContent = envContent.replace('VITE_FIREBASE_DATABASE_ID=', `VITE_FIREBASE_DATABASE_ID="${config.firestoreDatabaseId || '(default)'}"`);
envContent = envContent.replace('VITE_FIREBASE_STORAGE_BUCKET=', `VITE_FIREBASE_STORAGE_BUCKET="${config.storageBucket}"`);
envContent = envContent.replace('VITE_FIREBASE_MESSAGING_SENDER_ID=', `VITE_FIREBASE_MESSAGING_SENDER_ID="${config.messagingSenderId}"`);
envContent = envContent.replace('VITE_FIREBASE_APP_ID=', `VITE_FIREBASE_APP_ID="${config.appId}"`);

fs.writeFileSync('.env', envContent);
console.log('Updated .env with firebase-applet-config.json');
