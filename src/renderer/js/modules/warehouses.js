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
      appendTextCell(row, warehouse.warehouse_category === 'chien_dich' ? 'Kho chiến dịch' : warehouse.warehouse_category === 'chien_thuat' ? 'Kho chiến thuật' : '-');

      const categoryCell = document.createElement('td');
      if (warehouse.warehouse_type_name) {
        const badge = document.createElement('span');
        badge.className = 'badge info';
        badge.textContent = warehouse.warehouse_type_name;
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
    this.currentUnits = units;
    this.editingId = d.id || null;
    this.currentRecord = d.id ? d : null;
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
    formGrid.appendChild(this._createFormField('wh-name', 'Tên kho *', 'input', d.name || d.unit_name || ''));
    formGrid.appendChild(this._createUnitSearchField(units, 'Đơn vị cấp trên trực tiếp', 'wh-parent-unit-input', 'wh-parent-unit', d.parent_unit_id || ''));
    formGrid.appendChild(this._createSelectField('wh-warehouse-category', 'Loại kho', [
      { value: '', text: '-- Chọn --' },
      { value: 'chien_thuat', text: 'Kho chiến thuật' },
      { value: 'chien_dich', text: 'Kho chiến dịch' }
    ]));
    formGrid.appendChild(createCatalogCombobox(wtypes, 'warehouse_types', 'Phân loại kho', 'wh-category-input', 'wh-category-value', d.warehouse_type_id || ''));
    const provinceField = this._createSelectField('wh-province', 'Tỉnh', this._buildOptions(provinces));
    provinceField.querySelector('select').addEventListener('change', () => warehouseModule.onProvinceChange());
    formGrid.appendChild(provinceField);
    formGrid.appendChild(this._createSelectField('wh-ward', 'Xã', [{ value: '', text: '-- Chọn tỉnh trước --' }]));
    formGrid.appendChild(this._createFormField('wh-address', 'Địa chỉ chi tiết', 'input', d.address || '', 'Phường, TP...'));

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
    formGrid.appendChild(createCatalogCombobox(gtypes, 'goods_types', 'Loại hàng', 'wh-goods-input', 'wh-goods-value', d.goods_type_id || ''));

    // Section: Phân cấp chất lượng
    const secQuality = document.createElement('div');
    secQuality.className = 'form-section-title';
    secQuality.textContent = 'Phân cấp chất lượng nhà kho';
    formGrid.appendChild(secQuality);
    formGrid.appendChild(createCatalogCombobox(qgrades, 'quality_grades', 'Xếp loại chung', 'wh-quality-input', 'wh-quality-value', d.quality_grade_id || ''));
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
      if (d.warehouse_category) document.getElementById('wh-warehouse-category').value = d.warehouse_category;
      if (d.province_id) { document.getElementById('wh-province').value = d.province_id; await this.onProvinceChange(); if (d.ward_id) document.getElementById('wh-ward').value = d.ward_id; }
      if (d.goods_type_id) { document.getElementById('wh-goods-value').value = d.goods_type_id; document.getElementById('wh-goods-input').value = catalogNameById(gtypes, d.goods_type_id); }
      if (d.quality_grade_id) { document.getElementById('wh-quality-value').value = d.quality_grade_id; document.getElementById('wh-quality-input').value = catalogNameById(qgrades, d.quality_grade_id); }
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
    this.currentRecord = null;
    this.currentUnits = [];
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
    const parentSelection = this._resolveUnitSearch('wh-parent-unit-input', 'wh-parent-unit');
    if (!parentSelection.valid) {
      showToast('Vui lòng chọn đơn vị cấp trên từ danh sách', 'warning');
      return;
    }
    const data = {
      name,
      unit_id: this.currentRecord?.unit_id || null,
      parent_unit_id: parentSelection.id,
      child_unit_id: null,
      province_id: parseInt(document.getElementById('wh-province').value) || null,
      ward_id: parseInt(document.getElementById('wh-ward').value) || null,
      address: document.getElementById('wh-address').value.trim() || null,
      warehouse_category: document.getElementById('wh-warehouse-category').value || null,
      quantity: parseInt(document.getElementById('wh-quantity').value) || 0,
      land_area: parseFloat(document.getElementById('wh-land-area').value) || 0,
      warehouse_area: parseFloat(document.getElementById('wh-area').value) || 0,
      warehouse_land_area: parseFloat(document.getElementById('wh-wh-land-area').value) || 0,
      warehouse_type_id: await resolveCatalogValue('warehouse_types', 'wh-category-input', 'wh-category-value'),
      year_built: parseInt(document.getElementById('wh-year-built').value) || null,
      year_renovated: parseInt(document.getElementById('wh-year-renovated').value) || null,
      renovation_potential: document.getElementById('wh-renovation').value.trim() || null,
      storage_capacity: parseFloat(document.getElementById('wh-capacity').value) || 0,
      current_stock: parseFloat(document.getElementById('wh-stock').value) || 0,
      goods_type_id: await resolveCatalogValue('goods_types', 'wh-goods-input', 'wh-goods-value'),
      quality_grade_id: await resolveCatalogValue('quality_grades', 'wh-quality-input', 'wh-quality-value'),
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
      if (this.editingId && !(await this._confirmSaveChanges(data))) return;
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
      option.textContent = opt.text ?? opt.label ?? '';
      select.appendChild(option);
    });
    group.append(lbl, select);
    return group;
  },

  _createUnitSearchField(units, label, inputId, valueId, value = '') {
    const group = document.createElement('div');
    group.className = 'form-group';
    const lbl = document.createElement('label');
    lbl.className = 'form-label';
    lbl.setAttribute('for', inputId);
    lbl.textContent = label;

    const input = document.createElement('input');
    input.className = 'form-control';
    input.id = inputId;
    input.setAttribute('list', `${inputId}-options`);
    input.placeholder = '-- Chọn hoặc tìm đơn vị --';

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = valueId;

    const datalist = document.createElement('datalist');
    datalist.id = `${inputId}-options`;
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit.name || '';
      datalist.appendChild(option);
    });

    const selected = units.find(unit => String(unit.id) === String(value || ''));
    if (selected) {
      input.value = selected.name || '';
      hidden.value = String(selected.id);
    }

    const syncValue = () => {
      const text = input.value.trim();
      if (!text) {
        hidden.value = '';
        return;
      }
      const matched = units.find(unit => String(unit.name || '').toLowerCase() === text.toLowerCase());
      hidden.value = matched ? String(matched.id) : '';
    };
    input.addEventListener('input', syncValue);
    input.addEventListener('change', syncValue);

    group.append(lbl, input, hidden, datalist);
    return group;
  },

  _resolveUnitSearch(inputId, valueId) {
    const text = document.getElementById(inputId).value.trim();
    if (!text) return { valid: true, id: null };
    const id = parseInt(document.getElementById(valueId).value, 10);
    return Number.isFinite(id) ? { valid: true, id } : { valid: false, id: null };
  },

  async _confirmSaveChanges(data) {
    const changes = this._changedFields(this.currentRecord || {}, data);
    if (!changes.length) {
      showToast('Không có thay đổi để lưu', 'info');
      return false;
    }
    const parentChange = changes.find(change => change.key === 'parent_unit_id');
    const prefix = parentChange
      ? `Bạn đang chuyển đơn vị cấp trên trực tiếp của kho này từ "${parentChange.from}" sang "${parentChange.to}". `
      : '';
    const message = `${prefix}Có ${changes.length} thay đổi sẽ được lưu. Bạn có muốn tiếp tục không?`;
    return confirmAction(message);
  },

  _changedFields(current, data) {
    const fields = [
      { key: 'name', label: 'Tên kho', type: 'text' },
      { key: 'parent_unit_id', label: 'Đơn vị cấp trên trực tiếp', type: 'unit' },
      { key: 'province_id', label: 'Tỉnh', type: 'id' },
      { key: 'ward_id', label: 'Xã', type: 'id' },
      { key: 'address', label: 'Địa chỉ chi tiết', type: 'text' },
      { key: 'warehouse_category', label: 'Loại kho', type: 'text' },
      { key: 'warehouse_type_id', label: 'Phân loại kho', type: 'id' },
      { key: 'quantity', label: 'Số nhà kho', type: 'number' },
      { key: 'land_area', label: 'DT chiếm đất', type: 'number' },
      { key: 'warehouse_area', label: 'DT nhà kho', type: 'number' },
      { key: 'warehouse_land_area', label: 'DT kho chiếm đất', type: 'number' },
      { key: 'year_built', label: 'Năm xây dựng', type: 'nullableNumber' },
      { key: 'year_renovated', label: 'Năm sửa/nâng cấp', type: 'nullableNumber' },
      { key: 'renovation_potential', label: 'Khả năng cải tạo', type: 'text' },
      { key: 'storage_capacity', label: 'Trữ lượng dự trữ', type: 'number' },
      { key: 'current_stock', label: 'Trữ lượng hiện tại', type: 'number' },
      { key: 'goods_type_id', label: 'Loại hàng', type: 'id' },
      { key: 'quality_grade_id', label: 'Xếp loại chung', type: 'id' },
      { key: 'quality_grade_23_area', label: 'DT Cấp 2,3', type: 'number' },
      { key: 'quality_grade_4_area', label: 'DT Cấp 4', type: 'number' },
      { key: 'temp_house_area', label: 'Nhà tạm', type: 'number' },
      { key: 'lightning_grade_area', label: 'Nhà cấp', type: 'number' },
      { key: 'lightning_existing_count', label: 'Hiện có chống sét', type: 'number' },
      { key: 'fire_need', label: 'Nhu cầu cứu hỏa', type: 'text' },
      { key: 'fire_existing', label: 'Hiện có cứu hỏa', type: 'text' },
      { key: 'notes', label: 'Ghi chú', type: 'text' }
    ];
    return fields
      .filter(field => this._normalizeFieldValue(current[field.key], field.type) !== this._normalizeFieldValue(data[field.key], field.type))
      .map(field => ({
        key: field.key,
        label: field.label,
        from: this._displayFieldValue(current[field.key], field.type),
        to: this._displayFieldValue(data[field.key], field.type)
      }));
  },

  _normalizeFieldValue(value, type) {
    if (type === 'number') return String(Number(value || 0));
    if (type === 'nullableNumber' || type === 'id' || type === 'unit') {
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? String(parsed) : '';
    }
    return String(value ?? '').trim();
  },

  _displayFieldValue(value, type) {
    if (type === 'unit') return this._unitNameById(value) || 'Không có';
    if (value === null || value === undefined || value === '') return 'Trống';
    return String(value);
  },

  _unitNameById(id) {
    const unit = (this.currentUnits || []).find(item => String(item.id) === String(id || ''));
    return unit ? unit.name : '';
  }
};

window.warehouseModule = warehouseModule;
