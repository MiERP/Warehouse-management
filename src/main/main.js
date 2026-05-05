const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./database/db');
const { runMigrations } = require('./database/migrations');

// Register all IPC handlers
const unitQueries = require('./database/queries/units');
const locationQueries = require('./database/queries/locations');
const warehouseQueries = require('./database/queries/warehouses');
const cameraQueries = require('./database/queries/cameras');
const fireSystemQueries = require('./database/queries/fire_systems');
const constructionQueries = require('./database/queries/constructions');
const catalogQueries = require('./database/queries/catalogs');
const fs = require('fs');
const XLSX = require('xlsx');
const smartSearch = require('./search/smart_search');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Warehouse Management',
    icon: path.join(__dirname, '../renderer/assets/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: true,
    backgroundColor: '#0F1923',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  runMigrations();

  // Register IPC handlers
  registerIpcHandlers();

  // Build lightweight smart-search index from current SQLite data
  try { smartSearch.rebuild(); } catch (e) { console.error('Smart search index error:', e); }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  db.close();
  if (process.platform !== 'darwin') app.quit();
});

function withSearchRebuild(operation) {
  const result = operation();
  try { smartSearch.rebuild(); } catch (e) { console.error('Smart search rebuild error:', e); }
  return result;
}

function registerIpcHandlers() {
  // === UNITS ===
  ipcMain.handle('units:getAll', () => unitQueries.getAll());
  ipcMain.handle('units:getTree', () => unitQueries.getTree());
  ipcMain.handle('units:create', (_, data) => unitQueries.create(data));
  ipcMain.handle('units:update', (_, id, data) => unitQueries.update(id, data));
  ipcMain.handle('units:delete', (_, id) => unitQueries.remove(id));

  // === LOCATIONS ===
  ipcMain.handle('locations:getProvinces', () => locationQueries.getProvinces());
  ipcMain.handle('locations:getWardsByProvince', (_, provinceId) => locationQueries.getWardsByProvince(provinceId));
  ipcMain.handle('locations:createProvince', (_, data) => locationQueries.createProvince(data));
  ipcMain.handle('locations:updateProvince', (_, id, data) => locationQueries.updateProvince(id, data));
  ipcMain.handle('locations:deleteProvince', (_, id) => locationQueries.deleteProvince(id));
  ipcMain.handle('locations:createWard', (_, data) => locationQueries.createWard(data));
  ipcMain.handle('locations:updateWard', (_, id, data) => locationQueries.updateWard(id, data));
  ipcMain.handle('locations:deleteWard', (_, id) => locationQueries.deleteWard(id));

  // === CATALOGS ===
  ipcMain.handle('catalogs:getAll', (_, tableName) => catalogQueries.getAll(tableName));
  ipcMain.handle('catalogs:create', (_, tableName, data) => catalogQueries.create(tableName, data));
  ipcMain.handle('catalogs:update', (_, tableName, id, data) => catalogQueries.update(tableName, id, data));
  ipcMain.handle('catalogs:delete', (_, tableName, id) => catalogQueries.remove(tableName, id));

  // === WAREHOUSES ===
  ipcMain.handle('warehouses:getAll', () => warehouseQueries.getAll());
  ipcMain.handle('warehouses:getById', (_, id) => warehouseQueries.getById(id));
  ipcMain.handle('warehouses:create', (_, data) => withSearchRebuild(() => warehouseQueries.create(data)));
  ipcMain.handle('warehouses:update', (_, id, data) => withSearchRebuild(() => warehouseQueries.update(id, data)));
  ipcMain.handle('warehouses:delete', (_, id) => withSearchRebuild(() => warehouseQueries.remove(id)));
  ipcMain.handle('warehouses:search', (_, query) => warehouseQueries.search(query));

  // === CAMERAS ===
  ipcMain.handle('cameras:getAll', () => cameraQueries.getAll());
  ipcMain.handle('cameras:getById', (_, id) => cameraQueries.getById(id));
  ipcMain.handle('cameras:create', (_, data) => withSearchRebuild(() => cameraQueries.create(data)));
  ipcMain.handle('cameras:update', (_, id, data) => withSearchRebuild(() => cameraQueries.update(id, data)));
  ipcMain.handle('cameras:delete', (_, id) => withSearchRebuild(() => cameraQueries.remove(id)));

  // === FIRE SYSTEMS ===
  ipcMain.handle('fireSystems:getAll', () => fireSystemQueries.getAll());
  ipcMain.handle('fireSystems:getById', (_, id) => fireSystemQueries.getById(id));
  ipcMain.handle('fireSystems:create', (_, data) => withSearchRebuild(() => fireSystemQueries.create(data)));
  ipcMain.handle('fireSystems:update', (_, id, data) => withSearchRebuild(() => fireSystemQueries.update(id, data)));
  ipcMain.handle('fireSystems:delete', (_, id) => withSearchRebuild(() => fireSystemQueries.remove(id)));

  // === CONSTRUCTIONS ===
  ipcMain.handle('constructions:getAll', () => constructionQueries.getAll());
  ipcMain.handle('constructions:getById', (_, id) => constructionQueries.getById(id));
  ipcMain.handle('constructions:create', (_, data) => withSearchRebuild(() => constructionQueries.create(data)));
  ipcMain.handle('constructions:update', (_, id, data) => withSearchRebuild(() => constructionQueries.update(id, data)));
  ipcMain.handle('constructions:delete', (_, id) => withSearchRebuild(() => constructionQueries.remove(id)));

  // === EXCEL IMPORT/EXPORT ===
  ipcMain.handle('dialog:openFile', async (_, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
    });
    return result;
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });
    return result;
  });

  ipcMain.handle('excel:read', (_, filePath) => {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  });

  ipcMain.handle('excel:write', (_, filePath, data, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
    XLSX.writeFile(wb, filePath);
    return { success: true };
  });

  // === STATS (Dashboard — redesigned) ===
  ipcMain.handle('stats:overview', () => {
    // Count by warehouse category
    const catData = db.prepare(`
      SELECT warehouse_category, COUNT(*) as count
      FROM warehouses GROUP BY warehouse_category
    `).all();
    const chiendich = catData.find(c => c.warehouse_category === 'chien_dich');
    const chienthuat = catData.find(c => c.warehouse_category === 'chien_thuat');

    const cc = db.prepare('SELECT COUNT(*) as count FROM cameras').get();
    const fc = db.prepare('SELECT COUNT(*) as count FROM fire_systems').get();
    const wc = db.prepare('SELECT COUNT(*) as count FROM warehouses').get();

    // Danh sách nhà kho theo phân loại kho
    const warehouseByType = db.prepare(`
      SELECT COALESCE(wt.name, 'Chưa phân loại') as type_name,
        COUNT(w.id) as count, SUM(w.warehouse_area) as total_area
      FROM warehouses w
      LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
      GROUP BY wt.id ORDER BY count DESC
    `).all();

    // Công trình theo năm hiện tại
    const currentYear = new Date().getFullYear();
    const constructionsByYear = db.prepare(`
      SELECT c.name, c.construction_type, c.status, c.year_completed,
        pu.name as parent_unit_name
      FROM constructions c
      LEFT JOIN units pu ON c.parent_unit_id = pu.id
      WHERE c.year_started <= ? AND (c.year_completed IS NULL OR c.year_completed >= ?)
      ORDER BY c.name
    `).all(currentYear, currentYear);

    // Cảnh báo: kho cần sửa chữa/nâng cấp (xây trước 10 năm, chưa sửa)
    const alertYear = currentYear - 10;
    const alerts = db.prepare(`
      SELECT w.name, w.year_built, w.year_renovated,
        pu.name as parent_unit_name, 'warehouse' as type
      FROM warehouses w
      LEFT JOIN units pu ON w.parent_unit_id = pu.id
      WHERE (w.year_built IS NOT NULL AND w.year_built <= ?
        AND (w.year_renovated IS NULL OR w.year_renovated <= ?))
      UNION ALL
      SELECT cu.name as name, f.year_installed as year_built,
        f.year_repaired as year_renovated,
        pu.name as parent_unit_name, 'fire_system' as type
      FROM fire_systems f
      LEFT JOIN units pu ON f.parent_unit_id = pu.id
      LEFT JOIN units cu ON f.child_unit_id = cu.id
      WHERE (f.year_installed IS NOT NULL AND f.year_installed <= ?
        AND (f.year_repaired IS NULL OR f.year_repaired <= ?))
      UNION ALL
      SELECT cu.name as name, c.year_installed as year_built,
        c.year_repaired as year_renovated,
        pu.name as parent_unit_name, 'camera' as type
      FROM cameras c
      LEFT JOIN units pu ON c.parent_unit_id = pu.id
      LEFT JOIN units cu ON c.child_unit_id = cu.id
      WHERE (c.year_installed IS NOT NULL AND c.year_installed <= ?
        AND (c.year_repaired IS NULL OR c.year_repaired <= ?))
      ORDER BY year_built ASC
    `).all(alertYear, alertYear, alertYear, alertYear, alertYear, alertYear);

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

  // === GLOBAL SEARCH ===
  ipcMain.handle('search:global', (_, query) => smartSearch.search(query));
  ipcMain.handle('search:smart', (_, query, options) => smartSearch.search(query, options));
  ipcMain.handle('search:rebuildIndex', () => smartSearch.rebuild());
}

