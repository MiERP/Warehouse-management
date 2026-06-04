// === REPORTS MODULE ===
const reportsModule = {
  categories: [],
  templates: [],
  fields: [],
  selectedFields: [],
  editingId: null,
  draggedField: null,
  draggedSelectedIndex: null,
  toolbarBound: false,

  sourceLabels: {
    warehouses: 'Nhà kho',
    cameras: 'Camera',
    fireSystems: 'Hệ thống cứu hỏa',
    constructions: 'Công trình'
  },

  async load() {
    await this.refresh();
    this.bindToolbar();
    await this.newTemplate();
  },

  bindToolbar() {
    if (this.toolbarBound) return;
    this.toolbarBound = true;
    document.getElementById('btn-report-new')?.addEventListener('click', () => this.newTemplate());
    document.getElementById('btn-report-category')?.addEventListener('click', () => this.openCategoryModal());
    document.getElementById('btn-report-refresh')?.addEventListener('click', () => this.refresh());
    document.getElementById('report-category-filter')?.addEventListener('change', () => this.loadTemplates());
  },

  async refresh() {
    this.categories = await window.api.reports.listCategories();
    this.renderCategoryFilter();
    await this.loadTemplates();
  },

  renderCategoryFilter() {
    const filter = document.getElementById('report-category-filter');
    if (!filter) return;
    const current = filter.value;
    clearElement(filter);
    this.appendOption(filter, '', 'Tất cả loại báo cáo');
    this.categories.forEach(category => this.appendOption(filter, category.id, category.name));
    filter.value = current || '';
  },

  async loadTemplates() {
    const categoryId = document.getElementById('report-category-filter')?.value || '';
    this.templates = await window.api.reports.listTemplates({
      category_id: categoryId ? Number(categoryId) : null
    });
    this.renderTemplateList();
  },

  renderTemplateList() {
    const container = document.getElementById('report-template-list');
    if (!container) return;
    clearElement(container);
    if (!this.templates.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Chưa có mẫu báo cáo';
      container.appendChild(empty);
      return;
    }

    this.templates.forEach(template => {
      const item = document.createElement('div');
      item.className = 'config-tree-item';
      item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid var(--border-color)';

      const info = document.createElement('div');
      const name = document.createElement('div');
      name.style.fontWeight = '600';
      name.textContent = template.name;
      const meta = document.createElement('div');
      meta.style.cssText = 'color:var(--text-secondary);font-size:12px;margin-top:4px';
      meta.textContent = `${template.category_name || 'Chưa phân loại'} • ${this.sourceLabels[template.data_source] || template.data_source}`;
      info.append(name, meta);

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end';
      actions.appendChild(createButton('Sửa', 'btn btn-sm btn-secondary', () => this.editTemplate(template.id)));
      actions.appendChild(createButton('Xem', 'btn btn-sm btn-secondary', () => this.previewTemplate(template.id)));
      actions.appendChild(createButton('Xuất', 'btn btn-sm btn-primary', () => this.exportTemplate(template.id)));
      actions.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', () => this.deleteTemplate(template.id)));

      item.append(info, actions);
      container.appendChild(item);
    });
  },

  async newTemplate() {
    this.editingId = null;
    this.selectedFields = [];
    this.fields = [];
    this.renderBuilder({
      name: '',
      category_id: this.categories[0]?.id || '',
      data_source: 'warehouses',
      layout_json: this.defaultLayout()
    });
    await this.loadFields('warehouses');
  },

  async editTemplate(id) {
    const template = await window.api.reports.getTemplate(id);
    if (!template) return;
    this.editingId = id;
    this.selectedFields = (template.layout_json?.fields || []).map(field => ({
      ...field,
      field: field.field || field.name
    })).filter(field => field.field);
    this.renderBuilder(template);
    await this.loadFields(template.data_source || 'warehouses');
  },

  renderBuilder(template) {
    const container = document.getElementById('report-builder');
    if (!container) return;
    clearElement(container);
    const layout = { ...this.defaultLayout(), ...(template.layout_json || {}) };

    const form = document.createElement('div');
    form.className = 'form-grid';
    form.appendChild(this.createInput('report-name', 'Tên mẫu báo cáo *', template.name || ''));
    form.appendChild(this.createSelect('report-category', 'Loại báo cáo', this.categoryOptions(), template.category_id || ''));
    form.appendChild(this.createSelect('report-source', 'Nguồn dữ liệu', [
      ['warehouses', 'Nhà kho'],
      ['cameras', 'Camera'],
      ['fireSystems', 'Hệ thống cứu hỏa'],
      ['constructions', 'Công trình']
    ], template.data_source || 'warehouses'));
    form.appendChild(this.createSelect('report-page-size', 'Khổ giấy', [['A4', 'A4'], ['A3', 'A3']], layout.pageSize));
    form.appendChild(this.createSelect('report-orientation', 'Hướng giấy', [['portrait', 'Dọc'], ['landscape', 'Ngang']], layout.orientation));
    form.appendChild(this.createInput('report-margin', 'Lề trang (mm)', layout.marginMm, 'number'));
    form.appendChild(this.createInput('report-font-family', 'Font', layout.fontFamily));
    form.appendChild(this.createInput('report-font-size', 'Cỡ chữ', layout.fontSize, 'number'));

    const fieldGroup = document.createElement('div');
    fieldGroup.style.gridColumn = '1 / -1';
    fieldGroup.style.cssText += ';display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:16px';

    const palette = document.createElement('div');
    palette.style.cssText = 'border:1px solid var(--border-color);border-radius:8px;padding:16px';
    const paletteTitle = document.createElement('h4');
    paletteTitle.textContent = 'Trường dữ liệu';
    palette.appendChild(paletteTitle);
    const search = document.createElement('input');
    search.id = 'report-field-search';
    search.className = 'form-control';
    search.placeholder = 'Tìm trường để kéo vào mẫu...';
    search.addEventListener('input', () => this.renderFieldPalette());
    palette.appendChild(search);
    const paletteList = document.createElement('div');
    paletteList.id = 'report-field-palette';
    paletteList.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:12px';
    palette.appendChild(paletteList);

    const selected = document.createElement('div');
    selected.style.cssText = 'border:1px solid var(--border-color);border-radius:8px;padding:16px';
    const selectedTitle = document.createElement('h4');
    selectedTitle.textContent = 'Vị trí hiển thị trong báo cáo';
    selected.appendChild(selectedTitle);
    const dropZone = document.createElement('div');
    dropZone.id = 'report-selected-fields';
    dropZone.style.cssText = 'min-height:180px;border:1px dashed var(--border-color);border-radius:8px;padding:10px;margin-top:12px';
    dropZone.addEventListener('dragover', event => event.preventDefault());
    dropZone.addEventListener('drop', event => this.handleSelectedDrop(event, this.selectedFields.length));
    selected.appendChild(dropZone);

    fieldGroup.append(palette, selected);
    form.appendChild(fieldGroup);

    const actions = document.createElement('div');
    actions.style.cssText = 'grid-column:1 / -1;display:flex;gap:8px;justify-content:flex-end';
    actions.appendChild(createButton('Mẫu mới', 'btn btn-secondary', () => this.newTemplate()));
    actions.appendChild(createButton('Xem trước', 'btn btn-secondary', () => this.previewTemplate()));
    actions.appendChild(createButton('Xuất Excel', 'btn btn-secondary', () => this.exportTemplate()));
    actions.appendChild(createButton('Lưu mẫu', 'btn btn-primary', () => this.saveTemplate()));
    form.appendChild(actions);

    container.appendChild(form);
    document.getElementById('report-source')?.addEventListener('change', event => this.changeSource(event.target.value));
    this.renderSelectedFields();
  },

  async loadFields(source) {
    this.fields = await window.api.reports.getAvailableFields(source);
    this.selectedFields = this.selectedFields.filter(field => this.fields.some(item => item.field === field.field));
    this.renderFieldPalette();
    this.renderSelectedFields();
  },

  async changeSource(source) {
    this.selectedFields = [];
    await this.loadFields(source);
  },

  renderFieldPalette() {
    const container = document.getElementById('report-field-palette');
    if (!container) return;
    const query = document.getElementById('report-field-search')?.value.trim().toLowerCase() || '';
    clearElement(container);
    this.fields
      .filter(field => !query || field.label.toLowerCase().includes(query) || field.field.toLowerCase().includes(query))
      .forEach(field => {
        const button = createButton(`+ ${field.label}`, 'btn btn-sm btn-secondary', () => this.addField(field.field));
        button.draggable = true;
        button.addEventListener('dragstart', () => {
          this.draggedField = field.field;
          this.draggedSelectedIndex = null;
        });
        container.appendChild(button);
      });
  },

  renderSelectedFields() {
    const container = document.getElementById('report-selected-fields');
    if (!container) return;
    clearElement(container);
    if (!this.selectedFields.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Kéo trường dữ liệu vào đây để tạo bảng báo cáo';
      container.appendChild(empty);
      return;
    }

    this.selectedFields.forEach((field, index) => {
      const row = document.createElement('div');
      row.draggable = true;
      row.style.cssText = 'display:grid;grid-template-columns:32px minmax(0,1fr) 80px auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--border-color)';
      row.addEventListener('dragstart', () => {
        this.draggedSelectedIndex = index;
        this.draggedField = null;
      });
      row.addEventListener('dragover', event => event.preventDefault());
      row.addEventListener('drop', event => this.handleSelectedDrop(event, index));

      const order = document.createElement('span');
      order.textContent = `${index + 1}`;
      const label = document.createElement('input');
      label.className = 'form-control';
      label.value = field.label || field.field;
      label.addEventListener('input', event => { this.selectedFields[index] = { ...this.selectedFields[index], label: event.target.value }; });
      const width = document.createElement('input');
      width.className = 'form-control';
      width.type = 'number';
      width.value = field.width || '';
      width.placeholder = '%';
      width.addEventListener('input', event => { this.selectedFields[index] = { ...this.selectedFields[index], width: Number(event.target.value) || null }; });
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:4px';
      actions.appendChild(createButton('↑', 'btn btn-sm btn-secondary', () => this.moveField(index, -1)));
      actions.appendChild(createButton('↓', 'btn btn-sm btn-secondary', () => this.moveField(index, 1)));
      actions.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', () => this.removeField(index)));

      row.append(order, label, width, actions);
      container.appendChild(row);
    });
  },

  handleSelectedDrop(event, index) {
    event.preventDefault();
    if (this.draggedField) this.addField(this.draggedField, index);
    if (this.draggedSelectedIndex !== null) this.reorderField(this.draggedSelectedIndex, index);
    this.draggedField = null;
    this.draggedSelectedIndex = null;
  },

  addField(name, index = this.selectedFields.length) {
    const field = this.fields.find(item => item.field === name);
    if (!field || this.selectedFields.some(item => item.field === name)) return;
    const next = { field: field.field, label: field.label, width: null };
    this.selectedFields = [
      ...this.selectedFields.slice(0, index),
      next,
      ...this.selectedFields.slice(index)
    ];
    this.renderSelectedFields();
  },

  removeField(index) {
    this.selectedFields = this.selectedFields.filter((_, itemIndex) => itemIndex !== index);
    this.renderSelectedFields();
  },

  moveField(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= this.selectedFields.length) return;
    this.reorderField(index, target);
  },

  reorderField(from, to) {
    if (from === to) return;
    const next = [...this.selectedFields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    this.selectedFields = next;
    this.renderSelectedFields();
  },

  async saveTemplate(options = {}) {
    const payload = this.buildPayload();
    if (!payload) return null;
    const changed = await confirmAction('Mẫu báo cáo có thay đổi. Bạn có muốn lưu các thay đổi này không?');
    if (!changed) return null;

    const saved = this.editingId
      ? await window.api.reports.updateTemplate(this.editingId, payload)
      : await window.api.reports.createTemplate(payload);
    this.editingId = saved.id;
    if (!options.silent) showToast('Đã lưu mẫu báo cáo', 'success');
    await this.refresh();
    return saved;
  },

  buildPayload() {
    const name = document.getElementById('report-name')?.value.trim();
    if (!name) {
      showToast('Vui lòng nhập tên mẫu báo cáo', 'warning');
      return null;
    }
    if (!this.selectedFields.length) {
      showToast('Vui lòng chọn ít nhất một trường dữ liệu', 'warning');
      return null;
    }
    return {
      name,
      category_id: Number(document.getElementById('report-category')?.value) || null,
      data_source: document.getElementById('report-source')?.value || 'warehouses',
      layout_json: {
        fields: this.selectedFields,
        pageSize: document.getElementById('report-page-size')?.value || 'A4',
        orientation: document.getElementById('report-orientation')?.value || 'portrait',
        marginMm: Number(document.getElementById('report-margin')?.value) || 15,
        fontFamily: document.getElementById('report-font-family')?.value.trim() || 'Times New Roman',
        fontSize: Number(document.getElementById('report-font-size')?.value) || 12
      }
    };
  },

  async previewTemplate(templateId = this.editingId) {
    const id = templateId || (await this.saveTemplate({ silent: true }))?.id;
    if (!id) return;
    const result = await window.api.reports.renderTemplate(id, {});
    this.renderPreview(result);
  },

  renderPreview(result) {
    const container = document.getElementById('report-preview');
    if (!container) return;
    clearElement(container);
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = result.template.name;
    container.appendChild(title);

    const tableWrap = document.createElement('div');
    tableWrap.style.overflow = 'auto';
    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    result.columns.forEach(field => appendTextCell(headRow, field.label || field.field));
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    if (!result.rows.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = Math.max(result.columns.length, 1);
      cell.className = 'empty-state';
      cell.textContent = 'Không có dữ liệu phù hợp';
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      result.rows.slice(0, 50).forEach(item => {
        const row = document.createElement('tr');
        result.columns.forEach(field => appendTextCell(row, item[field.field]));
        tbody.appendChild(row);
      });
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.appendChild(tableWrap);
  },

  async exportTemplate(templateId = this.editingId) {
    const id = templateId || (await this.saveTemplate({ silent: true }))?.id;
    if (!id) return;
    const result = await window.api.dialog.saveFile('Bao_cao.xlsx', [{ name: 'Excel', extensions: ['xlsx'] }]);
    if (result.canceled || !result.filePath) return;
    await window.api.reports.exportTemplateToExcel(id, {}, result.filePath);
    showToast('Đã xuất báo cáo Excel', 'success');
  },

  async deleteTemplate(id) {
    const ok = await confirmAction('Bạn có chắc muốn xóa mẫu báo cáo này?');
    if (!ok) return;
    await window.api.reports.deleteTemplate(id);
    showToast('Đã xóa mẫu báo cáo', 'success');
    await this.refresh();
  },

  openCategoryModal() {
    openModal('Thêm loại báo cáo', `
      <div class="form-group"><label class="form-label">Tên loại báo cáo *</label><input class="form-control" id="report-category-name"></div>
      <div class="form-group" style="margin-top:12px"><label class="form-label">Mô tả</label><input class="form-control" id="report-category-desc"></div>`,
      `<button class="btn btn-secondary" id="report-category-cancel">Hủy</button>
       <button class="btn btn-primary" id="report-category-save">Lưu</button>`);
    document.getElementById('report-category-cancel').addEventListener('click', closeModal);
    document.getElementById('report-category-save').addEventListener('click', async () => {
      const name = document.getElementById('report-category-name').value.trim();
      if (!name) {
        showToast('Vui lòng nhập tên loại báo cáo', 'warning');
        return;
      }
      await window.api.reports.createCategory({
        name,
        description: document.getElementById('report-category-desc').value.trim()
      });
      closeModal();
      showToast('Đã thêm loại báo cáo', 'success');
      await this.refresh();
    });
  },

  createInput(id, label, value = '', type = 'text') {
    const group = document.createElement('div');
    group.className = 'form-group';
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'form-control';
    input.id = id;
    input.type = type;
    input.value = value || '';
    group.append(labelEl, input);
    return group;
  },

  createSelect(id, label, options, value = '') {
    const group = document.createElement('div');
    group.className = 'form-group';
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    const select = document.createElement('select');
    select.className = 'form-control';
    select.id = id;
    options.forEach(([optionValue, optionText]) => this.appendOption(select, optionValue, optionText));
    select.value = value || '';
    group.append(labelEl, select);
    return group;
  },

  categoryOptions() {
    return [['', '-- Chưa phân loại --'], ...this.categories.map(category => [category.id, category.name])];
  },

  appendOption(select, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  },

  defaultLayout() {
    return {
      fields: [],
      pageSize: 'A4',
      orientation: 'portrait',
      marginMm: 15,
      fontFamily: 'Times New Roman',
      fontSize: 12
    };
  }
};
