
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const login = ctx.pages()[0];
  console.log('Login page:', login.url().slice(-20));
  
  // Login
  await login.fill('#unit-name', 'TEST');
  await login.fill('#user-name', 'QA');
  await login.fill('#password', '123456');
  // Click via eval to avoid hang
  await login.evaluate(() => document.querySelector('#login-btn').click());
  console.log('Login clicked');
  
  // Wait and reconnect
  await b.close();
  
  // Poll for main window
  let main = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const b2 = await chromium.connectOverCDP('http://localhost:9222');
      for (const c of b2.contexts()) {
        for (const p of c.pages()) {
          try {
            const u = p.url();
            if (u.includes('index.html')) {
              await p.evaluate(() => 1);
              main = p;
              break;
            }
          } catch(e) {}
        }
        if (main) break;
      }
      if (!main) await b2.close();
      else break;
    } catch(e) {}
    if (main) break;
  }
  
  if (!main) { console.log('FAIL: no main'); process.exit(1); }
  console.log('Main found:', await main.url().catch(()=>'err'));
  
  await main.waitForTimeout(2000);
  
  // ===== TEST CAMERA FORM =====
  console.log('
=== CAMERA FORM ===');
  await main.click('.nav-item[data-page="cameras"]');
  await main.waitForTimeout(800);
  
  const camAdd = await main.$('#page-cameras.active .toolbar .btn-primary');
  if (camAdd) {
    await camAdd.click();
    await main.waitForTimeout(1200);
    
    // Check combobox fields exist
    const hasUnitMeasureCB = await main.$('#cam-measure-input');
    const hasStatusCB = await main.$('#cam-status-input');
    const hasInvestorCB = await main.$('#cam-investor-input');
    console.log('cam unit_measure combobox:', !!hasUnitMeasureCB);
    console.log('cam status combobox:', !!hasStatusCB);
    console.log('cam investor combobox:', !!hasInvestorCB);
    
    // Fill fields
    if (hasUnitMeasureCB) await hasUnitMeasureCB.fill('He thong');
    if (hasStatusCB) await hasStatusCB.fill('Hoat dong');
    if (hasInvestorCB) await hasInvestorCB.fill('Bo Quoc Phong');
    
    // Fill name
    const nameInp = await main.$('#cam-name');
    if (nameInp) await nameInp.fill('TEST_QA_CAM_CMB_01');
    
    const saveBtn = await main.$('#camera-form-container .btn-primary');
    if (saveBtn) {
      await saveBtn.click();
      await main.waitForTimeout(1000);
      console.log('Camera SAVED');
    }
  } else {
    console.log('Camera add btn MISSING');
  }
  
  // ===== TEST FIRE SYSTEMS FORM =====
  console.log('
=== FIRE SYSTEMS FORM ===');
  await main.click('.nav-item[data-page="fire-systems"]');
  await main.waitForTimeout(800);
  
  const fireAdd = await main.$('#page-fire-systems.active .toolbar .btn-primary');
  if (fireAdd) {
    await fireAdd.click();
    await main.waitForTimeout(1200);
    
    const hasUM = await main.$('#fire-measure-input');
    const hasST = await main.$('#fire-status-input');
    const hasIV = await main.$('#fire-investor-input');
    console.log('fire unit_measure combobox:', !!hasUM);
    console.log('fire status combobox:', !!hasST);
    console.log('fire investor combobox:', !!hasIV);
    
    if (hasST) await hasST.fill('Tot');
    if (hasIV) await hasIV.fill('Bo Quoc Phong');
    
    const nameInp = await main.$('#fire-name');
    if (nameInp) await nameInp.fill('TEST_QA_FIRE_CMB_01');
    
    const saveBtn = await main.$('#fire-form-container .btn-primary');
    if (saveBtn) {
      await saveBtn.click();
      await main.waitForTimeout(1000);
      console.log('Fire System SAVED');
    }
  }
  
  // ===== TEST CONSTRUCTIONS FORM =====
  console.log('
=== CONSTRUCTIONS FORM ===');
  await main.click('.nav-item[data-page="constructions"]');
  await main.waitForTimeout(800);
  
  const conAdd = await main.$('#page-constructions.active .toolbar .btn-primary');
  if (conAdd) {
    await conAdd.click();
    await main.waitForTimeout(1200);
    
    const hasTypeCB = await main.$('#con-type-input');
    const hasStatusCB2 = await main.$('#con-status-input');
    const hasInvestorCB2 = await main.$('#con-investor-input');
    console.log('con construction_type combobox:', !!hasTypeCB);
    console.log('con status combobox:', !!hasStatusCB2);
    console.log('con investor combobox:', !!hasInvestorCB2);
    
    if (hasTypeCB) await hasTypeCB.fill('Xay moi');
    if (hasStatusCB2) await hasStatusCB2.fill('Dang thi cong');
    if (hasInvestorCB2) await hasInvestorCB2.fill('Bo Quoc Phong');
    
    const nameInp = await main.$('#con-name');
    if (nameInp) await nameInp.fill('TEST_QA_CT_CMB_01');
    
    const saveBtn = await main.$('#construction-form-container .btn-primary');
    if (saveBtn) {
      await saveBtn.click();
      await main.waitForTimeout(1000);
      console.log('Construction SAVED');
    }
  }
  
  // ===== CHECK CONFIG UI =====
  console.log('
=== CONFIG UI ===');
  await main.click('.nav-item[data-page="config"]');
  await main.waitForTimeout(1000);
  
  const configTabs = [
    { tab: 'config-statuses', id: 'statuses-list' },
    { tab: 'config-investors', id: 'investors-list' },
    { tab: 'config-unit-measures', id: 'unit-measures-list' },
    { tab: 'config-construction-types', id: 'construction-types-list' }
  ];
  
  for (const t of configTabs) {
    const tab = await main.$(`#config-tabs .tab-item[data-tab="${t.tab}"]`);
    if (tab) {
      await tab.click();
      await main.waitForTimeout(600);
      const content = await main.$(`#${t.tab}.active`);
      const list = await main.$(`#${t.id}`);
      console.log(`${t.tab}: content=${!!content}, list=${!!list}`);
    } else {
      console.log(`${t.tab}: TAB MISSING`);
    }
  }
  
  console.log('
DONE - all forms tested');
  await main.context().browser().close();
})().catch(e => console.error('FATAL:', e.message));
