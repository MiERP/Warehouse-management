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
module.exports = { writeAudit };
