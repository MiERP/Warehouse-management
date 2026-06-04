const db = require('../main/database/db');
const { runMigrations } = require('../main/database/migrations');
const units = require('../main/database/queries/units');
const locations = require('../main/database/queries/locations');
const catalogs = require('../main/database/queries/catalogs');
const warehouses = require('../main/database/queries/warehouses');
const cameras = require('../main/database/queries/cameras');
const fireSystems = require('../main/database/queries/fire_systems');
const constructions = require('../main/database/queries/constructions');
const smartSearch = require('../main/search/smart_search');
const { listMigrations } = require('../main/database/hardening_migrations');
const { listAudit, writeAudit } = require('../main/audit');
const duplicateService = require('../main/duplicates');
const validator = require('../main/validation');

const DEFAULT_PASSWORD = '123456';
const LICENSE_KEY = '20261231';

function parseLicenseKey(key) {
  if (!key || key.length !== 8 || !/^\d{8}$/.test(key)) return null;
  const year = parseInt(key.slice(0, 4), 10);
  const month = parseInt(key.slice(4, 6), 10) - 1;
  const day = parseInt(key.slice(6, 8), 10);
  const expiry = new Date(year, month, day);
  if (expiry.getFullYear() !== year || expiry.getMonth() !== month || expiry.getDate() !== day) return null;
  return expiry;
}

function checkLicense() {
  const expiry = parseLicenseKey(LICENSE_KEY);
  if (!expiry) return { valid: false, daysLeft: 0, reason: 'License key khong hop le' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry - today) / 86400000);
  if (daysLeft < 0) return { valid: false, daysLeft, reason: 'License da het han ngay ' + expiry.toLocaleDateString('vi-VN') };
  return { valid: true, daysLeft };
}

function authenticate(sessionInfo) {
  const nextSession = sessionInfo || {};
  if (nextSession.password !== DEFAULT_PASSWORD) {
    throw new Error('Mat khau khong dung');
  }
  return {
    ...nextSession,
    license: checkLicense(),
    theme: nextSession.theme || 'dark',
    userName: nextSession.userName || 'Admin'
  };
}

function overview() {
  const chiendich = db.prepare('SELECT COUNT(*) as count FROM warehouses WHERE warehouse_category = ?').get('chien_dich');
  const chienthuat = db.prepare('SELECT COUNT(*) as count FROM warehouses WHERE warehouse_category = ?').get('chien_thuat');
  const cc = db.prepare('SELECT COUNT(*) as count FROM cameras').get();
  const fc = db.prepare('SELECT COUNT(*) as count FROM fire_systems').get();
  const wc = db.prepare('SELECT COUNT(*) as count FROM warehouses').get();
  const warehouseByType = db.prepare(`
    SELECT wt.id as type_id, COALESCE(wt.name, 'Chua phan loai') as type_name,
      COUNT(w.id) as count, SUM(w.warehouse_area) as total_area
    FROM warehouses w LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
    GROUP BY wt.id ORDER BY count DESC`).all();
  const constructionsByYear = db.prepare(`
    SELECT c.id, c.name, c.construction_type, c.status, c.year_started, c.year_completed,
      pu.name as parent_unit_name
    FROM constructions c LEFT JOIN units pu ON c.parent_unit_id = pu.id
    ORDER BY c.name`).all();
  const currentYear = new Date().getFullYear();
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
}

function makeCrud(moduleName, queries, validate) {
  return {
    getAll: () => queries.getAll(),
    getById: (id) => queries.getById(id),
    create: (data) => {
      const payload = validate ? validate(data) : data;
      const result = queries.create(payload);
      writeAudit({ module: moduleName, action: 'create', recordId: result.id, after: payload });
      return result;
    },
    update: (id, data) => {
      const before = queries.getById(id);
      const payload = validate ? validate(data) : data;
      const result = queries.update(id, payload);
      writeAudit({ module: moduleName, action: 'update', recordId: id, before, after: payload });
      return result;
    },
    delete: (id) => {
      const before = queries.getById(id);
      queries.remove(id);
      writeAudit({ module: moduleName, action: 'delete', recordId: id, before });
      return { success: true };
    }
  };
}

runMigrations();

module.exports = {
  authenticate,
  units: {
    getAll: () => units.getAll(),
    getTree: () => units.getTree(),
    create: (data) => units.create(data),
    update: (id, data) => units.update(id, data),
    delete: (id) => units.remove(id)
  },
  locations,
  catalogs,
  warehouses: {
    ...makeCrud('warehouses', warehouses, validator.warehouses),
    search: (query) => warehouses.search(query)
  },
  cameras: makeCrud('cameras', cameras, validator.cameras),
  fireSystems: makeCrud('fireSystems', fireSystems, validator.fireSystems),
  constructions: makeCrud('constructions', constructions, validator.constructions),
  stats: { overview },
  search: {
    global: (query) => smartSearch.search(query),
    smart: (query, options) => smartSearch.search(query, options),
    rebuildIndex: () => smartSearch.rebuild()
  },
  system: { migrations: () => listMigrations() },
  audit: { list: (limit) => listAudit(limit) },
  duplicates: { review: () => duplicateService.reviewDuplicates() }
};
