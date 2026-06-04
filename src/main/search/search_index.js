const db = require('../database/db');
const { normalizeVietnamese } = require('./normalize');

function joinText(...values) {
  return values.filter(value => value !== null && value !== undefined && value !== '').join(' ');
}

function getUnitPathText(unitId) {
  if (!unitId) return '';
  return db.prepare(`
    WITH RECURSIVE ancestors(id, name, parent_id, level) AS (
      SELECT id, name, parent_id, level FROM units WHERE id = ?
      UNION ALL
      SELECT u.id, u.name, u.parent_id, u.level FROM units u JOIN ancestors a ON a.parent_id = u.id
    )
    SELECT name FROM ancestors ORDER BY level
  `).all(unitId).map(row => row.name).join(' ');
}

function createDocument(module, record) {
  const title = record.title || '';
  const subtitle = record.subtitle || '';
  const unitName = record.unit_name || '';
  const address = record.address || '';
  const status = record.status || '';
  const investor = record.investor || '';
  const notes = record.notes || '';
  const rawText = joinText(title, subtitle, unitName, address, status, investor, notes, record.unit_path_text, record.extra_text);

  return {
    module,
    record_id: record.id,
    title,
    subtitle,
    unit_name: unitName,
    address,
    status,
    investor,
    notes,
    normalized_text: normalizeVietnamese(rawText)
  };
}

