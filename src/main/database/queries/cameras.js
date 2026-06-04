const db = require('../db');

const cameraQueries = {
  getAll() {
    return db.prepare(`
      SELECT c.*,
        COALESCE(u.name, cu.name) as unit_name,
        COALESCE(pu.name, up.name) as parent_unit_name,
        cu.name as child_unit_name
      FROM cameras c
      LEFT JOIN units u ON c.unit_id = u.id
      LEFT JOIN units up ON u.parent_id = up.id
      LEFT JOIN units pu ON c.parent_unit_id = pu.id
      LEFT JOIN units cu ON c.child_unit_id = cu.id
      ORDER BY COALESCE(up.name, pu.name), COALESCE(u.name, cu.name)
    `).all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO cameras (unit_id, parent_unit_id, child_unit_id, unit_measure, quantity,
        year_installed, year_repaired, screen_count, camera_count,
        investor, status, repair_need, new_install_need, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.unit_id || data.child_unit_id || data.parent_unit_id || null, data.parent_unit_id, data.child_unit_id, data.unit_measure, data.quantity,
      data.year_installed, data.year_repaired, data.screen_count, data.camera_count,
      data.investor, data.status, data.repair_need, data.new_install_need, data.notes
    );
    return { id: result.lastInsertRowid, ...data };
  },

  update(id, data) {
    db.prepare(`
      UPDATE cameras SET unit_id=?, parent_unit_id=?, child_unit_id=?, unit_measure=?, quantity=?,
        year_installed=?, year_repaired=?, screen_count=?, camera_count=?,
        investor=?, status=?, repair_need=?, new_install_need=?, notes=?
      WHERE id=?
    `).run(
      data.unit_id || data.child_unit_id || data.parent_unit_id || null, data.parent_unit_id, data.child_unit_id, data.unit_measure, data.quantity,
      data.year_installed, data.year_repaired, data.screen_count, data.camera_count,
      data.investor, data.status, data.repair_need, data.new_install_need, data.notes, id
    );
    return { id, ...data };
  },

  remove(id) {
    db.prepare('DELETE FROM cameras WHERE id = ?').run(id);
    return { success: true };
  }
};

module.exports = cameraQueries;
