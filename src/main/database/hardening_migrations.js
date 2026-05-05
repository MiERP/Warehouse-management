const db = require('./db');
function runHardeningMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      record_id INTEGER,
      before_json TEXT,
      after_json TEXT,
      metadata_json TEXT,
      actor TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS backup_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (1, 'initial_schema');
    INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (2, 'smart_search');
    INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (3, 'audit_backup_hardening');
  `);
}
module.exports = { runHardeningMigrations };
