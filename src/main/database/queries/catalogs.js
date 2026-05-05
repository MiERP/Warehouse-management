const db = require('../db');

// Allowed table names to prevent SQL injection
const ALLOWED_TABLES = ['warehouse_types', 'goods_types', 'quality_grades', 'lightning_protection'];

function validateTable(tableName) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
}

const catalogQueries = {
  getAll(tableName) {
    validateTable(tableName);
    return db.prepare(`SELECT * FROM ${tableName} ORDER BY name`).all();
  },

  create(tableName, data) {
    validateTable(tableName);
    const stmt = db.prepare(`INSERT INTO ${tableName} (name, description) VALUES (?, ?)`);
    const result = stmt.run(data.name, data.description || '');
    return { id: result.lastInsertRowid, ...data };
  },

  update(tableName, id, data) {
    validateTable(tableName);
    db.prepare(`UPDATE ${tableName} SET name = ?, description = ? WHERE id = ?`)
      .run(data.name, data.description || '', id);
    return { id, ...data };
  },

  remove(tableName, id) {
    validateTable(tableName);
    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
    return { success: true };
  }
};

module.exports = catalogQueries;
