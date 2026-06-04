js = '''const { chromium } = require('playwright');
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
  
  // Test camera form
  console.log('=== CAMERA ===');
  await main.click('.nav-item[data-page="cameras"]');
  await main.waitForTimeout(800);
  const camBtns = await main.$$('#page-cameras.active .toolbar .btn-primary');
  if (camBtns.length > 0) {
    await camBtns[0].click();
    await main.waitForTimeout(1200);
    console.log('cam status-input:', (await main.$$('#cam-status-input')).length > 0);
    console.log('cam investor-input:', (await main.$$('#cam-investor-input')).length > 0);
    console.log('cam measure-input:', (await main.$$('#cam-measure-input')).length > 0);
  } else { console.log('No cam add btn'); }
  
  // Test fire form
  console.log('=== FIRE ===');
  await main.click('.nav-item[data-page="fire-systems"]');
  await main.waitForTimeout(800);
  const fireBtns = await main.$$('#page-fire-systems.active .toolbar .btn-primary');
  if (fireBtns.length > 0) {
    await fireBtns[0].click();
    await main.waitForTimeout(1200);
    console.log('fire status-input:', (await main.$$('#fire-status-input')).length > 0);
    console.log('fire investor-input:', (await main.$$('#fire-investor-input')).length > 0);
    console.log('fire measure-input:', (await main.$$('#fire-measure-input')).length > 0);
  }
  
  // Test construction form
  console.log('=== CONSTRUCTION ===');
  await main.click('.nav-item[data-page="constructions"]');
  await main.waitForTimeout(800);
  const conBtns = await main.$$('#page-constructions.active .toolbar .btn-primary');
  if (conBtns.length > 0) {
    await conBtns[0].click();
    await main.waitForTimeout(1200);
    console.log('con type-input:', (await main.$$('#con-type-input')).length > 0);
    console.log('con status-input:', (await main.$$('#con-status-input')).length > 0);
    console.log('con investor-input:', (await main.$$('#con-investor-input')).length > 0);
  }
  
  // Test config tabs
  console.log('=== CONFIG ===');
  await main.click('.nav-item[data-page="config"]');
  await main.waitForTimeout(1000);
  for (const t of ['statuses','investors','unit-measures','construction-types']) {
    const tab = await main.$$('#config-tabs .tab-item[data-tab=\"config-' + t + '\"]');
    console.log('tab config-' + t + ':', tab.length > 0);
  }
  
  console.log('Errors:', errors.length);
  errors.slice(0,5).forEach(e => console.log('  ', e.substring(0,100)));
  await main.context().browser().close();
  console.log('DONE');
})().catch(e => console.error('FATAL:', e.message));
'''

with open(r'D:\PROJECT\Agentic-AI\Warehouse-management\tests\check.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Written')