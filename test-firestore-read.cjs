const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    
    let firestoreRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('firestore.googleapis.com')) {
        firestoreRequests.push({ url, method: request.method() });
      }
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('Injecting Firestore read test...');
    await page.evaluate(async () => {
      try {
        const projectId = "straight-modem-gw1xt";
        const dbId = "ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80";
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/users`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('REST API Response:', JSON.stringify(data));
      } catch (e) {
        console.error('REST API Error:', e.message);
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('--- Network Requests to Firestore ---');
    console.log(JSON.stringify(firestoreRequests, null, 2));
    
    await browser.close();
  } catch (e) {
    console.error('Failed:', e);
  }
})();
