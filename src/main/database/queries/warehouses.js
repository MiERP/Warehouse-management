const db = require('../db');

const warehouseQueries = {
  getAll() {
    return db.prepare(`
      SELECT w.*,
        pu.name as parent_unit_name,
        cu.name as child_unit_name,
        p.name as province_name,
        wd.name as ward_name,
        wt.name as warehouse_type_name,
        gt.name as goods_type_name,
        qg.name as quality_grade_name
      FROM warehouses w
      LEFT JOIN units pu ON w.parent_unit_id = pu.id
      LEFT JOIN units cu ON w.child_unit_id = cu.id
      LEFT JOIN provinces p ON w.province_id = p.id
      LEFT JOIN wards wd ON w.ward_id = wd.id
      LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
      LEFT JOIN goods_types gt ON w.goods_type_id = gt.id
      LEFT JOIN quality_grades qg ON w.quality_grade_id = qg.id
      ORDER BY pu.name, cu.name, w.name
    `).all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO warehouses (name, parent_unit_id, child_unit_id, province_id, ward_id,
        address, warehouse_category, quantity, land_area, warehouse_area, warehouse_land_area,
        year_built, year_renovated, warehouse_type_id, renovation_potential,
        storage_capacity, current_stock, goods_type_id, quality_grade_id,
        quality_grade_23_area, quality_grade_4_area, temp_house_area,
        lightning_grade_area, lightning_existing_count, fire_need, fire_existing, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name, data.parent_unit_id, data.child_unit_id, data.province_id, data.ward_id,
      data.address, data.warehouse_category, data.quantity, data.land_area, data.warehouse_area,
      data.warehouse_land_area, data.year_built, data.year_renovated, data.warehouse_type_id,
      data.renovation_potential, data.storage_capacity, data.current_stock, data.goods_type_id,
      data.quality_grade_id, data.quality_grade_23_area, data.quality_grade_4_area,
      data.temp_house_area, data.lightning_grade_area, data.lightning_existing_count,
      data.fire_need, data.fire_existing, data.notes
    );
    return { id: result.lastInsertRowid, ...data };
  },

  update(id, data) {
    db.prepare(`
      UPDATE warehouses SET name=?, parent_unit_id=?, child_unit_id=?, province_id=?, ward_id=?,
        address=?, warehouse_category=?, quantity=?, land_area=?, warehouse_area=?,
        warehouse_land_area=?, year_built=?, year_renovated=?, warehouse_type_id=?,
        renovation_potential=?, storage_capacity=?, current_stock=?, goods_type_id=?,
        quality_grade_id=?, quality_grade_23_area=?, quality_grade_4_area=?, temp_house_area=?,
        lightning_grade_area=?, lightning_existing_count=?, fire_need=?, fire_existing=?, notes=?
      WHERE id=?
    `).run(
      data.name, data.parent_unit_id, data.child_unit_id, data.province_id, data.ward_id,
      data.address, data.warehouse_category, data.quantity, data.land_area, data.warehouse_area,
      data.warehouse_land_area, data.year_built, data.year_renovated, data.warehouse_type_id,
      data.renovation_potential, data.storage_capacity, data.current_stock, data.goods_type_id,
      data.quality_grade_id, data.quality_grade_23_area, data.quality_grade_4_area,
      data.temp_house_area, data.lightning_grade_area, data.lightning_existing_count,
      data.fire_need, data.fire_existing, data.notes, id
    );
    return { id, ...data };
  },

  remove(id) {
    db.prepare('DELETE FROM warehouses WHERE id = ?').run(id);
    return { success: true };
  },

  search(query) {
    const q = `%${query}%`;
    return db.prepare(`
      SELECT w.*, pu.name as parent_unit_name, cu.name as child_unit_name
      FROM warehouses w
      LEFT JOIN units pu ON w.parent_unit_id = pu.id
      LEFT JOIN units cu ON w.child_unit_id = cu.id
      WHERE w.name LIKE ? OR pu.name LIKE ? OR cu.name LIKE ?
      ORDER BY w.name
    `).all(q, q, q);
  },

  // Thống kê theo category (chiến dịch / chiến thuật)
  countByCategory() {
    return db.prepare(`
      SELECT warehouse_category, COUNT(*) as count
      FROM warehouses
      GROUP BY warehouse_category
    `).all();
  },

  // Danh sách theo phân loại kho
  getByWarehouseType() {
    return db.prepare(`
      SELECT wt.name as type_name, COUNT(w.id) as count,
        SUM(w.warehouse_area) as total_area
      FROM warehouse_types wt
      LEFT JOIN warehouses w ON w.warehouse_type_id = wt.id
      GROUP BY wt.id, wt.name
      ORDER BY count DESC
    `).all();
  }
};

module.exports = warehouseQueries;
