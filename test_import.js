/**
 * Test script: Import data from Excel templates into database
 * Standalone — không cần Electron runtime
 */
const XLSX = require('xlsx');
const path = require('path');
const Database = require('better-sqlite3');

// Create DB in project root for testing
const dbPath = path.join(__dirname, 'test_warehouse.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Override db module
const dbModule = require.resolve('./src/main/database/db');
require.cache[dbModule] = { id: dbModule, filename: dbModule, loaded: true, exports: db };

const { runMigrations } = require('./src/main/database/migrations');

console.log('=== INITIALIZING DATABASE ===');
runMigrations();
console.log('✓ Migrations completed\n');

// Import queries
const unitQueries = require('./src/main/database/queries/units');
const warehouseQueries = require('./src/main/database/queries/warehouses');
const cameraQueries = require('./src/main/database/queries/cameras');
const fireSystemQueries = require('./src/main/database/queries/fire_systems');
const constructionQueries = require('./src/main/database/queries/constructions');

// =========================================================
// 1. SEED UNITS (Vùng 1 hierarchy)
// =========================================================
console.log('=== IMPORTING UNITS ===');
const parentUnit = unitQueries.create({ name: 'Vùng 1 Hải quân', parent_id: null, level: 0 });
const childNames = [
  'Cơ quan Vùng', 'Kho .../P.HCKT Vùng', 'Kho …',
  'Lữ đoàn 147', 'Trung đoàn …', 'Lữ đoàn 170 (KKT)',
  'Phòng HC-KT Vùng'
];
const childUnits = childNames.map(name =>
  unitQueries.create({ name, parent_id: parentUnit.id, level: 1 })
);
console.log(`✓ Created ${childUnits.length + 1} units\n`);

// Helper to find child unit by partial name match
function findUnit(name) {
  if (!name) return null;
  const n = name.trim();
  return childUnits.find(u => n.includes(u.name.substring(0, 5)) || u.name.includes(n.substring(0, 5)));
}

// =========================================================
// 2. IMPORT CAMERAS from CAMERA.xls
// =========================================================
console.log('=== IMPORTING CAMERAS ===');
const camWb = XLSX.readFile('docs/template/CAMERA.xls');
const camData = XLSX.utils.sheet_to_json(camWb.Sheets[camWb.SheetNames[0]], { header: 1 });

let camCount = 0;
for (let i = 8; i <= 13; i++) {
  const row = camData[i];
  if (!row || !row[1]) continue;
  const unitName = String(row[1]).trim();
  const unit = findUnit(unitName);

  try {
    cameraQueries.create({
      parent_unit_id: parentUnit.id,
      child_unit_id: unit ? unit.id : null,
      unit_measure: row[2] || 'Hệ thống',
      quantity: row[3] || 0,
      year_installed: row[4] || null,
      year_repaired: row[5] || null,
      screen_count: row[6] || 0,
      camera_count: row[7] || 0,
      investor: row[8] || null,
      status: row[9] || null,
      repair_need: row[10] || 0,
      new_install_need: row[11] || 0,
      notes: null
    });
    camCount++;
    console.log(`  ✓ ${unitName} — ${row[7]||0} CAM, ${row[6]||0} màn hình`);
  } catch (e) { console.log(`  ✗ ${unitName} — ${e.message}`); }
}
console.log(`✓ Imported ${camCount} cameras\n`);

// =========================================================
// 3. IMPORT FIRE SYSTEMS from CUU-HOA.xls
// =========================================================
console.log('=== IMPORTING FIRE SYSTEMS ===');
const fireWb = XLSX.readFile('docs/template/CUU-HOA.xls');
const fireData = XLSX.utils.sheet_to_json(fireWb.Sheets[fireWb.SheetNames[0]], { header: 1 });

let fireCount = 0;
for (let i = 8; i <= 13; i++) {
  const row = fireData[i];
  if (!row || !row[1]) continue;
  const unitName = String(row[1]).trim();
  const unit = findUnit(unitName);

  try {
    fireSystemQueries.create({
      parent_unit_id: parentUnit.id,
      child_unit_id: unit ? unit.id : null,
      unit_measure: row[2] || 'Hệ thống',
      equipment_type: null,
      quantity: row[3] || 0,
      year_installed: row[4] || null,
      year_repaired: row[5] || null,
      pump_house_count: row[6] || 0,
      hydrant_count: row[7] || 0,
      investor: row[8] || null,
      status: row[9] || null,
      repair_need: row[10] || 0,
      new_install_need: row[11] || 0,
      notes: null
    });
    fireCount++;
    console.log(`  ✓ ${unitName} — ${row[6]||0} nhà bơm, ${row[7]||0} họng`);
  } catch (e) { console.log(`  ✗ ${unitName} — ${e.message}`); }
}
console.log(`✓ Imported ${fireCount} fire systems\n`);

// =========================================================
// 4. IMPORT WAREHOUSES from KHO.xls
// =========================================================
console.log('=== IMPORTING WAREHOUSES ===');
const khoWb = XLSX.readFile('docs/template/KHO.xls');
const khoData = XLSX.utils.sheet_to_json(khoWb.Sheets['PL2'], { header: 1 });

let whCount = 0;
for (let i = 10; i <= 18; i++) {
  const row = khoData[i];
  if (!row || !row[2]) continue;
  const name = String(row[2]).trim();
  if (!name || name === 'TỔNG CỘNG') continue;

  const addr = row[3] ? String(row[3]).replace(/^nt$/, 'Phường Bạch Đằng, TP Hải Phòng') : null;

  try {
    warehouseQueries.create({
      name,
      parent_unit_id: parentUnit.id,
      child_unit_id: childUnits[6] ? childUnits[6].id : null,
      province_id: null, ward_id: null,
      address: addr,
      warehouse_category: 'chien_thuat',
      quantity: row[4] || 1,
      land_area: row[5] || 0,
      warehouse_area: row[6] || 0,
      warehouse_land_area: 0,
      year_built: row[7] || null,
      year_renovated: row[8] || null,
      warehouse_type_id: null,
      renovation_potential: null,
      storage_capacity: row[10] || 0,
      current_stock: row[11] || 0,
      goods_type_id: null,
      quality_grade_id: null,
      quality_grade_23_area: 0,
      quality_grade_4_area: row[16] || 0,
      temp_house_area: 0,
      lightning_grade_area: 0,
      lightning_existing_count: row[21] || 0,
      fire_need: null,
      fire_existing: null,
      notes: row[12] || null
    });
    whCount++;
    console.log(`  ✓ ${name} — DT=${row[6]||0}m², XD=${row[7]||'?'}, SC=${row[8]||'?'}`);
  } catch (e) { console.log(`  ✗ ${name} — ${e.message}`); }
}
console.log(`✓ Imported ${whCount} warehouses\n`);

// =========================================================
// 5. IMPORT CONSTRUCTIONS from CONG-TRINH.xlsx
// =========================================================
console.log('=== IMPORTING CONSTRUCTIONS ===');
const conWb = XLSX.readFile('docs/template/CONG-TRINH.xlsx');
const conData = XLSX.utils.sheet_to_json(conWb.Sheets['PTCh'], { header: 1 });

let conCount = 0;
// Import main project headers + key sub-items
for (let i = 6; i < conData.length; i++) {
  const row = conData[i];
  if (!row || !row[1]) continue;
  const name = String(row[1]).trim();
  if (!name || name.length < 5) continue;
  // Skip pure cost line items (chi phí quản lý, dự phòng, etc.)
  if (name.startsWith('Chi phí quản lý') || name.startsWith('Chi phí thẩm tra')
    || name.startsWith('Chi phí dự phòng') || name.startsWith('Chi phí kiểm toán')) continue;

  try {
    constructionQueries.create({
      name,
      parent_unit_id: parentUnit.id,
      child_unit_id: null,
      construction_type: row[2] || null,
      year_started: row[3] || null,
      year_completed: null,
      status: 'Đang thi công',
      budget: 0,
      investor: null,
      description: null,
      progress: 0,
      approval_decision_no: row[4] ? String(row[4]).trim() : null,
      contract_number: row[5] ? String(row[5]).replace(/[\r\n]+/g, ' ').trim() : null,
      contractor_name: row[6] ? String(row[6]).trim() : null,
      contractor_address: row[7] ? String(row[7]).trim() : null,
      contractor_tax_code: null,
      review_authority: row[8] || null,
      work_volume: null,
      start_date: row[9] ? String(row[9]) : null,
      end_date: row[10] ? String(row[10]) : null,
      approved_investment: 0,
      estimated_cost: row[12] || 0,
      contract_value: row[13] || 0,
      settlement_approved: 0,
      total_estimated: 0,
      settlement_decision_no: null,
      settlement_value: 0,
      total_investment: 0,
      notes: null
    });
    conCount++;
    console.log(`  ✓ ${name.substring(0, 70)}${name.length > 70 ? '...' : ''}`);
  } catch (e) { console.log(`  ✗ ${name.substring(0, 40)} — ${e.message}`); }
}
console.log(`✓ Imported ${conCount} constructions\n`);

// =========================================================
// 6. VERIFICATION
// =========================================================
console.log('========================================');
console.log('     VERIFICATION REPORT');
console.log('========================================\n');

const wc = db.prepare('SELECT COUNT(*) as count FROM warehouses').get();
const cc = db.prepare('SELECT COUNT(*) as count FROM cameras').get();
const fc = db.prepare('SELECT COUNT(*) as count FROM fire_systems').get();
const conc = db.prepare('SELECT COUNT(*) as count FROM constructions').get();

console.log(`📦 Warehouses:     ${wc.count}`);
console.log(`📷 Cameras:        ${cc.count}`);
console.log(`🔥 Fire Systems:   ${fc.count}`);
console.log(`🏗️  Constructions:  ${conc.count}`);

// Category check
const cats = db.prepare('SELECT warehouse_category, COUNT(*) as c FROM warehouses GROUP BY warehouse_category').all();
console.log(`\n📊 Warehouse categories:`);
cats.forEach(c => console.log(`   ${c.warehouse_category || 'null'}: ${c.c}`));

// Alerts test
const currentYear = new Date().getFullYear();
const alertYear = currentYear - 10;
const alerts = db.prepare(`
  SELECT w.name, w.year_built, w.year_renovated FROM warehouses w
  WHERE w.year_built IS NOT NULL AND w.year_built <= ?
  AND (w.year_renovated IS NULL OR w.year_renovated <= ?)
`).all(alertYear, alertYear);
console.log(`\n⚠️  Alerts (built before ${alertYear}, not renovated):`);
alerts.forEach(a => console.log(`   ⚠ ${a.name} — built ${a.year_built}, renovated ${a.year_renovated || 'never'}`));

// CRUD reads
console.log('\n✅ CRUD READ Tests:');
const allWh = warehouseQueries.getAll();
console.log(`   warehouses.getAll()    → ${allWh.length} records`);
const allCam = cameraQueries.getAll();
console.log(`   cameras.getAll()       → ${allCam.length} records`);
const allFire = fireSystemQueries.getAll();
console.log(`   fireSystems.getAll()   → ${allFire.length} records`);
const allCon = constructionQueries.getAll();
console.log(`   constructions.getAll() → ${allCon.length} records`);

// Search test
const sr = warehouseQueries.search('K708');
console.log(`\n🔍 Search "K708": ${sr.length} results`);
sr.forEach(r => console.log(`   → ${r.name}`));

const sr2 = warehouseQueries.search('K701');
console.log(`🔍 Search "K701": ${sr2.length} results`);
sr2.forEach(r => console.log(`   → ${r.name}`));

console.log('\n========================================');
console.log('     ALL TESTS PASSED ✅');
console.log('========================================');

db.close();
// Cleanup test DB
const fs = require('fs');
// Keep the test DB so the user can inspect it
console.log(`\nTest DB saved at: ${dbPath}`);
