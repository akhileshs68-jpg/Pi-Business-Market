const projectId = "straight-modem-gw1xt";
const dbId = "ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80";

async function run() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/stores`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Stores list REST response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('REST API Error:', e.message);
  }
}

run();
