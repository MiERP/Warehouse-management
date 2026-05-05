// === CONFIG MODULE ===
const configModule = {
  async loadAll() {
    await Promise.all([this.loadUnits(), this.loadProvinces(), this.loadCatalog('warehouse_types', 'warehouse-types-list'), this.loadCatalog('goods_types', 'goods-types-list'), this.loadCatalog('quality_grades', 'quality-grades-list'), this.loadCatalog('lightning_protection', 'lightning-list')]);
  },

  // === UNITS (Tree) ===
  async loadUnits() {
    const tree = await window.api.units.getTree();
    document.getElementById('units-tree').innerHTML = this.renderTree(tree);
  },

  renderTree(nodes, level = 0) {
    if (!nodes || nodes.length === 0) return '';
    let html = level > 0 ? '<ul>' : '';
    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      html += `<li>
        <div class="tree-node" data-id="${node.id}">
          <span class="tree-toggle ${hasChildren ? 'expanded' : 'empty'}">▶</span>
          <span style="flex:1">${node.name}</span>
          <button class="btn btn-sm btn-secondary" onclick="configModule.editUnit(${node.id},'${node.name.replace(/'/g,"\\'")}',${node.parent_id || 'null'})">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="configModule.deleteUnit(${node.id})">Xóa</button>
        </div>
        ${hasChildren ? this.renderTree(node.children, level + 1) : ''}
      </li>`;
    });
    html += level > 0 ? '</ul>' : '';
    return html;
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
      <div class="form-group"><label class="form-label">Tên đơn vị</label><input class="form-control" id="m-unit-name" value="${name}"></div>
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
    document.getElementById('provinces-list').innerHTML = html;
  },

  async loadWards(provinceId) {
    const wards = await window.api.locations.getWardsByProvince(provinceId);
    let html = '<table style="width:100%"><thead><tr><th>Tên xã</th><th>Mã</th><th>Thao tác</th></tr></thead><tbody>';
    wards.forEach(w => {
      html += `<tr><td>${w.name}</td><td>${w.code || ''}</td>
        <td><button class="btn btn-sm btn-danger" onclick="configModule.deleteWard(${w.id})">Xóa</button></td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('wards-list').innerHTML = html;
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
  },

  async deleteWard(id) {
    const ok = await confirmAction('Xóa xã này?');
    if (!ok) return;
    await window.api.locations.deleteWard(id);
    showToast('Đã xóa', 'success');
  },

  importLocations() { showToast('Chức năng import Excel đang phát triển (Phase 5)', 'info'); },

  // === GENERIC CATALOGS ===
  async loadCatalog(tableName, containerId) {
    const items = await window.api.catalogs.getAll(tableName);
    let html = '<table style="width:100%"><thead><tr><th>Tên</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>';
    items.forEach(item => {
      html += `<tr><td>${item.name}</td><td style="color:var(--text-muted)">${item.description || ''}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="configModule.editCatalog('${tableName}',${item.id},'${item.name.replace(/'/g,"\\'")}','${(item.description||'').replace(/'/g,"\\'")}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="configModule.deleteCatalog('${tableName}',${item.id})">Xóa</button>
        </td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById(containerId).innerHTML = html;
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
      <div class="form-group"><label class="form-label">Tên</label><input class="form-control" id="m-cat-name" value="${name}"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Mô tả</label><input class="form-control" id="m-cat-desc" value="${desc}"></div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
       <button class="btn btn-primary" onclick="configModule.saveCatalog('${tableName}',${id})">Cập nhật</button>`);
  },

  async deleteCatalog(tableName, id) {
    const ok = await confirmAction('Xóa mục này?');
    if (!ok) return;
    await window.api.catalogs.delete(tableName, id);
    showToast('Đã xóa', 'success'); this.loadAll();
  }
};
