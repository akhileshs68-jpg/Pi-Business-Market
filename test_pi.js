import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  try {
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
    console.log("Navigated to cart");
    // Since we need to be logged in to access cart and checkout, we can't easily test the full UI flow in Puppeteer without auth.
    // Let's just check if Pi is present on window.
    const hasPi = await page.evaluate(() => !!window.Pi);
    console.log("Has Pi SDK:", hasPi);
  } catch(e) {
    console.error("Test failed:", e);
  }
  
  await browser.close();
})();
