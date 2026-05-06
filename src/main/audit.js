const db = require('./database/db');
function writeAudit({ module, action, recordId = null, before = null, after = null, metadata = null }) {
  try {
    db.prepare(`INSERT INTO audit_logs (module, action, record_id, before_json, after_json, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(module, action, recordId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, metadata ? JSON.stringify(metadata) : null);
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
function listAudit(limit = 100) {
  return db.prepare(`SELECT id, module, action, record_id, actor, created_at, before_json, after_json, metadata_json
    FROM audit_logs ORDER BY id DESC LIMIT ?`).all(Number(limit) || 100);
}
module.exports = { writeAudit, listAudit };