function ensureTables() {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS smart_search_fts USING fts5(
      module,
      record_id UNINDEXED,
      title,
      subtitle,
      unit_name,
      address,
      status,
      investor,
      notes,
      normalized_text,
      tokenize = 'unicode61 remove_diacritics 2'
    );

    CREATE TABLE IF NOT EXISTS smart_search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      normalized_query TEXT,
      result_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getWarehouseDocuments() {
  return db.prepare(`
    SELECT w.id, w.name as title, pu.name as subtitle,
      TRIM(COALESCE(u.name,'') || ' ' || COALESCE(cu.name,'')) as unit_name,
      COALESCE(w.unit_id, w.child_unit_id, w.parent_unit_id) as unit_id,
      w.address,
      TRIM(COALESCE(w.warehouse_category,'') || ' ' || COALESCE(w.fire_need,'') || ' ' || COALESCE(w.fire_existing,'')) as status,
      '' as investor,
      w.notes,
      TRIM(COALESCE(w.year_built,'') || ' ' || COALESCE(w.year_renovated,'') || ' ' ||
        COALESCE(w.storage_capacity,'') || ' ' || COALESCE(w.current_stock,'') || ' ' ||
        COALESCE(wt.name,'') || ' ' || COALESCE(gt.name,'') || ' ' || COALESCE(qg.name,'')) as extra_text
    FROM warehouses w
    LEFT JOIN units u ON w.unit_id = u.id
    LEFT JOIN units pu ON w.parent_unit_id = pu.id
    LEFT JOIN units cu ON w.child_unit_id = cu.id
    LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
    LEFT JOIN goods_types gt ON w.goods_type_id = gt.id
    LEFT JOIN quality_grades qg ON w.quality_grade_id = qg.id
  `).all().map(row => createDocument('warehouse', { ...row, unit_path_text: getUnitPathText(row.unit_id) }));
}

function getCameraDocuments() {
  return db.prepare(`
    SELECT c.id, COALESCE(u.name, cu.name, 'Hệ thống camera') as title, pu.name as subtitle,
      TRIM(COALESCE(u.name,'') || ' ' || COALESCE(cu.name,'')) as unit_name,
      COALESCE(c.unit_id, c.child_unit_id, c.parent_unit_id) as unit_id,
      '' as address,
      c.status,
      c.investor,
      c.notes,
      TRIM('camera cam an ninh ' || COALESCE(c.unit_measure,'') || ' ' || COALESCE(c.quantity,'') || ' ' ||
        COALESCE(c.year_installed,'') || ' ' || COALESCE(c.year_repaired,'') || ' ' ||
        COALESCE(c.screen_count,'') || ' man hinh ' || COALESCE(c.camera_count,'') || ' cam ' ||
        CASE WHEN COALESCE(c.repair_need,0) > 0 THEN COALESCE(c.repair_need,'') || ' can sua chua ' ELSE '' END ||
        CASE WHEN COALESCE(c.new_install_need,0) > 0 THEN COALESCE(c.new_install_need,'') || ' lap moi ' ELSE '' END) as extra_text
    FROM cameras c
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN units pu ON c.parent_unit_id = pu.id
    LEFT JOIN units cu ON c.child_unit_id = cu.id
  `).all().map(row => createDocument('camera', { ...row, unit_path_text: getUnitPathText(row.unit_id) }));
}

function getFireDocuments() {
  return db.prepare(`
    SELECT f.id, COALESCE(u.name, cu.name, 'Hệ thống cứu hỏa') as title, pu.name as subtitle,
      TRIM(COALESCE(u.name,'') || ' ' || COALESCE(cu.name,'')) as unit_name,
      COALESCE(f.unit_id, f.child_unit_id, f.parent_unit_id) as unit_id,
      '' as address,
      f.status,
      f.investor,
      f.notes,
      TRIM('cuu hoa pccc phong chay chua chay ' || COALESCE(f.unit_measure,'') || ' ' || COALESCE(f.quantity,'') || ' ' ||
        COALESCE(f.year_installed,'') || ' ' || COALESCE(f.year_repaired,'') || ' ' ||
        COALESCE(f.pump_house_count,'') || ' nha bom ' || COALESCE(f.hydrant_count,'') || ' hong ' ||
        CASE WHEN COALESCE(f.repair_need,0) > 0 THEN COALESCE(f.repair_need,'') || ' can sua chua ' ELSE '' END ||
        CASE WHEN COALESCE(f.new_install_need,0) > 0 THEN COALESCE(f.new_install_need,'') || ' lap moi ' ELSE '' END) as extra_text
    FROM fire_systems f
    LEFT JOIN units u ON f.unit_id = u.id
    LEFT JOIN units pu ON f.parent_unit_id = pu.id
    LEFT JOIN units cu ON f.child_unit_id = cu.id
  `).all().map(row => createDocument('fire', { ...row, unit_path_text: getUnitPathText(row.unit_id) }));
}

function getConstructionDocuments() {
  return db.prepare(`
    SELECT c.id, c.name as title, pu.name as subtitle,
      TRIM(COALESCE(u.name,'') || ' ' || COALESCE(cu.name,'')) as unit_name,
      COALESCE(c.unit_id, c.child_unit_id, c.parent_unit_id) as unit_id,
      '' as address,
      c.status,
      c.investor,
      TRIM(COALESCE(c.description,'') || ' ' || COALESCE(c.notes,'')) as notes,
      TRIM('cong trinh du an xay dung ' || COALESCE(c.construction_type,'') || ' ' ||
        COALESCE(c.year_started,'') || ' ' || COALESCE(c.year_completed,'') || ' ' ||
        COALESCE(c.approval_decision_no,'') || ' ' || COALESCE(c.contract_number,'') || ' ' ||
        COALESCE(c.contractor_name,'') || ' ' || COALESCE(c.settlement_decision_no,'') || ' ' ||
        COALESCE(c.settlement_value,'') || ' quyet toan') as extra_text
    FROM constructions c
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN units pu ON c.parent_unit_id = pu.id
    LEFT JOIN units cu ON c.child_unit_id = cu.id
  `).all().map(row => createDocument('construction', { ...row, unit_path_text: getUnitPathText(row.unit_id) }));
}


function getDocumentDocuments() {
  try {
    return db.prepare(`
      SELECT d.id, d.title, d.original_name as subtitle,
        '' as unit_name,
        d.stored_path as address,
        d.document_type as status,
        '' as investor,
        d.description as notes,
        TRIM('tai lieu ho so file ' || COALESCE(d.original_name,'') || ' ' || COALESCE(d.tags,'') || ' ' || COALESCE(d.extension,'')) as extra_text
      FROM documents d
      WHERE d.deleted_at IS NULL
    `).all().map(row => createDocument('documents', row));
  } catch (_) {
    return [];
  }
}

function rebuild() {
  ensureTables();
  db.prepare('DELETE FROM smart_search_fts').run();
  const insert = db.prepare(`
    INSERT INTO smart_search_fts (module, record_id, title, subtitle, unit_name, address, status, investor, notes, normalized_text)
    VALUES (@module, @record_id, @title, @subtitle, @unit_name, @address, @status, @investor, @notes, @normalized_text)
  `);

  const docs = [
    ...getWarehouseDocuments(),
    ...getCameraDocuments(),
    ...getFireDocuments(),
    ...getConstructionDocuments(),
    ...getDocumentDocuments()
  ];

  const tx = db.transaction(items => items.forEach(item => insert.run(item)));
  tx(docs);
  return { success: true, count: docs.length };
}


// Per-record document builders for incremental index updates
function getWarehouseDocument(id) {
  const rows = db.prepare(`
    SELECT w.id, w.name as title, pu.name as subtitle,
      TRIM(COALESCE(pu.name,"") || " " || COALESCE(cu.name,"")) as unit_name,
      w.address,
      TRIM(COALESCE(w.warehouse_category,"") || " " || COALESCE(w.fire_need,"") || " " || COALESCE(w.fire_existing,"")) as status,
      "" as investor, w.notes,
      TRIM(COALESCE(w.year_built,"") || " " || COALESCE(w.year_renovated,"") || " " ||
        COALESCE(w.storage_capacity,"") || " " || COALESCE(w.current_stock,"") || " " ||
        COALESCE(wt.name,"") || " " || COALESCE(gt.name,"") || " " || COALESCE(qg.name,"")) as extra_text
    FROM warehouses w
    LEFT JOIN units pu ON w.parent_unit_id = pu.id
    LEFT JOIN units cu ON w.child_unit_id = cu.id
    LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
    LEFT JOIN goods_types gt ON w.goods_type_id = gt.id
    LEFT JOIN quality_grades qg ON w.quality_grade_id = qg.id
    WHERE w.id = ?`).all(id).map(row => createDocument("warehouse", row));
  return rows;
}

function getCameraDocument(id) {
  const rows = db.prepare(`
    SELECT c.id, COALESCE(cu.name, "He thong camera") as title, pu.name as subtitle,
      TRIM(COALESCE(pu.name,"") || " " || COALESCE(cu.name,"")) as unit_name,
      "" as address, c.status, c.investor, c.notes,
      TRIM("camera cam an ninh " || COALESCE(c.unit_measure,"") || " " || COALESCE(c.quantity,"") || " " ||
        COALESCE(c.year_installed,"") || " " || COALESCE(c.year_repaired,"") || " " ||
        COALESCE(c.screen_count,"") || " man hinh " || COALESCE(c.camera_count,"") || " cam " ||
        CASE WHEN COALESCE(c.repair_need,0) > 0 THEN COALESCE(c.repair_need,"") || " can sua chua " ELSE "" END ||
        CASE WHEN COALESCE(c.new_install_need,0) > 0 THEN COALESCE(c.new_install_need,"") || " lap moi " ELSE "" END) as extra_text
    FROM cameras c LEFT JOIN units pu ON c.parent_unit_id = pu.id LEFT JOIN units cu ON c.child_unit_id = cu.id
    WHERE c.id = ?`).all(id).map(row => createDocument("camera", row));
  return rows;
}

function getFireDocument(id) {
  const rows = db.prepare(`
    SELECT f.id, COALESCE(cu.name, "He thong cuu hoa") as title, pu.name as subtitle,
      TRIM(COALESCE(pu.name,"") || " " || COALESCE(cu.name,"")) as unit_name,
      "" as address, f.status, f.investor, f.notes,
      TRIM("cuu hoa pccc phong chay chua chay " || COALESCE(f.unit_measure,"") || " " || COALESCE(f.quantity,"") || " " ||
        COALESCE(f.year_installed,"") || " " || COALESCE(f.year_repaired,"") || " " ||
        COALESCE(f.pump_house_count,"") || " nha bom " || COALESCE(f.hydrant_count,"") || " hong " ||
        CASE WHEN COALESCE(f.repair_need,0) > 0 THEN COALESCE(f.repair_need,"") || " can sua chua " ELSE "" END ||
        CASE WHEN COALESCE(f.new_install_need,0) > 0 THEN COALESCE(f.new_install_need,"") || " lap moi " ELSE "" END) as extra_text
    FROM fire_systems f LEFT JOIN units pu ON f.parent_unit_id = pu.id LEFT JOIN units cu ON f.child_unit_id = cu.id
    WHERE f.id = ?`).all(id).map(row => createDocument("fire", row));
  return rows;
}

function getConstructionDocument(id) {
  const rows = db.prepare(`
    SELECT c.id, c.name as title, pu.name as subtitle,
      TRIM(COALESCE(pu.name,"") || " " || COALESCE(cu.name,"")) as unit_name,
      "" as address, c.status, c.investor,
      TRIM(COALESCE(c.description,"") || " " || COALESCE(c.notes,"")) as notes,
      TRIM("cong trinh du an xay dung " || COALESCE(c.construction_type,"") || " " ||
        COALESCE(c.year_started,"") || " " || COALESCE(c.year_completed,"") || " " ||
        COALESCE(c.approval_decision_no,"") || " " || COALESCE(c.contract_number,"") || " " ||
        COALESCE(c.contractor_name,"") || " " || COALESCE(c.settlement_decision_no,"") || " " ||
        COALESCE(c.settlement_value,"") || " quyet toan") as extra_text
    FROM constructions c LEFT JOIN units pu ON c.parent_unit_id = pu.id LEFT JOIN units cu ON c.child_unit_id = cu.id
    WHERE c.id = ?`).all(id).map(row => createDocument("construction", row));
  return rows;
}

const perRecordFns = {
  warehouse: getWarehouseDocument,
  camera: getCameraDocument,
  fire: getFireDocument,
  construction: getConstructionDocument
};

function updateRecord(module, recordId) {
  db.prepare("DELETE FROM smart_search_fts WHERE module = ? AND record_id = ?").run(module, recordId);
  const fn = perRecordFns[module];
  if (!fn) return;
  const docs = fn(recordId);
  if (!docs.length) return;
  const insert = db.prepare(`
    INSERT INTO smart_search_fts (module, record_id, title, subtitle, unit_name, address, status, investor, notes, normalized_text)
    VALUES (@module, @record_id, @title, @subtitle, @unit_name, @address, @status, @investor, @notes, @normalized_text)`);
  docs.forEach(doc => insert.run(doc));
}

function deleteRecord(module, recordId) {
  db.prepare("DELETE FROM smart_search_fts WHERE module = ? AND record_id = ?").run(module, recordId);
}

module.exports = { ensureTables, rebuild, updateRecord, deleteRecord };
