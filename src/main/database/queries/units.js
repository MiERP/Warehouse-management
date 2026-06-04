const db = require('../db');

const UNIT_TYPES = new Set(['organization', 'department', 'facility', 'warehouse', 'other']);

const unitQueries = {
  getAll() {
    return db.prepare('SELECT * FROM units WHERE COALESCE(is_active, 1) = 1 ORDER BY level, sort_order, name').all();
  },

  getTree() {
    const all = this.getAll();
    return buildTree(all);
  },

  getById(id) {
    return db.prepare('SELECT * FROM units WHERE id = ?').get(id);
  },

  getChildren(parentId) {
    if (!parentId) return db.prepare('SELECT * FROM units WHERE parent_id IS NULL AND COALESCE(is_active, 1) = 1 ORDER BY sort_order, name').all();
    return db.prepare('SELECT * FROM units WHERE parent_id = ? AND COALESCE(is_active, 1) = 1 ORDER BY sort_order, name').all(parentId);
  },

  getByLevel(level) {
    return db.prepare('SELECT * FROM units WHERE level = ? AND COALESCE(is_active, 1) = 1 ORDER BY sort_order, name').all(level);
  },

  getAncestors(id) {
    return db.prepare(`
      WITH RECURSIVE ancestors(id, name, code, parent_id, level, unit_type, path, sort_order, is_active) AS (
        SELECT id, name, code, parent_id, level, unit_type, path, sort_order, is_active FROM units WHERE id = ?
        UNION ALL
        SELECT u.id, u.name, u.code, u.parent_id, u.level, u.unit_type, u.path, u.sort_order, u.is_active
        FROM units u JOIN ancestors a ON a.parent_id = u.id
      )
      SELECT * FROM ancestors ORDER BY level
    `).all(id);
  },

  getDescendants(id) {
    return db.prepare(`
      WITH RECURSIVE descendants(id, name, code, parent_id, level, unit_type, path, sort_order, is_active) AS (
        SELECT id, name, code, parent_id, level, unit_type, path, sort_order, is_active FROM units WHERE parent_id = ?
        UNION ALL
        SELECT u.id, u.name, u.code, u.parent_id, u.level, u.unit_type, u.path, u.sort_order, u.is_active
        FROM units u JOIN descendants d ON u.parent_id = d.id
      )
      SELECT * FROM descendants ORDER BY level, sort_order, name
    `).all(id);
  },

  create(data) {
    const parentId = normalizeParentId(data.parent_id);
    const level = resolveLevel(parentId);
    const unitType = normalizeUnitType(data.unit_type, level);
    const stmt = db.prepare('INSERT INTO units (name, code, parent_id, level, unit_type, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)');
    const result = stmt.run(data.name, cleanOptional(data.code), parentId, level, unitType, Number(data.sort_order) || 0);
    updatePath(result.lastInsertRowid);
    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const parentId = normalizeParentId(data.parent_id);
    assertNotMovingIntoDescendant(id, parentId);
    const level = resolveLevel(parentId);
    const unitType = normalizeUnitType(data.unit_type, level);
    const stmt = db.prepare('UPDATE units SET name = ?, code = ?, parent_id = ?, level = ?, unit_type = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(data.name, cleanOptional(data.code), parentId, level, unitType, Number(data.sort_order) || 0, id);
    rebuildPathsForSubtree(id);
    return this.getById(id);
  },

  move(id, parentId) {
    const unit = this.getById(id);
    if (!unit) throw new Error('Đơn vị không tồn tại');
    return this.update(id, { ...unit, parent_id: parentId });
  },

  remove(id) {
    assertUnitCanBeRemoved(id);
    db.prepare('UPDATE units SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return { success: true };
  },

  rebuildPaths() {
    db.prepare('SELECT id FROM units WHERE parent_id IS NULL ORDER BY id').all().forEach(row => rebuildPathsForSubtree(row.id));
    return { success: true };
  },

  findOrCreatePath(names, warehouseLevel) {
    let parentId = null;
    let current = null;
    names.filter(name => String(name || '').trim()).slice(0, 6).forEach((name, index) => {
      const level = index + 1;
      current = findChildByName(parentId, name);
      if (!current) {
        current = this.create({
          name: String(name).trim(),
          parent_id: parentId,
          unit_type: level === warehouseLevel ? 'warehouse' : 'organization'
        });
      }
      parentId = current.id;
    });
    return current;
  }
};

function findChildByName(parentId, name) {
  const normalizedName = String(name || '').trim().toLowerCase();
  if (!parentId) {
    return db.prepare('SELECT * FROM units WHERE parent_id IS NULL AND lower(name) = ? AND COALESCE(is_active, 1) = 1').get(normalizedName);
  }
  return db.prepare('SELECT * FROM units WHERE parent_id = ? AND lower(name) = ? AND COALESCE(is_active, 1) = 1').get(parentId, normalizedName);
}

function cleanOptional(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeParentId(parentId) {
  const parsed = Number.parseInt(parentId, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveLevel(parentId) {
  if (!parentId) return 1;
  const parent = db.prepare('SELECT level FROM units WHERE id = ? AND COALESCE(is_active, 1) = 1').get(parentId);
  if (!parent) throw new Error('Đơn vị cha không tồn tại');
  if (parent.level >= 6) throw new Error('Không thể tạo quá 6 cấp');
  return parent.level + 1;
}

function normalizeUnitType(unitType, level) {
  const value = UNIT_TYPES.has(unitType) ? unitType : 'organization';
  return value;
}

function assertNotMovingIntoDescendant(id, parentId) {
  if (!parentId) return;
  if (Number(id) === Number(parentId)) throw new Error('Không thể chọn chính nó làm đơn vị cha');
  const descendants = unitQueries.getDescendants(id);
  if (descendants.some(item => Number(item.id) === Number(parentId))) throw new Error('Không thể chuyển đơn vị vào cây con của nó');
}

function assertUnitCanBeRemoved(id) {
  if (db.prepare('SELECT 1 FROM units WHERE parent_id = ? AND COALESCE(is_active, 1) = 1 LIMIT 1').get(id)) throw new Error('Không thể xóa đơn vị đang có cấp con');
  const tables = ['warehouses', 'cameras', 'fire_systems', 'constructions'];
  for (const table of tables) {
    if (db.prepare(`SELECT 1 FROM ${table} WHERE unit_id = ? OR parent_unit_id = ? OR child_unit_id = ? LIMIT 1`).get(id, id, id)) throw new Error('Không thể xóa đơn vị đang được sử dụng');
  }
}

function updatePath(id) {
  const ancestors = unitQueries.getAncestors(id);
  const path = `/${ancestors.map(unit => unit.id).join('/')}/`;
  db.prepare('UPDATE units SET path = ? WHERE id = ?').run(path, id);
}

function rebuildPathsForSubtree(id) {
  updatePath(id);
  unitQueries.getDescendants(id).forEach(unit => updatePath(unit.id));
}

function buildTree(items, parentId = null) {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
}

module.exports = unitQueries;
