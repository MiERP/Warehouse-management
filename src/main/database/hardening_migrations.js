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
  },
  {
    version: 6,
    name: '006_check_constraints',
    up() {
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='warehouses_old'").get();
      if (tableExists) return;

      db.exec(`
        -- Fix warehouses: year_renovated < year_built
        UPDATE warehouses SET year_renovated = year_built
        WHERE year_renovated IS NOT NULL AND year_built IS NOT NULL AND year_renovated < year_built;

        -- Fix negative values in warehouses
        UPDATE warehouses SET storage_capacity = 0 WHERE storage_capacity < 0;
        UPDATE warehouses SET warehouse_area = 0 WHERE warehouse_area IS NOT NULL AND warehouse_area < 0;
        UPDATE warehouses SET current_stock = 0 WHERE current_stock < 0;

        -- Recreate warehouses with CHECK constraints
        ALTER TABLE warehouses RENAME TO warehouses_old;
        CREATE TABLE warehouses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_unit_id INTEGER,
          child_unit_id INTEGER,
          province_id INTEGER,
          ward_id INTEGER,
          address TEXT,
          warehouse_category TEXT,
          quantity INTEGER DEFAULT 0,
          land_area REAL DEFAULT 0,
          warehouse_area REAL DEFAULT 0 CHECK (warehouse_area >= 0),
          warehouse_land_area REAL DEFAULT 0,
          year_built INTEGER,
          year_renovated INTEGER CHECK (year_renovated >= year_built OR year_renovated IS NULL OR year_built IS NULL),
          warehouse_type_id INTEGER,
          renovation_potential TEXT,
          storage_capacity REAL DEFAULT 0 CHECK (storage_capacity >= 0),
          current_stock REAL DEFAULT 0 CHECK (current_stock >= 0),
          goods_type_id INTEGER,
          quality_grade_id INTEGER,
          quality_grade_23_area REAL DEFAULT 0,
          quality_grade_4_area REAL DEFAULT 0,
          temp_house_area REAL DEFAULT 0,
          lightning_grade_area REAL DEFAULT 0,
          lightning_existing_count INTEGER DEFAULT 0,
          fire_need TEXT,
          fire_existing TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_unit_id) REFERENCES units(id) ON DELETE SET NULL,
          FOREIGN KEY (child_unit_id) REFERENCES units(id) ON DELETE SET NULL,
          FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
          FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL,
          FOREIGN KEY (warehouse_type_id) REFERENCES warehouse_types(id) ON DELETE SET NULL,
          FOREIGN KEY (goods_type_id) REFERENCES goods_types(id) ON DELETE SET NULL,
          FOREIGN KEY (quality_grade_id) REFERENCES quality_grades(id) ON DELETE SET NULL
        );
        INSERT INTO warehouses SELECT * FROM warehouses_old;
        DROP TABLE warehouses_old;

        -- Fix cameras: year_repaired < year_installed
        UPDATE cameras SET year_repaired = year_installed
        WHERE year_repaired IS NOT NULL AND year_installed IS NOT NULL AND year_repaired < year_installed;

        -- Fix negative values in cameras
        UPDATE cameras SET quantity = 0 WHERE quantity < 0;
        UPDATE cameras SET camera_count = 0 WHERE camera_count < 0;
        UPDATE cameras SET screen_count = 0 WHERE screen_count < 0;

        -- Recreate cameras with CHECK constraints
        ALTER TABLE cameras RENAME TO cameras_old;
        CREATE TABLE cameras (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parent_unit_id INTEGER,
          child_unit_id INTEGER,
          unit_measure TEXT,
          quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
          year_installed INTEGER,
          year_repaired INTEGER CHECK (year_repaired >= year_installed OR year_repaired IS NULL OR year_installed IS NULL),
          screen_count INTEGER DEFAULT 0 CHECK (screen_count >= 0),
          camera_count INTEGER DEFAULT 0 CHECK (camera_count >= 0),
          investor TEXT,
          status TEXT,
          repair_need INTEGER DEFAULT 0,
          new_install_need INTEGER DEFAULT 0,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_unit_id) REFERENCES units(id) ON DELETE SET NULL,
          FOREIGN KEY (child_unit_id) REFERENCES units(id) ON DELETE SET NULL
        );
        INSERT INTO cameras SELECT * FROM cameras_old;
        DROP TABLE cameras_old;

        -- Fix fire_systems: year_repaired < year_installed
        UPDATE fire_systems SET year_repaired = year_installed
        WHERE year_repaired IS NOT NULL AND year_installed IS NOT NULL AND year_repaired < year_installed;

        -- Fix negative values in fire_systems
        UPDATE fire_systems SET pump_house_count = 0 WHERE pump_house_count < 0;
        UPDATE fire_systems SET hydrant_count = 0 WHERE hydrant_count < 0;

        -- Recreate fire_systems with CHECK constraints
        ALTER TABLE fire_systems RENAME TO fire_systems_old;
        CREATE TABLE fire_systems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parent_unit_id INTEGER,
          child_unit_id INTEGER,
          unit_measure TEXT,
          equipment_type TEXT,
          quantity INTEGER DEFAULT 0,
          year_installed INTEGER,
          year_repaired INTEGER CHECK (year_repaired >= year_installed OR year_repaired IS NULL OR year_installed IS NULL),
          pump_house_count INTEGER DEFAULT 0 CHECK (pump_house_count >= 0),
          hydrant_count INTEGER DEFAULT 0 CHECK (hydrant_count >= 0),
          investor TEXT,
          status TEXT,
          repair_need INTEGER DEFAULT 0,
          new_install_need INTEGER DEFAULT 0,
          coverage_area REAL DEFAULT 0,
          last_inspection TEXT,
          fire_rating TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_unit_id) REFERENCES units(id) ON DELETE SET NULL,
          FOREIGN KEY (child_unit_id) REFERENCES units(id) ON DELETE SET NULL
        );
        INSERT INTO fire_systems SELECT * FROM fire_systems_old;
        DROP TABLE fire_systems_old;

        -- Fix constructions: year_completed < year_started
        UPDATE constructions SET year_completed = year_started
        WHERE year_completed IS NOT NULL AND year_started IS NOT NULL AND year_completed < year_started;

        -- Fix negative values in constructions
        UPDATE constructions SET contract_value = 0 WHERE contract_value < 0;
        UPDATE constructions SET total_investment = 0 WHERE total_investment < 0;

        -- Recreate constructions with CHECK constraints
        ALTER TABLE constructions RENAME TO constructions_old;
        CREATE TABLE constructions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_unit_id INTEGER,
          child_unit_id INTEGER,
          construction_type TEXT,
          year_started INTEGER,
          year_completed INTEGER CHECK (year_completed >= year_started OR year_completed IS NULL OR year_started IS NULL),
          status TEXT,
          budget REAL DEFAULT 0,
          investor TEXT,
          description TEXT,
          progress INTEGER DEFAULT 0,
          approval_decision_no TEXT,
          contract_number TEXT,
          contractor_name TEXT,
          contractor_address TEXT,
          contractor_tax_code TEXT,
          review_authority TEXT,
          work_volume TEXT,
          start_date TEXT,
          end_date TEXT,
          approved_investment REAL DEFAULT 0,
          estimated_cost REAL DEFAULT 0,
          contract_value REAL DEFAULT 0 CHECK (contract_value >= 0),
          settlement_approved REAL DEFAULT 0,
          total_estimated REAL DEFAULT 0,
          settlement_decision_no TEXT,
          settlement_value REAL DEFAULT 0,
          total_investment REAL DEFAULT 0 CHECK (total_investment >= 0),
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_unit_id) REFERENCES units(id) ON DELETE SET NULL,
          FOREIGN KEY (child_unit_id) REFERENCES units(id) ON DELETE SET NULL
        );
        INSERT INTO constructions SELECT * FROM constructions_old;
        DROP TABLE constructions_old;
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

