const db = require('../db');

const unitQueries = {
  getAll() {
    return db.prepare('SELECT * FROM units ORDER BY level, name').all();
  },

  getTree() {
    const all = db.prepare('SELECT * FROM units ORDER BY level, name').all();
    return buildTree(all);
  },

  getChildren(parentId) {
    return db.prepare('SELECT * FROM units WHERE parent_id = ? ORDER BY name').all(parentId);
  },

  create(data) {
    const stmt = db.prepare('INSERT INTO units (name, parent_id, level) VALUES (?, ?, ?)');
    const level = data.parent_id ? getLevel(data.parent_id) + 1 : 0;
    const result = stmt.run(data.name, data.parent_id || null, level);
    return { id: result.lastInsertRowid, ...data, level };
  },

  update(id, data) {
    const level = data.parent_id ? getLevel(data.parent_id) + 1 : 0;
    const stmt = db.prepare('UPDATE units SET name = ?, parent_id = ?, level = ? WHERE id = ?');
    stmt.run(data.name, data.parent_id || null, level, id);
    return { id, ...data, level };
  },

  remove(id) {
    // Set children's parent to null before deleting
    db.prepare('UPDATE units SET parent_id = NULL WHERE parent_id = ?').run(id);
    db.prepare('DELETE FROM units WHERE id = ?').run(id);
    return { success: true };
  }
};

function getLevel(parentId) {
  const parent = db.prepare('SELECT level FROM units WHERE id = ?').get(parentId);
  return parent ? parent.level : -1;
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
