// === CAMERA MODULE ===
const cameraModule = {
  editingId: null,

  async loadList() {
    const items = await window.api.cameras.getAll();
    const tbody = document.getElementById('camera-table-body');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="empty-state">Chưa có dữ liệu camera</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(c => `
      <tr onclick="cameraModule.edit(${c.id})" data-id="${c.id}">
        <td>${c.parent_unit_name || '-'}</td>
        <td>${c.child_unit_name || '-'}</td>
        <td>${c.unit_measure || '-'}</td>
        <td>${c.quantity || 0}</td>
        <td>${c.year_installed || '-'}</td>
        <td>${c.year_repaired || '-'}</td>
        <td>${c.screen_count || 0}</td>
        <td>${c.camera_count || 0}</td>
        <td>${c.investor || '-'}</td>
        <td>${c.status ? '<span class="badge info">' + c.status + '</span>' : '-'}</td>
        <td>${c.repair_need || 0}</td>
        <td>${c.new_install_need || 0}</td>
        <td><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();cameraModule.remove(${c.id})">Xóa</button></td>
      </tr>`).join('');
  },

  async showForm(data) {
    const units = await window.api.units.getAll();
    const d = data || {};
    const container = document.getElementById('camera-form-container');
    container.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <h3 class="card-title">${d.id ? 'Sửa camera' : 'Thêm hệ thống camera'}</h3>
          <button class="btn btn-secondary" onclick="cameraModule.hideForm()">Đóng</button>
        </div>
        <div class="form-grid">
          <div class="form-section-title">Thông tin đơn vị</div>
          <div class="form-group"><label class="form-label">Đơn vị cha</label><select class="form-control" id="cam-parent">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">Tên đơn vị</label><select class="form-control" id="cam-child">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">ĐVT</label><select class="form-control" id="cam-measure"><option value="">-- Chọn --</option><option>Bộ</option><option>Hệ thống</option><option>Cái</option></select></div>
          <div class="form-section-title">Thông số kỹ thuật</div>
          <div class="form-group"><label class="form-label">Số lượng</label><input type="number" class="form-control" id="cam-qty" value="${d.quantity||''}"></div>
          <div class="form-group"><label class="form-label">Năm lắp đặt</label><input type="number" class="form-control" id="cam-year" value="${d.year_installed||''}"></div>
          <div class="form-group"><label class="form-label">Năm sửa chữa</label><input type="number" class="form-control" id="cam-repair-year" value="${d.year_repaired||''}"></div>
          <div class="form-group"><label class="form-label">Số màn hình</label><input type="number" class="form-control" id="cam-screen" value="${d.screen_count||''}"></div>
          <div class="form-group"><label class="form-label">Số CAM</label><input type="number" class="form-control" id="cam-count" value="${d.camera_count||''}"></div>
          <div class="form-group"><label class="form-label">Cơ quan chủ đầu tư</label><input class="form-control" id="cam-investor" value="${d.investor||''}"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Tình trạng</label><input class="form-control" id="cam-status" value="${d.status||''}"></div>
          <div class="form-section-title">Nhu cầu</div>
          <div class="form-group"><label class="form-label">Sửa chữa, cải tạo</label><input type="number" class="form-control" id="cam-repair-need" value="${d.repair_need||''}"></div>
          <div class="form-group"><label class="form-label">Lắp đặt mới</label><input type="number" class="form-control" id="cam-new-need" value="${d.new_install_need||''}"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Ghi chú</label><input class="form-control" id="cam-notes" value="${d.notes||''}"></div>
        </div>
        <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end">
          <button class="btn btn-secondary" onclick="cameraModule.hideForm()">Hủy</button>
          <button class="btn btn-primary" onclick="cameraModule.save()">Lưu</button>
        </div>
      </div>`;
    if (d.id) {
      this.editingId = d.id;
      if (d.parent_unit_id) document.getElementById('cam-parent').value = d.parent_unit_id;
      if (d.child_unit_id) document.getElementById('cam-child').value = d.child_unit_id;
      if (d.unit_measure) document.getElementById('cam-measure').value = d.unit_measure;
    } else { this.editingId = null; }
  },

  hideForm() { document.getElementById('camera-form-container').innerHTML = ''; this.editingId = null; },

  async save() {
    const data = {
      parent_unit_id: parseInt(document.getElementById('cam-parent').value) || null,
      child_unit_id: parseInt(document.getElementById('cam-child').value) || null,
      unit_measure: document.getElementById('cam-measure').value || null,
      quantity: parseInt(document.getElementById('cam-qty').value) || 0,
      camera_count: parseInt(document.getElementById('cam-count').value) || 0,
      screen_count: parseInt(document.getElementById('cam-screen').value) || 0,
      year_installed: parseInt(document.getElementById('cam-year').value) || null,
      year_repaired: parseInt(document.getElementById('cam-repair-year').value) || null,
      investor: document.getElementById('cam-investor').value.trim() || null,
      status: document.getElementById('cam-status').value.trim() || null,
      repair_need: parseInt(document.getElementById('cam-repair-need').value) || 0,
      new_install_need: parseInt(document.getElementById('cam-new-need').value) || 0,
      notes: document.getElementById('cam-notes').value.trim() || null
    };
    try {
      if (this.editingId) await window.api.cameras.update(this.editingId, data);
      else await window.api.cameras.create(data);
      showToast(this.editingId ? 'Đã cập nhật' : 'Đã thêm camera', 'success');
      this.hideForm(); this.loadList();
    } catch (e) { showToast('Lỗi: ' + e.message, 'error'); }
  },

  async edit(id) { const d = await window.api.cameras.getById(id); if (d) this.showForm(d); },
  async remove(id) { if (await confirmAction('Xóa hệ thống camera này?')) { await window.api.cameras.delete(id); showToast('Đã xóa','success'); this.loadList(); } },
  exportExcel() { excelHelper.exportModule('cameras', 'Camera'); }
};
