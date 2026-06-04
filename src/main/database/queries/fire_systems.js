const db = require('../db');

const fireSystemQueries = {
  getAll() {
    return db.prepare(`
      SELECT f.*, COALESCE(u.name, cu.name) as unit_name, COALESCE(pu.name, up.name) as parent_unit_name, cu.name as child_unit_name
      FROM fire_systems f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN units up ON u.parent_id = up.id
      LEFT JOIN units pu ON f.parent_unit_id = pu.id
      LEFT JOIN units cu ON f.child_unit_id = cu.id
      ORDER BY COALESCE(up.name, pu.name), COALESCE(u.name, cu.name)
    `).all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM fire_systems WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO fire_systems (unit_id, parent_unit_id, child_unit_id, unit_measure, equipment_type,
        quantity, year_installed, year_repaired, pump_house_count, hydrant_count,
        investor, status, repair_need, new_install_need, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const r = stmt.run(
      data.unit_id || data.child_unit_id || data.parent_unit_id || null, data.parent_unit_id, data.child_unit_id, data.unit_measure, data.equipment_type,
      data.quantity, data.year_installed, data.year_repaired, data.pump_house_count,
      data.hydrant_count, data.investor, data.status, data.repair_need,
      data.new_install_need, data.notes
    );
    return { id: r.lastInsertRowid, ...data };
  },

  update(id, data) {
    db.prepare(`
      UPDATE fire_systems SET unit_id=?, parent_unit_id=?, child_unit_id=?, unit_measure=?, equipment_type=?,
        quantity=?, year_installed=?, year_repaired=?, pump_house_count=?, hydrant_count=?,
        investor=?, status=?, repair_need=?, new_install_need=?, notes=?
      WHERE id=?
    `).run(
      data.unit_id || data.child_unit_id || data.parent_unit_id || null, data.parent_unit_id, data.child_unit_id, data.unit_measure, data.equipment_type,
      data.quantity, data.year_installed, data.year_repaired, data.pump_house_count,
      data.hydrant_count, data.investor, data.status, data.repair_need,
      data.new_install_need, data.notes, id
    );
    return { id, ...data };
  },

  remove(id) {
    db.prepare('DELETE FROM fire_systems WHERE id = ?').run(id);
    return { success: true };
  }
};

module.exports = fireSystemQueries;
