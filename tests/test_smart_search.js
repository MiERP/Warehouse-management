const { _electron: electron } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const expectations = {
  'kho xang dau': { module: 'warehouse' },
  'kho k02': { module: 'warehouse', title: /k02/i },
  'camera hong': { module: 'camera' },
  'cam can sua chua': { module: 'camera' },
  'cuu hoa pccc': { module: 'fire' },
  'cong trinh chua quyet toan': { module: 'construction' },
  'cong trinh dang thi cong': { module: 'construction', status: /thi công/i },
  'kho xay truoc 2010': { module: 'warehouse', reason: 'khớp điều kiện lọc' },
  'camera lap truoc 2020': { module: 'camera', reason: 'khớp điều kiện lọc' },
  'kho suc chua tren 100': { module: 'warehouse', reason: 'khớp điều kiện lọc' }
};
const queries = Object.keys(expectations);


(async () => {
  const app = await electron.launch({ args: [ROOT], cwd: ROOT });
  let page = await app.firstWindow();
  if (await page.locator('#login-btn').count()) {
    await page.fill('#unit-name', 'Test');
    await page.fill('#user-name', 'Tester');
    await page.fill('#password', '123456');
    const mainWindow = app.waitForEvent('window');
    await page.click('#login-btn');
    page = await mainWindow;
  }
  await page.waitForSelector('#global-search', { timeout: 15000 });
  const created = await page.evaluate(async () => {
    const suffix = Date.now();
    const warehouse = await window.api.warehouses.create({ name: `Kho Xăng dầu K02 Search ${suffix}`, address: 'Khu vực test', warehouse_category: 'chien_dich', year_built: 2005, storage_capacity: 150, notes: 'xang dau k02 smart search' });
    const camera = await window.api.cameras.create({ unit_measure: 'Hệ thống', quantity: 1, camera_count: 5, screen_count: 1, year_installed: 2019, status: '05 CAM hỏng cần sửa chữa', repair_need: 1, notes: `camera hong smart search ${suffix}` });
    const fire = await window.api.fireSystems.create({ unit_measure: 'Hệ thống', quantity: 1, hydrant_count: 4, year_installed: 2018, status: 'Hoạt động bình thường', notes: `pccc cứu hỏa smart search ${suffix}` });
    const construction = await window.api.constructions.create({ name: `Công trình đang thi công chưa quyết toán Search ${suffix}`, construction_type: 'xay dung', status: 'Đang thi công', year_started: 2024, settlement_value: 0, notes: 'chua quyet toan smart search' });
    await window.api.search.rebuildIndex();
    return { warehouse: warehouse.id, camera: camera.id, fire: fire.id, construction: construction.id };
  });

  const results = [];
  for (const query of queries) {
    const rows = await page.evaluate(q => window.api.search.smart(q, { limit: 5 }), query);
    const expected = expectations[query];
    const top = rows[0];
    results.push({ query, count: rows.length, top: rows.slice(0, 3) });
    console.log('\nQUERY:', query);
    rows.slice(0, 3).forEach((row, index) => console.log(index + 1, row.module, row.title, row.score, (row.matched_reason || []).join(', ')));
    assert(top, `${query} should return results`);
    assert.strictEqual(top.module, expected.module, `${query} should return ${expected.module} first`);
    if (expected.title) assert(expected.title.test(top.title || ''), `${query} top title should match ${expected.title}`);
    if (expected.status) assert(expected.status.test(top.status || ''), `${query} top status should match ${expected.status}`);
    if (expected.reason) assert((top.matched_reason || []).includes(expected.reason), `${query} should include ${expected.reason}`);
  }

  const reportPath = path.join(DOCS, 'smart_search_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2), 'utf8');
  await page.evaluate(async ids => {
    await window.api.warehouses.delete(ids.warehouse);
    await window.api.cameras.delete(ids.camera);
    await window.api.fireSystems.delete(ids.fire);
    await window.api.constructions.delete(ids.construction);
    await window.api.search.rebuildIndex();
  }, created);
  await app.close();
  console.log('\nReport:', reportPath);
})().catch(err => { console.error(err); process.exit(1); });


