const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'warehouse-unit-tree-'));
process.env.WAREHOUSE_DB_PATH = path.join(tempDir, 'test.db');

const db = require('../src/main/database/db');
const { runMigrations } = require('../src/main/database/migrations');
const units = require('../src/main/database/queries/units');

runMigrations();

db.exec('DELETE FROM constructions; DELETE FROM fire_systems; DELETE FROM cameras; DELETE FROM warehouses; DELETE FROM units;');

const level1 = units.create({ name: 'Cấp 1' });
const level2 = units.create({ name: 'Cấp 2', parent_id: level1.id });
const level3 = units.create({ name: 'Cấp 3', parent_id: level2.id });
const level4 = units.create({ name: 'Cấp 4', parent_id: level3.id });
const rootWarehouse = units.create({ name: 'Kho truc thuoc cap 1', parent_id: level1.id, unit_type: 'warehouse' });
const level5Warehouse = units.create({ name: 'Kho cấp 5', parent_id: level4.id, unit_type: 'warehouse' });
const level6Warehouse = units.create({ name: 'Kho cấp 6', parent_id: level5Warehouse.id, unit_type: 'warehouse' });

assert.strictEqual(level1.level, 1);
assert.strictEqual(rootWarehouse.level, 2);
assert.strictEqual(rootWarehouse.unit_type, 'warehouse');
assert.strictEqual(level5Warehouse.level, 5);
assert.strictEqual(level5Warehouse.unit_type, 'warehouse');
assert.strictEqual(level6Warehouse.level, 6);
assert.strictEqual(level6Warehouse.unit_type, 'warehouse');
assert.strictEqual(level6Warehouse.path, `/${level1.id}/${level2.id}/${level3.id}/${level4.id}/${level5Warehouse.id}/${level6Warehouse.id}/`);

assert.throws(() => units.create({ name: 'Cấp 7', parent_id: level6Warehouse.id }), /quá 6 cấp/);
assert.throws(() => units.move(level4.id, level6Warehouse.id), /cây con/);

assert.strictEqual(units.getAncestors(level6Warehouse.id).length, 6);
assert.ok(units.getDescendants(level4.id).some(unit => unit.id === level6Warehouse.id));

const importedWarehouseUnit = units.findOrCreatePath(['Tổng cục', 'Vùng 1', 'Lữ 7', 'Phòng kỹ thuật', 'Nhà kho 7', 'Kho K1'], 6);
assert.strictEqual(importedWarehouseUnit.name, 'Kho K1');
assert.strictEqual(importedWarehouseUnit.level, 6);
assert.strictEqual(importedWarehouseUnit.unit_type, 'warehouse');
assert.deepStrictEqual(units.getAncestors(importedWarehouseUnit.id).map(unit => unit.name), ['Tổng cục', 'Vùng 1', 'Lữ 7', 'Phòng kỹ thuật', 'Nhà kho 7', 'Kho K1']);

const insertCamera = db.prepare('INSERT INTO cameras (unit_id, quantity) VALUES (?, ?)');
insertCamera.run(level2.id, 1);
assert.throws(() => units.remove(level2.id), /đang có cấp con|đang được sử dụng/);

console.log('Unit tree OK');
process.exit(0);
