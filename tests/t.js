const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const login = ctx.pages()[0];
  console.log('Login page');
  await login.fill('#unit-name', 'TEST');
  await login.fill('#user-name', 'QA');
  await login.fill('#password', '123456');
  await login.evaluate(() => { document.querySelector('#login-btn').click(); });
  console.log('Login clicked');
  await b.close();
  let main = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const b2 = await chromium.connectOverCDP('http://localhost:9222');
      for (const c of b2.contexts()) {
        for (const p of c.pages()) {
          try { if (p.url().includes('index.html')) { await p.evaluate(() => 1); main = p; break; } } catch(e) {}
        }
        if (main) break;
      }
      if (!main) await b2.close(); else break;
    } catch(e) {}
    if (main) break;
  }
  if (!main) { console.log('FAIL: no main'); process.exit(1); }
  console.log('Main found');
  await main.waitForTimeout(2000);
  const errors = [];
  main.on('pageerror', e => errors.push(e.message));
  console.log('=== CAMERA ===');
  await main.click('.nav-item[data-page="cameras"]');
  await main.waitForTimeout(800);
  const camAdd = await main.('#page-cameras.active .toolbar .btn-primary');
  if (camAdd.length > 0) {
    await camAdd[0].click();
    await main.waitForTimeout(1200);
    console.log('cam um:', !!(await main.('#cam-measure-input')));
    console.log('cam st:', !!(await main.('#cam-status-input')));
    console.log('cam iv:', !!(await main.('#cam-investor-input')));
  }
  console.log('=== FIRE ===');
  await main.click('.nav-item[data-page="fire-systems"]');
  await main.waitForTimeout(800);
  const fireAdd = await main.('#page-fire-systems.active .toolbar .btn-primary');
  if (fireAdd.length > 0) {
    await fireAdd[0].click();
    await main.waitForTimeout(1200);
    console.log('fire um:', !!(await main.('#fire-measure-input')));
    console.log('fire st:', !!(await main.('#fire-status-input')));
    console.log('fire iv:', !!(await main.('#fire-investor-input')));
  }
  console.log('=== CONSTRUCTIONS ===');
  await main.click('.nav-item[data-page="constructions"]');
  await main.waitForTimeout(800);
  const conAdd = await main.('#page-constructions.active .toolbar .btn-primary');
  if (conAdd.length > 0) {
    await conAdd[0].click();
    await main.waitForTimeout(1200);
    console.log('con type:', !!(await main.('#con-type-input')));
    console.log('con st:', !!(await main.('#con-status-input')));
    console.log('con iv:', !!(await main.('#con-investor-input')));
  }
  console.log('=== CONFIG ===');
  await main.click('.nav-item[data-page="config"]');
  await main.waitForTimeout(1000);
  const tabs = ['config-statuses','config-investors','config-unit-measures','config-construction-types'];
  for (const t of tabs) {
    const el = await main.(#config-tabs .tab-item[data-tab=""]);
    console.log(t + ':', el.length > 0);
  }
  console.log('Errors:', errors.length);
  errors.forEach(e => console.log('  ' + e.substring(0,80)));
  await main.context().browser().close();
  console.log('DONE');
})().catch(e => console.error('ERR:', e.message));