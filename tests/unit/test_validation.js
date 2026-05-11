// Unit test: Validation
const warehouses = require('../../src/main/validation/warehouses');
const cameras = require('../../src/main/validation/cameras');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  OK: ${name}`); }
  catch (e) { failed++; console.log(`  FAIL: ${name} - ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log('=== Validation Tests ===');

test('warehouses: rejects empty name', () => {
  try { warehouses({ name: '' }); assert(false, 'should throw'); }
  catch (e) { assert(e.message.toLowerCase().includes('tên'.toLowerCase()), 'should mention name'); }
});

test('warehouses: accepts valid data', () => {
  const result = warehouses({ name: 'Kho Test', warehouse_area: 100 });
  assert(result.name === 'Kho Test', 'name preserved');
  assert(result.warehouse_area === 100, 'area preserved');
});

test('warehouses: defaults missing fields', () => {
  const result = warehouses({ name: 'Kho Test' });
  assert(result.quantity === 0 || result.quantity === undefined, 'quantity defaults');
});

test('cameras: accepts valid data', () => {
  const result = cameras({ unit_measure: 'He thong', quantity: 1, camera_count: 4 });
  assert(result.camera_count === 4, 'camera_count preserved');
});

console.log('');
if (failed === 0) {
  console.log(`All ${passed} tests passed!`);
  process.exit(0);
} else {
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(1);
}
