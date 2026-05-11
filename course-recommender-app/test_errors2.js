const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle0', timeout: 30000 });
  console.log("ERRORS_FOUND:");
  console.log(errors.join('\n'));
  await browser.close();
})();
