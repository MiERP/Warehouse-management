function safeText(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function numberValue(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumberValue(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function appendTextCell(row, value, fallback = '-') {
  const cell = document.createElement('td');
  cell.textContent = safeText(value, fallback);
  row.appendChild(cell);
  return cell;
}

function appendBadgeCell(row, value) {
  const cell = document.createElement('td');
  if (value) {
    const badge = document.createElement('span');
    badge.className = 'badge info';
    badge.textContent = String(value);
    cell.appendChild(badge);
  } else {
    cell.textContent = '-';
  }
  row.appendChild(cell);
  return cell;
}

function createButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function createFormGroup({ label, id, type = 'text', value = '', options = null, placeholder = '', full = false }) {
  const group = document.createElement('div');
  group.className = 'form-group';
  if (full) group.style.gridColumn = '1/-1';

  const labelElement = document.createElement('label');
  labelElement.className = 'form-label';
  labelElement.setAttribute('for', id);
  labelElement.textContent = label;
  group.appendChild(labelElement);

  let input;
  if (options) {
    input = document.createElement('select');
    input.className = 'form-control';
    for (const option of options) {
      const optionElement = document.createElement('option');
      optionElement.value = option.value ?? option;
      optionElement.textContent = option.label ?? option;
      input.appendChild(optionElement);
    }
  } else {
    input = document.createElement('input');
    input.type = type;
    input.className = 'form-control';
    input.placeholder = placeholder;
  }
  input.id = id;
  input.value = value ?? '';
  group.appendChild(input);
  return group;
}

function appendSectionTitle(container, title) {
  const section = document.createElement('div');
  section.className = 'form-section-title';
  section.textContent = title;
  container.appendChild(section);
}

function unitOptions(units) {
  return [{ value: '', label: '-- Chọn --' }, ...units.map(unit => ({ value: String(unit.id), label: unit.name }))];
}

function createAssetCrudModule(config) {
  return {
    editingId: null,

    async loadList() {
      const items = await window.api[config.api].getAll();
      const tbody = document.getElementById(config.tableBodyId);
      clearElement(tbody);
      if (!items.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = config.columns.length + 1;
        cell.className = 'empty-state';
        cell.textContent = config.emptyText;
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
      }
      items.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => this.edit(item.id));
        config.columns.forEach(column => {
          if (column.type === 'badge') appendBadgeCell(row, item[column.field]);
          else appendTextCell(row, item[column.field], column.fallback || '-');
        });
        const actionCell = document.createElement('td');
        actionCell.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', event => {
          event.stopPropagation();
          this.remove(item.id);
        }));
        row.appendChild(actionCell);
        tbody.appendChild(row);
      });
    },

    async showForm(data) {
      const units = await window.api.units.getAll();
      const current = data || {};
      this.editingId = current.id || null;
      const container = document.getElementById(config.formContainerId);
      clearElement(container);

      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = 'var(--space-lg)';

      const header = document.createElement('div');
      header.className = 'card-header';
      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = current.id ? config.editTitle : config.addTitle;
      header.appendChild(title);
      header.appendChild(createButton('Đóng', 'btn btn-secondary', () => this.hideForm()));
      card.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'form-grid';
      appendSectionTitle(grid, 'Thông tin đơn vị');
      grid.appendChild(createFormGroup({ label: 'Đơn vị cha', id: `${config.prefix}-parent`, options: unitOptions(units), value: current.parent_unit_id || '' }));
      grid.appendChild(createFormGroup({ label: 'Đơn vị con', id: `${config.prefix}-child`, options: unitOptions(units), value: current.child_unit_id || '' }));
      grid.appendChild(createFormGroup({ label: 'Đơn vị tính', id: `${config.prefix}-measure`, options: [{ value: '', label: '-- Chọn --' }, 'Bộ', 'Hệ thống', 'Cái'], value: current.unit_measure || '' }));

      appendSectionTitle(grid, 'Thông số kỹ thuật');
      for (const field of config.technicalFields) {
        grid.appendChild(createFormGroup({
          label: field.label,
          id: `${config.prefix}-${field.id}`,
          type: field.type || 'number',
          value: current[field.name] || '',
          placeholder: field.placeholder || '',
          full: field.full || false
        }));
      }

      appendSectionTitle(grid, 'Nhu cầu');
      grid.appendChild(createFormGroup({ label: 'Sửa chữa, cải tạo', id: `${config.prefix}-repair-need`, type: 'number', value: current.repair_need || '' }));
      grid.appendChild(createFormGroup({ label: 'Lắp đặt mới', id: `${config.prefix}-new-need`, type: 'number', value: current.new_install_need || '' }));
      grid.appendChild(createFormGroup({ label: 'Ghi chú', id: `${config.prefix}-notes`, value: current.notes || '', full: true }));
      card.appendChild(grid);

      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:flex-end';
      footer.appendChild(createButton('Hủy', 'btn btn-secondary', () => this.hideForm()));
      footer.appendChild(createButton('Lưu', 'btn btn-primary', () => this.save()));
      card.appendChild(footer);
      container.appendChild(card);
      if (config.entityType && window.documentPanel) {
        const documentContainer = document.createElement('div');
        documentContainer.id = `${config.prefix}-document-panel`;
        container.appendChild(documentContainer);
        await documentPanel.render(documentContainer, config.entityType, this.editingId);
      }
    },

    hideForm() {
      clearElement(document.getElementById(config.formContainerId));
      this.editingId = null;
    },

    collectData() {
      const data = {
        parent_unit_id: nullableNumberValue(document.getElementById(`${config.prefix}-parent`).value),
        child_unit_id: nullableNumberValue(document.getElementById(`${config.prefix}-child`).value),
        unit_measure: document.getElementById(`${config.prefix}-measure`).value || null,
        quantity: numberValue(document.getElementById(`${config.prefix}-qty`).value),
        year_installed: nullableNumberValue(document.getElementById(`${config.prefix}-year`).value),
        year_repaired: nullableNumberValue(document.getElementById(`${config.prefix}-repair-year`).value),
        investor: document.getElementById(`${config.prefix}-investor`).value.trim() || null,
        status: document.getElementById(`${config.prefix}-status`).value.trim() || null,
        repair_need: numberValue(document.getElementById(`${config.prefix}-repair-need`).value),
        new_install_need: numberValue(document.getElementById(`${config.prefix}-new-need`).value),
        notes: document.getElementById(`${config.prefix}-notes`).value.trim() || null,
        ...config.collectExtra(config.prefix)
      };
      return data;
    },

    async save() {
      try {
        const data = this.collectData();
        if (this.editingId) await window.api[config.api].update(this.editingId, data);
        else await window.api[config.api].create(data);
        showToast(this.editingId ? 'Đã cập nhật' : config.createdToast, 'success');
        this.hideForm();
        await this.loadList();
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    },

    async edit(id) {
      const data = await window.api[config.api].getById(id);
      if (data) await this.showForm(data);
    },

    async remove(id) {
      if (!(await confirmAction(config.deleteConfirm))) return;
      await window.api[config.api].delete(id);
      showToast('Đã xóa', 'success');
      await this.loadList();
    },

    exportExcel() {
      excelHelper.exportModule(config.api, config.exportName);
    }
  };
}


