const { chromium } = require('playwright');
(async () => {
  console.log('connecting...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('connected');
  let p = null;
  for (const ctx of browser.contexts()) for (const pg of ctx.pages()) if (pg.url().includes('index.html')) { p = pg; break; }
  console.log('page:', !!p);
  if (!p) { process.exit(1); }
  await p.click('.nav-item[data-page="constructions"]');
  await p.waitForTimeout(800);
  const add = await p.eval('.toolbar .btn-primary', els => els.map(e => e.textContent));
  console.log('add btns:', JSON.stringify(add));
  await browser.close();
  console.log('done');
})().catch(e => console.error('err:', e.message));
