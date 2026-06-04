(function () {
  if (window.api && window.loginApi && window.appApi) return;

  async function request(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Request failed');
    }
    return payload.data;
  }

  function crud(path) {
    return {
      getAll: () => request(path),
      getById: (id) => request(`${path}/${id}`),
      create: (data) => request(path, { method: 'POST', body: data }),
      update: (id, data) => request(`${path}/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`${path}/${id}`, { method: 'DELETE' })
    };
  }

  window.loginApi = window.loginApi || {
    authenticate: async (sessionInfo) => {
      const session = await request('/api/auth/login', { method: 'POST', body: sessionInfo });
      window.location.href = '/app';
      return session;
    }
  };

  window.api = window.api || {
    units: {
      getAll: () => request('/api/units'),
      getTree: () => request('/api/units/tree'),
      create: (data) => request('/api/units', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/units/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`/api/units/${id}`, { method: 'DELETE' })
    },
    locations: {
      getProvinces: () => request('/api/locations/provinces'),
      getWardsByProvince: (provinceId) => request(`/api/locations/wards/${provinceId}`),
      createProvince: (data) => request('/api/locations/provinces', { method: 'POST', body: data }),
      updateProvince: (id, data) => request(`/api/locations/provinces/${id}`, { method: 'PUT', body: data }),
      deleteProvince: (id) => request(`/api/locations/provinces/${id}`, { method: 'DELETE' }),
      createWard: (data) => request('/api/locations/wards', { method: 'POST', body: data }),
      updateWard: (id, data) => request(`/api/locations/wards/${id}`, { method: 'PUT', body: data }),
      deleteWard: (id) => request(`/api/locations/wards/${id}`, { method: 'DELETE' })
    },
    catalogs: {
      getAll: (tableName) => request(`/api/catalogs/${encodeURIComponent(tableName)}`),
      create: (tableName, data) => request(`/api/catalogs/${encodeURIComponent(tableName)}`, { method: 'POST', body: data }),
      update: (tableName, id, data) => request(`/api/catalogs/${encodeURIComponent(tableName)}/${id}`, { method: 'PUT', body: data }),
      delete: (tableName, id) => request(`/api/catalogs/${encodeURIComponent(tableName)}/${id}`, { method: 'DELETE' })
    },
    warehouses: {
      ...crud('/api/warehouses'),
      search: (query) => request(`/api/warehouses/search?q=${encodeURIComponent(query || '')}`)
    },
    cameras: crud('/api/cameras'),
    fireSystems: crud('/api/fireSystems'),
    constructions: crud('/api/constructions'),
    dialog: {
      openFile: async () => ({ canceled: true, filePaths: [] }),
      saveFile: async () => ({ canceled: true, filePath: null })
    },
    excel: {
      read: async () => { throw new Error('Import Excel tren web se duoc bo sung bang upload file'); },
      write: async () => { throw new Error('Export Excel tren web se duoc bo sung bang download file'); },
      readWorkbook: async () => { throw new Error('Import Excel tren web se duoc bo sung bang upload file'); }
    },
    stats: {
      overview: () => request('/api/stats/overview')
    },
    search: {
      global: (query) => request(`/api/search/global?q=${encodeURIComponent(query || '')}`),
      smart: (query, options) => request('/api/search/smart', { method: 'POST', body: { query, options } }),
      rebuildIndex: () => request('/api/search/rebuild-index', { method: 'POST', body: {} })
    },
    backup: {
      create: async () => { throw new Error('Backup tren web se duoc bo sung o milestone tiep theo'); },
      restore: async () => { throw new Error('Restore tren web se duoc bo sung o milestone tiep theo'); },
      list: async () => []
    },
    audit: {
      list: (limit) => request(`/api/audit?limit=${encodeURIComponent(limit || 100)}`)
    },
    duplicates: {
      review: () => request('/api/duplicates/review')
    },
    documents: {
      list: async () => [],
      getById: async () => null,
      createFromFile: async () => { throw new Error('Tai lieu tren web se duoc bo sung bang upload file'); },
      update: async () => { throw new Error('Tai lieu tren web se duoc bo sung bang upload file'); },
      delete: async () => ({ success: true }),
      listLinks: async () => [],
      listLinkableRecords: async () => [],
      link: async () => ({ success: true }),
      unlink: async () => ({ success: true }),
      listForEntity: async () => [],
      open: async () => { throw new Error('Tai lieu tren web se duoc bo sung bang download file'); },
      reveal: async () => { throw new Error('Khong ho tro mo thu muc tren trinh duyet'); }
    },
    system: {
      migrations: () => request('/api/system/migrations')
    }
  };

  window.sessionApi = window.sessionApi || {
    onInfo: async (callback) => {
      const session = await request('/api/auth/session');
      if (!session) {
        window.location.href = '/login';
        return;
      }
      callback(session);
    }
  };

  window.appApi = window.appApi || {
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST', body: {} });
      window.location.href = '/login';
    }
  };
}());
