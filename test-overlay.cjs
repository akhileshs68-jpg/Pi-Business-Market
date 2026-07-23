const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Mock the auth to bypass login
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem('pi_auth_user', JSON.stringify({
      uid: 'test-uid',
      displayName: 'Test User',
      roles: ['merchant']
    }));
  });

  await page.goto('http://localhost:3000/business/test-biz');
  
  // Wait for the page to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Check if main rendered
  const mainExists = await page.$('main');
  console.log('Main exists?', !!mainExists);

  if (mainExists) {
    const blockingElement = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Staff'));
      if (!tabs) return 'Tab not found';
      
      const rect = tabs.getBoundingClientRect();
      const el = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      
      return {
        tabRect: rect,
        elementAtPoint: el ? el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : '') : 'null',
        isSame: el === tabs || tabs.contains(el)
      };
    });
    
    console.log('Blocking Element for Tabs:', blockingElement);
  }
  
  await browser.close();
})();
