const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];
  console.log('page:', page.url().slice(-30));
  
  if (page.url().includes('login.html')) {
    await page.fill('#unit-name', 'TEST');
    await page.fill('#user-name', 'QA');
    await page.fill('#password', '123456');
    console.log('filled');
    
    // Click via eval and IMMEDIATELY disconnect
    const p = page.evaluate(() => { document.querySelector('#login-btn').click(); return 'clicked'; });
    try {
      const result = await Promise.race([p, new Promise(r => setTimeout(() => r('timeout'), 2000))]);
      console.log('click result:', result);
    } catch(e) {
      console.log('click err:', e.message.substring(0,50));
    }
  }
  
  // Don''t close browser, just wait
  console.log('sleeping 5s for login...');
  await new Promise(r => setTimeout(r, 5000));
  
  // Check pages now
  try {
    const contexts = browser.contexts();
    for (const c of contexts) {
      for (const p of c.pages()) {
        try {
          const u = p.url();
          console.log('page:', u.slice(-40));
        } catch(e) { console.log('dead page'); }
      }
    }
  } catch(e) {
    console.log('list error:', e.message);
  }
  
  console.log('done');
})().catch(e => console.error('FATAL:', e.message));
