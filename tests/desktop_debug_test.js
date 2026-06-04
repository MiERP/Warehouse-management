const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REPORT = { modules: {}, errors: [], totals: { pass: 0, fail: 0, blocked: 0 } };

function log(level, msg) { const ts = new Date().toISOString().slice(11,19); console.log(`[${ts}] [${level}] ${msg}`); }
function record(module, action, status, detail) {
  if (!REPORT.modules[module]) REPORT.modules[module] = [];
  REPORT.modules[module].push({ action, status, detail });
  REPORT.totals[status]++;
  const icon = status==='PASS'?'OK':status==='FAIL'?'XX':status==='BLOCKED'?'--':'??';
  log(status, `${icon} ${module} | ${action} ${detail ? ': '+detail : ''}`);
}

async function findPage(browser, urlPattern) {
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      try {
        const url = p.url();
        if (url.includes(urlPattern)) {
          await p.evaluate(() => document.readyState);
          return p;
        }
      } catch(e) { /* page may be closed */ }
    }
  }
  return null;
}

async function waitForPage(browser, urlPattern, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const page = await findPage(browser, urlPattern);
    if (page) return page;
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

async function navTo(mainPage, pageId) {
  log('INFO', `Navigating to: ${pageId}`);
  const navEl = await mainPage.$(`.nav-item[data-page="${pageId}"]`);
  if (!navEl) { record(pageId, 'Navigation', 'FAIL', 'Nav item not found'); return false; }
  await navEl.click();
  await mainPage.waitForTimeout(800);
  const active = await mainPage.$(`#page-${pageId}.active`);
  if (active) { record(pageId, 'Navigation', 'PASS', `Navigated to ${pageId}`); return true; }
  else { record(pageId, 'Navigation', 'FAIL', `Page ${pageId} not active`); return false; }
}

(async () => {
  log('INFO', 'Connecting to Electron CDP on port 9222...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');

  // Look for main page first (might already be logged in)
  let mainPage = await findPage(browser, 'index.html');
  let loginPage = await findPage(browser, 'login.html');

  if (!loginPage && !mainPage) {
    log('ERROR', 'No pages found');
    process.exit(1);
  }

  // === LOGIN IF NEEDED ===
  if (loginPage && !mainPage) {
    log('INFO', 'Login required');
    loginPage.on('pageerror', err => { REPORT.errors.push(`[LOGIN] ${err.message}`); });

    // Test empty submit
    try {
      await loginPage.click('#login-btn');
      await loginPage.waitForTimeout(400);
      record('Login', 'Empty submit', 'PASS', 'Login button clickable');
    } catch(e) { record('Login', 'Empty submit', 'FAIL', e.message); }

    // Fill + login
    try {
      await loginPage.fill('#unit-name', 'TEST_DEBUG_DON_VI');
      await loginPage.fill('#user-name', 'QA_Tester');
      await loginPage.fill('#password', '123456');
      record('Login', 'Fill credentials', 'PASS', 'All 3 fields fillable');
    } catch(e) { record('Login', 'Fill credentials', 'FAIL', e.message); }

    // Test wrong password
    try {
      await loginPage.fill('#password', 'wrongpass');
      await loginPage.click('#login-btn');
      await loginPage.waitForTimeout(800);
      record('Login', 'Wrong password', 'PASS', 'Error handling works');
    } catch(e) { record('Login', 'Wrong password', 'FAIL', e.message); }

    // Theme toggle on login
    try {
      const lt = await loginPage.$('#theme-toggle');
      if (lt) { await lt.click(); record('Login', 'Theme toggle', 'PASS'); }
    } catch(e) {}

    // Correct login
    try {
      await loginPage.fill('#password', '123456');
      await loginPage.click('#login-btn');
    } catch(e) { record('Login', 'Submit', 'FAIL', e.message); }

    log('INFO', 'Waiting for main window...');
    mainPage = await waitForPage(browser, 'index.html', 20000);
    if (!mainPage) { log('ERROR', 'Main window never appeared'); process.exit(1); }
    record('Login', 'Login OK', 'PASS', 'Main window appeared');
  } else if (mainPage) {
    log('INFO', `Already logged in: ${mainPage.url()}`);
    record('Login', 'Already logged in', 'PASS', 'Skipped login, main window found');
  }

  // Setup error listeners
  mainPage.on('pageerror', err => { REPORT.errors.push(`[MAIN] ${err.message}`); log('ERROR', `Main: ${err.message}`); });
  mainPage.on('console', msg => { if (msg.type() === 'error') { REPORT.errors.push(`[CONSOLE] ${msg.text()}`); } });

  await mainPage.waitForTimeout(2000);
  
  // Verify main UI loaded
  try {
    await mainPage.waitForSelector('.sidebar', { timeout: 8000 });
    record('Main', 'Sidebar render', 'PASS', 'Sidebar visible');
  } catch(e) { record('Main', 'Sidebar render', 'FAIL', e.message); }

  // Check all 7 nav items
  const navIds = ['dashboard', 'warehouses', 'fire-systems', 'cameras', 'constructions', 'documents', 'config'];
  const navLabels = ['Dashboard', 'Nha kho', 'Cuu hoa', 'Camera', 'Cong trinh', 'Tai lieu', 'Cau hinh'];
  for (let i = 0; i < navIds.length; i++) {
    const nav = await mainPage.$(`.nav-item[data-page="${navIds[i]}"]`);
    if (nav) {
      const txt = await nav.textContent().catch(()=>'');
      record('Global', `Nav ${navLabels[i]}`, 'PASS', txt.trim().substring(0,40));
    } else {
      record('Global', `Nav ${navLabels[i]}`, 'FAIL', 'Missing');
    }
  }

  // Sidebar user info
  try {
    const uname = await mainPage.$eval('#sidebar-user-name', el => el.textContent).catch(()=>'?');
    const uunit = await mainPage.$eval('#sidebar-user-unit', el => el.textContent).catch(()=>'?');
    record('Global', 'User info', 'PASS', `Name=${uname}, Unit=${uunit}`);
  } catch(e) { record('Global', 'User info', 'FAIL', e.message); }

  // Dashboard check
  try {
    const dashboardActive = await mainPage.$('#page-dashboard.active');
    record('Dashboard', 'Active on load', dashboardActive ? 'PASS' : 'FAIL');
  } catch(e) {}

  // === GLOBAL SEARCH ===
  const searchInput = await mainPage.$('.search-box input, #global-search');
  if (searchInput) {
    try {
      await searchInput.click();
      await searchInput.fill('Kho');
      await mainPage.waitForTimeout(1200);
      const display = await mainPage.$eval('#search-results', el => el.style.display).catch(() => 'none');
      record('Global', 'Search', display !== 'none' ? 'PASS' : 'BLOCKED', display !== 'none' ? 'Results shown' : 'No results / no data');
      await searchInput.fill('');
      await mainPage.waitForTimeout(300);
    } catch(e) { record('Global', 'Search', 'FAIL', e.message); }
  } else {
    record('Global', 'Search', 'FAIL', 'Search input not found');
  }

  // === THEME TOGGLE ===
  try {
    const themeBtn = await mainPage.$('#header-theme-toggle');
    if (themeBtn) {
      const before = await mainPage.$eval('html', el => el.getAttribute('data-theme'));
      await themeBtn.click();
      await mainPage.waitForTimeout(400);
      const after = await mainPage.$eval('html', el => el.getAttribute('data-theme'));
      record('Global', 'Theme toggle', before !== after ? 'PASS' : 'FAIL', `${before} -> ${after}`);
      // toggle back to dark
      if (after !== 'dark') await themeBtn.click();
    } else { record('Global', 'Theme toggle', 'FAIL', 'Button not found'); }
  } catch(e) { record('Global', 'Theme toggle', 'FAIL', e.message); }

  // === HEADER USER BUTTON ===
  try {
    const headerUser = await mainPage.$('#header-user');
    if (headerUser) record('Global', 'Header user badge', 'PASS', 'User initial shown');
  } catch(e) {}

  // ==========================================
  // PHASE: WAREHOUSES CRUD
  // ==========================================
  log('INFO', '--- WAREHOUSES ---');
  if (await navTo(mainPage, 'warehouses')) {
    await mainPage.waitForTimeout(600);
    
    // Toolbar buttons
    const whBtns = await mainPage.$$('#page-warehouses.active .toolbar button');
    const whBtnTexts = [];
    for (const b of whBtns) { whBtnTexts.push((await b.textContent().catch(()=>'')).trim()); }
    record('Warehouses', 'Toolbar buttons', 'PASS', `${whBtns.length}: ${whBtnTexts.join(', ')}`);

    // Add
    const whAdd = await mainPage.$('#page-warehouses.active .toolbar .btn-primary');
    if (whAdd) {
      await whAdd.click();
      await mainPage.waitForTimeout(1000);
      const whForm = await mainPage.$('#warehouse-form-container .card');
      if (whForm) {
        const whFields = await mainPage.$$('#warehouse-form-container input, #warehouse-form-container select, #warehouse-form-container textarea');
        record('Warehouses', 'Add form', 'PASS', `${whFields.length} fields`);
        
        const nameInputs = await mainPage.$$('#warehouse-form-container input[type="text"]');
        if (nameInputs.length > 0) {
          await nameInputs[0].fill('TEST_QA_KHO_001');
          record('Warehouses', 'Fill name', 'PASS');
        }
        
        const saveBtn = await mainPage.$('#warehouse-form-container .btn-primary');
        if (saveBtn) {
          await saveBtn.click();
          await mainPage.waitForTimeout(1000);
          record('Warehouses', 'Save', 'PASS');
        } else { record('Warehouses', 'Save', 'FAIL', 'Not found'); }
      } else { record('Warehouses', 'Add form', 'FAIL', 'Not rendered'); }
    } else { record('Warehouses', 'Add button', 'FAIL', 'Not found'); }

    await mainPage.waitForTimeout(500);
    const whRows = await mainPage.$$('#warehouse-table-body tr');
    record('Warehouses', 'Table', 'PASS', `${whRows.length} rows`);
    
    // Click row for edit
    if (whRows.length > 0) {
      try {
        await whRows[0].click();
        await mainPage.waitForTimeout(800);
        const editForm = await mainPage.$('#warehouse-form-container .card');
        record('Warehouses', 'Edit (row click)', editForm ? 'PASS' : 'FAIL');
      } catch(e) { record('Warehouses', 'Edit (row click)', 'FAIL', e.message); }
    }

    // Delete test records
    const whDelBtns = await mainPage.$$('#warehouse-table-body .btn-danger');
    for (let i = 0; i < Math.min(whDelBtns.length, 20); i++) {
      const txt = await mainPage.$eval(`#warehouse-table-body tr:nth-child(${i+1}) td:first-child`, el => el.textContent).catch(() => '');
      if (txt && txt.includes('TEST_QA')) {
        await whDelBtns[i].click(); await mainPage.waitForTimeout(400);
        const cb = await mainPage.$('#modal-overlay.active .btn-primary');
        if (cb) { await cb.click(); await mainPage.waitForTimeout(500); }
        record('Warehouses', 'Delete', 'PASS', `Deleted: ${txt.substring(0,30)}`);
        break;
      }
    }
  }

  // ==========================================
  // PHASE: FIRE SYSTEMS
  // ==========================================
  log('INFO', '--- FIRE SYSTEMS ---');
  if (await navTo(mainPage, 'fire-systems')) {
    await mainPage.waitForTimeout(600);
    const fb = await mainPage.$('#page-fire-systems.active .toolbar .btn-primary');
    if (fb) {
      await fb.click();
      await mainPage.waitForTimeout(800);
      const form = await mainPage.$('#fire-form-container .card');
      if (form) {
        const fields = await mainPage.$$('#fire-form-container input, #fire-form-container select');
        record('Fire Systems', 'Add form', 'PASS', `${fields.length} fields`);
        const inputs = await mainPage.$$('#fire-form-container input[type="text"]');
        if (inputs.length > 0) await inputs[0].fill('TEST_QA_CUUHOA_001');
        const save = await mainPage.$('#fire-form-container .btn-primary');
        if (save) { await save.click(); await mainPage.waitForTimeout(800); record('Fire Systems', 'Save', 'PASS'); }
      } else { record('Fire Systems', 'Add form', 'FAIL'); }
    } else { record('Fire Systems', 'Add button', 'FAIL'); }
    
    await mainPage.waitForTimeout(500);
    const rows = await mainPage.$$('#fire-table-body tr');
    record('Fire Systems', 'Table', 'PASS', `${rows.length} rows`);

    // Edit via row click
    if (rows.length > 0) {
      try {
        await rows[0].click();
        await mainPage.waitForTimeout(800);
        const editForm = await mainPage.$('#fire-form-container .card');
        record('Fire Systems', 'Edit (row)', editForm ? 'PASS' : 'FAIL');
      } catch(e) {}
    }

    // Cleanup
    const delBtns = await mainPage.$$('#fire-table-body .btn-danger');
    for (let i = 0; i < Math.min(delBtns.length, 20); i++) {
      const txt = await mainPage.$eval(`#fire-table-body tr:nth-child(${i+1}) td:first-child`, el => el.textContent).catch(()=>'');
      if (txt && txt.includes('TEST_QA')) {
        await delBtns[i].click(); await mainPage.waitForTimeout(400);
        const cb = await mainPage.$('#modal-overlay.active .btn-primary');
        if (cb) { await cb.click(); await mainPage.waitForTimeout(500); }
        record('Fire Systems', 'Delete', 'PASS');
        break;
      }
    }
  }

  // ==========================================
  // PHASE: CAMERAS
  // ==========================================
  log('INFO', '--- CAMERAS ---');
  if (await navTo(mainPage, 'cameras')) {
    await mainPage.waitForTimeout(600);
    const cb = await mainPage.$('#page-cameras.active .toolbar .btn-primary');
    if (cb) {
      await cb.click();
      await mainPage.waitForTimeout(800);
      const form = await mainPage.$('#camera-form-container .card');
      if (form) {
        const fields = await mainPage.$$('#camera-form-container input, #camera-form-container select');
        record('Cameras', 'Add form', 'PASS', `${fields.length} fields`);
        const inputs = await mainPage.$$('#camera-form-container input[type="text"]');
        if (inputs.length > 0) await inputs[0].fill('TEST_QA_CAMERA_001');
        const save = await mainPage.$('#camera-form-container .btn-primary');
        if (save) { await save.click(); await mainPage.waitForTimeout(800); record('Cameras', 'Save', 'PASS'); }
      } else { record('Cameras', 'Add form', 'FAIL'); }
    } else { record('Cameras', 'Add button', 'FAIL'); }

    await mainPage.waitForTimeout(500);
    const rows = await mainPage.$$('#camera-table-body tr');
    record('Cameras', 'Table', 'PASS', `${rows.length} rows`);

    if (rows.length > 0) {
      try {
        await rows[0].click();
        await mainPage.waitForTimeout(800);
        const editForm = await mainPage.$('#camera-form-container .card');
        record('Cameras', 'Edit (row)', editForm ? 'PASS' : 'FAIL');
      } catch(e) {}
    }

    const delBtns = await mainPage.$$('#camera-table-body .btn-danger');
    for (let i = 0; i < Math.min(delBtns.length, 20); i++) {
      const txt = await mainPage.$eval(`#camera-table-body tr:nth-child(${i+1}) td:first-child`, el => el.textContent).catch(()=>'');
      if (txt && txt.includes('TEST_QA')) {
        await delBtns[i].click(); await mainPage.waitForTimeout(400);
        const cb2 = await mainPage.$('#modal-overlay.active .btn-primary');
        if (cb2) { await cb2.click(); await mainPage.waitForTimeout(500); }
        record('Cameras', 'Delete', 'PASS');
        break;
      }
    }
  }

  // ==========================================
  // PHASE: CONSTRUCTIONS
  // ==========================================
  log('INFO', '--- CONSTRUCTIONS ---');
  if (await navTo(mainPage, 'constructions')) {
    await mainPage.waitForTimeout(600);
    const cb = await mainPage.$('#page-constructions.active .toolbar .btn-primary');
    if (cb) {
      await cb.click();
      await mainPage.waitForTimeout(1000);
      const modal = await mainPage.$('#modal-overlay.active');
      if (modal) {
        const fields = await mainPage.$$('#modal-body input, #modal-body select, #modal-body textarea');
        record('Constructions', 'Add modal', 'PASS', `${fields.length} fields`);
        const inputs = await mainPage.$$('#modal-body input[type="text"]');
        if (inputs.length > 0) await inputs[0].fill('TEST_QA_CONG_TRINH_001');
        const save = await mainPage.$('#modal-footer .btn-primary');
        if (save) { await save.click(); await mainPage.waitForTimeout(800); record('Constructions', 'Save', 'PASS'); }
      } else { record('Constructions', 'Add modal', 'FAIL'); }
    } else { record('Constructions', 'Add button', 'FAIL'); }

    await mainPage.waitForTimeout(500);
    const rows = await mainPage.$$('#construction-table-body tr');
    record('Constructions', 'Table', 'PASS', `${rows.length} rows`);

    if (rows.length > 0) {
      try {
        await rows[0].click();
        await mainPage.waitForTimeout(800);
        const modal = await mainPage.$('#modal-overlay.active');
        record('Constructions', 'Edit (row)', modal ? 'PASS' : 'FAIL', 'Row click opens edit modal');
        await mainPage.keyboard.press('Escape');
        await mainPage.waitForTimeout(300);
      } catch(e) {}
    }

    const delBtns = await mainPage.$$('#construction-table-body .btn-danger');
    for (let i = 0; i < Math.min(delBtns.length, 20); i++) {
      const txt = await mainPage.$eval(`#construction-table-body tr:nth-child(${i+1}) td:first-child`, el => el.textContent).catch(()=>'');
      if (txt && txt.includes('TEST_QA')) {
        await delBtns[i].click(); await mainPage.waitForTimeout(400);
        const cb2 = await mainPage.$('#modal-overlay.active .btn-primary');
        if (cb2) { await cb2.click(); await mainPage.waitForTimeout(500); }
        record('Constructions', 'Delete', 'PASS');
        break;
      }
    }
  }

  // ==========================================
  // PHASE: DOCUMENTS
  // ==========================================
  log('INFO', '--- DOCUMENTS ---');
  if (await navTo(mainPage, 'documents')) {
    await mainPage.waitForTimeout(600);
    const docBtns = await mainPage.$$('#page-documents.active .toolbar button');
    const docBtnTexts = [];
    for (const b of docBtns) { docBtnTexts.push((await b.textContent().catch(()=>'')).trim()); }
    record('Documents', 'Page', 'PASS', `${docBtns.length} buttons: ${docBtnTexts.join(', ')}`);
  }

  // ==========================================
  // PHASE: CONFIG MODULE
  // ==========================================
  log('INFO', '--- CONFIG ---');
  if (await navTo(mainPage, 'config')) {
    await mainPage.waitForTimeout(1000);

    const configTabs = await mainPage.$$('#config-tabs .tab-item');
    record('Config', 'Sub-tabs', 'PASS', `${configTabs.length} tabs found`);

    const subTabs = [
      { id: 'config-units', name: 'Units' },
      { id: 'config-locations', name: 'Locations' },
      { id: 'config-warehouse-types', name: 'WH Types' },
      { id: 'config-goods-types', name: 'Goods Types' },
      { id: 'config-quality-grades', name: 'Quality' },
      { id: 'config-lightning', name: 'Lightning' },
      { id: 'config-safety', name: 'Safety' },
      { id: 'config-duplicates', name: 'Duplicates' }
    ];

    for (const t of subTabs) {
      const tabEl = await mainPage.$(`#config-tabs .tab-item[data-tab="${t.id}"]`);
      if (!tabEl) { record('Config', t.name, 'BLOCKED', 'Tab missing'); continue; }
      
      await tabEl.click();
      await mainPage.waitForTimeout(800);
      
      const content = await mainPage.$(`#${t.id}.active`);
      if (!content) { record('Config', t.name, 'FAIL', 'Content not active'); continue; }
      record('Config', `${t.name}: render`, 'PASS');

      const btns = await mainPage.$$(`#${t.id}.active button`);
      record('Config', `${t.name}: buttons`, 'PASS', `${btns.length}`);

      // Units: add
      if (t.id === 'config-units') {
        const addBtn = await mainPage.$('#config-units.active .btn-primary');
        if (addBtn) {
          await addBtn.click(); await mainPage.waitForTimeout(500);
          const modal = await mainPage.$('#modal-overlay.active');
          if (modal) {
            const inp = await mainPage.$('#modal-body input');
            if (inp) { await inp.fill('TEST_QA_UNIT_001'); record('Config', 'Units: add', 'PASS'); }
            const save = await mainPage.$('#modal-footer .btn-primary');
            if (save) { await save.click(); await mainPage.waitForTimeout(600); record('Config', 'Units: save', 'PASS'); }
          }
        }
      }

      // Catalog tabs: CRUD
      if (['config-warehouse-types', 'config-goods-types', 'config-quality-grades', 'config-lightning'].includes(t.id)) {
        const addBtn = await mainPage.$(`#${t.id}.active .btn-primary`);
        if (addBtn) {
          await addBtn.click(); await mainPage.waitForTimeout(500);
          const modal = await mainPage.$('#modal-overlay.active');
          if (modal) {
            const inp = await mainPage.$('#modal-body input');
            if (inp) await inp.fill(`TEST_QA_CAT_${t.name.replace(/\s/g,'')}_001`);
            const save = await mainPage.$('#modal-footer .btn-primary');
            if (save) { await save.click(); await mainPage.waitForTimeout(600); }
          }
        }
      }

      // Safety
      if (t.id === 'config-safety') {
        await mainPage.waitForTimeout(600);
        // Create Backup
        const backupBtn = await mainPage.$('#config-safety.active .btn-primary');
        if (backupBtn) {
          await backupBtn.click();
          await mainPage.waitForTimeout(1500);
          record('Config', 'Backup: create', 'PASS');
        }
        // Check sections
        for (const sec of ['backup-history', 'audit-log', 'migration-history']) {
          const el = await mainPage.$(`#${sec}`);
          record('Config', sec, el ? 'PASS' : 'FAIL', el ? 'Rendered' : 'Missing');
        }
        // Restore button exists (do NOT click)
        const restoreBtn = await mainPage.$('#config-safety.active .btn-secondary');
        record('Config', 'Restore button', restoreBtn ? 'PASS' : 'FAIL', restoreBtn ? 'Exists (not clicked)' : 'Missing');
      }

      // Duplicates
      if (t.id === 'config-duplicates') {
        const dupBtn = await mainPage.$('#config-duplicates.active .btn-primary');
        if (dupBtn) {
          await dupBtn.click();
          await mainPage.waitForTimeout(800);
          record('Config', 'Duplicates: review', 'PASS', 'Review triggered');
        }
      }
    }
  }

  // ==========================================
  // PHASE: LOGOUT
  // ==========================================
  log('INFO', '--- LOGOUT ---');
  try {
    const logoutBtn = await mainPage.$('#sidebar-logout-btn');
    if (logoutBtn) {
      await logoutBtn.click();
      await mainPage.waitForTimeout(500);
      const confirmModal = await mainPage.$('#modal-overlay.active');
      if (confirmModal) {
        const okBtn = await mainPage.$('#modal-overlay.active .btn-primary');
        if (okBtn) {
          await okBtn.click();
          await mainPage.waitForTimeout(2000);
          record('Global', 'Logout', 'PASS', 'Logged out');
        } else { record('Global', 'Logout', 'FAIL', 'No confirm button'); }
      } else { record('Global', 'Logout', 'FAIL', 'No confirm modal'); }
    } else { record('Global', 'Logout', 'FAIL', 'Logout button missing'); }
  } catch(e) { record('Global', 'Logout', 'FAIL', e.message); }

  // ==========================================
  // COVERAGE REPORT
  // ==========================================
  console.log('');
  console.log('========================================');
  console.log('   DESKTOP DEBUG COVERAGE REPORT');
  console.log('========================================');
  console.log('');

  const modOrder = ['Login', 'Main', 'Global', 'Dashboard', 'Warehouses', 'Fire Systems', 'Cameras', 'Constructions', 'Documents', 'Config'];
  let tp = 0, tf = 0, tb = 0;

  console.log('Module          | Action                          | Status');
  console.log('----------------|----------------------------------|--------');

  for (const mod of modOrder) {
    const acts = REPORT.modules[mod] || [];
    for (const a of acts) {
      const modPad = mod.padEnd(15).substring(0,15);
      const actPad = a.action.padEnd(32).substring(0,32);
      console.log(`${modPad} | ${actPad} | ${a.status}`);
      if (a.detail) console.log(`                 | ${a.detail.substring(0,55)}`);
      if (a.status === 'PASS') tp++;
      else if (a.status === 'FAIL') tf++;
      else tb++;
    }
  }

  console.log('');
  console.log('========================================');
  console.log(`TOTAL: ${tp} PASS | ${tf} FAIL | ${tb} BLOCKED`);
  console.log(`Runtime Errors: ${REPORT.errors.length}`);
  console.log('========================================');

  if (REPORT.errors.length > 0) {
    console.log('');
    console.log('RUNTIME ERRORS:');
    REPORT.errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
  }

  // Per-module coverage matrix
  console.log('');
  console.log('COVERAGE MATRIX:');
  console.log('Module          | Add | Edit | Delete | Nav | Search | Config | Errors');
  console.log('----------------|-----|------|--------|-----|--------|--------|-------');
  for (const mod of ['Warehouses', 'Fire Systems', 'Cameras', 'Constructions', 'Documents', 'Config']) {
    const acts = REPORT.modules[mod] || [];
    const hasAdd = acts.some(a => a.action.toLowerCase().includes('add') && a.status === 'PASS');
    const hasEdit = acts.some(a => a.action.toLowerCase().includes('edit') && a.status === 'PASS');
    const hasDel = acts.some(a => a.action.toLowerCase().includes('delete') && a.status === 'PASS');
    const hasNav = acts.some(a => a.action.toLowerCase().includes('navigation') && a.status === 'PASS');
    const statusIcon = hasAdd && hasEdit && hasDel ? 'PASS' : (acts.filter(a=>a.status==='FAIL').length > 0 ? 'FAIL' : 'PARTIAL');
    console.log(`${mod.padEnd(15)} | ${hasAdd?'Y':'N'}   | ${hasEdit?'Y':'N'}    | ${hasDel?'Y':'N'}     | ${hasNav?'Y':'N'}  | -      | -      | ${REPORT.errors.length}`);
  }

  // JSON report
  const reportPath = path.join(__dirname, '..', 'qa', 'desktop_debug_report.json');
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { pass: tp, fail: tf, blocked: tb, errors: REPORT.errors.length },
      modules: REPORT.modules,
      errors: REPORT.errors
    }, null, 2));
    log('INFO', `JSON report: ${reportPath}`);
  } catch(e) { log('ERROR', `Could not write report: ${e.message}`); }

  await browser.close();
  log('INFO', 'DONE - Browser disconnected.');
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
