// === WAREHOUSE MODULE ===
const warehouseModule = {
  editingId: null,
  activeFilter: null,

  async loadList(filter = this.activeFilter) {
    this.activeFilter = filter || null;
    let items = await window.api.warehouses.getAll();
    if (this.activeFilter?.warehouse_category) items = items.filter(item => item.warehouse_category === this.activeFilter.warehouse_category);
    if (this.activeFilter?.warehouse_type_id !== undefined) items = items.filter(item => String(item.warehouse_type_id || '') === String(this.activeFilter.warehouse_type_id || ''));
    const tbody = document.getElementById('warehouse-table-body');
    clearElement(tbody);
    if (!items.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 10;
      cell.className = 'empty-state';
      cell.textContent = 'Chưa có dữ liệu nhà kho';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    items.forEach(warehouse => {
      const row = document.createElement('tr');
      row.dataset.id = warehouse.id;
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => this.edit(warehouse.id));

      const nameCell = appendTextCell(row, warehouse.name);
      nameCell.style.fontWeight = '600';
      appendTextCell(row, warehouse.parent_unit_name);
      appendTextCell(row, warehouse.child_unit_name);

      const categoryCell = document.createElement('td');
      if (warehouse.warehouse_category === 'chien_dich' || warehouse.warehouse_category === 'chien_thuat') {
        const badge = document.createElement('span');
        badge.className = warehouse.warehouse_category === 'chien_dich' ? 'badge info' : 'badge success';
        badge.textContent = warehouse.warehouse_category === 'chien_dich' ? 'Chiến dịch' : 'Chiến thuật';
        categoryCell.appendChild(badge);
      } else {
        categoryCell.textContent = '-';
      }
      row.appendChild(categoryCell);

      appendTextCell(row, [warehouse.province_name, warehouse.address].filter(Boolean).join(' - '));
      appendTextCell(row, warehouse.warehouse_type_name);
      appendBadgeCell(row, warehouse.quality_grade_name);
      appendTextCell(row, `${warehouse.warehouse_area || 0} m²`);
      appendTextCell(row, warehouse.storage_capacity || 0, '0');

      const actionCell = document.createElement('td');
      actionCell.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', event => {
        event.stopPropagation();
        this.remove(warehouse.id);
      }));
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });
  },

  openFiltered(filter) {
    navigateTo('warehouses');
    setTimeout(() => this.loadList(filter), 100);
  },
  async showForm(data) {
    const [units, provinces, wtypes, gtypes, qgrades] = await Promise.all([
      window.api.units.getAll(), window.api.locations.getProvinces(),
      window.api.catalogs.getAll('warehouse_types'), window.api.catalogs.getAll('goods_types'),
      window.api.catalogs.getAll('quality_grades')
    ]);
    const d = data || {};
    this.editingId = d.id || null;
    const container = document.getElementById('warehouse-form-container');
    clearElement(container);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = 'var(--space-lg)';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = d.id ? 'Sửa nhà kho' : 'Thêm nhà kho mới';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Đóng';
    closeBtn.addEventListener('click', () => warehouseModule.hideForm());
    cardHeader.append(title, closeBtn);
    card.appendChild(cardHeader);

    const formGrid = document.createElement('div');
    formGrid.className = 'form-grid';

    // Section: Thông tin chung
    const secInfo = document.createElement('div');
    secInfo.className = 'form-section-title';
    secInfo.textContent = 'Thông tin chung';
    formGrid.appendChild(secInfo);
    formGrid.appendChild(this._createFormField('wh-name', 'Tên kho *', 'input', d.name || ''));
    formGrid.appendChild(this._createSelectField('wh-category', 'Phân loại kho', [
      { value: '', text: '-- Chọn --' },
      { value: 'chien_dich', text: 'Kho chiến dịch' },
      { value: 'chien_thuat', text: 'Kho chiến thuật' }
    ]));
    formGrid.appendChild(this._createSelectField('wh-parent-unit', 'Đơn vị cha', this._buildOptions(units)));
    formGrid.appendChild(this._createSelectField('wh-child-unit', 'Đơn vị con', this._buildOptions(units)));
    const provinceField = this._createSelectField('wh-province', 'Tỉnh', this._buildOptions(provinces));
    provinceField.querySelector('select').addEventListener('change', () => warehouseModule.onProvinceChange());
    formGrid.appendChild(provinceField);
    formGrid.appendChild(this._createSelectField('wh-ward', 'Xã', [{ value: '', text: '-- Chọn tỉnh trước --' }]));
    formGrid.appendChild(this._createFormField('wh-address', 'Địa chỉ chi tiết', 'input', d.address || '', 'Phường, TP...'));
    formGrid.appendChild(this._createSelectField('wh-type', 'Loại nhà kho', this._buildOptions(wtypes)));

    // Section: Thông số kỹ thuật
    const secTech = document.createElement('div');
    secTech.className = 'form-section-title';
    secTech.textContent = 'Thông số kỹ thuật';
    formGrid.appendChild(secTech);
    formGrid.appendChild(this._createFormField('wh-quantity', 'Số nhà kho', 'number', d.quantity || ''));
    formGrid.appendChild(this._createFormField('wh-land-area', 'DT chiếm đất (m²)', 'number', d.land_area || ''));
    formGrid.appendChild(this._createFormField('wh-area', 'DT nhà kho (m²)', 'number', d.warehouse_area || ''));
    formGrid.appendChild(this._createFormField('wh-wh-land-area', 'DT kho chiếm đất (m²)', 'number', d.warehouse_land_area || ''));
    formGrid.appendChild(this._createFormField('wh-year-built', 'Năm xây dựng', 'number', d.year_built || ''));
    formGrid.appendChild(this._createFormField('wh-year-renovated', 'Năm sửa/nâng cấp', 'number', d.year_renovated || ''));
    formGrid.appendChild(this._createFormField('wh-renovation', 'Khả năng cải tạo', 'input', d.renovation_potential || '', 'km'));
    formGrid.appendChild(this._createFormField('wh-capacity', 'Trữ lượng dự trữ (tấn)', 'number', d.storage_capacity || ''));
    formGrid.appendChild(this._createFormField('wh-stock', 'Trữ lượng hiện tại (tấn)', 'number', d.current_stock || ''));
    formGrid.appendChild(this._createSelectField('wh-goods', 'Loại hàng', this._buildOptions(gtypes)));

    // Section: Phân cấp chất lượng
    const secQuality = document.createElement('div');
    secQuality.className = 'form-section-title';
    secQuality.textContent = 'Phân cấp chất lượng nhà kho';
    formGrid.appendChild(secQuality);
    formGrid.appendChild(this._createSelectField('wh-quality', 'Xếp loại chung', this._buildOptions(qgrades)));
    formGrid.appendChild(this._createFormField('wh-q23', 'DT Cấp 2,3 (m²)', 'number', d.quality_grade_23_area || ''));
    formGrid.appendChild(this._createFormField('wh-q4', 'DT Cấp 4 (m²)', 'number', d.quality_grade_4_area || ''));
    formGrid.appendChild(this._createFormField('wh-temp', 'Nhà tạm (m²)', 'number', d.temp_house_area || ''));

    // Section: Hệ thống chống sét
    const secLightning = document.createElement('div');
    secLightning.className = 'form-section-title';
    secLightning.textContent = 'Hệ thống chống sét';
    formGrid.appendChild(secLightning);
    formGrid.appendChild(this._createFormField('wh-lightning-area', 'Nhà cấp (m²)', 'number', d.lightning_grade_area || ''));
    formGrid.appendChild(this._createFormField('wh-lightning-count', 'Hiện có (cái)', 'number', d.lightning_existing_count || ''));

    // Section: Hệ thống cứu hỏa
    const secFire = document.createElement('div');
    secFire.className = 'form-section-title';
    secFire.textContent = 'Hệ thống cứu hỏa';
    formGrid.appendChild(secFire);
    formGrid.appendChild(this._createSelectField('wh-fire-need', 'Nhu cầu cứu hỏa', [
      { value: '', text: '-- Chọn --' },
      { value: 'Cần thiết', text: 'Cần thiết' },
      { value: 'Không cần', text: 'Không cần' }
    ]));
    formGrid.appendChild(this._createSelectField('wh-fire-existing', 'Hiện có cứu hỏa', [
      { value: '', text: '-- Chọn --' },
      { value: 'Có', text: 'Có' },
      { value: 'Không', text: 'Không' }
    ]));

    // Notes (full width)
    const notesGroup = document.createElement('div');
    notesGroup.className = 'form-group';
    notesGroup.style.gridColumn = '1 / -1';
    const notesLabel = document.createElement('label');
    notesLabel.className = 'form-label';
    notesLabel.textContent = 'Ghi chú';
    const notesInput = document.createElement('input');
    notesInput.className = 'form-control';
    notesInput.id = 'wh-notes';
    notesInput.value = d.notes || '';
    notesGroup.append(notesLabel, notesInput);
    formGrid.appendChild(notesGroup);

    card.appendChild(formGrid);

    const actions = document.createElement('div');
    actions.style.cssText = 'margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Hủy';
    cancelBtn.addEventListener('click', () => warehouseModule.hideForm());
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Lưu';
    saveBtn.addEventListener('click', () => warehouseModule.save());
    actions.append(cancelBtn, saveBtn);
    card.appendChild(actions);

    container.appendChild(card);
    // Set values if editing
    if (d.id) {
      this.editingId = d.id;
      if (d.warehouse_category) document.getElementById('wh-category').value = d.warehouse_category;
      if (d.parent_unit_id) document.getElementById('wh-parent-unit').value = d.parent_unit_id;
      if (d.child_unit_id) document.getElementById('wh-child-unit').value = d.child_unit_id;
      if (d.province_id) { document.getElementById('wh-province').value = d.province_id; await this.onProvinceChange(); if (d.ward_id) document.getElementById('wh-ward').value = d.ward_id; }
      if (d.warehouse_type_id) document.getElementById('wh-type').value = d.warehouse_type_id;
      if (d.goods_type_id) document.getElementById('wh-goods').value = d.goods_type_id;
      if (d.quality_grade_id) document.getElementById('wh-quality').value = d.quality_grade_id;
      if (d.fire_need) document.getElementById('wh-fire-need').value = d.fire_need;
      if (d.fire_existing) document.getElementById('wh-fire-existing').value = d.fire_existing;
    } else { this.editingId = null; }

    if (window.documentPanel) {
      const documentContainer = document.createElement('div');
      documentContainer.id = 'warehouse-document-panel';
      container.appendChild(documentContainer);
      await documentPanel.render(documentContainer, 'warehouses', this.editingId);
    }
  },

  hideForm() {
    clearElement(document.getElementById('warehouse-form-container'));
    this.editingId = null;
  },

  async onProvinceChange() {
    const provinceId = document.getElementById('wh-province').value;
    const wardSelect = document.getElementById('wh-ward');
    if (!provinceId) {
      clearElement(wardSelect);
      const opt = document.createElement('option');
      opt.textContent = '-- Chọn tỉnh trước --';
      wardSelect.appendChild(opt);
      return;
    }
    const wards = await window.api.locations.getWardsByProvince(parseInt(provinceId));
    clearElement(wardSelect);
    const opts = this._buildOptions(wards);
    opts.forEach(optData => {
      const opt = document.createElement('option');
      opt.value = optData.value;
      opt.textContent = optData.text;
      wardSelect.appendChild(opt);
    });
  },

  async save() {
    const name = document.getElementById('wh-name').value.trim();
    if (!name) { showToast('Nhập tên kho', 'warning'); return; }
    const data = {
      name,
      parent_unit_id: parseInt(document.getElementById('wh-parent-unit').value) || null,
      child_unit_id: parseInt(document.getElementById('wh-child-unit').value) || null,
      province_id: parseInt(document.getElementById('wh-province').value) || null,
      ward_id: parseInt(document.getElementById('wh-ward').value) || null,
      address: document.getElementById('wh-address').value.trim() || null,
      warehouse_category: document.getElementById('wh-category').value || null,
      quantity: parseInt(document.getElementById('wh-quantity').value) || 0,
      land_area: parseFloat(document.getElementById('wh-land-area').value) || 0,
      warehouse_area: parseFloat(document.getElementById('wh-area').value) || 0,
      warehouse_land_area: parseFloat(document.getElementById('wh-wh-land-area').value) || 0,
      year_built: parseInt(document.getElementById('wh-year-built').value) || null,
      year_renovated: parseInt(document.getElementById('wh-year-renovated').value) || null,
      warehouse_type_id: parseInt(document.getElementById('wh-type').value) || null,
      renovation_potential: document.getElementById('wh-renovation').value.trim() || null,
      storage_capacity: parseFloat(document.getElementById('wh-capacity').value) || 0,
      current_stock: parseFloat(document.getElementById('wh-stock').value) || 0,
      goods_type_id: parseInt(document.getElementById('wh-goods').value) || null,
      quality_grade_id: parseInt(document.getElementById('wh-quality').value) || null,
      quality_grade_23_area: parseFloat(document.getElementById('wh-q23').value) || 0,
      quality_grade_4_area: parseFloat(document.getElementById('wh-q4').value) || 0,
      temp_house_area: parseFloat(document.getElementById('wh-temp').value) || 0,
      lightning_grade_area: parseFloat(document.getElementById('wh-lightning-area').value) || 0,
      lightning_existing_count: parseInt(document.getElementById('wh-lightning-count').value) || 0,
      fire_need: document.getElementById('wh-fire-need').value || null,
      fire_existing: document.getElementById('wh-fire-existing').value || null,
      notes: document.getElementById('wh-notes').value.trim() || null
    };
    try {
      if (this.editingId) await window.api.warehouses.update(this.editingId, data);
      else await window.api.warehouses.create(data);
      showToast(this.editingId ? 'Đã cập nhật' : 'Đã thêm nhà kho', 'success');
      this.hideForm(); this.loadList();
    } catch (e) { showToast('Lỗi: ' + e.message, 'error'); }
  },

  async edit(id) {
    const data = await window.api.warehouses.getById(id);
    if (data) this.showForm(data);
  },

  async remove(id) {
    const ok = await confirmAction('Xóa nhà kho này?');
    if (!ok) return;
    await window.api.warehouses.delete(id);
    showToast('Đã xóa', 'success'); this.loadList();
  },

  exportExcel() { excelHelper.exportModule('warehouses', 'Nha_kho'); },

  _buildOptions(items, valueField = 'id', textField = 'name') {
    const options = [{ value: '', text: '-- Chọn --' }];
    items.forEach(i => options.push({ value: i[valueField] || '', text: i[textField] || '' }));
    return options;
  },

  _createFormField(id, label, type = 'input', value = '', placeholder = '') {
    const group = document.createElement('div');
    group.className = 'form-group';
    const lbl = document.createElement('label');
    lbl.className = 'form-label';
    lbl.textContent = label;
    const input = document.createElement('input');
    input.className = 'form-control';
    input.id = id;
    input.type = type;
    input.value = value || '';
    if (placeholder) input.placeholder = placeholder;
    group.append(lbl, input);
    return group;
  },

  _createSelectField(id, label, options) {
    const group = document.createElement('div');
    group.className = 'form-group';
    const lbl = document.createElement('label');
    lbl.className = 'form-label';
    lbl.textContent = label;
    const select = document.createElement('select');
    select.className = 'form-control';
    select.id = id;
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      select.appendChild(option);
    });
    group.append(lbl, select);
    return group;
  }
};

window.warehouseModule = warehouseModule;
