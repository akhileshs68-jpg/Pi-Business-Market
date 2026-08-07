const fs = require('fs');

async function run() {
  if (fs.existsSync('/firebase-applet-config.json')) {
    const config = JSON.parse(fs.readFileSync('/firebase-applet-config.json', 'utf8'));
    const dbId = config.firestoreDatabaseId || '(default)';
    const projId = config.projectId;
    const apiKey = config.apiKey;
    const restUrl = `https://firestore.googleapis.com/v1/projects/${projId}/databases/${dbId}/documents/clientLogs?key=${apiKey}`;
    try {
      const res = await fetch(restUrl);
      if (res.ok) {
        const json = await res.json();
        console.log('--- FIRESTORE NEWEST LOGS ---');
        console.log(JSON.stringify(json, null, 2));
      } else {
        console.log('REST API FAILED:', res.status, await res.text());
      }
    } catch(err) {
      console.log('REST API ERROR:', err.message);
    }
  } else {
    console.log('firebase-applet-config.json not found');
  }
}

run();
