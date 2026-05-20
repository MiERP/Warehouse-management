const { chromium } = require('playwright');

async function run() {
  const baseUrl = process.env.WAREHOUSE_WEB_URL || 'http://127.0.0.1:3000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const runtimeErrors = [];

  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });
  page.on('pageerror', error => runtimeErrors.push(error.message));

  try {
    await page.goto(baseUrl + '/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#unit-name', 'Test Unit');
    await page.fill('#user-name', 'Tester');
    await page.fill('#password', '123456');
    await Promise.all([
      page.waitForURL('**/app', { timeout: 10000 }),
      page.click('#login-btn')
    ]);
    await page.waitForSelector('#page-dashboard.active', { timeout: 10000 });
    await page.waitForSelector('#header-title', { timeout: 10000 });

    if (runtimeErrors.length) {
      throw new Error(runtimeErrors.join('\n'));
    }
  } finally {
    await browser.close();
  }
}

run()
  .then(() => process.stdout.write('Web browser smoke test passed\n'))
  .catch(error => {
    process.stderr.write((error.stack || String(error)) + '\n');
    process.exit(1);
  });
