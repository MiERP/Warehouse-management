const db = require('./db');

const migrations = [
  {
    version: 1,
    name: '001_initial_schema_marker',
    up() {}
  },
  {
    version: 2,
    name: '002_smart_search_marker',
    up() {}
  },
  {
    version: 3,
    name: '003_audit_backup_hardening',
    up() {
      db.exec(`
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
      `);
    }
  },
  {
    version: 4,
    name: '004_duplicate_review_views',
    up() {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);
        CREATE INDEX IF NOT EXISTS idx_constructions_name ON constructions(name);
        CREATE INDEX IF NOT EXISTS idx_cameras_child_unit ON cameras(child_unit_id);
        CREATE INDEX IF NOT EXISTS idx_fire_systems_child_unit ON fire_systems(child_unit_id);
      `);
    }  },
  {
    version: 5,
    name: '005_document_management',
    up() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          document_type TEXT,
          tags TEXT,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          stored_path TEXT NOT NULL,
          extension TEXT,
          mime_type TEXT,
          size_bytes INTEGER DEFAULT 0,
          sha256 TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME
        );
        CREATE TABLE IF NOT EXISTS document_links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id INTEGER NOT NULL,
          relation_type TEXT DEFAULT 'attachment',
          note TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
        CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256);
        CREATE INDEX IF NOT EXISTS idx_document_links_entity ON document_links(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_document_links_document ON document_links(document_id);
      `);
    }
  }
];

function ensureMigrationTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function runHardeningMigrations() {
  ensureMigrationTable();
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map(row => row.version));
  const insert = db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)');
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    const tx = db.transaction(() => {
      migration.up();
      insert.run(migration.version, migration.name);
    });
    tx();
  }
}

function listMigrations() {
  ensureMigrationTable();
  return db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version').all();
}

module.exports = { runHardeningMigrations, listMigrations };

