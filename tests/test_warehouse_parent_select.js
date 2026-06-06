const { _electron: electron } = require('playwright');
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

(async () => {
  const app = await electron.launch({
    args: [ROOT],
    cwd: ROOT
  });
  let page = null;
  let cleanupIds = null;

  try {
    page = await app.firstWindow();
    if (await page.locator('#login-btn').count()) {
      await page.fill('#unit-name', 'Test');
      await page.fill('#user-name', 'Tester');
      await page.fill('#password', '123456');
      const mainWindow = app.waitForEvent('window');
      await page.click('#login-btn');
      page = await mainWindow;
    }

    await page.waitForSelector('#global-search', { timeout: 15000 });
    const ids = await page.evaluate(async () => {
      const suffix = Date.now();
      const lv1 = await window.api.units.create({ name: `Tong cuc parent test ${suffix}` });
      const lv2 = await window.api.units.create({ name: `Vung 1 parent test ${suffix}`, parent_id: lv1.id });
      const lv3 = await window.api.units.create({ name: `Lu 7 parent test ${suffix}`, parent_id: lv2.id });
      const lv4 = await window.api.units.create({ name: `Phong ky thuat parent test ${suffix}`, parent_id: lv3.id });
      const parentWarehouse = await window.api.units.create({
        name: `Nha kho 7 parent test ${suffix}`,
        parent_id: lv4.id,
        unit_type: 'warehouse'
      });
      const warehouse = await window.api.warehouses.create({
        name: `Kho K1 parent test ${suffix}`,
        parent_unit_id: parentWarehouse.id,
        warehouse_category: 'chien_dich'
      });
      const directWarehouse = await window.api.warehouses.create({
        name: `Kho truc thuoc cap 1 parent test ${suffix}`,
        parent_unit_id: lv1.id,
        warehouse_category: 'chien_dich'
      });
      return {
        warehouseId: warehouse.id,
        directWarehouseId: directWarehouse.id,
        parentId: parentWarehouse.id,
        nextParentName: lv2.name,
        unitIds: [lv1.id, lv2.id, lv3.id, lv4.id, parentWarehouse.id, warehouse.unit_id, directWarehouse.unit_id]
      };
    });
    cleanupIds = ids;

    await page.evaluate((warehouseId) => {
      window.navigateTo('warehouses');
      return window.warehouseModule.edit(warehouseId);
    }, ids.warehouseId);
    await page.waitForSelector('#wh-parent-unit-input', { state: 'attached', timeout: 5000 });
    const selected = await page.$eval('#wh-parent-unit-input', input => ({
      value: document.getElementById('wh-parent-unit').value,
      text: input.value
    }));

    assert.strictEqual(Number(selected.value), ids.parentId);
    assert.match(selected.text, /Nha kho 7 parent test/);

    await page.fill('#wh-parent-unit-input', ids.nextParentName);
    await page.locator('#warehouse-form-container button.btn-primary').first().click();
    await page.waitForSelector('#modal-overlay.active', { timeout: 5000 });
    const confirmText = await page.locator('#modal-body').textContent();
    assert.ok(confirmText.includes(ids.nextParentName), confirmText);
    await page.locator('#modal-footer .btn-secondary').click();
  } finally {
    if (page && cleanupIds) {
      await page.evaluate(async (ids) => {
        await window.api.warehouses.delete(ids.warehouseId).catch(() => {});
        await window.api.warehouses.delete(ids.directWarehouseId).catch(() => {});
        for (const unitId of ids.unitIds.slice().reverse()) {
          await window.api.units.delete(unitId).catch(() => {});
        }
      }, cleanupIds).catch(() => {});
    }
    await app.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
