const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app, shell } = require('electron');
const db = require('./database/db');
const { writeAudit } = require('./audit');
const { assertAllowedPath } = require('./file_guard');
const { moduleRegistry } = require('../shared/module_registry');

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip', 'rar'];
const LINKABLE_ENTITIES = ['warehouses', 'cameras', 'fireSystems', 'constructions'];

function ensureDocumentsDir() {
  const dir = path.join(app.getPath('userData'), 'documents', 'by-id');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function normalizeEntityType(entityType) {
  if (!LINKABLE_ENTITIES.includes(entityType)) throw new Error('Module không hỗ trợ tài liệu');
  return entityType;
}

function cleanText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function fileHash(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function safeFileName(name) {
  return String(name || 'document')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || 'document';
}

function getDocument(id, includeDeleted = false) {
  const sql = `SELECT d.*, (SELECT COUNT(*) FROM document_links dl WHERE dl.document_id = d.id) as link_count
    FROM documents d WHERE d.id = ? ${includeDeleted ? '' : 'AND d.deleted_at IS NULL'}`;
  return db.prepare(sql).get(id) || null;
}

function listDocuments(filters = {}) {
  const where = ['deleted_at IS NULL'];
  const params = {};
  if (filters.query) {
    where.push(`(title LIKE @query OR original_name LIKE @query OR description LIKE @query OR tags LIKE @query OR document_type LIKE @query)`);
    params.query = `%${filters.query}%`;
  }
  if (filters.document_type) {
    where.push('document_type = @document_type');
    params.document_type = filters.document_type;
  }
  return db.prepare(`SELECT d.*, (SELECT COUNT(*) FROM document_links dl WHERE dl.document_id = d.id) as link_count
    FROM documents d WHERE ${where.join(' AND ')} ORDER BY d.id DESC LIMIT 500`).all(params);
}

function createDocumentFromFile(filePath, metadata = {}) {
  const safePath = assertAllowedPath(filePath, ALLOWED_EXTENSIONS);
  const stat = fs.statSync(safePath);
  const originalName = path.basename(safePath);
  const extension = path.extname(originalName).toLowerCase().replace('.', '');
  const sha256 = fileHash(safePath);
  const title = cleanText(metadata.title) || originalName;
  const nowName = `${Date.now()}_${safeFileName(originalName)}`;
  const insert = db.prepare(`INSERT INTO documents
    (title, description, document_type, tags, original_name, stored_name, stored_path, extension, mime_type, size_bytes, sha256)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const result = insert.run(title, cleanText(metadata.description), cleanText(metadata.document_type), cleanText(metadata.tags), originalName, nowName, '', extension, cleanText(metadata.mime_type), stat.size, sha256);
  const documentId = result.lastInsertRowid;
  const docDir = path.join(ensureDocumentsDir(), String(documentId));
  fs.mkdirSync(docDir, { recursive: true });
  const storedPath = path.join(docDir, nowName);
  fs.copyFileSync(safePath, storedPath);
  db.prepare('UPDATE documents SET stored_path = ? WHERE id = ?').run(storedPath, documentId);
  const doc = getDocument(documentId);
  writeAudit({ module: 'documents', action: 'document:create', recordId: documentId, after: doc });
  return doc;
}

function updateDocument(id, metadata = {}) {
  const before = getDocument(id);
  if (!before) throw new Error('Không tìm thấy tài liệu');
  db.prepare(`UPDATE documents SET title = ?, description = ?, document_type = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(cleanText(metadata.title) || before.title, cleanText(metadata.description), cleanText(metadata.document_type), cleanText(metadata.tags), id);
  const after = getDocument(id);
  writeAudit({ module: 'documents', action: 'document:update', recordId: id, before, after });
  return after;
}

function deleteDocument(id) {
  const before = getDocument(id);
  if (!before) throw new Error('Không tìm thấy tài liệu');
  db.prepare('UPDATE documents SET deleted_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?').run('deleted', id);
  db.prepare('DELETE FROM document_links WHERE document_id = ?').run(id);
  writeAudit({ module: 'documents', action: 'document:delete', recordId: id, before });
  return { success: true };
}

function listLinks(documentId) {
  return db.prepare(`SELECT dl.*,
    CASE dl.entity_type
      WHEN 'warehouses' THEN (SELECT name FROM warehouses WHERE id = dl.entity_id)
      WHEN 'constructions' THEN (SELECT name FROM constructions WHERE id = dl.entity_id)
      WHEN 'cameras' THEN (SELECT COALESCE(cu.name, 'Camera chưa gắn đơn vị') FROM cameras c LEFT JOIN units cu ON c.child_unit_id = cu.id WHERE c.id = dl.entity_id)
      WHEN 'fireSystems' THEN (SELECT COALESCE(cu.name, 'Cứu hỏa chưa gắn đơn vị') FROM fire_systems f LEFT JOIN units cu ON f.child_unit_id = cu.id WHERE f.id = dl.entity_id)
    END as entity_title,
    CASE dl.entity_type
      WHEN 'warehouses' THEN (SELECT COALESCE(warehouse_category, '') || ' ' || COALESCE(year_built, '') FROM warehouses WHERE id = dl.entity_id)
      WHEN 'constructions' THEN (SELECT COALESCE(status, '') || ' ' || COALESCE(year_completed, '') FROM constructions WHERE id = dl.entity_id)
      WHEN 'cameras' THEN (SELECT COALESCE(status, '') || ' ' || COALESCE(year_installed, '') FROM cameras WHERE id = dl.entity_id)
      WHEN 'fireSystems' THEN (SELECT COALESCE(status, '') || ' ' || COALESCE(year_installed, '') FROM fire_systems WHERE id = dl.entity_id)
    END as entity_subtitle
    FROM document_links dl WHERE dl.document_id = ? ORDER BY dl.id DESC`).all(documentId);
}

function listLinkableRecords(entityType, query = '') {
  normalizeEntityType(entityType);
  const term = `%${String(query || '').trim()}%`;
  const limit = 100;
  if (entityType === 'warehouses') return db.prepare(`SELECT w.id, w.name as title,
    TRIM(COALESCE(w.warehouse_category, '') || ' ' || COALESCE(w.year_built, '') || ' ' || COALESCE(pu.name, '') || ' ' || COALESCE(cu.name, '')) as subtitle
    FROM warehouses w LEFT JOIN units pu ON w.parent_unit_id = pu.id LEFT JOIN units cu ON w.child_unit_id = cu.id
    WHERE @q = '%%' OR w.name LIKE @q OR w.warehouse_category LIKE @q OR CAST(w.year_built AS TEXT) LIKE @q OR pu.name LIKE @q OR cu.name LIKE @q
    ORDER BY w.name LIMIT @limit`).all({ q: term, limit });
  if (entityType === 'constructions') return db.prepare(`SELECT c.id, c.name as title,
    TRIM(COALESCE(c.status, '') || ' ' || COALESCE(c.year_completed, '') || ' ' || COALESCE(c.construction_type, '') || ' ' || COALESCE(pu.name, '')) as subtitle
    FROM constructions c LEFT JOIN units pu ON c.parent_unit_id = pu.id
    WHERE @q = '%%' OR c.name LIKE @q OR c.status LIKE @q OR c.construction_type LIKE @q OR CAST(c.year_completed AS TEXT) LIKE @q OR pu.name LIKE @q
    ORDER BY c.name LIMIT @limit`).all({ q: term, limit });
  if (entityType === 'cameras') return db.prepare(`SELECT c.id, COALESCE(cu.name, 'Camera chưa gắn đơn vị') as title,
    TRIM(COALESCE(c.status, '') || ' ' || COALESCE(c.year_installed, '') || ' ' || COALESCE(c.notes, '')) as subtitle
    FROM cameras c LEFT JOIN units cu ON c.child_unit_id = cu.id
    WHERE @q = '%%' OR cu.name LIKE @q OR c.status LIKE @q OR CAST(c.year_installed AS TEXT) LIKE @q OR c.notes LIKE @q
    ORDER BY c.id DESC LIMIT @limit`).all({ q: term, limit });
  return db.prepare(`SELECT f.id, COALESCE(cu.name, 'Cứu hỏa chưa gắn đơn vị') as title,
    TRIM(COALESCE(f.status, '') || ' ' || COALESCE(f.year_installed, '') || ' ' || COALESCE(f.equipment_type, '')) as subtitle
    FROM fire_systems f LEFT JOIN units cu ON f.child_unit_id = cu.id
    WHERE @q = '%%' OR cu.name LIKE @q OR f.status LIKE @q OR f.equipment_type LIKE @q OR CAST(f.year_installed AS TEXT) LIKE @q
    ORDER BY f.id DESC LIMIT @limit`).all({ q: term, limit });
}

function linkDocument(documentId, entityType, entityId, relationType = 'attachment', note = null) {
  normalizeEntityType(entityType);
  const doc = getDocument(documentId);
  if (!doc) throw new Error('Không tìm thấy tài liệu');
  const exists = db.prepare('SELECT id FROM document_links WHERE document_id = ? AND entity_type = ? AND entity_id = ?').get(documentId, entityType, entityId);
  if (exists) return { success: true, id: exists.id, existed: true };
  const result = db.prepare(`INSERT INTO document_links (document_id, entity_type, entity_id, relation_type, note) VALUES (?, ?, ?, ?, ?)`)
    .run(documentId, entityType, entityId, cleanText(relationType) || 'attachment', cleanText(note));
  writeAudit({ module: 'documents', action: 'document:link', recordId: documentId, metadata: { entityType, entityId, linkId: result.lastInsertRowid } });
  return { success: true, id: result.lastInsertRowid };
}

function unlinkDocument(linkId) {
  const link = db.prepare('SELECT * FROM document_links WHERE id = ?').get(linkId);
  if (!link) return { success: true };
  db.prepare('DELETE FROM document_links WHERE id = ?').run(linkId);
  writeAudit({ module: 'documents', action: 'document:unlink', recordId: link.document_id, metadata: link });
  return { success: true };
}

function listDocumentsForEntity(entityType, entityId) {
  normalizeEntityType(entityType);
  return db.prepare(`SELECT d.*, dl.id as link_id, dl.entity_type, dl.entity_id, dl.relation_type, dl.note as link_note
    FROM document_links dl JOIN documents d ON d.id = dl.document_id
    WHERE dl.entity_type = ? AND dl.entity_id = ? AND d.deleted_at IS NULL
    ORDER BY dl.id DESC`).all(entityType, entityId);
}

async function openDocument(id) {
  const doc = getDocument(id);
  if (!doc) throw new Error('Không tìm thấy tài liệu');
  if (!fs.existsSync(doc.stored_path)) throw new Error('File tài liệu không tồn tại trong kho tài liệu');
  writeAudit({ module: 'documents', action: 'document:open', recordId: id, metadata: { storedPath: doc.stored_path } });
  const error = await shell.openPath(doc.stored_path);
  if (error) throw new Error(error);
  return { success: true };
}

async function revealDocument(id) {
  const doc = getDocument(id);
  if (!doc) throw new Error('Không tìm thấy tài liệu');
  if (!fs.existsSync(doc.stored_path)) throw new Error('File tài liệu không tồn tại trong kho tài liệu');
  shell.showItemInFolder(doc.stored_path);
  return { success: true };
}

module.exports = {
  listDocuments,
  getDocument,
  createDocumentFromFile,
  updateDocument,
  deleteDocument,
  listLinks,
  listLinkableRecords,
  linkDocument,
  unlinkDocument,
  listDocumentsForEntity,
  openDocument,
  revealDocument,
  ALLOWED_EXTENSIONS,
  LINKABLE_ENTITIES
};
