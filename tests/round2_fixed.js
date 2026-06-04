const { chromium } = require('playwright');

async function findAnyPage(browser) {
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      try { await p.evaluate(() => document.readyState); return p; } catch(e) {}
    }
  }
  return null;
}

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  console.log('connected');
  
  let page = await findAnyPage(b);
  console.log('initial page:', page ? page.url() : 'none');
  
  if (page && page.url().includes('login.html')) {
    page.on('pageerror', e => console.log('PAGEERR:', e.message));
    page.on('console', m => { if (m.type()==='error') console.log('CONSERR:', m.text()); });
    
    // Fill login
    await page.fill('#unit-name', 'TEST');
    await page.fill('#user-name', 'QA');
    await page.fill('#password', '123456');
    await page.click('#login-btn');
    console.log('login submitted');
    
    // Wait for main page
    let mainPage = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      mainPage = await findAnyPage(b);
      if (mainPage && mainPage.url().includes('index.html')) break;
      mainPage = null;
    }
    
    if (mainPage) {
      console.log('main page found:', mainPage.url());
      page = mainPage;
    } else {
      console.log('FAIL: main page not found after login');
      await b.close();
      process.exit(1);
    }
  }
  
  if (!page.url().includes('index.html')) {
    console.log('not on main page, abort');
    await b.close();
    process.exit(1);
  }
  
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  
  await page.waitForTimeout(3000);
  await page.waitForSelector('.sidebar', { timeout: 5000 }).catch(() => {});
  console.log('main page ready');
  
  // ====== TEST CONSTRUCTIONS (inline form) ======
  console.log('\n=== CONSTRUCTIONS ===');
  await page.click('.nav-item[data-page="constructions"]');
  await page.waitForTimeout(800);
  
  const addBtn = await page.$('#page-constructions.active .toolbar .btn-primary');
  console.log('add btn:', !!addBtn);
  
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(1200);
    
    const formCard = await page.$('#construction-form-container .card');
    console.log('form card:', !!formCard);
    
    if (formCard) {
      await page.fill('#con-name', 'TEST_QA_CT_004');
      const saveBtn = await page.$('#construction-form-container .btn-primary');
      if (saveBtn) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        console.log('construction SAVED');
      }
      
      // Check rows
      const rows = await page.$$('#construction-table-body tr');
      console.log('rows after add:', rows.length);
      
      // Edit via evaluate
      const edited = await page.evaluate(() => {
        const row = document.querySelector('#construction-table-body tr');
        if (row && row.textContent.includes('TEST_QA')) {
          row.click();
          return true;
        }
        return false;
      });
      console.log('edit row clicked:', edited);
      
      if (edited) {
        await page.waitForTimeout(800);
        const editForm = await page.$('#construction-form-container .card');
        console.log('edit form:', !!editForm);
        if (editForm) {
          const nameVal = await page.$eval('#con-name', el => el.value).catch(()=>'?');
          console.log('edit name:', nameVal);
          await page.fill('#con-name', nameVal + '_EDITED');
          const saveBtn2 = await page.$('#construction-form-container .btn-primary');
          if (saveBtn2) { await saveBtn2.click(); await page.waitForTimeout(800); console.log('construction EDITED'); }
        }
      }
      
      // Cleanup
      const delBtns = await page.$$('#construction-table-body .btn-danger');
      for (let i = 0; i < delBtns.length; i++) {
        const txt = await page.evaluate((idx) => {
          const rows = document.querySelectorAll('#construction-table-body tr');
          return rows[idx] ? rows[idx].querySelector('td:first-child')?.textContent || '' : '';
        }, i);
        if (txt.includes('TEST_QA')) {
          await delBtns[i].click();
          await page.waitForTimeout(400);
          const confirm = await page.$('#modal-overlay.active .btn-danger, #modal-overlay.active .btn-primary');
          if (confirm) { await confirm.click(); await page.waitForTimeout(500); }
          console.log('construction DELETED');
          break;
        }
      }
    }
  }
  
  // ====== TEST WAREHOUSE EDIT ======
  console.log('\n=== WAREHOUSE EDIT ===');
  await page.click('.nav-item[data-page="warehouses"]');
  await page.waitForTimeout(800);
  
  const whRows = await page.$$('#warehouse-table-body tr');
  console.log('wh rows:', whRows.length);
  
  if (whRows.length > 0) {
    const clicked = await page.evaluate(() => {
      const row = document.querySelector('#warehouse-table-body tr');
      if (row) { row.click(); return true; }
      return false;
    });
    console.log('wh row clicked:', clicked);
    
    if (clicked) {
      await page.waitForTimeout(800);
      const form = await page.$('#warehouse-form-container .card');
      console.log('wh edit form:', !!form);
      
      if (form) {
        const nameInp = await page.$('#warehouse-form-container input[type="text"]');
        if (nameInp) {
          const val = await nameInp.inputValue();
          console.log('wh edit name:', val);
          await nameInp.fill(val + '_EDITED');
          const saveBtn = await page.$('#warehouse-form-container .btn-primary');
          if (saveBtn) { await saveBtn.click(); await page.waitForTimeout(800); console.log('wh EDITED'); }
        }
      }
    }
  }
  
  // ====== TEST LOGOUT ======
  console.log('\n=== LOGOUT ===');
  const lb = await page.$('#sidebar-logout-btn');
  console.log('logout btn:', !!lb);
  
  if (lb) {
    await lb.click();
    await page.waitForTimeout(500);
    
    const modal = await page.$('#modal-overlay.active');
    console.log('modal:', !!modal);
    
    if (modal) {
      const btnTexts = await page.$$eval('#modal-footer button', btns => btns.map(b => ({text: b.textContent, cls: b.className})));
      console.log('footer btns:', JSON.stringify(btnTexts));
      
      const confirmBtn = await page.$('#modal-footer .btn-danger');
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('LOGGED OUT via btn-danger');
      } else {
        const primaryBtn = await page.$('#modal-footer .btn-primary');
        if (primaryBtn) {
          await primaryBtn.click();
          console.log('LOGGED OUT via btn-primary');
        }
      }
    }
  }
  
  console.log('\n=== ERRORS ===');
  console.log(`Count: ${errors.length}`);
  errors.slice(0, 10).forEach(e => console.log('  ', e));
  
  await b.close();
  console.log('DONE');
})().catch(e => console.error('FATAL:', e.message));
