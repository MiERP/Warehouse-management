// === CONSTRUCTIONS MODULE ===
const constructionModule = {
  editingId: null,

  async loadList() {
    const items = await window.api.constructions.getAll();
    const tbody = document.getElementById('construction-table-body');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="12" class="empty-state">Chưa có dữ liệu công trình</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(c => `
      <tr onclick="constructionModule.edit(${c.id})">
        <td><strong>${c.name}</strong></td>
        <td>${c.construction_type || '-'}</td>
        <td>${c.year_completed || '-'}</td>
        <td>${c.approval_decision_no || '-'}</td>
        <td>${c.contract_number || '-'}</td>
        <td>${c.contractor_name || '-'}</td>
        <td>${c.status ? '<span class="badge '+(c.status==='Hoàn thành'?'success':c.status==='Đang thi công'?'info':'warning')+'">' + c.status + '</span>' : '-'}</td>
        <td>${c.approved_investment ? new Intl.NumberFormat('vi-VN').format(c.approved_investment) : '-'}</td>
        <td>${c.estimated_cost ? new Intl.NumberFormat('vi-VN').format(c.estimated_cost) : '-'}</td>
        <td>${c.contract_value ? new Intl.NumberFormat('vi-VN').format(c.contract_value) : '-'}</td>
        <td>${c.settlement_approved ? new Intl.NumberFormat('vi-VN').format(c.settlement_approved) : '-'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();constructionModule.remove(${c.id})">Xóa</button></td>
      </tr>`).join('');
  },

  async showForm(data) {
    const units = await window.api.units.getAll();
    const d = data || {};
    const container = document.getElementById('construction-form-container');
    container.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <h3 class="card-title">${d.id ? 'Sửa công trình' : 'Thêm công trình'}</h3>
          <button class="btn btn-secondary" onclick="constructionModule.hideForm()">Đóng</button>
        </div>
        <div class="form-grid">
          <div class="form-section-title">Thông tin chung</div>
          <div class="form-group"><label class="form-label">Nội dung (tên công trình) *</label><input class="form-control" id="con-name" value="${d.name||''}"></div>
          <div class="form-group"><label class="form-label">Loại công trình</label><select class="form-control" id="con-type"><option value="">-- Chọn --</option><option>SỬA CHỮA, NÂNG CẤP</option><option>LÀM MỚI</option><option>Xây mới</option><option>Cải tạo</option></select></div>
          <div class="form-group"><label class="form-label">Năm hoàn thành</label><input type="number" class="form-control" id="con-end" value="${d.year_completed||''}"></div>
          <div class="form-group"><label class="form-label">Đơn vị cha</label><select class="form-control" id="con-parent">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">Đơn vị con</label><select class="form-control" id="con-child">${buildOptions(units)}</select></div>
          <div class="form-group"><label class="form-label">Số QĐ phê duyệt</label><input class="form-control" id="con-approval" value="${d.approval_decision_no||''}"></div>

          <div class="form-section-title">Thông tin hợp đồng</div>
          <div class="form-group"><label class="form-label">Số hợp đồng</label><input class="form-control" id="con-contract-no" value="${d.contract_number||''}"></div>
          <div class="form-group"><label class="form-label">Tên nhà thầu</label><input class="form-control" id="con-contractor" value="${d.contractor_name||''}"></div>
          <div class="form-group"><label class="form-label">Địa chỉ nhà thầu</label><input class="form-control" id="con-contractor-addr" value="${d.contractor_address||''}"></div>
          <div class="form-group"><label class="form-label">Mã số thuế</label><input class="form-control" id="con-tax" value="${d.contractor_tax_code||''}"></div>

          <div class="form-section-title">Thẩm tra & Tiến độ</div>
          <div class="form-group"><label class="form-label">CQ thẩm tra, phản biện</label><input class="form-control" id="con-review" value="${d.review_authority||''}"></div>
          <div class="form-group"><label class="form-label">Khối lượng</label><input class="form-control" id="con-volume" value="${d.work_volume||''}"></div>
          <div class="form-group"><label class="form-label">Thời gian bắt đầu</label><input class="form-control" id="con-start-date" value="${d.start_date||''}" placeholder="DD/MM/YYYY"></div>
          <div class="form-group"><label class="form-label">Thời gian kết thúc</label><input class="form-control" id="con-end-date" value="${d.end_date||''}" placeholder="DD/MM/YYYY"></div>
          <div class="form-group"><label class="form-label">Trạng thái</label><select class="form-control" id="con-status"><option value="">-- Chọn --</option><option>Đang thi công</option><option>Hoàn thành</option><option>Tạm dừng</option><option>Lập kế hoạch</option></select></div>

          <div class="form-section-title">Tài chính</div>
          <div class="form-group"><label class="form-label">Mức đầu tư được duyệt</label><input type="number" class="form-control" id="con-approved-inv" value="${d.approved_investment||''}"></div>
          <div class="form-group"><label class="form-label">Dự toán</label><input type="number" class="form-control" id="con-estimated" value="${d.estimated_cost||''}"></div>
          <div class="form-group"><label class="form-label">Giá trị hợp đồng</label><input type="number" class="form-control" id="con-contract-val" value="${d.contract_value||''}"></div>
          <div class="form-group"><label class="form-label">Quyết toán được duyệt</label><input type="number" class="form-control" id="con-settlement" value="${d.settlement_approved||''}"></div>
          <div class="form-group"><label class="form-label">Tổng tiền dự toán</label><input type="number" class="form-control" id="con-total-est" value="${d.total_estimated||''}"></div>
          <div class="form-group"><label class="form-label">SQ phê duyệt quyết toán</label><input class="form-control" id="con-settle-no" value="${d.settlement_decision_no||''}"></div>
          <div class="form-group"><label class="form-label">Giá trị quyết toán</label><input type="number" class="form-control" id="con-settle-val" value="${d.settlement_value||''}"></div>
          <div class="form-group"><label class="form-label">Tổng tiền từ đầu tư</label><input type="number" class="form-control" id="con-total-inv" value="${d.total_investment||''}"></div>
          <div class="form-group"><label class="form-label">Cơ quan đầu tư</label><input class="form-control" id="con-investor" value="${d.investor||''}"></div>

          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Mô tả</label><input class="form-control" id="con-desc" value="${d.description||''}"></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Ghi chú</label><input class="form-control" id="con-notes" value="${d.notes||''}"></div>
        </div>
        <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end">
          <button class="btn btn-secondary" onclick="constructionModule.hideForm()">Hủy</button>
          <button class="btn btn-primary" onclick="constructionModule.save()">Lưu</button>
        </div>
      </div>`;
    if (d.id) {
      this.editingId = d.id;
      if(d.parent_unit_id) document.getElementById('con-parent').value = d.parent_unit_id;
      if(d.child_unit_id) document.getElementById('con-child').value = d.child_unit_id;
      if(d.construction_type) document.getElementById('con-type').value = d.construction_type;
      if(d.status) document.getElementById('con-status').value = d.status;
    } else { this.editingId = null; }
  },

  hideForm() { document.getElementById('construction-form-container').innerHTML = ''; this.editingId = null; },

  async save() {
    const name = document.getElementById('con-name').value.trim();
    if (!name) { showToast('Nhập tên công trình', 'warning'); return; }
    const data = {
      name,
      parent_unit_id: parseInt(document.getElementById('con-parent').value) || null,
      child_unit_id: parseInt(document.getElementById('con-child').value) || null,
      construction_type: document.getElementById('con-type').value || null,
      year_started: null,
      year_completed: parseInt(document.getElementById('con-end').value) || null,
      status: document.getElementById('con-status').value || null,
      budget: 0,
      investor: document.getElementById('con-investor').value.trim() || null,
      description: document.getElementById('con-desc').value.trim() || null,
      progress: 0,
      approval_decision_no: document.getElementById('con-approval').value.trim() || null,
      contract_number: document.getElementById('con-contract-no').value.trim() || null,
      contractor_name: document.getElementById('con-contractor').value.trim() || null,
      contractor_address: document.getElementById('con-contractor-addr').value.trim() || null,
      contractor_tax_code: document.getElementById('con-tax').value.trim() || null,
      review_authority: document.getElementById('con-review').value.trim() || null,
      work_volume: document.getElementById('con-volume').value.trim() || null,
      start_date: document.getElementById('con-start-date').value.trim() || null,
      end_date: document.getElementById('con-end-date').value.trim() || null,
      approved_investment: parseFloat(document.getElementById('con-approved-inv').value) || 0,
      estimated_cost: parseFloat(document.getElementById('con-estimated').value) || 0,
      contract_value: parseFloat(document.getElementById('con-contract-val').value) || 0,
      settlement_approved: parseFloat(document.getElementById('con-settlement').value) || 0,
      total_estimated: parseFloat(document.getElementById('con-total-est').value) || 0,
      settlement_decision_no: document.getElementById('con-settle-no').value.trim() || null,
      settlement_value: parseFloat(document.getElementById('con-settle-val').value) || 0,
      total_investment: parseFloat(document.getElementById('con-total-inv').value) || 0,
      notes: document.getElementById('con-notes').value.trim() || null
    };
    try {
      if (this.editingId) await window.api.constructions.update(this.editingId, data);
      else await window.api.constructions.create(data);
      showToast(this.editingId ? 'Đã cập nhật' : 'Đã thêm', 'success');
      this.hideForm(); this.loadList();
    } catch (e) { showToast('Lỗi: ' + e.message, 'error'); }
  },

  async edit(id) { const d = await window.api.constructions.getById(id); if (d) this.showForm(d); },
  async remove(id) { if (await confirmAction('Xóa công trình này?')) { await window.api.constructions.delete(id); showToast('Đã xóa','success'); this.loadList(); } },
  exportExcel() { excelHelper.exportModule('constructions', 'Cong_trinh'); }
};
