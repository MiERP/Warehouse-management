const { contextBridge, ipcRenderer } = require('electron');

// === LOGIN API (for login window) ===
contextBridge.exposeInMainWorld('loginApi', {
  authenticate: (sessionInfo) => ipcRenderer.invoke('login:authenticate', sessionInfo)
});

// === MAIN APP API ===
contextBridge.exposeInMainWorld('api', {
  // === UNITS ===
  units: {
    getAll: () => ipcRenderer.invoke('units:getAll'),
    getTree: () => ipcRenderer.invoke('units:getTree'),
    getById: (id) => ipcRenderer.invoke('units:getById', id),
    getChildren: (parentId) => ipcRenderer.invoke('units:getChildren', parentId),
    getByLevel: (level) => ipcRenderer.invoke('units:getByLevel', level),
    getAncestors: (id) => ipcRenderer.invoke('units:getAncestors', id),
    getDescendants: (id) => ipcRenderer.invoke('units:getDescendants', id),
    create: (data) => ipcRenderer.invoke('units:create', data),
    update: (id, data) => ipcRenderer.invoke('units:update', id, data),
    move: (id, parentId) => ipcRenderer.invoke('units:move', id, parentId),
    findOrCreatePath: (names, warehouseLevel) => ipcRenderer.invoke('units:findOrCreatePath', names, warehouseLevel),
    delete: (id) => ipcRenderer.invoke('units:delete', id)
  },

  // === LOCATIONS ===
  locations: {
    getProvinces: () => ipcRenderer.invoke('locations:getProvinces'),
    getWardsByProvince: (provinceId) => ipcRenderer.invoke('locations:getWardsByProvince', provinceId),
    createProvince: (data) => ipcRenderer.invoke('locations:createProvince', data),
    updateProvince: (id, data) => ipcRenderer.invoke('locations:updateProvince', id, data),
    deleteProvince: (id) => ipcRenderer.invoke('locations:deleteProvince', id),
    createWard: (data) => ipcRenderer.invoke('locations:createWard', data),
    updateWard: (id, data) => ipcRenderer.invoke('locations:updateWard', id, data),
    deleteWard: (id) => ipcRenderer.invoke('locations:deleteWard', id)
  },

  // === CATALOGS (generic) ===
  catalogs: {
    getAll: (tableName) => ipcRenderer.invoke('catalogs:getAll', tableName),
    create: (tableName, data) => ipcRenderer.invoke('catalogs:create', tableName, data),
    update: (tableName, id, data) => ipcRenderer.invoke('catalogs:update', tableName, id, data),
    delete: (tableName, id) => ipcRenderer.invoke('catalogs:delete', tableName, id)
  },

  // === WAREHOUSES ===
  warehouses: {
    getAll: () => ipcRenderer.invoke('warehouses:getAll'),
    getById: (id) => ipcRenderer.invoke('warehouses:getById', id),
    create: (data) => ipcRenderer.invoke('warehouses:create', data),
    update: (id, data) => ipcRenderer.invoke('warehouses:update', id, data),
    delete: (id) => ipcRenderer.invoke('warehouses:delete', id),
    search: (query) => ipcRenderer.invoke('warehouses:search', query)
  },

  // === CAMERAS ===
  cameras: {
    getAll: () => ipcRenderer.invoke('cameras:getAll'),
    getById: (id) => ipcRenderer.invoke('cameras:getById', id),
    create: (data) => ipcRenderer.invoke('cameras:create', data),
    update: (id, data) => ipcRenderer.invoke('cameras:update', id, data),
    delete: (id) => ipcRenderer.invoke('cameras:delete', id)
  },

  // === FIRE SYSTEMS ===
  fireSystems: {
    getAll: () => ipcRenderer.invoke('fireSystems:getAll'),
    getById: (id) => ipcRenderer.invoke('fireSystems:getById', id),
    create: (data) => ipcRenderer.invoke('fireSystems:create', data),
    update: (id, data) => ipcRenderer.invoke('fireSystems:update', id, data),
    delete: (id) => ipcRenderer.invoke('fireSystems:delete', id)
  },

  // === CONSTRUCTIONS ===
  constructions: {
    getAll: () => ipcRenderer.invoke('constructions:getAll'),
    getById: (id) => ipcRenderer.invoke('constructions:getById', id),
    create: (data) => ipcRenderer.invoke('constructions:create', data),
    update: (id, data) => ipcRenderer.invoke('constructions:update', id, data),
    delete: (id) => ipcRenderer.invoke('constructions:delete', id)
  },

  // === DIALOGS ===
  dialog: {
    openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
    saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName)
  },

  // === EXCEL ===
  excel: {
    read: (filePath) => ipcRenderer.invoke('excel:read', filePath),
    write: (filePath, data, sheetName) => ipcRenderer.invoke('excel:write', filePath, data, sheetName),
    readWorkbook: (filePath) => ipcRenderer.invoke('excel:readWorkbook', filePath)
  },

  // === STATS ===
  stats: {
    overview: () => ipcRenderer.invoke('stats:overview')
  },

  // === GLOBAL SEARCH ===
  search: {
    global: (query) => ipcRenderer.invoke('search:global', query),
    smart: (query, options) => ipcRenderer.invoke('search:smart', query, options),
    rebuildIndex: () => ipcRenderer.invoke('search:rebuildIndex')
  },

  // === BACKUP / RESTORE ===
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: (filePath) => ipcRenderer.invoke('backup:restore', filePath),
    list: (limit) => ipcRenderer.invoke('backup:list', limit)
  },

  audit: {
    list: (limit) => ipcRenderer.invoke('audit:list', limit)
  },

  duplicates: {
    review: () => ipcRenderer.invoke('duplicates:review')
  },


  documents: {
    list: (filters) => ipcRenderer.invoke('documents:list', filters),
    getById: (id) => ipcRenderer.invoke('documents:getById', id),
    createFromFile: (filePath, metadata) => ipcRenderer.invoke('documents:createFromFile', filePath, metadata),
    update: (id, metadata) => ipcRenderer.invoke('documents:update', id, metadata),
    delete: (id) => ipcRenderer.invoke('documents:delete', id),
    listLinks: (documentId) => ipcRenderer.invoke('documents:listLinks', documentId),
    listLinkableRecords: (entityType, query) => ipcRenderer.invoke('documents:listLinkableRecords', entityType, query),
    link: (documentId, entityType, entityId, relationType, note) => ipcRenderer.invoke('documents:link', documentId, entityType, entityId, relationType, note),
    unlink: (linkId) => ipcRenderer.invoke('documents:unlink', linkId),
    listForEntity: (entityType, entityId) => ipcRenderer.invoke('documents:listForEntity', entityType, entityId),
    open: (id) => ipcRenderer.invoke('documents:open', id),
    reveal: (id) => ipcRenderer.invoke('documents:reveal', id)
  },
  reports: {
    listCategories: () => ipcRenderer.invoke('reports:listCategories'),
    createCategory: (data) => ipcRenderer.invoke('reports:createCategory', data),
    updateCategory: (id, data) => ipcRenderer.invoke('reports:updateCategory', id, data),
    deleteCategory: (id) => ipcRenderer.invoke('reports:deleteCategory', id),
    listTemplates: (filters) => ipcRenderer.invoke('reports:listTemplates', filters),
    getTemplate: (id) => ipcRenderer.invoke('reports:getTemplate', id),
    createTemplate: (data) => ipcRenderer.invoke('reports:createTemplate', data),
    updateTemplate: (id, data) => ipcRenderer.invoke('reports:updateTemplate', id, data),
    deleteTemplate: (id) => ipcRenderer.invoke('reports:deleteTemplate', id),
    getAvailableFields: (dataSource) => ipcRenderer.invoke('reports:getAvailableFields', dataSource),
    renderTemplate: (id, params) => ipcRenderer.invoke('reports:renderTemplate', id, params),
    exportTemplateToExcel: (id, params, filePath) => ipcRenderer.invoke('reports:exportTemplateToExcel', id, params, filePath)
  },
  system: {
    migrations: () => ipcRenderer.invoke('system:migrations')
  }
});

// === SESSION INFO (for main window) ===
contextBridge.exposeInMainWorld('sessionApi', {
  onInfo: (callback) => ipcRenderer.on('session:info', (_, info) => callback(info))
});

// === APP CONTROL (for main window) ===
contextBridge.exposeInMainWorld('appApi', {
  logout: () => ipcRenderer.invoke('app:logout')
});

