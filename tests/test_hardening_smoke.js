const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');

(async () => {
  const app = await electron.launch({ args: [ROOT], cwd: ROOT });
  let page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  if (await page.locator('#login-btn').count()) {
    await page.fill('#unit-name', 'Test');
    await page.fill('#user-name', 'Tester');
    await page.fill('#password', '123456');
    const mainWindow = app.waitForEvent('window');
    await page.click('#login-btn');
    page = await mainWindow;
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  }
  await page.waitForSelector('#global-search', { timeout: 15000 });

  const result = { timestamp: new Date().toISOString(), checks: [] };
  function check(name, ok, detail = {}) { result.checks.push({ name, ok, detail }); if (!ok) throw new Error(`${name} failed: ${JSON.stringify(detail)}`); }
  const seedToken = Date.now();
  const smokeWarehouse = await page.evaluate(token => window.api.warehouses.create({
    name: `Kho K02 Smoke ${token}`,
    address: 'Smoke test',
    warehouse_category: 'chien_dich',
    year_built: 2005,
    storage_capacity: 150,
    notes: 'kho k02 smoke search'
  }), seedToken);
  const smokeCamera = await page.evaluate(token => window.api.cameras.create({
    unit_measure: 'Hệ thống',
    quantity: 1,
    camera_count: 1,
    status: `camera hong smoke ${token}`,
    notes: 'camera hong smoke search'
  }), seedToken);

  const searchRows = await page.evaluate(() => window.api.search.smart('camera hong', { limit: 5 }));
  check('smart search returns camera results', searchRows.some(row => row.module === 'camera' && row.id === smokeCamera.id), { rows: searchRows.slice(0, 3), smokeCamera });

  await page.fill('#global-search', 'kho k02');
  await page.waitForSelector('#search-results .search-result-item', { timeout: 5000 });
  await page.locator('#search-results .search-result-item').first().click();
  await page.waitForSelector('#warehouse-form-container .card', { timeout: 5000 });
  const formName = await page.locator('#wh-name').inputValue();
  check('search result opens record form', formName.toLowerCase().includes('kho'), { formName, smokeWarehouse });

  const validationMessage = await page.evaluate(async () => {
    try {
      await window.api.warehouses.create({ name: '', year_built: 3000, warehouse_area: -1 });
      return null;
    } catch (e) { return e.message; }
  });
  check('validation rejects invalid warehouse', Boolean(validationMessage), { validationMessage });

  const token = `SmokeSync${Date.now()}`;
  const created = await page.evaluate(token => window.api.cameras.create({ unit_measure: 'Hệ thống', quantity: 1, camera_count: 1, status: token, notes: token }), token);
  const synced = await page.evaluate(token => window.api.search.smart(token, { limit: 5 }), token);
  check('search index syncs after create', synced.length === 1 && synced[0].id === created.id, { created, synced: synced[0] });
  await page.evaluate(id => window.api.cameras.delete(id), created.id);

  const backup = await page.evaluate(() => window.api.backup.create());
  check('backup file created', backup.success === true && Boolean(backup.filePath), backup);
  const migrations = await page.evaluate(() => window.api.system.migrations());
  check('numbered migrations are tracked', migrations.some(row => row.version === 4), { migrations });

  const backups = await page.evaluate(() => window.api.backup.list(10));
  check('backup history is listed', Array.isArray(backups) && backups.length > 0, { backups: backups.slice(0, 2) });

  const audits = await page.evaluate(() => window.api.audit.list(20));
  check('audit log is listed', Array.isArray(audits) && audits.some(row => row.action === 'backup' || row.module === 'cameras'), { audits: audits.slice(0, 3) });

  const duplicates = await page.evaluate(() => window.api.duplicates.review());
  check('duplicate review API returns sections', duplicates && Array.isArray(duplicates.warehouses) && Array.isArray(duplicates.constructions), duplicates);

  await page.evaluate(({ cameraId, warehouseId }) => {
    window.api.cameras.delete(cameraId);
    window.api.warehouses.delete(warehouseId);
  }, { cameraId: smokeCamera.id, warehouseId: smokeWarehouse.id });

  const parserCheck = await page.evaluate(() => {
    const workbook = { sheetNames: ['PL2'], sheets: { PL2: [
      [], [], [], [], [], [], [], [], [], [],
      ['', '', 'Kho test <script>', 'Địa chỉ', 1, 100, 50, 2020, 2024, '', 200, 20, 'Ghi chú']
    ] } };
    const rows = excelHelper.normalizeImportRows('warehouses', workbook);
    return rows[0];
  });
  check('KHO parser reads warehouse template rows', parserCheck && parserCheck.name === 'Kho test <script>' && parserCheck.year_built === 2020, parserCheck);

  check('no renderer runtime errors', errors.length === 0, { errors });
  fs.writeFileSync(path.join(ROOT, 'docs', 'hardening_smoke_report.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
  await app.close();
})().catch(err => { console.error(err); process.exit(1); });



