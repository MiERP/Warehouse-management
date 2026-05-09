const db = require('../db');

const locationQueries = {
  // === PROVINCES ===
  getProvinces() {
    return db.prepare('SELECT * FROM provinces ORDER BY name').all();
  },

  createProvince(data) {
    const stmt = db.prepare('INSERT INTO provinces (name, code) VALUES (?, ?)');
    const result = stmt.run(data.name, data.code || null);
    return { id: result.lastInsertRowid, ...data };
  },

  updateProvince(id, data) {
    db.prepare('UPDATE provinces SET name = ?, code = ? WHERE id = ?').run(data.name, data.code || null, id);
    return { id, ...data };
  },

  deleteProvince(id) {
    db.prepare('DELETE FROM provinces WHERE id = ?').run(id);
    return { success: true };
  },

  // === WARDS ===
  getWardsByProvince(provinceId) {
    return db.prepare('SELECT * FROM wards WHERE province_id = ? ORDER BY name').all(provinceId);
  },

  createWard(data) {
    const stmt = db.prepare('INSERT INTO wards (name, province_id, code) VALUES (?, ?, ?)');
    const result = stmt.run(data.name, data.province_id, data.code || null);
    return { id: result.lastInsertRowid, ...data };
  },

  updateWard(id, data) {
    db.prepare('UPDATE wards SET name = ?, province_id = ?, code = ? WHERE id = ?')
      .run(data.name, data.province_id, data.code || null, id);
    return { id, ...data };
  },

  deleteWard(id) {
    db.prepare('DELETE FROM wards WHERE id = ?').run(id);
    return { success: true };
  }
};

module.exports = locationQueries;
