const { chromium } = require('playwright');
(async () => {
  console.log('connect...');
  const b = await chromium.connectOverCDP('http://localhost:9222');
  console.log('connected!');
  for (const ctx of b.contexts()) {
    console.log('context pages:', ctx.pages().length);
    for (const p of ctx.pages()) {
      console.log('page:', p.url());
      await p.evaluate(() => document.title).then(t => console.log('title:', t)).catch(e => console.log('eval err:', e.message));
    }
  }
  console.log('close...');
  await b.close();
  console.log('done');
})().catch(e => console.error('ERR:', e.message));
