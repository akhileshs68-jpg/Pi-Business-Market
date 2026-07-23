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
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    console.log('Clicking Pi Auth...');
    // The button has "Authenticate with Pi SDK" text
    const buttons = await page.$$('button');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Authenticate with Pi SDK')) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (clicked) {
      // Wait for auth to complete
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.log('Could not find auth button');
    }

    console.log('--- Network Requests to Firestore ---');
    console.log(JSON.stringify(firestoreRequests, null, 2));
    
    await browser.close();
  } catch (e) {
    console.error('Failed:', e);
  }
})();
