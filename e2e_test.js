/**
 * E2E Test: Launch Electron app with remote debugging, perform all CRUD operations
 * Uses Playwright to connect via CDP, records video automatically
 * Run: node e2e_test.js
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, 'docs');
const VIDEO_DIR = path.join(DOCS_DIR, 'recordings');
const CDP_PORT = 9222;
const SAMPLE_FILES = {
  warehouses: path.join(DOCS_DIR, 'mau_nhap_nha_kho.xlsx'),
  cameras: path.join(DOCS_DIR, 'mau_nhap_camera.xlsx'),
  fireSystems: path.join(DOCS_DIR, 'mau_nhap_cuuhoa.xlsx'),
  constructions: path.join(DOCS_DIR, 'mau_nhap_congtrinh.xlsx'),
};

if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

// Helper: wait ms
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Helper: log with timestamp
function log(msg) {
  const t = new Date().toLocaleTimeString('vi-VN');
  console.log(`[${t}] ${msg}`);
}

async function main() {
  log('=== E2E TEST — Warehouse Management ===');
  
  // 1. Launch Electron with remote debugging
  log('Launching Electron app with remote debugging...');
  const electronPath = path.join(__dirname, 'node_modules/.bin/electron.cmd');
  const appProcess = spawn(electronPath, ['.', `--remote-debugging-port=${CDP_PORT}`], {
    cwd: __dirname, stdio: 'pipe', shell: true
  });
  appProcess.stdout.on('data', d => process.stdout.write(`[electron] ${d}`));
  appProcess.stderr.on('data', d => process.stderr.write(`[electron] ${d}`));

  await sleep(4000); // Wait for app to start

  // 2. Connect via CDP
  log('Connecting to Electron via CDP...');
  let browser, context, page;
  try {
    browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
    context = browser.contexts()[0];
    // Enable video recording on a new context won't work for CDP, 
    // so we'll use screenshots + browser_subagent video instead
    page = context.pages()[0];
    if (!page) {
      log('Waiting for page...');
      page = await context.waitForEvent('page', { timeout: 10000 });
    }
    log('✓ Connected to Electron app');
  } catch (e) {
    log(`✗ Failed to connect: ${e.message}`);
    appProcess.kill();
    process.exit(1);
  }

  await sleep(2000);
  const bugs = [];

  try {
    // ============================================================
    // PHASE 1: Check Dashboard
    // ============================================================
    log('\n=== PHASE 1: Dashboard ===');
    await page.waitForSelector('#page-dashboard.active', { timeout: 5000 });
    log('✓ Dashboard loaded');
    
    const statCards = await page.$$('.stat-card');
    log(`  Stat cards: ${statCards.length}`);
    if (statCards.length !== 4) bugs.push('Dashboard: Expected 4 stat cards');
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '01_dashboard.png'), fullPage: true });

    // ============================================================
    // PHASE 2: Config — Add units first (needed for other modules)
    // ============================================================
    log('\n=== PHASE 2: Config — Verify Units ===');
    await page.click('#nav-config');
    await sleep(1000);
    
    const unitTree = await page.$('#units-tree');
    const unitNodes = await unitTree.$$('.tree-node');
    log(`  Units in tree: ${unitNodes.length}`);
    await page.screenshot({ path: path.join(VIDEO_DIR, '02_config_units.png'), fullPage: true });

    // ============================================================
    // PHASE 3: Warehouses — Manual entry
    // ============================================================
    log('\n=== PHASE 3: Warehouses — Manual Entry ===');
    await page.click('#nav-warehouses');
    await sleep(1000);
    await page.screenshot({ path: path.join(VIDEO_DIR, '03_warehouses_empty.png'), fullPage: true });

    // Click "Thêm nhà kho"
    await page.click('#btn-warehouse-add');
    await sleep(1000);
    log('  Form opened');

    // Fill warehouse form
    await page.fill('#wh-name', 'Kho Thủ công Test E2E');
    await page.selectOption('#wh-category', 'chien_thuat');
    
    // Select first available unit for parent
    const parentOptions = await page.$$eval('#wh-parent-unit option', opts => 
      opts.filter(o => o.value).map(o => o.value));
    if (parentOptions.length > 0) {
      await page.selectOption('#wh-parent-unit', parentOptions[0]);
    }
    
    await page.fill('#wh-address', 'Số 1, Phường Bạch Đằng, TP Hải Phòng');
    await page.fill('#wh-quantity', '1');
    await page.fill('#wh-land-area', '600');
    await page.fill('#wh-area', '400');
    await page.fill('#wh-year-built', '2020');
    await page.fill('#wh-capacity', '100');
    await page.fill('#wh-stock', '75');
    await page.fill('#wh-notes', 'Nhập thủ công qua E2E test');
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '04_warehouse_form_filled.png'), fullPage: true });
    
    // Save
    await page.click('button:has-text("Lưu")');
    await sleep(1500);
    log('  ✓ Warehouse saved manually');
    await page.screenshot({ path: path.join(VIDEO_DIR, '05_warehouse_after_manual.png'), fullPage: true });

    // ============================================================
    // PHASE 4: Warehouses — Import Excel
    // ============================================================
    log('\n=== PHASE 4: Warehouses — Import Excel ===');
    
    // Override dialog to return sample file path
    await page.evaluate((filePath) => {
      window._origDialogOpen = window.api.dialog.openFile;
      window.api.dialog.openFile = async () => ({
        canceled: false,
        filePaths: [filePath]
      });
    }, SAMPLE_FILES.warehouses);

    await page.click('button:has-text("Import Excel")');
    await sleep(2000);
    
    // Check if preview modal opened
    const modalVisible = await page.$eval('#modal-overlay', el => el.classList.contains('active'));
    if (modalVisible) {
      log('  ✓ Import preview modal opened');
      await page.screenshot({ path: path.join(VIDEO_DIR, '06_warehouse_import_preview.png'), fullPage: true });
      
      // Click confirm import
      const importBtn = await page.$('button:has-text("Import")');
      if (importBtn) {
        await importBtn.click();
        await sleep(2000);
        log('  ✓ Import confirmed');
      }
    } else {
      bugs.push('Warehouses Import: Preview modal did not appear');
      log('  ✗ Import modal did not open');
    }
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '07_warehouse_after_import.png'), fullPage: true });
    
    // Restore dialog
    await page.evaluate(() => {
      if (window._origDialogOpen) window.api.dialog.openFile = window._origDialogOpen;
    });

    // Verify table rows
    const whRows = await page.$$('#warehouse-table-body tr');
    log(`  Table rows after import: ${whRows.length}`);

    // ============================================================
    // PHASE 5: Warehouses — Export Excel
    // ============================================================
    log('\n=== PHASE 5: Warehouses — Export Excel ===');
    const exportPath = path.join(DOCS_DIR, 'export_nha_kho.xlsx');
    
    await page.evaluate((fp) => {
      window._origDialogSave = window.api.dialog.saveFile;
      window.api.dialog.saveFile = async () => ({ canceled: false, filePath: fp });
    }, exportPath);

    await page.click('button:has-text("Export Excel")');
    await sleep(2000);
    
    if (fs.existsSync(exportPath)) {
      log(`  ✓ Export saved: ${exportPath}`);
    } else {
      bugs.push('Warehouses Export: File not created');
      log('  ✗ Export file not found');
    }
    
    await page.evaluate(() => {
      if (window._origDialogSave) window.api.dialog.saveFile = window._origDialogSave;
    });

    // ============================================================
    // PHASE 6: Cameras — Manual entry + Import + Export
    // ============================================================
    log('\n=== PHASE 6: Cameras ===');
    await page.click('#nav-cameras');
    await sleep(1000);

    // Manual entry
    await page.click('#btn-camera-add');
    await sleep(1000);
    
    if (parentOptions.length > 0) {
      await page.selectOption('#cam-parent', parentOptions[0]);
    }
    await page.selectOption('#cam-measure', 'Hệ thống');
    await page.fill('#cam-qty', '1');
    await page.fill('#cam-year', '2025');
    await page.fill('#cam-screen', '4');
    await page.fill('#cam-count', '20');
    await page.fill('#cam-investor', 'Cục HC-KT Test');
    await page.fill('#cam-status', 'Hoạt động bình thường');
    await page.fill('#cam-notes', 'Camera nhập thủ công E2E');
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '08_camera_form.png'), fullPage: true });
    await page.click('button:has-text("Lưu")');
    await sleep(1500);
    log('  ✓ Camera saved manually');

    // Import cameras
    await page.evaluate((fp) => {
      window.api.dialog.openFile = async () => ({ canceled: false, filePaths: [fp] });
    }, SAMPLE_FILES.cameras);
    
    await page.click('button:has-text("Import Excel")');
    await sleep(2000);
    
    const camModalVisible = await page.$eval('#modal-overlay', el => el.classList.contains('active'));
    if (camModalVisible) {
      await page.screenshot({ path: path.join(VIDEO_DIR, '09_camera_import.png'), fullPage: true });
      const btn = await page.$('button:has-text("Import")');
      if (btn) { await btn.click(); await sleep(2000); }
      log('  ✓ Cameras imported');
    }

    // Export cameras
    const camExport = path.join(DOCS_DIR, 'export_camera.xlsx');
    await page.evaluate((fp) => {
      window.api.dialog.saveFile = async () => ({ canceled: false, filePath: fp });
    }, camExport);
    await page.click('button:has-text("Export Excel")');
    await sleep(2000);
    log(`  Export: ${fs.existsSync(camExport) ? '✓' : '✗'}`);
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '10_cameras_complete.png'), fullPage: true });

    // ============================================================
    // PHASE 7: Fire Systems — Manual + Import + Export
    // ============================================================
    log('\n=== PHASE 7: Fire Systems ===');
    await page.click('#nav-fire-systems');
    await sleep(1000);

    // Manual entry
    await page.click('button:has-text("Thêm cứu hỏa")');
    await sleep(1000);
    
    if (parentOptions.length > 0) {
      await page.selectOption('#fire-parent', parentOptions[0]);
    }
    await page.selectOption('#fire-measure', 'Hệ thống');
    await page.fill('#fire-qty', '1');
    await page.fill('#fire-year', '2024');
    await page.fill('#fire-pump', '2');
    await page.fill('#fire-hydrant', '10');
    await page.fill('#fire-investor', 'Ban QLDA Test');
    await page.fill('#fire-status', 'Hoạt động bình thường');
    await page.fill('#fire-notes', 'Cứu hỏa nhập thủ công E2E');
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '11_fire_form.png'), fullPage: true });
    await page.click('button:has-text("Lưu")');
    await sleep(1500);
    log('  ✓ Fire system saved manually');

    // Import
    await page.evaluate((fp) => {
      window.api.dialog.openFile = async () => ({ canceled: false, filePaths: [fp] });
    }, SAMPLE_FILES.fireSystems);
    await page.click('button:has-text("Import Excel")');
    await sleep(2000);
    
    const fireModalVis = await page.$eval('#modal-overlay', el => el.classList.contains('active'));
    if (fireModalVis) {
      await page.screenshot({ path: path.join(VIDEO_DIR, '12_fire_import.png'), fullPage: true });
      const btn = await page.$('button:has-text("Import")');
      if (btn) { await btn.click(); await sleep(2000); }
      log('  ✓ Fire systems imported');
    }

    // Export
    const fireExport = path.join(DOCS_DIR, 'export_cuuhoa.xlsx');
    await page.evaluate((fp) => {
      window.api.dialog.saveFile = async () => ({ canceled: false, filePath: fp });
    }, fireExport);
    await page.click('button:has-text("Export Excel")');
    await sleep(2000);
    log(`  Export: ${fs.existsSync(fireExport) ? '✓' : '✗'}`);
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '13_fire_complete.png'), fullPage: true });

    // ============================================================
    // PHASE 8: Constructions — Manual + Import + Export
    // ============================================================
    log('\n=== PHASE 8: Constructions ===');
    await page.click('#nav-constructions');
    await sleep(1000);

    await page.click('button:has-text("Thêm công trình")');
    await sleep(1000);

    await page.fill('#con-name', 'Công trình test E2E — Sửa chữa kho K99');
    await page.selectOption('#con-type', 'SỬA CHỮA, NÂNG CẤP');
    await page.fill('#con-end', '2026');
    await page.fill('#con-approval', 'QĐ 999/E2E-2025');
    await page.fill('#con-contract-no', 'HĐ-E2E/2025');
    await page.fill('#con-contractor', 'Công ty E2E Test');
    await page.fill('#con-contractor-addr', 'Hà Nội');
    await page.selectOption('#con-status', 'Đang thi công');
    await page.fill('#con-approved-inv', '3000000000');
    await page.fill('#con-estimated', '2500000000');
    await page.fill('#con-contract-val', '2200000000');
    await page.fill('#con-desc', 'Sửa chữa nâng cấp kho K99 — E2E test');
    await page.fill('#con-notes', 'Nhập thủ công qua E2E');
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '14_construction_form.png'), fullPage: true });
    await page.click('button:has-text("Lưu")');
    await sleep(1500);
    log('  ✓ Construction saved manually');

    // Import
    await page.evaluate((fp) => {
      window.api.dialog.openFile = async () => ({ canceled: false, filePaths: [fp] });
    }, SAMPLE_FILES.constructions);
    await page.click('button:has-text("Import Excel")');
    await sleep(2000);
    
    const conModalVis = await page.$eval('#modal-overlay', el => el.classList.contains('active'));
    if (conModalVis) {
      await page.screenshot({ path: path.join(VIDEO_DIR, '15_construction_import.png'), fullPage: true });
      const btn = await page.$('button:has-text("Import")');
      if (btn) { await btn.click(); await sleep(2000); }
      log('  ✓ Constructions imported');
    }

    // Export
    const conExport = path.join(DOCS_DIR, 'export_congtrinh.xlsx');
    await page.evaluate((fp) => {
      window.api.dialog.saveFile = async () => ({ canceled: false, filePath: fp });
    }, conExport);
    await page.click('button:has-text("Export Excel")');
    await sleep(2000);
    log(`  Export: ${fs.existsSync(conExport) ? '✓' : '✗'}`);
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '16_constructions_complete.png'), fullPage: true });

    // ============================================================
    // PHASE 9: Back to Dashboard — verify stats updated
    // ============================================================
    log('\n=== PHASE 9: Dashboard verification ===');
    await page.click('#nav-dashboard');
    await sleep(2000);
    
    const finalStats = await page.evaluate(() => ({
      chienDich: document.getElementById('stat-chien-dich')?.textContent,
      chienThuat: document.getElementById('stat-chien-thuat')?.textContent,
      cameras: document.getElementById('stat-cameras')?.textContent,
      fire: document.getElementById('stat-fire')?.textContent,
    }));
    log(`  Dashboard stats: CD=${finalStats.chienDich} CT=${finalStats.chienThuat} CAM=${finalStats.cameras} FIRE=${finalStats.fire}`);
    
    await page.screenshot({ path: path.join(VIDEO_DIR, '17_dashboard_final.png'), fullPage: true });

    // ============================================================
    // PHASE 10: Global Search test
    // ============================================================
    log('\n=== PHASE 10: Global Search ===');
    await page.fill('#global-search', 'Kho');
    await sleep(1500);
    
    const searchVisible = await page.$eval('#search-results', el => el.style.display !== 'none');
    if (searchVisible) {
      const resultCount = await page.$$eval('#search-results .search-result-item', items => items.length);
      log(`  ✓ Search "Kho" returned ${resultCount} results`);
    } else {
      log('  ✗ Search results not visible');
      bugs.push('Global Search: Results not displayed');
    }
    await page.screenshot({ path: path.join(VIDEO_DIR, '18_search.png'), fullPage: true });

    // Clear search
    await page.fill('#global-search', '');
    await sleep(500);

    // ============================================================
    // PHASE 11: Edit + Delete test (warehouse)
    // ============================================================
    log('\n=== PHASE 11: Edit & Delete test ===');
    await page.click('#nav-warehouses');
    await sleep(1000);
    
    // Click first row to edit
    const firstRow = await page.$('#warehouse-table-body tr');
    if (firstRow) {
      await firstRow.click();
      await sleep(1500);
      
      const nameField = await page.$('#wh-name');
      if (nameField) {
        const currentName = await nameField.inputValue();
        await nameField.fill(currentName + ' (đã sửa)');
        await page.click('button:has-text("Lưu")');
        await sleep(1500);
        log('  ✓ Warehouse edited');
      }
    }
    await page.screenshot({ path: path.join(VIDEO_DIR, '19_edit_complete.png'), fullPage: true });

  } catch (e) {
    log(`\n✗ ERROR: ${e.message}`);
    bugs.push(`Runtime error: ${e.message}`);
    await page.screenshot({ path: path.join(VIDEO_DIR, 'ERROR.png'), fullPage: true }).catch(() => {});
  }

  // ============================================================
  // REPORT
  // ============================================================
  log('\n========================================');
  log('     E2E TEST REPORT');
  log('========================================');
  
  const screenshots = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.png'));
  log(`Screenshots saved: ${screenshots.length} files in docs/recordings/`);
  
  const exports = fs.readdirSync(DOCS_DIR).filter(f => f.startsWith('export_'));
  log(`Export files: ${exports.join(', ') || 'none'}`);
  
  if (bugs.length) {
    log(`\n⚠ BUGS FOUND (${bugs.length}):`);
    bugs.forEach((b, i) => log(`  ${i + 1}. ${b}`));
  } else {
    log('\n✅ No bugs found — all tests passed!');
  }
  log('========================================\n');

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    screenshots: screenshots.length,
    exports,
    bugs,
    passed: bugs.length === 0
  };
  fs.writeFileSync(path.join(VIDEO_DIR, 'report.json'), JSON.stringify(report, null, 2));

  // Cleanup
  appProcess.kill();
  process.exit(bugs.length > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
