const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./database/db');
const { runMigrations } = require('./database/migrations');
const { runHardeningMigrations, listMigrations } = require('./database/hardening_migrations');

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
const validators = require('./validation');
const { writeAudit, listAudit } = require('./audit');
const backupService = require('./backup');
const duplicateService = require('./duplicates');
const documentService = require('./documents');
const { rememberDialogResult, assertAllowedPath } = require('./file_guard');

let mainWindow;
let loginWindow;
let currentSession = null;

const DEFAULT_PASSWORD = '123456';
const LICENSE_KEY = '20260731'; // YYYYMMDD - han su dung den ngay nay

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

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: true,
    backgroundColor: '#0F1923',
    title: 'Ðang nh?p — Warehouse Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  loginWindow.loadFile(path.join(__dirname, '../renderer/login.html'));

  if (process.argv.includes('--dev')) {
    loginWindow.webContents.openDevTools();
  }

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createWindow(sessionInfo) {
  currentSession = sessionInfo;

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
    // Send session info to renderer
    mainWindow.webContents.send('session:info', sessionInfo);
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
  runHardeningMigrations();

  // Register IPC handlers
  registerIpcHandlers();

  // Build lightweight smart-search index from current SQLite data
  try { smartSearch.rebuild(); } catch (e) { console.error('Smart search index error:', e); }

  // Show login window first
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
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

function withValidatedChange({ moduleName, action, id = null, data = null, validator, getById, operation }) {
  const before = id && getById ? getById(id) : null;
  const payload = data && validator ? validator(data) : data;
  const result = withSearchRebuild(() => operation(payload));
  const recordId = id || result?.id || null;
  const after = recordId && getById ? getById(recordId) : result;
  writeAudit({ module: moduleName, action, recordId, before, after, metadata: currentSession ? { actor: currentSession.userName, unit: currentSession.unitName } : null });
  return result;
}

// === LOGIN IPC ===
ipcMain.handle('login:authenticate', async (event, sessionInfo) => {
  const loginWin = BrowserWindow.fromWebContents(event.sender);
  if (!sessionInfo || !sessionInfo.unitName || !sessionInfo.userName) {
    throw new Error('Thi?u thông tin dang nh?p');
  }

  // License check on server side
  const license = checkLicense();
  if (!license.valid) {
    throw new Error(license.reason || 'License da het han hoac khong hop le');
  }

  // Close login window and create main window
  if (loginWin) loginWin.close();

  createWindow(sessionInfo);
  return { success: true };
});

// === LOGOUT IPC ===
ipcMain.handle('app:logout', async () => {
  currentSession = null;
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  createLoginWindow();
  return { success: true };
});

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
  ipcMain.handle('warehouses:create', (_, data) => withValidatedChange({ moduleName: 'warehouses', action: 'create', data, validator: validators.warehouses, getById: warehouseQueries.getById, operation: payload => warehouseQueries.create(payload) }));
  ipcMain.handle('warehouses:update', (_, id, data) => withValidatedChange({ moduleName: 'warehouses', action: 'update', id, data, validator: validators.warehouses, getById: warehouseQueries.getById, operation: payload => warehouseQueries.update(id, payload) }));
  ipcMain.handle('warehouses:delete', (_, id) => withValidatedChange({ moduleName: 'warehouses', action: 'delete', id, getById: warehouseQueries.getById, operation: () => warehouseQueries.remove(id) }));
  ipcMain.handle('warehouses:search', (_, query) => warehouseQueries.search(query));

  // === CAMERAS ===
  ipcMain.handle('cameras:getAll', () => cameraQueries.getAll());
  ipcMain.handle('cameras:getById', (_, id) => cameraQueries.getById(id));
  ipcMain.handle('cameras:create', (_, data) => withValidatedChange({ moduleName: 'cameras', action: 'create', data, validator: validators.cameras, getById: cameraQueries.getById, operation: payload => cameraQueries.create(payload) }));
  ipcMain.handle('cameras:update', (_, id, data) => withValidatedChange({ moduleName: 'cameras', action: 'update', id, data, validator: validators.cameras, getById: cameraQueries.getById, operation: payload => cameraQueries.update(id, payload) }));
  ipcMain.handle('cameras:delete', (_, id) => withValidatedChange({ moduleName: 'cameras', action: 'delete', id, getById: cameraQueries.getById, operation: () => cameraQueries.remove(id) }));

  // === FIRE SYSTEMS ===
  ipcMain.handle('fireSystems:getAll', () => fireSystemQueries.getAll());
  ipcMain.handle('fireSystems:getById', (_, id) => fireSystemQueries.getById(id));
  ipcMain.handle('fireSystems:create', (_, data) => withValidatedChange({ moduleName: 'fireSystems', action: 'create', data, validator: validators.fireSystems, getById: fireSystemQueries.getById, operation: payload => fireSystemQueries.create(payload) }));
  ipcMain.handle('fireSystems:update', (_, id, data) => withValidatedChange({ moduleName: 'fireSystems', action: 'update', id, data, validator: validators.fireSystems, getById: fireSystemQueries.getById, operation: payload => fireSystemQueries.update(id, payload) }));
  ipcMain.handle('fireSystems:delete', (_, id) => withValidatedChange({ moduleName: 'fireSystems', action: 'delete', id, getById: fireSystemQueries.getById, operation: () => fireSystemQueries.remove(id) }));

  // === CONSTRUCTIONS ===
  ipcMain.handle('constructions:getAll', () => constructionQueries.getAll());
  ipcMain.handle('constructions:getById', (_, id) => constructionQueries.getById(id));
  ipcMain.handle('constructions:create', (_, data) => withValidatedChange({ moduleName: 'constructions', action: 'create', data, validator: validators.constructions, getById: constructionQueries.getById, operation: payload => constructionQueries.create(payload) }));
  ipcMain.handle('constructions:update', (_, id, data) => withValidatedChange({ moduleName: 'constructions', action: 'update', id, data, validator: validators.constructions, getById: constructionQueries.getById, operation: payload => constructionQueries.update(id, payload) }));
  ipcMain.handle('constructions:delete', (_, id) => withValidatedChange({ moduleName: 'constructions', action: 'delete', id, getById: constructionQueries.getById, operation: () => constructionQueries.remove(id) }));

  // === EXCEL IMPORT/EXPORT ===
  ipcMain.handle('dialog:openFile', async (_, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
    });
    return rememberDialogResult(result);
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });
    return rememberDialogResult(result);
  });

  ipcMain.handle('excel:read', (_, filePath) => {
    const safePath = assertAllowedPath(filePath, ['xlsx', 'xls']);
    const workbook = XLSX.readFile(safePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  });

  ipcMain.handle('excel:readWorkbook', (_, filePath) => {
    const safePath = assertAllowedPath(filePath, ['xlsx', 'xls']);
    const workbook = XLSX.readFile(safePath);
    const sheets = {};
    workbook.SheetNames.forEach(name => {
      sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' });
    });
    return { sheetNames: workbook.SheetNames, sheets };
  });

  ipcMain.handle('excel:write', (_, filePath, data, sheetName) => {
    const safePath = assertAllowedPath(filePath, ['xlsx']);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
    XLSX.writeFile(wb, safePath);
    writeAudit({ module: 'excel', action: 'export', metadata: { filePath: safePath, sheetName, rows: Array.isArray(data) ? data.length : 0 } });
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

    // Danh sách nhà kho theo phân lo?i kho
    const warehouseByType = db.prepare(`
      SELECT wt.id as type_id, COALESCE(wt.name, 'Chua phân lo?i') as type_name,
        COUNT(w.id) as count, SUM(w.warehouse_area) as total_area
      FROM warehouses w
      LEFT JOIN warehouse_types wt ON w.warehouse_type_id = wt.id
      GROUP BY wt.id ORDER BY count DESC
    `).all();

    // Danh sách công trình cho dashboard: l?y toàn b? d? l?c theo tr?ng thái/don v?/nam/lo?i t?i UI
    const currentYear = new Date().getFullYear();
    const constructionsByYear = db.prepare(`
      SELECT c.id, c.name, c.construction_type, c.status, c.year_started, c.year_completed,
        pu.name as parent_unit_name
      FROM constructions c
      LEFT JOIN units pu ON c.parent_unit_id = pu.id
      ORDER BY c.name
    `).all();

    // C?nh báo: kho c?n s?a ch?a/nâng c?p (xây tru?c 10 nam, chua s?a)
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
  ipcMain.handle('system:migrations', () => listMigrations());
  ipcMain.handle('audit:list', (_, limit) => listAudit(limit));
  ipcMain.handle('duplicates:review', () => duplicateService.reviewDuplicates());


  // === DOCUMENTS ===
  ipcMain.handle('documents:list', (_, filters) => documentService.listDocuments(filters || {}));
  ipcMain.handle('documents:getById', (_, id) => documentService.getDocument(id));
  ipcMain.handle('documents:createFromFile', (_, filePath, metadata) => documentService.createDocumentFromFile(assertAllowedPath(filePath, documentService.ALLOWED_EXTENSIONS), metadata || {}));
  ipcMain.handle('documents:update', (_, id, metadata) => documentService.updateDocument(id, metadata || {}));
  ipcMain.handle('documents:delete', (_, id) => documentService.deleteDocument(id));
  ipcMain.handle('documents:listLinks', (_, documentId) => documentService.listLinks(documentId));
  ipcMain.handle('documents:listLinkableRecords', (_, entityType, query) => documentService.listLinkableRecords(entityType, query));
  ipcMain.handle('documents:link', (_, documentId, entityType, entityId, relationType, note) => documentService.linkDocument(documentId, entityType, entityId, relationType, note));
  ipcMain.handle('documents:unlink', (_, linkId) => documentService.unlinkDocument(linkId));
  ipcMain.handle('documents:listForEntity', (_, entityType, entityId) => documentService.listDocumentsForEntity(entityType, entityId));
  ipcMain.handle('documents:open', (_, id) => documentService.openDocument(id));
  ipcMain.handle('documents:reveal', (_, id) => documentService.revealDocument(id));
  // === BACKUP / RESTORE ===
  ipcMain.handle('backup:create', () => backupService.createBackup());
  ipcMain.handle('backup:list', (_, limit) => backupService.listBackups(limit));
  ipcMain.handle('backup:restore', (_, filePath) => backupService.restoreBackup(assertAllowedPath(filePath, ['db'])));
}




