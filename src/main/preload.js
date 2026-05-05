const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // === UNITS ===
  units: {
    getAll: () => ipcRenderer.invoke('units:getAll'),
    getTree: () => ipcRenderer.invoke('units:getTree'),
    create: (data) => ipcRenderer.invoke('units:create', data),
    update: (id, data) => ipcRenderer.invoke('units:update', id, data),
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
    write: (filePath, data, sheetName) => ipcRenderer.invoke('excel:write', filePath, data, sheetName)
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
  }
});

