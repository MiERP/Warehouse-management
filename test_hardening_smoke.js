const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = __dirname;

(async () => {
  const app = await electron.launch({ args: [ROOT], cwd: ROOT });
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.waitForSelector('#global-search', { timeout: 15000 });

  const result = { timestamp: new Date().toISOString(), checks: [] };
  function check(name, ok, detail = {}) { result.checks.push({ name, ok, detail }); if (!ok) throw new Error(`${name} failed: ${JSON.stringify(detail)}`); }

  const searchRows = await page.evaluate(() => window.api.search.smart('camera hong', { limit: 5 }));
  check('smart search returns camera results', searchRows.length > 0 && searchRows[0].module === 'camera', { top: searchRows[0] });

  await page.fill('#global-search', 'kho k02');
  await page.waitForSelector('#search-results .search-result-item', { timeout: 5000 });
  await page.locator('#search-results .search-result-item').first().click();
  await page.waitForSelector('#warehouse-form-container .card', { timeout: 5000 });
  const formName = await page.locator('#wh-name').inputValue();
  check('search result opens record form', formName.toLowerCase().includes('kho'), { formName });

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

  check('no renderer runtime errors', errors.length === 0, { errors });
  fs.writeFileSync(path.join(ROOT, 'docs', 'hardening_smoke_report.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
  await app.close();
})().catch(err => { console.error(err); process.exit(1); });
