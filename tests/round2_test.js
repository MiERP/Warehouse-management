const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function findPage(browser, pattern) {
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) {
    try { if (p.url().includes(pattern)) { await p.evaluate(() => 1); return p; } } catch(e) {}
  }
  return null;
}

async function waitForPage(browser, pattern, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const p = await findPage(browser, pattern);
    if (p) return p;
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  // Login
  let login = await findPage(browser, 'login.html');
  let main = await findPage(browser, 'index.html');
  
  if (login) {
    console.log('=== LOGIN ===');
    await login.fill('#unit-name', 'TEST');
    await login.fill('#user-name', 'QA');
    await login.fill('#password', '123456');
    await login.click('#login-btn');
    main = await waitForPage(browser, 'index.html', 20000);
    console.log('Login done, main:', !!main);
  } else if (main) {
    console.log('Already logged in');
  }
  
  if (!main) { console.log('FAIL: no main page'); process.exit(1); }
  
  const errors = [];
  main.on('pageerror', e => errors.push(e.message));
  main.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await main.waitForTimeout(2000);
  
  // === TEST CONSTRUCTIONS (the correct way: inline form) ===
  console.log('--- CONSTRUCTIONS ---');
  await main.click('.nav-item[data-page="constructions"]');
  await main.waitForTimeout(800);
  
  const conAdd = await main.$('#page-constructions.active .toolbar .btn-primary');
  console.log('con add btn:', !!conAdd ? await conAdd.textContent() : 'NONE');
  
  if (conAdd) {
    await conAdd.click();
    await main.waitForTimeout(1000);
    
    const formCard = await main.$('#construction-form-container .card');
    console.log('con form:', !!formCard);
    
    if (formCard) {
      const fields = await main.$$('#construction-form-container input, #construction-form-container select, #construction-form-container textarea');
      console.log(`con fields: ${fields.length}`);
      
      const nameInp = await main.$('#con-name');
      if (nameInp) {
        await nameInp.fill('TEST_QA_CT_FIXED_001');
        console.log('con name filled');
      }
      
      const saveBtn = await main.$('#construction-form-container .btn-primary');
      if (saveBtn) {
        await saveBtn.click();
        await main.waitForTimeout(800);
        console.log('con SAVED');
        
        const rows = await main.$$('#construction-table-body tr');
        console.log(`con table rows: ${rows.length}`);
        
        // Edit via row click (use evaluate)
        if (rows.length > 0) {
          console.log('testing edit via evaluate click...');
          await main.evaluate(() => {
            const row = document.querySelector('#construction-table-body tr');
            if (row) row.click();
          });
          await main.waitForTimeout(800);
          const editForm = await main.$('#construction-form-container .card');
          console.log('con edit form:', !!editForm);
          
          if (editForm) {
            const nameInp2 = await main.$('#con-name');
            if (nameInp2) {
              const val = await nameInp2.inputValue();
              await nameInp2.fill(val + '_EDITED');
              const save2 = await main.$('#construction-form-container .btn-primary');
              if (save2) { await save2.click(); await main.waitForTimeout(800); console.log('con EDITED'); }
            }
          }
        }
        
        // Delete
        const delBtns = await main.$$('#construction-table-body .btn-danger');
        for (let i = 0; i < delBtns.length; i++) {
          const txt = await main.$eval(`#construction-table-body tr:nth-child(${i+1}) td:first-child`, el => el.textContent).catch(()=>'');
          if (txt.includes('TEST_QA')) {
            await delBtns[i].click(); await main.waitForTimeout(400);
            const confirm = await main.$('#modal-overlay.active .btn-danger, #modal-overlay.active .btn-primary');
            if (confirm) { await confirm.click(); await main.waitForTimeout(500); }
            console.log('con DELETED:', txt.substring(0,30));
            break;
          }
        }
      }
    }
  }
  
  // === TEST WAREHOUSE EDIT (use evaluate click) ===
  console.log('--- WAREHOUSE EDIT ---');
  await main.click('.nav-item[data-page="warehouses"]');
  await main.waitForTimeout(800);
  
  const whRows = await main.$$('#warehouse-table-body tr');
  console.log(`wh rows: ${whRows.length}`);
  
  if (whRows.length > 0) {
    // Use evaluate for click to avoid pointer interception
    await main.evaluate(() => {
      const row = document.querySelector('#warehouse-table-body tr');
      if (row) row.click();
    });
    await main.waitForTimeout(800);
    
    const form = await main.$('#warehouse-form-container .card');
    console.log('wh edit form:', !!form);
    
    if (form) {
      const nameInp = await main.$('#warehouse-form-container input[type="text"]');
      if (nameInp) {
        const val = await nameInp.inputValue();
        console.log(`wh name: ${val}`);
        await nameInp.fill(val + '_EDITED_R2');
        const saveBtn = await main.$('#warehouse-form-container .btn-primary');
        if (saveBtn) { await saveBtn.click(); await main.waitForTimeout(800); console.log('wh EDITED via evaluate'); }
      }
    }
  }
  
  // === TEST LOGOUT (use btn-danger) ===
  console.log('--- LOGOUT ---');
  const logoutBtn = await main.$('#sidebar-logout-btn');
  if (logoutBtn) {
    await logoutBtn.click();
    await main.waitForTimeout(500);
    
    const modal = await main.$('#modal-overlay.active');
    console.log('logout modal:', !!modal);
    
    if (modal) {
      // List all buttons
      const btns = await main.$$('#modal-footer button');
      for (const b of btns) {
        console.log(`  btn: "${await b.textContent()}" class="${await b.getAttribute('class')}"`);
      }
      
      // confirmAction uses btn-danger for confirm
      const confirmBtn = await main.$('#modal-footer .btn-danger');
      if (confirmBtn) {
        await confirmBtn.click();
        await main.waitForTimeout(2000);
        console.log('LOGGED OUT with btn-danger');
      } else {
        // Fallback: try btn-primary
        const primaryBtn = await main.$('#modal-footer .btn-primary');
        if (primaryBtn) {
          await primaryBtn.click();
          await main.waitForTimeout(2000);
          console.log('LOGGED OUT with btn-primary fallback');
        }
      }
    }
  }
  
  // === RUNTIME ERRORS ===
  console.log('');
  console.log(`RUNTIME ERRORS: ${errors.length}`);
  errors.slice(0, 10).forEach(e => console.log(`  ${e}`));
  
  await browser.close();
  console.log('DONE');
})().catch(e => console.error('FATAL:', e.message));
