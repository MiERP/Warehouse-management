(function () {
  const STORAGE_KEY = 'warehouse_management_web_demo_v1';
  const store = { warehouses: [], cameras: [], fireSystems: [], constructions: [], units: [], warehouse_types: [], goods_types: [], quality_grades: [], lightning_protection: [], provinces: [], wards: [] };

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function nextId(items) { return Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1; }
  function tree(units, parentId = null) { return units.filter(unit => (unit.parent_id || null) === parentId).map(unit => ({ ...unit, children: tree(units, unit.id) })); }
  function withUnitNames(items) { return items.map(item => ({ ...item, parent_unit_name: store.units.find(unit => unit.id === item.parent_unit_id)?.name || '', child_unit_name: store.units.find(unit => unit.id === item.child_unit_id)?.name || '' })); }
  function loadFromStorage() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { return null; } }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  async function loadJson(file) { return fetch(file).then(res => res.json()); }

  const ready = (async () => {
    const existing = loadFromStorage();
    if (existing) { Object.assign(store, existing); return store; }
    const [warehouses, cameras, fireSystems, constructions, units, catalogs] = await Promise.all([
      loadJson('data/warehouses.json'), loadJson('data/cameras.json'), loadJson('data/fireSystems.json'),
      loadJson('data/constructions.json'), loadJson('data/units.json'), loadJson('data/catalogs.json')
    ]);
    Object.assign(store, { warehouses, cameras, fireSystems, constructions, units, ...catalogs });
    save();
    return store;
  })();
  window.webDemoReady = ready;
  window.__demoStore = store;

  async function rows(key) { await ready; return key === 'warehouses' || key === 'cameras' || key === 'fireSystems' || key === 'constructions' ? withUnitNames(store[key]) : (store[key] || []); }
  function crud(key) {
    return {
      getAll: async () => rows(key),
      getById: async id => (await rows(key)).find(item => item.id === Number(id)) || null,
      create: async data => { await ready; const item = { id: nextId(store[key]), ...data }; store[key].push(item); save(); return item; },
      update: async (id, data) => { await ready; const index = store[key].findIndex(item => item.id === Number(id)); if (index >= 0) store[key][index] = { ...store[key][index], ...data, id: Number(id) }; save(); return store[key][index]; },
      delete: async id => { await ready; store[key] = store[key].filter(item => item.id !== Number(id)); save(); return { success: true }; }
    };
  }

  function searchText(row) { return normalize(Object.values(row).join(' ')); }
  async function smartSearch(query, options = {}) {
    await ready;
    const q = normalize(query);
    const expansions = { cam: 'camera', pccc: 'cuu hoa phong chay chua chay', ct: 'cong trinh du an', hckt: 'hau can ky thuat', qlda: 'ban quan ly du an', hong: 'hong loi can sua chua' };
    const expanded = normalize(`${q} ${Object.entries(expansions).filter(([key]) => q.includes(key)).map(([, value]) => value).join(' ')}`);
    const terms = [...new Set(expanded.split(' ').filter(term => term.length > 1))];
    const moduleHints = [];
    if (/\bkho\b|xang dau|luong thuc/.test(q)) moduleHints.push('warehouse');
    if (/camera|\bcam\b|giam sat/.test(q)) moduleHints.push('camera');
    if (/cuu hoa|pccc|phong chay|chua chay/.test(q)) moduleHints.push('fire');
    if (/cong trinh|du an|thi cong|quyet toan/.test(q)) moduleHints.push('construction');
    const modules = [['warehouse', await rows('warehouses')], ['camera', await rows('cameras')], ['fire', await rows('fireSystems')], ['construction', await rows('constructions')]];
    const results = [];
    modules.forEach(([module, items]) => items.forEach(item => {
      const text = searchText(item);
      const matched = terms.filter(term => text.includes(term));
      if (!matched.length) return;
      const title = item.name || item.child_unit_name || (module === 'camera' ? 'Hệ thống camera' : module === 'fire' ? 'Hệ thống cứu hỏa' : 'Bản ghi');
      let score = matched.length * 10 + (moduleHints.includes(module) ? 30 : 0);
      matched.forEach(term => { if (normalize(title).includes(term)) score += 20; });
      results.push({ module, id: item.id, record_id: item.id, title, subtitle: item.parent_unit_name || item.address || item.status || '', status: item.status || '', score, matched_reason: matched.slice(0, 5) });
    }));
    return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 20);
  }

  window.api = {
    units: {
      getAll: async () => rows('units'), getTree: async () => { await ready; return tree(store.units); },
      create: async data => { await ready; const item = { id: nextId(store.units), level: 0, ...data, parent_id: data.parent_id ? Number(data.parent_id) : null }; store.units.push(item); save(); return item; },
      update: async (id, data) => { await ready; const item = store.units.find(unit => unit.id === Number(id)); if (item) Object.assign(item, data, { parent_id: data.parent_id ? Number(data.parent_id) : null }); save(); return item; },
      delete: async id => { await ready; store.units = store.units.filter(unit => unit.id !== Number(id)); save(); return { success: true }; }
    },
    locations: {
      getProvinces: async () => rows('provinces'), getWardsByProvince: async provinceId => { await ready; return store.wards.filter(ward => ward.province_id === Number(provinceId)); },
      createProvince: async data => { await ready; const item = { id: nextId(store.provinces), ...data }; store.provinces.push(item); save(); return item; }, deleteProvince: async id => { await ready; store.provinces = store.provinces.filter(item => item.id !== Number(id)); save(); return { success: true }; },
      createWard: async data => { await ready; const item = { id: nextId(store.wards), ...data, province_id: Number(data.province_id) }; store.wards.push(item); save(); return item; }, deleteWard: async id => { await ready; store.wards = store.wards.filter(item => item.id !== Number(id)); save(); return { success: true }; }
    },
    catalogs: { getAll: async tableName => rows(tableName), create: async (tableName, data) => { await ready; store[tableName] ||= []; const item = { id: nextId(store[tableName]), ...data }; store[tableName].push(item); save(); return item; }, update: async (tableName, id, data) => { await ready; const item = (store[tableName] || []).find(x => x.id === Number(id)); if (item) Object.assign(item, data); save(); return item; }, delete: async (tableName, id) => { await ready; store[tableName] = (store[tableName] || []).filter(x => x.id !== Number(id)); save(); return { success: true }; } },
    warehouses: crud('warehouses'), cameras: crud('cameras'), fireSystems: crud('fireSystems'), constructions: crud('constructions'),
    stats: { overview: async () => { await ready; return { khoChienDich: store.warehouses.filter(w => w.warehouse_category === 'chien_dich').length, khoChienThuat: store.warehouses.filter(w => w.warehouse_category === 'chien_thuat').length, cameraCount: store.cameras.length, fireCount: store.fireSystems.length, warehouseByType: [], currentYearConstructions: await rows('constructions'), alerts: [] }; } },
    search: { global: smartSearch, smart: smartSearch, rebuildIndex: async () => ({ success: true }) },
    dialog: { openFile: async () => ({ canceled: true, filePaths: [] }), saveFile: async defaultName => ({ canceled: false, filePath: defaultName }) },
    excel: { read: async () => [], write: async (_filePath, data, sheetName) => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${sheetName || 'export'}.json`; a.click(); URL.revokeObjectURL(url); return { success: true }; } }
  };
})();
