const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('firebase-admin')) {
  code = "import admin from 'firebase-admin';\n" + code;
  code = code.replace("async function startServer() {", 
`if (process.env.VITE_FIREBASE_PROJECT_ID && !admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

async function startServer() {`);
}

fs.writeFileSync('server.ts', code);
