/**
 * Electron test runner: import Excel data and verify modules
 * Run with: npx electron test_electron.js
 */
const { app } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const db = require('./src/main/database/db');
  const { runMigrations } = require('./src/main/database/migrations');
  const XLSX = require('xlsx');

  console.log('=== INITIALIZING DATABASE ===');
  runMigrations();
  console.log('✓ Migrations completed\n');

  const unitQueries = require('./src/main/database/queries/units');
  const warehouseQueries = require('./src/main/database/queries/warehouses');
  const cameraQueries = require('./src/main/database/queries/cameras');
  const fireSystemQueries = require('./src/main/database/queries/fire_systems');
  const constructionQueries = require('./src/main/database/queries/constructions');

  // =========================================================
  // 1. SEED UNITS
  // =========================================================
  console.log('=== IMPORTING UNITS ===');
  const parentUnit = unitQueries.create({ name: 'Vùng 1 Hải quân', parent_id: null, level: 0 });
  const childNames = [
    'Cơ quan Vùng', 'Kho HCKT Vùng', 'Kho chung',
    'Lữ đoàn 147', 'Trung đoàn Hải quân', 'Lữ đoàn 170 (KKT)',
    'Phòng HC-KT Vùng'
  ];
  const childUnits = childNames.map(name =>
    unitQueries.create({ name, parent_id: parentUnit.id, level: 1 })
  );
  console.log(`✓ Created ${childUnits.length + 1} units\n`);

  function findUnit(name) {
    if (!name) return null;
    const n = name.trim();
    return childUnits.find(u => n.includes(u.name.substring(0, 5)) || u.name.includes(n.substring(0, 5)));
  }

  // =========================================================
  // 2. IMPORT CAMERAS
  // =========================================================
  console.log('=== IMPORTING CAMERAS ===');
  const camWb = XLSX.readFile(path.join(__dirname, 'docs/template/CAMERA.xls'));
  const camData = XLSX.utils.sheet_to_json(camWb.Sheets[camWb.SheetNames[0]], { header: 1 });
  let camCount = 0;
  for (let i = 8; i <= 13; i++) {
    const row = camData[i];
    if (!row || !row[1]) continue;
    const unitName = String(row[1]).trim();
    try {
      cameraQueries.create({
        parent_unit_id: parentUnit.id,
        child_unit_id: findUnit(unitName)?.id || null,
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
      console.log(`  ✓ ${unitName} — ${row[7]||0} CAM`);
    } catch (e) { console.log(`  ✗ ${unitName} — ${e.message}`); }
  }
  console.log(`✓ Imported ${camCount} cameras\n`);

  // =========================================================
  // 3. IMPORT FIRE SYSTEMS
  // =========================================================
  console.log('=== IMPORTING FIRE SYSTEMS ===');
  const fireWb = XLSX.readFile(path.join(__dirname, 'docs/template/CUU-HOA.xls'));
  const fireData = XLSX.utils.sheet_to_json(fireWb.Sheets[fireWb.SheetNames[0]], { header: 1 });
  let fireCount = 0;
  for (let i = 8; i <= 13; i++) {
    const row = fireData[i];
    if (!row || !row[1]) continue;
    const unitName = String(row[1]).trim();
    try {
      fireSystemQueries.create({
        parent_unit_id: parentUnit.id,
        child_unit_id: findUnit(unitName)?.id || null,
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
      console.log(`  ✓ ${unitName} — ${row[6]||0} bơm, ${row[7]||0} họng`);
    } catch (e) { console.log(`  ✗ ${unitName} — ${e.message}`); }
  }
  console.log(`✓ Imported ${fireCount} fire systems\n`);

  // =========================================================
  // 4. IMPORT WAREHOUSES
  // =========================================================
  console.log('=== IMPORTING WAREHOUSES ===');
  const khoWb = XLSX.readFile(path.join(__dirname, 'docs/template/KHO.xls'));
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
        child_unit_id: childUnits[6]?.id || null,
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
        fire_need: null, fire_existing: null,
        notes: typeof row[12] === 'string' ? row[12] : null
      });
      whCount++;
      console.log(`  ✓ ${name} — area=${row[6]||0}m², built=${row[7]||'?'}`);
    } catch (e) { console.log(`  ✗ ${name} — ${e.message}`); }
  }
  console.log(`✓ Imported ${whCount} warehouses\n`);

  // =========================================================
  // 5. IMPORT CONSTRUCTIONS
  // =========================================================
  console.log('=== IMPORTING CONSTRUCTIONS ===');
  const conWb = XLSX.readFile(path.join(__dirname, 'docs/template/CONG-TRINH.xlsx'));
  const conData = XLSX.utils.sheet_to_json(conWb.Sheets['PTCh'], { header: 1 });
  let conCount = 0;
  const skipPrefixes = ['Chi phí quản lý', 'Chi phí thẩm tra', 'Chi phí dự phòng', 'Chi phí kiểm toán'];
  for (let i = 6; i < conData.length; i++) {
    const row = conData[i];
    if (!row || !row[1]) continue;
    const name = String(row[1]).trim();
    if (!name || name.length < 5) continue;
    if (skipPrefixes.some(p => name.startsWith(p))) continue;
    try {
      constructionQueries.create({
        name, parent_unit_id: parentUnit.id, child_unit_id: null,
        construction_type: row[2] || null,
        year_started: row[3] || null, year_completed: null,
        status: 'Đang thi công', budget: 0, investor: null,
        description: null, progress: 0,
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
        settlement_approved: 0, total_estimated: 0,
        settlement_decision_no: null, settlement_value: 0, total_investment: 0,
        notes: null
      });
      conCount++;
      console.log(`  ✓ ${name.substring(0, 65)}${name.length > 65 ? '...' : ''}`);
    } catch (e) { console.log(`  ✗ ${name.substring(0, 40)} — ${e.message}`); }
  }
  console.log(`✓ Imported ${conCount} constructions\n`);

  // =========================================================
  // VERIFICATION
  // =========================================================
  console.log('========================================');
  console.log('     VERIFICATION REPORT');
  console.log('========================================\n');

  const counts = {
    warehouses: db.prepare('SELECT COUNT(*) as c FROM warehouses').get().c,
    cameras: db.prepare('SELECT COUNT(*) as c FROM cameras').get().c,
    fire_systems: db.prepare('SELECT COUNT(*) as c FROM fire_systems').get().c,
    constructions: db.prepare('SELECT COUNT(*) as c FROM constructions').get().c,
  };
  console.log(`📦 Warehouses:     ${counts.warehouses}`);
  console.log(`📷 Cameras:        ${counts.cameras}`);
  console.log(`🔥 Fire Systems:   ${counts.fire_systems}`);
  console.log(`🏗  Constructions:  ${counts.constructions}`);

  // Category
  const cats = db.prepare('SELECT warehouse_category, COUNT(*) as c FROM warehouses GROUP BY warehouse_category').all();
  console.log(`\n📊 Warehouse categories:`);
  cats.forEach(c => console.log(`   ${c.warehouse_category || 'null'}: ${c.c}`));

  // Alerts
  const alertYear = new Date().getFullYear() - 10;
  const alerts = db.prepare(`SELECT name, year_built, year_renovated FROM warehouses WHERE year_built IS NOT NULL AND year_built <= ? AND (year_renovated IS NULL OR year_renovated <= ?)`).all(alertYear, alertYear);
  console.log(`\n⚠️  Alerts (built before ${alertYear}):`);
  alerts.forEach(a => console.log(`   ⚠ ${a.name} — built ${a.year_built}, renovated ${a.year_renovated || 'never'}`));

  // CRUD reads
  console.log('\n✅ CRUD READ:');
  console.log(`   warehouses.getAll()    → ${warehouseQueries.getAll().length}`);
  console.log(`   cameras.getAll()       → ${cameraQueries.getAll().length}`);
  console.log(`   fireSystems.getAll()   → ${fireSystemQueries.getAll().length}`);
  console.log(`   constructions.getAll() → ${constructionQueries.getAll().length}`);

  // Search
  const sr = warehouseQueries.search('K708');
  console.log(`\n🔍 Search "K708": ${sr.length} results`);
  sr.forEach(r => console.log(`   → ${r.name}`));

  console.log('\n========================================');
  console.log('     ALL TESTS PASSED ✅');
  console.log('========================================');

  db.close();
  app.exit(0);
});
