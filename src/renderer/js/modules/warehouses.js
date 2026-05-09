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
    container.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <h3 class="card-title">${d.id ? 'Sửa nhà kho' : 'Thêm nhà kho mới'}</h3>
          <button class="btn btn-secondary" onclick="warehouseModule.hideForm()">Đóng</button>
        </div>
        <div class="form-grid">
          <div class="form-section-title">Thông tin chung</div>
           <div class="form-group"><label class="form-label">Tên kho *</label><input class="form-control" id="wh-name" value="${escapeHTML(d.name||'')}"></div>
          <div class="form-group"><label class="form-label">Phân loại kho</label><select class="form-control" id="wh-category"><option value="">-- Chọn --</option><option value="chien_dich">Kho chiến dịch</option><option value="chien_thuat">Kho chiến thuật</option></select></div>
          <div class="form-group"><label class="form-label">Đơn vị cha</label><select class="form-control" id="wh-parent-unit">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">Đơn vị con</label><select class="form-control" id="wh-child-unit">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">Tỉnh</label><select class="form-control" id="wh-province" onchange="warehouseModule.onProvinceChange()">${buildOptions(provinces)}</select></div>
          <div class="form-group"><label class="form-label">Xã</label><select class="form-control" id="wh-ward"><option>-- Chọn tỉnh trước --</option></select></div>
           <div class="form-group"><label class="form-label">Địa chỉ chi tiết</label><input class="form-control" id="wh-address" value="${escapeHTML(d.address||'')}" placeholder="Phường, TP..."></div>
          <div class="form-group"><label class="form-label">Loại nhà kho</label><select class="form-control" id="wh-type">${buildOptions(wtypes)}</select></div>

          <div class="form-section-title">Thông số kỹ thuật</div>
          <div class="form-group"><label class="form-label">Số nhà kho</label><input type="number" class="form-control" id="wh-quantity" value="${d.quantity||''}"></div>
          <div class="form-group"><label class="form-label">DT chiếm đất (m²)</label><input type="number" class="form-control" id="wh-land-area" value="${d.land_area||''}"></div>
          <div class="form-group"><label class="form-label">DT nhà kho (m²)</label><input type="number" class="form-control" id="wh-area" value="${d.warehouse_area||''}"></div>
          <div class="form-group"><label class="form-label">DT kho chiếm đất (m²)</label><input type="number" class="form-control" id="wh-wh-land-area" value="${d.warehouse_land_area||''}"></div>
          <div class="form-group"><label class="form-label">Năm xây dựng</label><input type="number" class="form-control" id="wh-year-built" value="${d.year_built||''}"></div>
          <div class="form-group"><label class="form-label">Năm sửa/nâng cấp</label><input type="number" class="form-control" id="wh-year-renovated" value="${d.year_renovated||''}"></div>
           <div class="form-group"><label class="form-label">Khả năng cải tạo</label><input class="form-control" id="wh-renovation" value="${escapeHTML(d.renovation_potential||'')}" placeholder="km"></div>
          <div class="form-group"><label class="form-label">Trữ lượng dự trữ (tấn)</label><input type="number" class="form-control" id="wh-capacity" value="${d.storage_capacity||''}"></div>
          <div class="form-group"><label class="form-label">Trữ lượng hiện tại (tấn)</label><input type="number" class="form-control" id="wh-stock" value="${d.current_stock||''}"></div>
          <div class="form-group"><label class="form-label">Loại hàng</label><select class="form-control" id="wh-goods">${buildOptions(gtypes)}</select></div>

          <div class="form-section-title">Phân cấp chất lượng nhà kho</div>
          <div class="form-group"><label class="form-label">Xếp loại chung</label><select class="form-control" id="wh-quality">${buildOptions(qgrades)}</select></div>
          <div class="form-group"><label class="form-label">DT Cấp 2,3 (m²)</label><input type="number" class="form-control" id="wh-q23" value="${d.quality_grade_23_area||''}"></div>
          <div class="form-group"><label class="form-label">DT Cấp 4 (m²)</label><input type="number" class="form-control" id="wh-q4" value="${d.quality_grade_4_area||''}"></div>
          <div class="form-group"><label class="form-label">Nhà tạm (m²)</label><input type="number" class="form-control" id="wh-temp" value="${d.temp_house_area||''}"></div>

          <div class="form-section-title">Hệ thống chống sét</div>
          <div class="form-group"><label class="form-label">Nhà cấp (m²)</label><input type="number" class="form-control" id="wh-lightning-area" value="${d.lightning_grade_area||''}"></div>
          <div class="form-group"><label class="form-label">Hiện có (cái)</label><input type="number" class="form-control" id="wh-lightning-count" value="${d.lightning_existing_count||''}"></div>

          <div class="form-section-title">Hệ thống cứu hỏa</div>
          <div class="form-group"><label class="form-label">Nhu cầu cứu hỏa</label><select class="form-control" id="wh-fire-need"><option value="">-- Chọn --</option><option>Cần thiết</option><option>Không cần</option></select></div>
          <div class="form-group"><label class="form-label">Hiện có cứu hỏa</label><select class="form-control" id="wh-fire-existing"><option value="">-- Chọn --</option><option>Có</option><option>Không</option></select></div>

           <div class="form-group" style="grid-column:1/-1"><label class="form-label">Ghi chú</label><input class="form-control" id="wh-notes" value="${escapeHTML(d.notes||'')}"></div>
        </div>
        <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end">
          <button class="btn btn-secondary" onclick="warehouseModule.hideForm()">Hủy</button>
          <button class="btn btn-primary" onclick="warehouseModule.save()">Lưu</button>
        </div>
      </div>`;
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
    if (!provinceId) { wardSelect.innerHTML = '<option>-- Chọn tỉnh trước --</option>'; return; }
    const wards = await window.api.locations.getWardsByProvince(parseInt(provinceId));
    wardSelect.innerHTML = buildOptions(wards);
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

  exportExcel() { excelHelper.exportModule('warehouses', 'Nha_kho'); }
};

window.warehouseModule = warehouseModule;
