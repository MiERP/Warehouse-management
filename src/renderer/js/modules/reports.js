// === REPORTS MODULE ===
const reportsModule = {
  categories: [],
  templates: [],
  fields: [],
  selectedFields: [],
  editingId: null,
  draggedField: null,
  draggedSelectedIndex: null,
  draggedFieldPart: null,
  insertionHint: null,
  resizeState: {},
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
    this.setupReportsLayoutResize();
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
      field: field.field || field.name,
      fields: Array.isArray(field.fields) ? field.fields : undefined
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
    fieldGroup.id = 'report-field-layout';
    fieldGroup.className = 'report-resizable-split';
    fieldGroup.style.gridColumn = '1 / -1';
    fieldGroup.style.cssText += ';display:grid;gap:16px';

    const palette = document.createElement('div');
    palette.id = 'report-field-palette-panel';
    palette.className = 'report-resizable-panel';
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
    selected.id = 'report-selected-fields-panel';
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
    this.setupFieldLayoutResize(fieldGroup, palette);
    this.setupReportsLayoutResize();
    this.renderSelectedFields();
  },

  setupReportsLayoutResize() {
    const layout = document.getElementById('reports-main-layout');
    const savedPanel = document.getElementById('report-template-card');
    if (!layout || !savedPanel) return;
    this.setupResizableSplit(layout, savedPanel, 'mainLayout', { minPercent: 25, maxPercent: 72, defaultPercent: 50 });
  },

  setupFieldLayoutResize(layout, palettePanel) {
    if (!layout || !palettePanel) return;
    this.setupResizableSplit(layout, palettePanel, 'fieldLayout', { minPercent: 28, maxPercent: 70, defaultPercent: 45 });
  },

  setupResizableSplit(layout, leftPanel, key, options = {}) {
    leftPanel.className = `${leftPanel.className || ''} report-resizable-panel`.trim();
    const defaultPercent = options.defaultPercent ?? 50;
    this.applyResizableSplit(layout, key, this.resizeState[key] ?? defaultPercent);
    if (leftPanel._reportResizeHandle) return;

    const handle = document.createElement('div');
    handle.className = 'report-resize-handle';
    handle.title = 'Kéo để thay đổi độ rộng khối này';
    handle.addEventListener('mousedown', event => {
      event.preventDefault();
      handle.className = 'report-resize-handle is-active';
      const onMouseMove = moveEvent => {
        const rect = layout.getBoundingClientRect();
        if (!rect.width) return;
        const rawPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        const nextPercent = Math.round(Math.max(options.minPercent ?? 20, Math.min(options.maxPercent ?? 80, rawPercent)));
        this.resizeState[key] = nextPercent;
        this.applyResizableSplit(layout, key, nextPercent);
      };
      const onMouseUp = () => {
        handle.className = 'report-resize-handle';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    leftPanel._reportResizeHandle = handle;
    leftPanel.appendChild(handle);
  },

  applyResizableSplit(layout, key, percent) {
    const firstMin = key === 'fieldLayout' ? '220px' : '260px';
    const secondMin = key === 'fieldLayout' ? '280px' : '360px';
    layout.style.gridTemplateColumns = `minmax(${firstMin}, ${percent}%) minmax(${secondMin}, 1fr)`;
  },

  async loadFields(source) {
    this.fields = await window.api.reports.getAvailableFields(source);
    this.selectedFields = this.selectedFields.filter(field => this.reportFieldNames(field).every(name => this.fields.some(item => item.field === name)));
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
        button.addEventListener('dragstart', event => {
          this.draggedField = field.field;
          this.draggedSelectedIndex = null;
          this.draggedFieldPart = null;
          event.dataTransfer?.setData('text/plain', field.field);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
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
      row.style.cssText = 'display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;align-items:flex-start;padding:10px 8px;border-bottom:1px solid var(--border-color)';
      if (this.isCombinedField(field)) row.title = `Ghép: ${field.fields.map(name => this.labelForField(name)).join(field.separator || ', ')}`;
      row.addEventListener('dragstart', () => {
        this.draggedSelectedIndex = index;
        this.draggedField = null;
        this.draggedFieldPart = null;
      });
      row.addEventListener('dragover', event => event.preventDefault());
      row.addEventListener('drop', event => this.handleSelectedRowDrop(event, index, row));

      const order = document.createElement('span');
      order.textContent = `${index + 1}`;
      order.style.paddingTop = '42px';

      const editor = document.createElement('div');
      editor.style.cssText = 'display:flex;flex-direction:column;gap:8px;min-width:0';

      const header = document.createElement('div');
      header.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) 64px auto;gap:8px;align-items:center';

      const label = document.createElement('input');
      label.className = 'form-control';
      label.value = this.labelForReportField(field);
      label.placeholder = 'Tên cột hiển thị';
      label.style.cssText = 'width:100%';
      label.addEventListener('input', event => { this.selectedFields[index] = { ...this.selectedFields[index], label: event.target.value, customLabel: true }; });

      const width = document.createElement('input');
      width.className = 'form-control';
      width.type = 'number';
      width.value = field.width || '';
      width.placeholder = '%';
      width.title = 'Độ rộng cột (%)';
      width.style.cssText = 'width:64px;text-align:center;padding-left:6px;padding-right:6px';
      width.addEventListener('input', event => { this.selectedFields[index] = { ...this.selectedFields[index], width: Number(event.target.value) || null }; });

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:4px;flex-wrap:nowrap;justify-content:flex-end';
      actions.appendChild(createButton('↑', 'btn btn-sm btn-secondary', () => this.moveField(index, -1)));
      actions.appendChild(createButton('↓', 'btn btn-sm btn-secondary', () => this.moveField(index, 1)));
      if (this.isCombinedField(field)) {
        actions.appendChild(createButton('Tách', 'btn btn-sm btn-secondary', () => this.splitCombinedField(index)));
      }
      actions.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', () => this.removeField(index)));
      header.append(label, width, actions);

      const expression = document.createElement('div');
      expression.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:nowrap;min-height:38px;max-width:100%;overflow-x:auto;border:1px dashed var(--border-color);border-radius:8px;padding:6px;background:rgba(15,23,42,0.18)';
      expression.addEventListener('dragover', event => {
        event.preventDefault();
        const partCount = this.reportFieldNames(field).length;
        this.setInsertionHint({ columnIndex: index, partIndex: Math.max(partCount - 1, 0), side: 'right' });
      });
      expression.addEventListener('drop', event => this.handleExpressionDrop(event, index));
      this.reportFieldNames(field).forEach((fieldName, partIndex, allParts) => {
        if (this.shouldShowInsertionCaret(index, partIndex, 'left')) expression.appendChild(this.createInsertionCaret());
        const chip = document.createElement('span');
        chip.textContent = this.labelForField(fieldName);
        chip.style.cssText = 'display:inline-flex;align-items:center;min-height:28px;max-width:220px;padding:5px 10px;border:1px solid var(--accent-color);border-radius:6px;background:rgba(6,182,212,0.12);color:var(--text-primary);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto';
        chip.title = 'Thả trường vào nửa trái hoặc phải của ô này để ghép';
        chip.draggable = true;
        chip.addEventListener('dragstart', event => {
          event.stopPropagation();
          this.draggedField = null;
          this.draggedSelectedIndex = null;
          this.draggedFieldPart = { columnIndex: index, partIndex };
          event.dataTransfer?.setData('text/plain', fieldName);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        });
        chip.addEventListener('dragover', event => event.preventDefault());
        chip.addEventListener('dragenter', event => this.handleFieldPartDragOver(event, index, partIndex, chip));
        chip.addEventListener('drop', event => this.handleFieldPartDrop(event, index, partIndex, chip));
        expression.appendChild(chip);
        if (this.shouldShowInsertionCaret(index, partIndex, 'right')) expression.appendChild(this.createInsertionCaret());

        if (partIndex < allParts.length - 1) {
          const separator = document.createElement('input');
          separator.className = 'form-control';
          separator.value = field.separator ?? ', ';
          separator.placeholder = 'Dấu nối';
          separator.title = 'Dấu nối giữa các trường trong cột này';
          separator.style.cssText = 'width:76px;min-width:56px;text-align:center;padding-left:6px;padding-right:6px;flex:0 0 auto';
          separator.addEventListener('input', event => {
            this.selectedFields[index] = this.normalizeCombinedField({ ...this.selectedFields[index], separator: event.target.value });
            this.renderSelectedFields();
          });
          expression.appendChild(separator);
        }
      });

      editor.append(header, expression);
      row.append(order, editor);
      container.appendChild(row);
    });
  },

  handleSelectedDrop(event, index) {
    event.preventDefault();
    const draggedField = this.readDraggedField(event);
    if (this.draggedFieldPart) {
      this.detachReportFieldPartToIndex(this.draggedFieldPart.columnIndex, this.draggedFieldPart.partIndex, index);
    } else if (draggedField) {
      this.addField(draggedField, index);
    }
    if (this.draggedSelectedIndex !== null) this.reorderField(this.draggedSelectedIndex, index);
    this.clearDragState();
  },

  handleSelectedRowDrop(event, index, row) {
    event.preventDefault();
    const draggedField = this.readDraggedField(event);
    if (draggedField) {
      const rect = row.getBoundingClientRect ? row.getBoundingClientRect() : null;
      const side = rect && event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
      this.insertFieldIntoReportField(index, draggedField, side);
    } else if (this.draggedFieldPart) {
      const rect = row.getBoundingClientRect ? row.getBoundingClientRect() : null;
      const side = rect && event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
      this.moveReportFieldPartToColumn(this.draggedFieldPart.columnIndex, this.draggedFieldPart.partIndex, index, side);
    } else if (this.draggedSelectedIndex !== null) {
      this.reorderField(this.draggedSelectedIndex, index);
    }
    this.clearDragState();
  },

  handleFieldPartDragOver(event, index, partIndex, chip) {
    event.preventDefault();
    const rect = chip.getBoundingClientRect ? chip.getBoundingClientRect() : null;
    const side = rect && event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
    this.setInsertionHint({ columnIndex: index, partIndex, side });
  },

  handleFieldPartDrop(event, index, partIndex, chip) {
    event.preventDefault();
    event.stopPropagation?.();
    const rect = chip.getBoundingClientRect ? chip.getBoundingClientRect() : null;
    const side = rect && event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
    const draggedField = this.readDraggedField(event);
    if (draggedField) {
      this.insertFieldIntoReportField(index, draggedField, side, partIndex);
    } else if (this.draggedFieldPart) {
      if (this.draggedFieldPart.columnIndex === index) {
        const rawIndex = partIndex + (side === 'left' ? 0 : 1);
        const toIndex = this.draggedFieldPart.partIndex < rawIndex ? rawIndex - 1 : rawIndex;
        this.moveReportFieldPart(index, this.draggedFieldPart.partIndex, toIndex);
      } else {
        this.moveReportFieldPartToColumn(this.draggedFieldPart.columnIndex, this.draggedFieldPart.partIndex, index, side, partIndex);
      }
    }
    this.clearDragState();
  },

  handleExpressionDrop(event, index) {
    event.preventDefault();
    event.stopPropagation?.();
    const partCount = this.reportFieldNames(this.selectedFields[index]).length;
    const hint = this.insertionHint?.columnIndex === index ? this.insertionHint : null;
    const partIndex = hint?.partIndex ?? Math.max(partCount - 1, 0);
    const side = hint?.side ?? 'right';
    const draggedField = this.readDraggedField(event);
    if (draggedField) {
      this.insertFieldIntoReportField(index, draggedField, side, partIndex);
    } else if (this.draggedFieldPart) {
      if (this.draggedFieldPart.columnIndex === index) {
        const rawIndex = hint ? partIndex + (side === 'left' ? 0 : 1) : partCount;
        const toIndex = this.draggedFieldPart.partIndex < rawIndex ? rawIndex - 1 : rawIndex;
        this.moveReportFieldPart(index, this.draggedFieldPart.partIndex, toIndex);
      } else {
        this.moveReportFieldPartToColumn(this.draggedFieldPart.columnIndex, this.draggedFieldPart.partIndex, index, side, partIndex);
      }
    }
    this.clearDragState();
  },

  setInsertionHint(nextHint) {
    if (
      this.insertionHint?.columnIndex === nextHint.columnIndex &&
      this.insertionHint.partIndex === nextHint.partIndex &&
      this.insertionHint.side === nextHint.side
    ) return;
    this.insertionHint = nextHint;
    this.renderSelectedFields();
  },

  readDraggedField(event) {
    if (this.draggedFieldPart) return null;
    return this.draggedField || event?.dataTransfer?.getData?.('text/plain') || null;
  },

  clearDragState() {
    this.draggedField = null;
    this.draggedSelectedIndex = null;
    this.draggedFieldPart = null;
    this.insertionHint = null;
  },

  createInsertionCaret() {
    const caret = document.createElement('span');
    caret.textContent = '|';
    caret.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;height:30px;color:var(--accent-color);font-size:26px;font-weight:700;line-height:1;flex:0 0 auto';
    return caret;
  },

  shouldShowInsertionCaret(columnIndex, partIndex, side) {
    return this.insertionHint?.columnIndex === columnIndex &&
      this.insertionHint.partIndex === partIndex &&
      this.insertionHint.side === side;
  },

  addField(name, index = this.selectedFields.length) {
    const field = this.fields.find(item => item.field === name);
    if (!field || this.selectedFields.some(item => this.reportFieldNames(item).includes(name))) return;
    const next = { field: field.field, label: field.label, width: null };
    this.selectedFields = [
      ...this.selectedFields.slice(0, index),
      next,
      ...this.selectedFields.slice(index)
    ];
    this.renderSelectedFields();
  },

  insertFieldIntoReportField(index, name, side = 'right', partIndex = null) {
    const source = this.fields.find(item => item.field === name);
    if (!source || this.selectedFields.some(item => this.reportFieldNames(item).includes(name))) return;
    const next = this.insertFieldNameIntoColumn(this.selectedFields, index, name, side, partIndex);
    if (!next) return;
    this.selectedFields = next;
    this.renderSelectedFields();
  },

  moveReportFieldPartToColumn(sourceColumnIndex, sourcePartIndex, targetColumnIndex, side = 'right', targetPartIndex = null) {
    if (sourceColumnIndex === targetColumnIndex) {
      const rawIndex = targetPartIndex === null
        ? this.reportFieldNames(this.selectedFields[targetColumnIndex]).length
        : targetPartIndex + (side === 'left' ? 0 : 1);
      const toIndex = sourcePartIndex < rawIndex ? rawIndex - 1 : rawIndex;
      this.moveReportFieldPart(targetColumnIndex, sourcePartIndex, toIndex);
      return;
    }

    const detached = this.removeReportFieldPart(this.selectedFields, sourceColumnIndex, sourcePartIndex);
    if (!detached) return;
    const adjustedTargetIndex = detached.columnRemoved && sourceColumnIndex < targetColumnIndex
      ? targetColumnIndex - 1
      : targetColumnIndex;
    const next = this.insertFieldNameIntoColumn(detached.fields, adjustedTargetIndex, detached.name, side, targetPartIndex);
    if (!next) return;
    this.selectedFields = next;
    this.renderSelectedFields();
  },

  detachReportFieldPartToIndex(sourceColumnIndex, sourcePartIndex, targetIndex) {
    const detached = this.removeReportFieldPart(this.selectedFields, sourceColumnIndex, sourcePartIndex);
    if (!detached) return;
    const adjustedTargetIndex = detached.columnRemoved && sourceColumnIndex < targetIndex
      ? targetIndex - 1
      : targetIndex;
    const next = [...detached.fields];
    const insertAt = Math.max(0, Math.min(adjustedTargetIndex, next.length));
    next.splice(insertAt, 0, this.createDetachedReportField(detached.name, detached.source));
    this.selectedFields = next;
    this.renderSelectedFields();
  },

  insertFieldNameIntoColumn(fieldsList, index, name, side = 'right', partIndex = null) {
    const target = fieldsList[index];
    if (!target) return null;
    const separator = target.separator ?? ', ';
    const targetFields = this.reportFieldNames(target);
    const rawInsertAt = partIndex === null
      ? (side === 'left' ? 0 : targetFields.length)
      : partIndex + (side === 'left' ? 0 : 1);
    const insertAt = Math.max(0, Math.min(rawInsertAt, targetFields.length));
    const fields = [...targetFields.slice(0, insertAt), name, ...targetFields.slice(insertAt)];
    const labelState = target.customLabel ? { label: target.label, customLabel: true } : {};
    const combined = this.normalizeCombinedField({ fields, separator, width: target.width || null, ...labelState });
    return [
      ...fieldsList.slice(0, index),
      combined,
      ...fieldsList.slice(index + 1)
    ];
  },

  removeReportFieldPart(fieldsList, columnIndex, partIndex) {
    const source = fieldsList[columnIndex];
    const sourceFields = this.reportFieldNames(source);
    if (!source || partIndex < 0 || partIndex >= sourceFields.length) return null;
    const name = sourceFields[partIndex];
    const remainingFields = sourceFields.filter((_, index) => index !== partIndex);
    const fields = [...fieldsList];
    if (!remainingFields.length) {
      fields.splice(columnIndex, 1);
    } else {
      fields[columnIndex] = this.normalizeReportFieldFromNames(source, remainingFields);
    }
    return { fields, name, source, columnRemoved: !remainingFields.length };
  },

  normalizeReportFieldFromNames(source, fields) {
    if (fields.length === 1) {
      return {
        field: fields[0],
        label: this.labelForField(fields[0]),
        width: source.width || null
      };
    }
    return this.normalizeCombinedField({ ...source, fields });
  },

  createDetachedReportField(name, source) {
    const sourceFields = this.reportFieldNames(source);
    const preserveSourceColumn = sourceFields.length === 1;
    const field = {
      field: name,
      label: preserveSourceColumn ? this.labelForReportField(source) : this.labelForField(name),
      width: preserveSourceColumn ? (source.width || null) : null
    };
    if (preserveSourceColumn && source.customLabel) field.customLabel = true;
    return field;
  },

  moveReportFieldPart(index, fromPartIndex, toPartIndex) {
    const target = this.selectedFields[index];
    if (!this.isCombinedField(target)) return;
    const fields = this.reportFieldNames(target);
    if (fromPartIndex < 0 || fromPartIndex >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(fromPartIndex, 1);
    const normalizedIndex = Math.max(0, Math.min(toPartIndex, next.length));
    next.splice(normalizedIndex, 0, moved);
    this.selectedFields = [
      ...this.selectedFields.slice(0, index),
      this.normalizeCombinedField({ ...target, fields: next }),
      ...this.selectedFields.slice(index + 1)
    ];
    this.renderSelectedFields();
  },

  combineFieldWithNext(index) {
    const current = this.selectedFields[index];
    const next = this.selectedFields[index + 1];
    if (!current || !next) return;
    const separator = current.separator ?? ', ';
    const fields = [...this.reportFieldNames(current), ...this.reportFieldNames(next)];
    const labelState = current.customLabel ? { label: current.label, customLabel: true } : {};
    const combined = this.normalizeCombinedField({ fields, separator, width: current.width || null, ...labelState });
    this.selectedFields = [
      ...this.selectedFields.slice(0, index),
      combined,
      ...this.selectedFields.slice(index + 2)
    ];
    this.renderSelectedFields();
  },

  splitCombinedField(index) {
    const field = this.selectedFields[index];
    if (!this.isCombinedField(field)) return;
    const children = field.fields.map(name => ({
      field: name,
      label: this.labelForField(name),
      width: null
    }));
    this.selectedFields = [
      ...this.selectedFields.slice(0, index),
      ...children,
      ...this.selectedFields.slice(index + 1)
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
        fields: this.selectedFields.map(field => this.normalizeSelectedFieldForPayload(field)),
        pageSize: document.getElementById('report-page-size')?.value || 'A4',
        orientation: document.getElementById('report-orientation')?.value || 'portrait',
        marginMm: Number(document.getElementById('report-margin')?.value) || 15,
        fontFamily: document.getElementById('report-font-family')?.value.trim() || 'Times New Roman',
        fontSize: Number(document.getElementById('report-font-size')?.value) || 12
      }
    };
  },

  isCombinedField(field) {
    return field?.type === 'combined' || Array.isArray(field?.fields);
  },

  normalizeSelectedFieldForPayload(field) {
    return this.isCombinedField(field) ? this.normalizeCombinedField(field) : field;
  },

  normalizeCombinedField(field) {
    const fields = this.reportFieldNames(field);
    const separator = field.separator === undefined ? ', ' : String(field.separator);
    return {
      ...field,
      type: 'combined',
      field: fields.join('_'),
      fields,
      separator,
      label: field.customLabel && String(field.label || '').trim()
        ? field.label
        : fields.map(name => this.labelForField(name)).join(separator),
      width: field.width || null
    };
  },

  reportFieldNames(field) {
    return this.isCombinedField(field) ? [...(field.fields || [])] : [field.field].filter(Boolean);
  },

  labelForField(name) {
    return this.fields.find(field => field.field === name)?.label || name;
  },

  labelForReportField(field) {
    if (this.isCombinedField(field)) {
      return field.label || field.fields.map(name => this.labelForField(name)).join(field.separator ?? ', ');
    }
    return field.label || this.labelForField(field.field);
  },

  async previewTemplate(templateId = null) {
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

  async exportTemplate(templateId = null) {
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
