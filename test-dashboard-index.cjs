const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    const indexUrls = new Set();
    page.on('console', msg => {
      const text = msg.text();
      console.log('BROWSER_CONSOLE:', text);
      if (text.includes('requires an index')) {
        const match = text.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
        if (match) indexUrls.add(match[0]);
      }
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Login to access dashboard
    console.log('Clicking Pi Auth...');
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
      // Wait for navigation to dashboard
      console.log('Waiting for navigation to dashboard...');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation wait timeout'));
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.log('Could not find auth button');
    }

    console.log('--- Index URLs Found ---');
    for (const url of indexUrls) {
      console.log(url);
    }
    
    await browser.close();
  } catch (e) {
    console.error('Failed:', e);
  }
})();
