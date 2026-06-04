const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  
  // step 1 - login
  const pages1 = b.contexts()[0].pages();
  console.log('pages before:', pages1.length, pages1.map(p => p.url().slice(-20)));
  
  const login = pages1[0];
  await login.fill('#unit-name', 'TEST');
  await login.fill('#user-name', 'QA');
  await login.fill('#password', '123456');
  console.log('fields filled');
  
  await login.click('#login-btn');
  console.log('login clicked');
  
  // Wait and re-list pages
  let mainPage = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const pages2 = b.contexts()[0].pages();
      const urls = pages2.map(p => { try { return p.url().slice(-30); } catch(e) { return 'ERR'; }});
      console.log(`  t=${i}: ${pages2.length} pages:`, urls);
      for (const p2 of pages2) {
        try {
          const u = p2.url();
          if (u.includes('index.html')) {
            await p2.evaluate(() => document.readyState);
            mainPage = p2;
            break;
          }
        } catch(e) {}
      }
      if (mainPage) break;
    } catch(e) { console.log('  list err:', e.message); }
  }
  
  console.log('main page found:', !!mainPage);
  if (mainPage) {
    console.log('url:', await mainPage.url().catch(()=>'err'));
  }
  
  await b.close();
  console.log('done');
})().catch(e => console.error('FATAL:', e.message));
