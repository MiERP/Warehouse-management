const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  const ctx = browser.contexts()[0];
  const loginPage = ctx.pages()[0];
  console.log('login:', loginPage.url().slice(-20));
  
  // Fill
  await loginPage.fill('#unit-name', 'TEST');
  await loginPage.fill('#user-name', 'QA');
  await loginPage.fill('#password', '123456');
  console.log('filled');
  
  // Click via evaluate (avoids Playwright hang on window close)
  try {
    await loginPage.evaluate(() => {
      document.querySelector('#login-btn').click();
    });
    console.log('login btn clicked via eval');
  } catch(e) {
    console.log('eval click err (expected):', e.message.substring(0, 60));
  }
  
  // Disconnect and reconnect to get fresh pages
  console.log('disconnecting...');
  await browser.close();
  
  // Now reconnect fresh
  console.log('reconnecting...');
  let mainPage = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const b2 = await chromium.connectOverCDP('http://localhost:9222');
      for (const c of b2.contexts()) {
        for (const p of c.pages()) {
          try {
            const u = p.url();
            if (u.includes('index.html')) {
              await p.evaluate(() => 1);
              mainPage = p;
              break;
            }
          } catch(e) {}
        }
        if (mainPage) break;
      }
      if (!mainPage) {
        // keep browser alive for next poll
        await b2.close();
      } else {
        console.log(`main found at poll ${i}:`, await mainPage.url().catch(()=>'err'));
        break;
      }
    } catch(e) {
      // CDP might not be ready yet
    }
  }
  
  if (!mainPage) {
    console.log('FAIL: main never appeared');
    process.exit(1);
  }
  
  const browser2 = mainPage.context().browser();
  if (!browser2) { console.log('no browser2'); process.exit(1); }
  
  const errors = [];
  mainPage.on('pageerror', e => errors.push(e.message));
  mainPage.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  
  await mainPage.waitForTimeout(3000);
  await mainPage.waitForSelector('.sidebar', { timeout: 8000 }).catch(() => {});
  console.log('sidebar ready');
  
  // ====== CONSTRUCTIONS ======
  console.log('\n=== CONSTRUCTIONS ===');
  await mainPage.click('.nav-item[data-page="constructions"]');
  await mainPage.waitForTimeout(800);
  
  const addBtn = await mainPage.$('#page-constructions.active .toolbar .btn-primary');
  console.log('add btn:', !!addBtn);
  
  if (addBtn) {
    await addBtn.click();
    await mainPage.waitForTimeout(1200);
    
    const formCard = await mainPage.$('#construction-form-container .card');
    console.log('form card:', !!formCard);
    
    if (formCard) {
      const fields = await mainPage.$$('#construction-form-container input, #construction-form-container select');
      console.log('fields:', fields.length);
      
      await mainPage.fill('#con-name', 'TEST_QA_CT_006');
      const saveBtn = await mainPage.$('#construction-form-container .btn-primary');
      if (saveBtn) {
        await saveBtn.click();
        await mainPage.waitForTimeout(800);
        console.log('SAVED');
        
        const rows = await mainPage.$$('#construction-table-body tr');
        console.log('rows:', rows.length);
        
        // Edit
        const edited = await mainPage.evaluate(() => {
          const rows = document.querySelectorAll('#construction-table-body tr');
          for (const row of rows) {
            if (row.textContent.includes('TEST_QA')) { row.click(); return true; }
          }
          return false;
        });
        console.log('edit clicked:', edited);
        
        if (edited) {
          await mainPage.waitForTimeout(800);
          const editForm = await mainPage.$('#construction-form-container .card');
          console.log('edit form:', !!editForm);
          if (editForm) {
            const val = await mainPage.$eval('#con-name', el => el.value).catch(()=>'?');
            console.log('edit val:', val);
            await mainPage.fill('#con-name', val + '_EDITED');
            const s2 = await mainPage.$('#construction-form-container .btn-primary');
            if (s2) { await s2.click(); await mainPage.waitForTimeout(800); console.log('EDITED'); }
          }
        }
        
        // Delete
        const delBtns = await mainPage.$$('#construction-table-body .btn-danger');
        for (let i = 0; i < delBtns.length; i++) {
          const txt = await mainPage.evaluate((idx) => {
            const rows = document.querySelectorAll('#construction-table-body tr');
            return rows[idx]?.querySelector('td:first-child')?.textContent || '';
          }, i);
          if (txt.includes('TEST_QA')) {
            await delBtns[i].click();
            await mainPage.waitForTimeout(400);
            const cb = await mainPage.$('#modal-overlay.active .btn-danger, #modal-overlay.active .btn-primary');
            if (cb) { await cb.click(); await mainPage.waitForTimeout(500); }
            console.log('DELETED');
            break;
          }
        }
      }
    }
  } else {
    console.log('NO ADD BTN - check page:');
    const active = await mainPage.$('#page-constructions.active');
    console.log('active:', !!active);
  }
  
  // ====== WAREHOUSE EDIT ======
  console.log('\n=== WAREHOUSE EDIT ===');
  await mainPage.click('.nav-item[data-page="warehouses"]');
  await mainPage.waitForTimeout(800);
  
  const whRows = await mainPage.$$('#warehouse-table-body tr');
  console.log('wh rows:', whRows.length);
  
  if (whRows.length > 0) {
    const clicked = await mainPage.evaluate(() => {
      const rows = document.querySelectorAll('#warehouse-table-body tr');
      if (rows.length) { rows[0].click(); return true; }
      return false;
    });
    console.log('wh clicked:', clicked);
    
    if (clicked) {
      await mainPage.waitForTimeout(800);
      const form = await mainPage.$('#warehouse-form-container .card');
      console.log('wh form:', !!form);
      
      if (form) {
        const inputs = await mainPage.$$('#warehouse-form-container input[type="text"]');
        if (inputs.length) {
          const val = await inputs[0].inputValue();
          console.log('wh name:', val);
          await inputs[0].fill(val + '_EDITED');
          const s = await mainPage.$('#warehouse-form-container .btn-primary');
          if (s) { await s.click(); await mainPage.waitForTimeout(800); console.log('wh EDITED'); }
        }
      }
    }
  }
  
  // ====== LOGOUT ======
  console.log('\n=== LOGOUT ===');
  const lb = await mainPage.$('#sidebar-logout-btn');
  if (lb) {
    await lb.click();
    await mainPage.waitForTimeout(500);
    const modal = await mainPage.$('#modal-overlay.active');
    console.log('modal:', !!modal);
    
    if (modal) {
      const btnInfo = await mainPage.$$eval('#modal-footer button', btns => btns.map(b => ({t: b.textContent.trim(), c: b.className})));
      console.log('btns:', JSON.stringify(btnInfo));
      
      const confirmBtn = await mainPage.$('#modal-footer .btn-danger');
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('LOGGED OUT via btn-danger');
      } else {
        const pb = await mainPage.$('#modal-footer .btn-primary');
        if (pb) { await pb.click(); console.log('LOGGED OUT via btn-primary'); }
      }
    }
  }
  
  console.log('\n=== ERRORS ===');
  console.log(`Count: ${errors.length}`);
  errors.slice(0, 15).forEach((e, i) => console.log(`  ${i}: ${e.substring(0,120)}`));
  
  await mainPage.context().browser().close();
  console.log('DONE');
})().catch(e => console.error('FATAL:', e.message));
