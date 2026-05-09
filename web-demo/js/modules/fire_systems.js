// === FIRE SYSTEMS MODULE ===
const fireModule = {
  editingId: null,

  async loadList() {
    const items = await window.api.fireSystems.getAll();
    const tbody = document.getElementById('fire-table-body');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="12" class="empty-state">Chưa có dữ liệu cứu hỏa</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(f => `
      <tr onclick="fireModule.edit(${f.id})">
        <td>${f.parent_unit_name || '-'}</td>
        <td>${f.child_unit_name || '-'}</td>
        <td>${f.unit_measure || '-'}</td>
        <td>${f.quantity || 0}</td>
        <td>${f.year_installed || '-'}</td>
        <td>${f.year_repaired || '-'}</td>
        <td>${f.pump_house_count || 0}</td>
        <td>${f.hydrant_count || 0}</td>
        <td>${f.investor || '-'}</td>
        <td>${f.status ? '<span class="badge '+(f.status==='Hoạt động bình thường'?'success':'warning')+'">' + f.status + '</span>' : '-'}</td>
        <td>${f.repair_need || 0}</td>
        <td>${f.new_install_need || 0}</td>
        <td><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();fireModule.remove(${f.id})">Xóa</button></td>
      </tr>`).join('');
  },

  async showForm(data) {
    const units = await window.api.units.getAll();
    const d = data || {};
    const container = document.getElementById('fire-form-container');
    container.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <h3 class="card-title">${d.id ? 'Sửa hệ thống cứu hỏa' : 'Thêm hệ thống cứu hỏa'}</h3>
          <button class="btn btn-secondary" onclick="fireModule.hideForm()">Đóng</button>
        </div>
        <div class="form-grid">
          <div class="form-section-title">Thông tin đơn vị</div>
          <div class="form-group"><label class="form-label">Đơn vị cha</label><select class="form-control" id="fire-parent">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">Tên đơn vị</label><select class="form-control" id="fire-child">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">ĐVT</label><select class="form-control" id="fire-measure"><option value="">-- Chọn --</option><option>Hệ thống</option><option>Bộ</option></select></div>
          <div class="form-section-title">Thông số kỹ thuật</div>
          <div class="form-group"><label class="form-label">Số lượng</label><input type="number" class="form-control" id="fire-qty" value="${d.quantity||''}"></div>
          <div class="form-group"><label class="form-label">Năm lắp đặt</label><input type="number" class="form-control" id="fire-year" value="${d.year_installed||''}"></div>
          <div class="form-group"><label class="form-label">Năm sửa chữa</label><input type="number" class="form-control" id="fire-repair" value="${d.year_repaired||''}"></div>
          <div class="form-group"><label class="form-label">Số nhà bơm</label><input type="number" class="form-control" id="fire-pump" value="${d.pump_house_count||''}"></div>
          <div class="form-group"><label class="form-label">Số họng</label><input type="number" class="form-control" id="fire-hydrant" value="${d.hydrant_count||''}"></div>
          <div class="form-group"><label class="form-label">Cơ quan chủ đầu tư</label><input class="form-control" id="fire-investor" value="${d.investor||''}"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Tình trạng</label><input class="form-control" id="fire-status" value="${d.status||''}" placeholder="Hoạt động bình thường"></div>
          <div class="form-section-title">Nhu cầu</div>
          <div class="form-group"><label class="form-label">Sửa chữa, cải tạo</label><input type="number" class="form-control" id="fire-repair-need" value="${d.repair_need||''}"></div>
          <div class="form-group"><label class="form-label">Lắp đặt mới</label><input type="number" class="form-control" id="fire-new-need" value="${d.new_install_need||''}"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Ghi chú</label><input class="form-control" id="fire-notes" value="${d.notes||''}"></div>
        </div>
        <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end">
          <button class="btn btn-secondary" onclick="fireModule.hideForm()">Hủy</button>
          <button class="btn btn-primary" onclick="fireModule.save()">Lưu</button>
        </div>
      </div>`;
    if (d.id) {
      this.editingId = d.id;
      if(d.parent_unit_id) document.getElementById('fire-parent').value = d.parent_unit_id;
      if(d.child_unit_id) document.getElementById('fire-child').value = d.child_unit_id;
      if(d.unit_measure) document.getElementById('fire-measure').value = d.unit_measure;
    } else { this.editingId = null; }
  },

  hideForm() { document.getElementById('fire-form-container').innerHTML = ''; this.editingId = null; },

  async save() {
    const data = {
      parent_unit_id: parseInt(document.getElementById('fire-parent').value) || null,
      child_unit_id: parseInt(document.getElementById('fire-child').value) || null,
      unit_measure: document.getElementById('fire-measure').value || null,
      equipment_type: null,
      quantity: parseInt(document.getElementById('fire-qty').value) || 0,
      year_installed: parseInt(document.getElementById('fire-year').value) || null,
      year_repaired: parseInt(document.getElementById('fire-repair').value) || null,
      pump_house_count: parseInt(document.getElementById('fire-pump').value) || 0,
      hydrant_count: parseInt(document.getElementById('fire-hydrant').value) || 0,
      investor: document.getElementById('fire-investor').value.trim() || null,
      status: document.getElementById('fire-status').value.trim() || null,
      repair_need: parseInt(document.getElementById('fire-repair-need').value) || 0,
      new_install_need: parseInt(document.getElementById('fire-new-need').value) || 0,
      notes: document.getElementById('fire-notes').value.trim() || null
    };
    try {
      if (this.editingId) await window.api.fireSystems.update(this.editingId, data);
      else await window.api.fireSystems.create(data);
      showToast(this.editingId ? 'Đã cập nhật' : 'Đã thêm', 'success');
      this.hideForm(); this.loadList();
    } catch (e) { showToast('Lỗi: ' + e.message, 'error'); }
  },

  async edit(id) { const d = await window.api.fireSystems.getById(id); if (d) this.showForm(d); },
  async remove(id) { if (await confirmAction('Xóa hệ thống cứu hỏa này?')) { await window.api.fireSystems.delete(id); showToast('Đã xóa','success'); this.loadList(); } },
  exportExcel() { excelHelper.exportModule('fireSystems', 'Cuu_hoa'); }
};
