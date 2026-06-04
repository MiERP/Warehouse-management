const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { app } = require('electron');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'warehouse-reports-'));
process.env.WAREHOUSE_DB_PATH = path.join(tempDir, 'test.db');

const { runMigrations } = require('../src/main/database/migrations');
const { runHardeningMigrations } = require('../src/main/database/hardening_migrations');

(async () => {
  await app.whenReady();
  runMigrations();
  runHardeningMigrations();

  const units = require('../src/main/database/queries/units');
  const warehouses = require('../src/main/database/queries/warehouses');
  const reports = require('../src/main/reports');

  const root = units.create({ name: 'Tong cuc report test' });
  const warehouse = warehouses.create({
    name: 'Kho cap 1 report test',
    parent_unit_id: root.id,
    warehouse_category: 'chien_dich',
    storage_capacity: 120,
    current_stock: 40
  });

  const category = reports.createCategory({ name: 'Bao cao kho' });
  const template = reports.createTemplate({
    category_id: category.id,
    name: 'Bao cao ton kho dong',
    data_source: 'warehouses',
    layout_json: {
      title: 'Bao cao ton kho',
      fields: [
        { field: 'name', label: 'Ten kho' },
        { field: 'parent_unit_name', label: 'Don vi cap tren' },
        { field: 'storage_capacity', label: 'Suc chua' }
      ],
      page: { size: 'A4', orientation: 'portrait', margin: 20, fontFamily: 'Arial', fontSize: 12 }
    },
    filter_config_json: {}
  });

  const rendered = reports.renderTemplate(template.id, {});
  assert.strictEqual(rendered.template.name, 'Bao cao ton kho dong');
  assert.deepStrictEqual(rendered.columns.map(column => column.field), ['name', 'parent_unit_name', 'storage_capacity']);
  assert.ok(rendered.rows.some(row => row.name === warehouse.name && row.parent_unit_name === root.name));

  const listed = reports.listTemplates({ category_id: category.id });
  assert.ok(listed.some(item => item.id === template.id));

  app.quit();
})().catch(error => {
  console.error(error);
  app.quit();
  process.exit(1);
});
