// === CONSTRUCTIONS MODULE ===
const constructionModule = {
  editingId: null,
  activeFilter: null,

  currency(value) {
    return value ? new Intl.NumberFormat('vi-VN').format(value) : '-';
  },

  textInput(grid, id, label, value = '', options = {}) {
    grid.appendChild(createFormGroup({ id, label, value, type: options.type || 'text', placeholder: options.placeholder || '', full: options.full || false }));
  },

  selectInput(grid, id, label, value, options) {
    grid.appendChild(createFormGroup({ id, label, value: value || '', options }));
  },

  async loadList(filter = this.activeFilter) {
    this.activeFilter = filter || null;
    let items = await window.api.constructions.getAll();
    if (this.activeFilter?.field) {
      const value = String(this.activeFilter.value || '').toLowerCase();
      items = items.filter(item => String(item[this.activeFilter.field] || '').toLowerCase().includes(value));
    }
    const tbody = document.getElementById('construction-table-body');
    clearElement(tbody);
    if (!items.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 13;
      cell.className = 'empty-state';
      cell.textContent = 'Chưa có dữ liệu công trình';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => this.edit(item.id));
      const nameCell = appendTextCell(row, item.name);
      nameCell.style.fontWeight = '600';
      appendTextCell(row, item.construction_type);
      appendTextCell(row, item.year_started);
      appendTextCell(row, item.year_completed);
      appendTextCell(row, item.approval_decision_no);
      appendTextCell(row, item.contract_number);
      appendTextCell(row, item.contractor_name);
      appendBadgeCell(row, item.status);
      appendTextCell(row, this.currency(item.approved_investment));
      appendTextCell(row, this.currency(item.estimated_cost));
      appendTextCell(row, this.currency(item.contract_value));
      appendTextCell(row, this.currency(item.settlement_approved));
      const actionCell = document.createElement('td');
      actionCell.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', event => {
        event.stopPropagation();
        this.remove(item.id);
      }));
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });
  },

  openFiltered(filter) {
    navigateTo('constructions');
    setTimeout(() => this.loadList(filter), 100);
  },

  getDefaultStatuses() {
    return ['Đang thi công', 'Hoàn thành', 'Tạm dừng', 'Chưa triển khai'];
  },

  async getStatusOptions() {
    const rows = await window.api.constructions.getAll();
    const statuses = new Set(this.getDefaultStatuses());
    rows.forEach(row => { if (row.status) statuses.add(String(row.status).trim()); });
    return [...statuses].filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
  },

  statusInput(grid, value) {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.setAttribute('for', 'con-status');
    label.textContent = 'Trạng thái';
    const input = document.createElement('input');
    input.className = 'form-control';
    input.id = 'con-status';
    input.setAttribute('list', 'con-status-options');
    input.value = value || '';
    input.placeholder = 'Chọn hoặc nhập trạng thái mới';
    const datalist = document.createElement('datalist');
    datalist.id = 'con-status-options';
    this.statusOptions.forEach(status => {
      const option = document.createElement('option');
      option.value = status;
      datalist.appendChild(option);
    });
    group.append(label, input, datalist);
    grid.appendChild(group);
  },

  async showForm(data) {
    const [units, statusOptions] = await Promise.all([window.api.units.getAll(), this.getStatusOptions()]);
    this.statusOptions = statusOptions;
    const current = data || {};
    this.editingId = current.id || null;
    const container = document.getElementById('construction-form-container');
    clearElement(container);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = 'var(--space-lg)';

    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = current.id ? 'Sửa công trình' : 'Thêm công trình';
    header.appendChild(title);
    header.appendChild(createButton('Đóng', 'btn btn-secondary', () => this.hideForm()));
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'form-grid';
    appendSectionTitle(grid, 'Thông tin chung');
    this.textInput(grid, 'con-name', 'Nội dung (tên công trình) *', current.name || '');
    this.selectInput(grid, 'con-type', 'Loại công trình', current.construction_type, [
      { value: '', label: '-- Chọn --' }, 'SỬA CHỮA, NÂNG CẤP', 'LÀM MỚI', 'Xây mới', 'Cải tạo'
    ]);
    this.textInput(grid, 'con-start', 'Năm bắt đầu', current.year_started || '', { type: 'number' });
    this.textInput(grid, 'con-end', 'Năm hoàn thành', current.year_completed || '', { type: 'number' });
    this.selectInput(grid, 'con-parent', 'Đơn vị cha', current.parent_unit_id, unitOptions(units));
    this.selectInput(grid, 'con-child', 'Đơn vị con', current.child_unit_id, unitOptions(units));
    this.textInput(grid, 'con-approval', 'Số QĐ phê duyệt', current.approval_decision_no || '');

    appendSectionTitle(grid, 'Thông tin hợp đồng');
    this.textInput(grid, 'con-contract-no', 'Số hợp đồng', current.contract_number || '');
    this.textInput(grid, 'con-contractor', 'Tên nhà thầu', current.contractor_name || '');
    this.textInput(grid, 'con-contractor-addr', 'Địa chỉ nhà thầu', current.contractor_address || '');
    this.textInput(grid, 'con-tax', 'Mã số thuế', current.contractor_tax_code || '');

    appendSectionTitle(grid, 'Thẩm tra & Tiến độ');
    this.textInput(grid, 'con-review', 'CQ thẩm tra, phản biện', current.review_authority || '');
    this.textInput(grid, 'con-volume', 'Khối lượng', current.work_volume || '');
    this.textInput(grid, 'con-start-date', 'Thời gian bắt đầu', current.start_date || '', { placeholder: 'DD/MM/YYYY' });
    this.textInput(grid, 'con-end-date', 'Thời gian kết thúc', current.end_date || '', { placeholder: 'DD/MM/YYYY' });
    this.statusInput(grid, current.status);

    appendSectionTitle(grid, 'Giá trị đầu tư');
    this.textInput(grid, 'con-approved-inv', 'Tổng mức đầu tư phê duyệt', current.approved_investment || '', { type: 'number' });
    this.textInput(grid, 'con-estimated', 'Dự toán', current.estimated_cost || '', { type: 'number' });
    this.textInput(grid, 'con-contract-val', 'Giá trị hợp đồng', current.contract_value || '', { type: 'number' });
    this.textInput(grid, 'con-settlement', 'Quyết toán được duyệt', current.settlement_approved || '', { type: 'number' });
    this.textInput(grid, 'con-total-est', 'Tổng dự toán', current.total_estimated || '', { type: 'number' });
    this.textInput(grid, 'con-settle-no', 'Số quyết định quyết toán', current.settlement_decision_no || '');
    this.textInput(grid, 'con-settle-val', 'Giá trị quyết toán', current.settlement_value || '', { type: 'number' });
    this.textInput(grid, 'con-total-inv', 'Tổng đầu tư', current.total_investment || '', { type: 'number' });

    appendSectionTitle(grid, 'Thông tin bổ sung');
    this.textInput(grid, 'con-investor', 'Chủ đầu tư', current.investor || '');
    this.textInput(grid, 'con-desc', 'Mô tả', current.description || '', { full: true });
    this.textInput(grid, 'con-notes', 'Ghi chú', current.notes || '', { full: true });
    card.appendChild(grid);

    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end';
    footer.appendChild(createButton('Hủy', 'btn btn-secondary', () => this.hideForm()));
    footer.appendChild(createButton('Lưu', 'btn btn-primary', () => this.save()));
    card.appendChild(footer);
    container.appendChild(card);
    const documentContainer = document.createElement('div');
    documentContainer.id = 'construction-document-panel';
    container.appendChild(documentContainer);
    if (window.documentPanel) await documentPanel.render(documentContainer, 'constructions', this.editingId);
  },

  hideForm() {
    clearElement(document.getElementById('construction-form-container'));
    this.editingId = null;
  },

  value(id) {
    return document.getElementById(id).value.trim();
  },

  number(id) {
    const parsed = parseFloat(document.getElementById(id).value);
    return Number.isFinite(parsed) ? parsed : 0;
  },

  nullableInt(id) {
    const parsed = parseInt(document.getElementById(id).value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  },

  async save() {
    const data = {
      name: this.value('con-name'),
      parent_unit_id: this.nullableInt('con-parent'),
      child_unit_id: this.nullableInt('con-child'),
      construction_type: this.value('con-type') || null,
      year_started: this.nullableInt('con-start'),
      year_completed: this.nullableInt('con-end'),
      status: this.value('con-status') || null,
      budget: 0,
      investor: this.value('con-investor') || null,
      description: this.value('con-desc') || null,
      progress: 0,
      approval_decision_no: this.value('con-approval') || null,
      contract_number: this.value('con-contract-no') || null,
      contractor_name: this.value('con-contractor') || null,
      contractor_address: this.value('con-contractor-addr') || null,
      contractor_tax_code: this.value('con-tax') || null,
      review_authority: this.value('con-review') || null,
      work_volume: this.value('con-volume') || null,
      start_date: this.value('con-start-date') || null,
      end_date: this.value('con-end-date') || null,
      approved_investment: this.number('con-approved-inv'),
      estimated_cost: this.number('con-estimated'),
      contract_value: this.number('con-contract-val'),
      settlement_approved: this.number('con-settlement'),
      total_estimated: this.number('con-total-est'),
      settlement_decision_no: this.value('con-settle-no') || null,
      settlement_value: this.number('con-settle-val'),
      total_investment: this.number('con-total-inv'),
      notes: this.value('con-notes') || null
    };
    try {
      if (this.editingId) await window.api.constructions.update(this.editingId, data);
      else await window.api.constructions.create(data);
      showToast(this.editingId ? 'Đã cập nhật' : 'Đã thêm', 'success');
      this.hideForm();
      await this.loadList();
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  },

  async edit(id) {
    const data = await window.api.constructions.getById(id);
    if (data) await this.showForm(data);
  },

  async remove(id) {
    if (!(await confirmAction('Xóa công trình này?'))) return;
    await window.api.constructions.delete(id);
    showToast('Đã xóa', 'success');
    await this.loadList();
  },

  exportExcel() {
    excelHelper.exportModule('constructions', 'Cong_trinh');
  }
};

window.constructionModule = constructionModule;

