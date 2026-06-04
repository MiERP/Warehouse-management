function cfgEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}
function cfgEmpty(message = 'Không có dữ liệu') {
  const div = document.createElement('div');
  div.style.cssText = 'padding:12px;color:var(--text-muted)';
  div.textContent = message;
  return div;
}
function cfgSetContent(container, content) {
  while (container.firstChild) container.removeChild(container.firstChild);
  if (typeof content === 'string') {
    const template = document.createElement('template');
    template.innerHTML = content;
    container.appendChild(template.content);
  } else {
    container.appendChild(content);
  }
}
function cfgRows(rows, columns) {
  if (!rows || rows.length === 0) return cfgEmpty();
  const table = document.createElement('table');
  table.style.width = '100%';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  columns.forEach(c => {
    const th = document.createElement('th');
    th.textContent = c.label;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(c => {
      const td = document.createElement('td');
      const val = typeof c.value === 'function' ? c.value(row) : row[c.value];
      td.textContent = val != null ? String(val) : '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}
// === CONFIG MODULE ===
const configModule = {
  selectedProvinceId: null,

  async loadAll() {
    await Promise.all([this.loadUnits(), this.loadProvinces(), this.loadCatalog('warehouse_types', 'warehouse-types-list'), this.loadCatalog('goods_types', 'goods-types-list'), this.loadCatalog('quality_grades', 'quality-grades-list'), this.loadCatalog('lightning_protection', 'lightning-list'), this.loadCatalog('statuses', 'statuses-list'), this.loadCatalog('investors', 'investors-list'), this.loadCatalog('unit_measures', 'unit-measures-list'), this.loadCatalog('construction_types', 'construction-types-list')]);
  },

  // === UNITS (Tree) ===
  async loadUnits() {
    const tree = await window.api.units.getTree();
    
    const unitsTreeEl = document.getElementById('units-tree');
    while (unitsTreeEl.firstChild) unitsTreeEl.removeChild(unitsTreeEl.firstChild);
    unitsTreeEl.appendChild(this.renderTree(tree));
    const unitsTree = document.getElementById('units-tree');
    if (!unitsTree._delegated) {
      unitsTree._delegated = true;
      unitsTree.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-unit');
        if (editBtn) {
          const id = parseInt(editBtn.dataset.unitId, 10);
          const name = editBtn.dataset.unitName;
          const parentId = editBtn.dataset.unitParent ? parseInt(editBtn.dataset.unitParent, 10) : null;
          this.editUnit(id, name, parentId);
          return;
        }
        const deleteBtn = e.target.closest('.btn-delete-unit');
        if (deleteBtn) {
          this.deleteUnit(parseInt(deleteBtn.dataset.unitId, 10));
          return;
        }
      });
    }
  },

  renderTree(nodes, level = 0) {
    if (!nodes || nodes.length === 0) {
      return document.createDocumentFragment();
    }
    const wrapper = document.createElement(level > 0 ? 'ul' : 'div');
    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      const li = document.createElement('li');
      const div = document.createElement('div');
      div.className = 'tree-node';
      div.setAttribute('data-id', String(node.id));

      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle ' + (hasChildren ? 'expanded' : 'empty');
      toggle.textContent = '▶';
      div.appendChild(toggle);

      const nameSpan = document.createElement('span');
      nameSpan.style.flex = '1';
      nameSpan.textContent = node.name || '';
      div.appendChild(nameSpan);

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-secondary btn-edit-unit';
      editBtn.setAttribute('data-unit-id', String(node.id));
      editBtn.setAttribute('data-unit-name', node.name || '');
      editBtn.setAttribute('data-unit-parent', node.parent_id != null ? String(node.parent_id) : '');
      editBtn.textContent = 'Sửa';
      div.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger btn-delete-unit';
      deleteBtn.setAttribute('data-unit-id', String(node.id));
      deleteBtn.textContent = 'Xóa';
      div.appendChild(deleteBtn);

      li.appendChild(div);
      if (hasChildren) {
        li.appendChild(this.renderTree(node.children, level + 1));
      }
      wrapper.appendChild(li);
    });
    return wrapper;
  },

  async addUnit() {
    const units = await window.api.units.getAll();
    openModal('Thêm đơn vị', `
      <div class="form-group"><label class="form-label">Tên đơn vị</label><input class="form-control" id="m-unit-name"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Đơn vị cha</label><select class="form-control" id="m-unit-parent">${buildOptions(units, 'id', 'name', '-- Không có (gốc) --')}</select></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveUnit()">Lưu</button>`);
  },

  async saveUnit(editId) {
    const name = document.getElementById('m-unit-name').value.trim();
    if (!name) { showToast('Vui lòng nhập tên đơn vị', 'warning'); return; }
    const parent_id = document.getElementById('m-unit-parent').value || null;
    try {
      if (editId) await window.api.units.update(editId, { name, parent_id });
      else await window.api.units.create({ name, parent_id });
      closeModal(); showToast(editId ? 'Đã cập nhật' : 'Đã thêm đơn vị', 'success'); this.loadUnits();
    } catch (e) { showToast('Lỗi: ' + e.message, 'error'); }
  },

  async editUnit(id, name, parentId) {
    const units = await window.api.units.getAll();
    openModal('Sửa đơn vị', `
      <div class="form-group"><label class="form-label">Tên đơn vị</label><input class="form-control" id="m-unit-name" value="${cfgEscape(name)}"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Đơn vị cha</label><select class="form-control" id="m-unit-parent">${buildOptions(units.filter(u => u.id !== id), 'id', 'name', '-- Không có (gốc) --')}</select></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveUnit(${id})">Cập nhật</button>`);
    if (parentId) document.getElementById('m-unit-parent').value = parentId;
  },

  async deleteUnit(id) {
    const ok = await confirmAction('Xóa đơn vị này? Các đơn vị con sẽ trở thành gốc.');
    if (!ok) return;
    await window.api.units.delete(id);
    showToast('Đã xóa đơn vị', 'success'); this.loadUnits();
  },

  // === PROVINCES & WARDS ===
  async loadProvinces() {
    const provinces = await window.api.locations.getProvinces();
    let html = '<table style="width:100%"><thead><tr><th>Tên tỉnh</th><th>Mã</th><th>Thao tác</th></tr></thead><tbody>';
    provinces.forEach(p => {
      html += `<tr onclick="configModule.loadWards(${p.id})" style="cursor:pointer">
        <td>${p.name}</td><td>${p.code || ''}</td>
        <td><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();configModule.deleteProvince(${p.id})">Xóa</button></td></tr>`;
    });
    html += '</tbody></table>';
    const provList = document.getElementById('provinces-list');
    cfgSetContent(provList, provinces.length ? html : cfgEmpty());
  },

  async loadWards(provinceId) {
    this.selectedProvinceId = provinceId;
    const wards = await window.api.locations.getWardsByProvince(provinceId);
    let html = '<table style="width:100%"><thead><tr><th>Tên xã</th><th>Mã</th><th>Thao tác</th></tr></thead><tbody>';
    wards.forEach(w => {
      html += `<tr><td>${w.name}</td><td>${w.code || ''}</td>
        <td><button class="btn btn-sm btn-danger" onclick="configModule.deleteWard(${w.id})">Xóa</button></td></tr>`;
    });
    html += '</tbody></table>';
    const wardsList = document.getElementById('wards-list');
    cfgSetContent(wardsList, wards.length ? html : cfgEmpty());
  },

  addProvince() {
    openModal('Thêm tỉnh', `
      <div class="form-group"><label class="form-label">Tên tỉnh</label><input class="form-control" id="m-prov-name"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Mã</label><input class="form-control" id="m-prov-code"></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveProvince()">Lưu</button>`);
  },

  async saveProvince() {
    const name = document.getElementById('m-prov-name').value.trim();
    if (!name) { showToast('Nhập tên tỉnh', 'warning'); return; }
    await window.api.locations.createProvince({ name, code: document.getElementById('m-prov-code').value.trim() });
    closeModal(); showToast('Đã thêm tỉnh', 'success'); this.loadProvinces();
  },

  async deleteProvince(id) {
    const ok = await confirmAction('Xóa tỉnh này? Các xã thuộc tỉnh cũng sẽ bị xóa.');
    if (!ok) return;
    await window.api.locations.deleteProvince(id);
    if (this.selectedProvinceId === id) {
      this.selectedProvinceId = null;
      cfgSetContent(document.getElementById('wards-list'), cfgEmpty());
    }
    showToast('Đã xóa', 'success'); this.loadProvinces();
  },

  async addWard() {
    const provinces = await window.api.locations.getProvinces();
    openModal('Thêm xã', `
      <div class="form-group"><label class="form-label">Tỉnh</label><select class="form-control" id="m-ward-prov">${buildOptions(provinces)}</select></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Tên xã</label><input class="form-control" id="m-ward-name"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Mã</label><input class="form-control" id="m-ward-code"></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveWard()">Lưu</button>`);
  },

  async saveWard() {
    const name = document.getElementById('m-ward-name').value.trim();
    const province_id = document.getElementById('m-ward-prov').value;
    if (!name || !province_id) { showToast('Điền đầy đủ thông tin', 'warning'); return; }
    await window.api.locations.createWard({ name, province_id: parseInt(province_id), code: document.getElementById('m-ward-code').value.trim() });
    closeModal(); showToast('Đã thêm xã', 'success');
    await this.loadWards(parseInt(province_id, 10));
  },

  async deleteWard(id) {
    const ok = await confirmAction('Xóa xã này?');
    if (!ok) return;
    await window.api.locations.deleteWard(id);
    showToast('Đã xóa', 'success');
    if (this.selectedProvinceId) await this.loadWards(this.selectedProvinceId);
  },

  importLocations() { showToast('Chức năng import Excel đang phát triển (Phase 5)', 'info'); },

  // === GENERIC CATALOGS ===
  async loadCatalog(tableName, containerId) {
    const items = await window.api.catalogs.getAll(tableName);
    let html = '<table style="width:100%"><thead><tr><th>Tên</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>';
    items.forEach(item => {
      const escapedName = cfgEscape(item.name);
      const escapedDesc = cfgEscape(item.description || '');
      html += `<tr><td>${escapedName}</td><td style="color:var(--text-muted)">${escapedDesc || ''}</td>
        <td>
          <button class="btn btn-sm btn-secondary btn-edit-catalog" data-table="${cfgEscape(tableName)}" data-id="${item.id}" data-name="${escapedName}" data-desc="${escapedDesc}">Sửa</button>
          <button class="btn btn-sm btn-danger btn-delete-catalog" data-table="${cfgEscape(tableName)}" data-id="${item.id}">Xóa</button>
        </td></tr>`;
    });
    html += '</tbody></table>';
    const container = document.getElementById(containerId);
    cfgSetContent(container, items.length ? html : cfgEmpty());
    if (!container._delegated) {
      container._delegated = true;
      container.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-catalog');
        if (editBtn) {
          this.editCatalog(editBtn.dataset.table, parseInt(editBtn.dataset.id, 10), editBtn.dataset.name, editBtn.dataset.desc);
          return;
        }
        const deleteBtn = e.target.closest('.btn-delete-catalog');
        if (deleteBtn) {
          this.deleteCatalog(deleteBtn.dataset.table, parseInt(deleteBtn.dataset.id, 10));
          return;
        }
      });
    }
  },

  addCatalog(tableName, label) {
    openModal(`Thêm ${label}`, `
      <div class="form-group"><label class="form-label">Tên</label><input class="form-control" id="m-cat-name"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Mô tả</label><input class="form-control" id="m-cat-desc"></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveCatalog('${tableName}')">Lưu</button>`);
  },

  async saveCatalog(tableName, editId) {
    const name = document.getElementById('m-cat-name').value.trim();
    if (!name) { showToast('Nhập tên', 'warning'); return; }
    const data = { name, description: document.getElementById('m-cat-desc').value.trim() };
    if (editId) await window.api.catalogs.update(tableName, editId, data);
    else await window.api.catalogs.create(tableName, data);
    closeModal(); showToast('Đã lưu', 'success'); this.loadAll();
  },

  editCatalog(tableName, id, name, desc) {
    openModal('Sửa danh mục', `
      <div class="form-group"><label class="form-label">Tên</label><input class="form-control" id="m-cat-name" value="${cfgEscape(name)}"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Mô tả</label><input class="form-control" id="m-cat-desc" value="${cfgEscape(desc)}"></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveCatalog('${cfgEscape(tableName)}',${id})">Cập nhật</button>`);
  },

  async deleteCatalog(tableName, id) {
    const ok = await confirmAction('Xóa mục này?');
    if (!ok) return;
    await window.api.catalogs.delete(tableName, id);
    showToast('Đã xóa', 'success'); this.loadAll();
  },
  async loadSafety() {
    await Promise.all([this.loadBackups(), this.loadAudit(), this.loadMigrations()]);
  },

  async createBackup() {
    try {
      const result = await window.api.backup.create();
      showToast(`Đã tạo backup: ${result.filePath}`, 'success');
      await this.loadSafety();
    } catch (e) { showToast('Lỗi backup: ' + e.message, 'error'); }
  },

  async restoreBackup() {
    const result = await window.api.dialog.openFile([{ name: 'SQLite DB', extensions: ['db'] }]);
    if (result.canceled || !result.filePaths || !result.filePaths[0]) return;
    const ok = await confirmAction('Restore sẽ thay thế dữ liệu hiện tại. Hệ thống sẽ tự tạo backup an toàn trước khi restore. Tiếp tục?');
    if (!ok) return;
    try {
      const restored = await window.api.backup.restore(result.filePaths[0]);
      showToast(`Đã restore. Backup an toàn: ${restored.safetyBackup}`, 'success');
      if (restored.restartRequired) showToast('Restore hoàn tất. Hãy khởi động lại ứng dụng để nạp lại DB.', 'warning');
    } catch (e) { showToast('Lỗi restore: ' + e.message, 'error'); }
  },

  async loadBackups() {
    const rows = await window.api.backup.list(50);
    const bhEl = document.getElementById('backup-history'); while (bhEl.firstChild) bhEl.removeChild(bhEl.firstChild); bhEl.appendChild(cfgRows(rows, [
      { label: 'Thời điểm', value: 'created_at' },
      { label: 'Hành động', value: 'action' },
      { label: 'File', value: 'file_path' }
    ]));
  },

  async loadAudit() {
    const rows = await window.api.audit.list(100);
    const alEl = document.getElementById('audit-log'); while (alEl.firstChild) alEl.removeChild(alEl.firstChild); alEl.appendChild(cfgRows(rows, [
      { label: 'Thời điểm', value: 'created_at' },
      { label: 'Module', value: 'module' },
      { label: 'Hành động', value: 'action' },
      { label: 'Bản ghi', value: row => row.record_id || '' },
      { label: 'Người dùng', value: 'actor' }
    ]));
  },

  async loadMigrations() {
    const rows = await window.api.system.migrations();
    const mhEl = document.getElementById('migration-history'); while (mhEl.firstChild) mhEl.removeChild(mhEl.firstChild); mhEl.appendChild(cfgRows(rows, [
      { label: 'Version', value: 'version' },
      { label: 'Tên migration', value: 'name' },
      { label: 'Áp dụng lúc', value: 'applied_at' }
    ]));
  },

  async loadDuplicates() {
    const data = await window.api.duplicates.review();
    const sections = [
      ['Nhà kho', data.warehouses || []],
      ['Công trình', data.constructions || []],
      ['Camera', data.cameras || []],
      ['Cứu hỏa', data.fireSystems || []]
    ];
    const html = sections.map(([label, groups]) => {
      if (!groups.length) return `<h4 style="margin-top:12px">${cfgEscape(label)}</h4><div style="color:var(--text-muted)">Không phát hiện nghi trùng</div>`;
      return `<h4 style="margin-top:12px">${cfgEscape(label)}</h4>` + groups.map(group =>
        `<div style="padding:10px;border-bottom:1px solid var(--border-color)"><div><strong>Khóa:</strong> ${cfgEscape(group.duplicate_key)} — ${group.count} bản ghi</div>` +
        `<ul style="margin:6px 0 0 18px">${group.records.map(r => `<li>#${cfgEscape(r.id)} — ${cfgEscape(r.title)} <span style="color:var(--text-muted)">${cfgEscape(r.subtitle)}</span></li>`).join('')}</ul></div>`
      ).join('');
    }).join('');
    const drEl = document.getElementById('duplicate-review');
    while (drEl.firstChild) drEl.removeChild(drEl.firstChild);
    drEl.appendChild(html);
  }
};


