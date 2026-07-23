const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('button', { timeout: 10000 });
  
  // Evaluate click on login
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Simulator'));
    if(btn) btn.click();
  });
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  
  await page.goto('http://localhost:3000/business/123'); // Assuming /business/:id works
  await page.waitForSelector('main', { timeout: 10000 });
  
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
  
  console.log('Blocking Element:', blockingElement);
  
  await browser.close();
})();
