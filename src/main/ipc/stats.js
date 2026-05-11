const { ipcMain } = require("electron");
const db = require("../database/db");

module.exports = function register() {
  ipcMain.handle("stats:overview", () => {
    const chiendich = db.prepare("SELECT COUNT(*) as count FROM warehouses WHERE warehouse_category = ?").get("chien_dich");
    const chienthuat = db.prepare("SELECT COUNT(*) as count FROM warehouses WHERE warehouse_category = ?").get("chien_thuat");
    const cc = db.prepare("SELECT COUNT(*) as count FROM cameras").get();
    const fc = db.prepare("SELECT COUNT(*) as count FROM fire_systems").get();
    const wc = db.prepare("SELECT COUNT(*) as count FROM warehouses").get();

    const warehouseByType = db.prepare(`
      SELECT wt.id as type_id, COALESCE(wt.name, 'Chua phan loai') as type_name,
        COUNT(w.id) as count, SUM(w.warehouse_area) as total_area
      FROM warehouses w LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
      GROUP BY wt.id ORDER BY count DESC`).all();

    const currentYear = new Date().getFullYear();
    const constructionsByYear = db.prepare(`
      SELECT c.id, c.name, c.construction_type, c.status, c.year_started, c.year_completed,
        pu.name as parent_unit_name
      FROM constructions c LEFT JOIN units pu ON c.parent_unit_id = pu.id
      ORDER BY c.name`).all();

    const alertYear = currentYear - 10;
    const alerts = db.prepare(`
      SELECT w.name, w.year_built, w.year_renovated,
        pu.name as parent_unit_name, 'warehouse' as type
      FROM warehouses w LEFT JOIN units pu ON w.parent_unit_id = pu.id
      WHERE (w.year_built IS NOT NULL AND w.year_built <= ?
        AND (w.year_renovated IS NULL OR w.year_renovated <= ?))
      UNION ALL
      SELECT cu.name as name, f.year_installed as year_built,
        f.year_repaired as year_renovated,
        pu.name as parent_unit_name, 'fire_system' as type
      FROM fire_systems f LEFT JOIN units pu ON f.parent_unit_id = pu.id
      LEFT JOIN units cu ON f.child_unit_id = cu.id
      WHERE (f.year_installed IS NOT NULL AND f.year_installed <= ?
        AND (f.year_repaired IS NULL OR f.year_repaired <= ?))
      UNION ALL
      SELECT cu.name as name, c.year_installed as year_built,
        c.year_repaired as year_renovated,
        pu.name as parent_unit_name, 'camera' as type
      FROM cameras c LEFT JOIN units pu ON c.parent_unit_id = pu.id
      LEFT JOIN units cu ON c.child_unit_id = cu.id
      WHERE (c.year_installed IS NOT NULL AND c.year_installed <= ?
        AND (c.year_repaired IS NULL OR c.year_repaired <= ?))
      ORDER BY year_built ASC`).all(alertYear, alertYear, alertYear, alertYear, alertYear, alertYear);

    return {
      warehousesTotal: wc.count,
      khoChienDich: chiendich ? chiendich.count : 0,
      khoChienThuat: chienthuat ? chienthuat.count : 0,
      cameras: cc.count,
      fireSystems: fc.count,
      warehouseByType,
      constructionsByYear,
      alerts
    };
  });
};