const db = require('./db');

function runMigrations() {
  db.exec(`
    -- Phân cấp đơn vị (cây đa cấp)
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      level INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES units(id) ON DELETE SET NULL
    );

    -- Danh sách tỉnh
    CREATE TABLE IF NOT EXISTS provinces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Danh sách xã (theo tỉnh)
    CREATE TABLE IF NOT EXISTS wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      province_id INTEGER NOT NULL,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
    );

    -- Loại nhà kho
    CREATE TABLE IF NOT EXISTS warehouse_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Loại hàng
    CREATE TABLE IF NOT EXISTS goods_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phân cấp chất lượng nhà kho
    CREATE TABLE IF NOT EXISTS quality_grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Hệ thống chống sét
    CREATE TABLE IF NOT EXISTS lightning_protection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Trạng thái
    CREATE TABLE IF NOT EXISTS statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cơ quan chủ đầu tư
    CREATE TABLE IF NOT EXISTS investors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Đơn vị tính
    CREATE TABLE IF NOT EXISTS unit_measures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Loại công trình
    CREATE TABLE IF NOT EXISTS construction_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Nhà kho (bảng chính — mở rộng theo yêu cầu thực tế)
    CREATE TABLE IF NOT EXISTS warehouses (
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
      warehouse_area REAL DEFAULT 0,
      warehouse_land_area REAL DEFAULT 0,
      year_built INTEGER,
      year_renovated INTEGER,
      warehouse_type_id INTEGER,
      renovation_potential TEXT,
      storage_capacity REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
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

    -- Camera an ninh
    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_unit_id INTEGER,
      child_unit_id INTEGER,
      unit_measure TEXT,
      quantity INTEGER DEFAULT 0,
      year_installed INTEGER,
      year_repaired INTEGER,
      screen_count INTEGER DEFAULT 0,
      camera_count INTEGER DEFAULT 0,
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

    -- Trigger cập nhật updated_at cho warehouses
    CREATE TRIGGER IF NOT EXISTS warehouses_updated_at
    AFTER UPDATE ON warehouses
    BEGIN
      UPDATE warehouses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Trigger cập nhật updated_at cho cameras
    CREATE TRIGGER IF NOT EXISTS cameras_updated_at
    AFTER UPDATE ON cameras
    BEGIN
      UPDATE cameras SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Hệ thống cứu hỏa tập trung
    CREATE TABLE IF NOT EXISTS fire_systems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_unit_id INTEGER,
      child_unit_id INTEGER,
      unit_measure TEXT,
      equipment_type TEXT,
      quantity INTEGER DEFAULT 0,
      year_installed INTEGER,
      year_repaired INTEGER,
      pump_house_count INTEGER DEFAULT 0,
      hydrant_count INTEGER DEFAULT 0,
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

    -- Công trình xây mới / sửa chữa / nâng cấp (mở rộng đầy đủ)
    CREATE TABLE IF NOT EXISTS constructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_unit_id INTEGER,
      child_unit_id INTEGER,
      construction_type TEXT,
      year_started INTEGER,
      year_completed INTEGER,
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
      contract_value REAL DEFAULT 0,
      settlement_approved REAL DEFAULT 0,
      total_estimated REAL DEFAULT 0,
      settlement_decision_no TEXT,
      settlement_value REAL DEFAULT 0,
      total_investment REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_unit_id) REFERENCES units(id) ON DELETE SET NULL,
      FOREIGN KEY (child_unit_id) REFERENCES units(id) ON DELETE SET NULL
    );

    CREATE TRIGGER IF NOT EXISTS fire_systems_updated_at
    AFTER UPDATE ON fire_systems
    BEGIN
      UPDATE fire_systems SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS constructions_updated_at
    AFTER UPDATE ON constructions
    BEGIN
      UPDATE constructions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // Migrate existing tables — add new columns if missing
  migrateExistingTables();

  // Seed sample data if tables are empty
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get();
  if (unitCount.count === 0) {
    seedData();
  }
}

function migrateExistingTables() {
  const allowedTables = new Set(['units', 'warehouses', 'cameras', 'fire_systems', 'constructions']);
  const addColumnIfMissing = (table, column, type) => {
    if (!allowedTables.has(table)) throw new Error(`Invalid migration table: ${table}`);
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all();
      if (!cols.find(c => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      }
    } catch (e) { /* table may not exist yet */ }
  };

  // Units — 6-level tree metadata
  addColumnIfMissing('units', 'code', 'TEXT');
  addColumnIfMissing('units', 'unit_type', "TEXT DEFAULT 'organization'");
  addColumnIfMissing('units', 'path', 'TEXT');
  addColumnIfMissing('units', 'sort_order', 'INTEGER DEFAULT 0');
  addColumnIfMissing('units', 'is_active', 'INTEGER DEFAULT 1');
  addColumnIfMissing('units', 'updated_at', 'DATETIME');

  normalizeExistingUnitLevels();

  // Warehouses — new columns
  addColumnIfMissing('warehouses', 'unit_id', 'INTEGER');
  addColumnIfMissing('warehouses', 'address', 'TEXT');
  addColumnIfMissing('warehouses', 'warehouse_category', 'TEXT');
  addColumnIfMissing('warehouses', 'warehouse_land_area', 'REAL DEFAULT 0');
  addColumnIfMissing('warehouses', 'renovation_potential', 'TEXT');
  addColumnIfMissing('warehouses', 'quality_grade_23_area', 'REAL DEFAULT 0');
  addColumnIfMissing('warehouses', 'quality_grade_4_area', 'REAL DEFAULT 0');
  addColumnIfMissing('warehouses', 'temp_house_area', 'REAL DEFAULT 0');
  addColumnIfMissing('warehouses', 'lightning_grade_area', 'REAL DEFAULT 0');
  addColumnIfMissing('warehouses', 'lightning_existing_count', 'INTEGER DEFAULT 0');
  addColumnIfMissing('warehouses', 'notes', 'TEXT');

  // Cameras — new columns
  addColumnIfMissing('cameras', 'unit_id', 'INTEGER');
  addColumnIfMissing('cameras', 'notes', 'TEXT');

  // Fire systems — new columns
  addColumnIfMissing('fire_systems', 'unit_id', 'INTEGER');
  addColumnIfMissing('fire_systems', 'unit_measure', 'TEXT');
  addColumnIfMissing('fire_systems', 'pump_house_count', 'INTEGER DEFAULT 0');
  addColumnIfMissing('fire_systems', 'hydrant_count', 'INTEGER DEFAULT 0');

  // Constructions — new columns
  addColumnIfMissing('constructions', 'unit_id', 'INTEGER');
  addColumnIfMissing('constructions', 'approval_decision_no', 'TEXT');
  addColumnIfMissing('constructions', 'contract_number', 'TEXT');
  addColumnIfMissing('constructions', 'contractor_name', 'TEXT');
  addColumnIfMissing('constructions', 'contractor_address', 'TEXT');
  addColumnIfMissing('constructions', 'contractor_tax_code', 'TEXT');
  addColumnIfMissing('constructions', 'review_authority', 'TEXT');
  addColumnIfMissing('constructions', 'work_volume', 'TEXT');
  addColumnIfMissing('constructions', 'start_date', 'TEXT');
  addColumnIfMissing('constructions', 'end_date', 'TEXT');
  addColumnIfMissing('constructions', 'approved_investment', 'REAL DEFAULT 0');
  addColumnIfMissing('constructions', 'estimated_cost', 'REAL DEFAULT 0');
  addColumnIfMissing('constructions', 'contract_value', 'REAL DEFAULT 0');
  addColumnIfMissing('constructions', 'settlement_approved', 'REAL DEFAULT 0');
  addColumnIfMissing('constructions', 'total_estimated', 'REAL DEFAULT 0');
  addColumnIfMissing('constructions', 'settlement_decision_no', 'TEXT');
  addColumnIfMissing('constructions', 'settlement_value', 'REAL DEFAULT 0');
  addColumnIfMissing('constructions', 'total_investment', 'REAL DEFAULT 0');

  migrateUnitReferences();
  rebuildUnitPaths();
}

function normalizeExistingUnitLevels() {
  const rootWithZeroLevel = db.prepare('SELECT 1 FROM units WHERE parent_id IS NULL AND level = 0 LIMIT 1').get();
  if (rootWithZeroLevel) db.exec('UPDATE units SET level = level + 1');
}

function migrateUnitReferences() {
  const migrate = db.transaction(() => {
    const createWarehouseUnit = db.prepare('INSERT INTO units (name, parent_id, level, unit_type, path, is_active) VALUES (?, ?, ?, ?, NULL, 1)');
    const setWarehouseUnit = db.prepare('UPDATE warehouses SET unit_id = ? WHERE id = ?');
    const warehouses = db.prepare('SELECT id, name, unit_id, child_unit_id, parent_unit_id FROM warehouses WHERE unit_id IS NULL').all();
    warehouses.forEach(warehouse => {
      const parentId = warehouse.child_unit_id || warehouse.parent_unit_id || null;
      const parent = parentId ? db.prepare('SELECT level FROM units WHERE id = ?').get(parentId) : null;
      const level = Math.min((parent ? parent.level : 4) + 1, 6);
      const result = createWarehouseUnit.run(warehouse.name, parentId, level, 'warehouse');
      setWarehouseUnit.run(result.lastInsertRowid, warehouse.id);
    });

    ['cameras', 'fire_systems', 'constructions'].forEach(table => {
      db.prepare(`UPDATE ${table} SET unit_id = COALESCE(child_unit_id, parent_unit_id) WHERE unit_id IS NULL`).run();
    });
  });
  migrate();
}

function rebuildUnitPaths() {
  const updatePath = db.prepare('UPDATE units SET path = ? WHERE id = ?');
  const units = db.prepare('SELECT id, parent_id FROM units ORDER BY level, id').all();
  const byId = new Map(units.map(unit => [unit.id, unit]));
  units.forEach(unit => {
    const ids = [];
    let current = unit;
    while (current) {
      ids.unshift(current.id);
      current = byId.get(current.parent_id);
    }
    updatePath.run(`/${ids.join('/')}/`, unit.id);
  });
}

function seedData() {
  const insertUnit = db.prepare('INSERT INTO units (name, parent_id, level) VALUES (?, ?, ?)');
  const insertProvince = db.prepare('INSERT INTO provinces (name, code) VALUES (?, ?)');
  const insertWard = db.prepare('INSERT INTO wards (name, province_id, code) VALUES (?, ?, ?)');
  const insertWarehouseType = db.prepare('INSERT INTO warehouse_types (name, description) VALUES (?, ?)');
  const insertGoodsType = db.prepare('INSERT INTO goods_types (name, description) VALUES (?, ?)');
  const insertQualityGrade = db.prepare('INSERT INTO quality_grades (name, description) VALUES (?, ?)');
  const insertLightning = db.prepare('INSERT INTO lightning_protection (name, description) VALUES (?, ?)');

  const seedTransaction = db.transaction(() => {
    // Đơn vị mẫu
    const rootUnitId = insertUnit.run('Đơn vị cấp 1', null, 1).lastInsertRowid;
    const unitAId = insertUnit.run('Đơn vị cấp 2 - A', rootUnitId, 2).lastInsertRowid;
    insertUnit.run('Đơn vị cấp 2 - B', rootUnitId, 2);
    insertUnit.run('Đơn vị cấp 3 - A1', unitAId, 3);

    // Tỉnh mẫu
    const hanoiId = insertProvince.run('Hà Nội', 'HN').lastInsertRowid;
    const hcmId = insertProvince.run('Hồ Chí Minh', 'HCM').lastInsertRowid;
    const danangId = insertProvince.run('Đà Nẵng', 'DN').lastInsertRowid;

    // Xã mẫu
    insertWard.run('Ba Đình', hanoiId, 'BD');
    insertWard.run('Hoàn Kiếm', hanoiId, 'HK');
    insertWard.run('Quận 1', hcmId, 'Q1');
    insertWard.run('Hải Châu', danangId, 'HC');

    // Loại nhà kho
    insertWarehouseType.run('Kho kín', 'Nhà kho có mái che, tường bao quanh');
    insertWarehouseType.run('Kho hở', 'Bãi chứa ngoài trời');
    insertWarehouseType.run('Kho lạnh', 'Nhà kho có hệ thống làm lạnh');

    // Loại hàng
    insertGoodsType.run('Vật liệu xây dựng', '');
    insertGoodsType.run('Thiết bị điện tử', '');
    insertGoodsType.run('Lương thực', '');
    insertGoodsType.run('Nhiên liệu', '');

    // Phân cấp chất lượng
    insertQualityGrade.run('Loại 1', 'Chất lượng tốt');
    insertQualityGrade.run('Loại 2', 'Chất lượng trung bình');
    insertQualityGrade.run('Loại 3', 'Cần sửa chữa');
    insertQualityGrade.run('Loại 4', 'Xuống cấp nghiêm trọng');

    // Hệ thống chống sét
    insertLightning.run('Có', 'Đã lắp đặt hệ thống chống sét');
    insertLightning.run('Không', 'Chưa có hệ thống chống sét');
    insertLightning.run('Cần nâng cấp', 'Có nhưng cần nâng cấp');
  });

  seedTransaction();
}

module.exports = { runMigrations };
