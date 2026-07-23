const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('firestore.googleapis.com')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    } else {
      request.continue();
    }
  });

  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem('pi_auth_user', JSON.stringify({
      uid: 'test-uid',
      displayName: 'Test User',
      roles: ['merchant']
    }));
  });

  await page.goto('http://localhost:3000/business/test-biz');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const mainExists = await page.$('main');
  console.log('Main exists?', !!mainExists);
  
  await browser.close();
})();
