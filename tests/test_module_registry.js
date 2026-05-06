const assert = require('assert');
const { moduleRegistry, listModules } = require('../src/shared/module_registry');

const expectedModules = ['warehouses', 'cameras', 'fireSystems', 'constructions'];
assert.deepStrictEqual(Object.keys(moduleRegistry), expectedModules);

for (const key of expectedModules) {
  const mod = moduleRegistry[key];
  assert.ok(mod.label, `${key} thiếu label`);
  assert.ok(mod.table, `${key} thiếu table`);
  assert.ok(mod.api, `${key} thiếu api`);
  assert.ok(Array.isArray(mod.fields) && mod.fields.length > 0, `${key} thiếu fields`);
  assert.ok(Array.isArray(mod.listColumns) && mod.listColumns.length > 0, `${key} thiếu listColumns`);
  assert.ok(Array.isArray(mod.searchFields) && mod.searchFields.length > 0, `${key} thiếu searchFields`);
}

assert.ok(moduleRegistry.warehouses.fields.some(field => field.name === 'name' && field.required));
assert.ok(moduleRegistry.cameras.fields.some(field => field.name === 'camera_count'));
assert.ok(moduleRegistry.fireSystems.fields.some(field => field.name === 'hydrant_count'));
assert.ok(moduleRegistry.constructions.fields.some(field => field.name === 'contract_value'));
assert.strictEqual(listModules().length, expectedModules.length);

console.log('Module registry OK');

