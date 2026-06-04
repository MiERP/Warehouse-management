// === EXCEL HELPER ===
const excelHelper = {
  moduleConfig(moduleName) {
    return window.getModuleConfig ? window.getModuleConfig(moduleName) : null;
  },

  escapeCell(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  },

  toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const normalized = String(value).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  },

  toYear(value) {
    const year = Math.round(this.toNumber(value));
    return year >= 1900 && year <= 2200 ? year : null;
  },

  isTechnicalRows(rows) {
    return Array.isArray(rows[0]) && rows[0].some(cell => ['name', 'unit_measure', 'quantity'].includes(String(cell).trim()));
  },

  rowsFromTechnicalSheet(rawRows) {
    const headers = rawRows[0].map(header => String(header).trim());
    return rawRows.slice(1)
      .filter(row => row.some(cell => cell !== ''))
      .map((row, index) => ({
        data: Object.fromEntries(headers.map((header, colIndex) => [header, row[colIndex] || null])),
        sourceRow: index + 2
      }));
  },

  selectSheet(workbook, preferredNames) {
    if (!workbook || !workbook.sheets) return [];
    const exact = preferredNames.find(name => workbook.sheets[name]);
    if (exact) return workbook.sheets[exact];
    const fuzzy = workbook.sheetNames.find(name => preferredNames.some(pref => name.toLowerCase().includes(pref.toLowerCase())));
    if (fuzzy) return workbook.sheets[fuzzy];
    return workbook.sheets[workbook.sheetNames[0]] || [];
  },

  rowsFromOfficialTemplate(moduleName, rawRows) {
    const rows = rawRows;
    if (!rows.some(row => row.some(cell => cell !== ''))) return [];

    if (moduleName === 'cameras' || moduleName === 'fireSystems') {
      return rows.slice(7)
        .map((row, index) => ({ row, sourceRow: index + 8 }))
        .filter(({ row }) => row[1] && !String(row[1]).toLowerCase().includes('tổng cộng'))
        .filter(({ row }) => row[2] || this.toNumber(row[3]) || this.toYear(row[4]) || this.toNumber(row[6]) || this.toNumber(row[7]))
        .map(({ row, sourceRow }) => ({
          sourceRow,
          data: {
            unit_measure: row[2] || null,
            quantity: this.toNumber(row[3]),
            year_installed: this.toYear(row[4]),
            year_repaired: this.toYear(row[5]),
            ...(moduleName === 'cameras'
              ? { screen_count: this.toNumber(row[6]), camera_count: this.toNumber(row[7]) }
              : { pump_house_count: this.toNumber(row[6]), hydrant_count: this.toNumber(row[7]) }),
            investor: row[8] || null,
            status: row[9] || null,
            repair_need: this.toNumber(row[10]),
            new_install_need: this.toNumber(row[11]),
            notes: row[1] || null
          }
        }));
    }

    if (moduleName === 'warehouses') {
      return rows.slice(8)
        .map((row, index) => ({ row, sourceRow: index + 9 }))
        .filter(({ row }) => row[2] && !String(row[2]).toLowerCase().includes('tổng cộng'))
        .map(({ row, sourceRow }) => ({
          sourceRow,
          data: {
            name: String(row[2]).trim(),
            address: row[3] || null,
            warehouse_category: 'chien_thuat',
            quantity: this.toNumber(row[4]) || 1,
            land_area: this.toNumber(row[5]),
            warehouse_area: this.toNumber(row[6]),
            year_built: this.toYear(row[7]),
            year_renovated: this.toYear(row[8]),
            storage_capacity: this.toNumber(row[10]),
            current_stock: this.toNumber(row[11]),
            quality_grade_4_area: this.toNumber(row[16]),
            lightning_existing_count: this.toNumber(row[21]),
            notes: row[12] || null
          }
        }));
    }

    if (moduleName === 'constructions') {
      const skipPrefixes = ['chi phí quản lý', 'chi phí thẩm tra', 'chi phí dự phòng', 'chi phí kiểm toán'];
      return rows.slice(5)
        .map((row, index) => ({ row, sourceRow: index + 6 }))
        .filter(({ row }) => row[1] && String(row[1]).trim().length >= 5)
        .filter(({ row }) => !skipPrefixes.some(prefix => String(row[1]).trim().toLowerCase().startsWith(prefix)))
        .map(({ row, sourceRow }) => ({
          sourceRow,
          data: {
            name: String(row[1]).trim(),
            construction_type: row[2] || null,
            year_started: this.toYear(row[3]),
            status: 'Đang thi công',
            approval_decision_no: row[4] ? String(row[4]).trim() : null,
            contract_number: row[5] ? String(row[5]).replace(/[\r\n]+/g, ' ').trim() : null,
            contractor_name: row[6] || null,
            contractor_address: row[7] || null,
            review_authority: row[8] || null,
            start_date: row[9] ? String(row[9]) : null,
            end_date: row[10] ? String(row[10]) : null,
            estimated_cost: this.toNumber(row[12]),
            contract_value: this.toNumber(row[13]),
            total_estimated: this.toNumber(row[14]),
            notes: row[11] || null
          }
        }));
    }

    return [];
  },

  normalizeImportRows(moduleName, workbookOrRows) {
    const rawRows = Array.isArray(workbookOrRows)
      ? workbookOrRows
      : this.selectSheet(workbookOrRows, moduleName === 'warehouses' ? ['PL2', 'KHO'] : moduleName === 'constructions' ? ['PTCh', 'CONG'] : []);
    if (!Array.isArray(rawRows) || !rawRows.length) return [];
    const parsed = this.isTechnicalRows(rawRows) ? this.rowsFromTechnicalSheet(rawRows) : this.rowsFromOfficialTemplate(moduleName, rawRows);
    return parsed.map(item => ({ ...item.data, _sourceRow: item.sourceRow }));
  },

  validateImportRow(moduleName, row) {
    const errors = [];
    if ((moduleName === 'warehouses' || moduleName === 'constructions') && !String(row.name || '').trim()) errors.push('Thiếu tên');
    if (row.year_built && (row.year_built < 1900 || row.year_built > 2200)) errors.push('Năm xây dựng không hợp lệ');
    if (row.year_started && (row.year_started < 1900 || row.year_started > 2200)) errors.push('Năm khởi công không hợp lệ');
    if (row.quantity !== undefined && Number(row.quantity) < 0) errors.push('Số lượng âm');
    return errors;
  },

  async reloadModule(moduleName) {
    const reloaders = {
      warehouses: () => warehouseModule.loadList(),
      cameras: () => cameraModule.loadList(),
      fireSystems: () => fireModule.loadList(),
      constructions: () => constructionModule.loadList()
    };
    if (reloaders[moduleName]) await reloaders[moduleName]();
    if (typeof loadDashboard === 'function') await loadDashboard();
  },

  async exportModule(moduleName, fileName) {
    try {
      const data = await window.api[moduleName].getAll();
      const moduleConfig = this.moduleConfig(moduleName);
      if (!data.length) { showToast('Không có dữ liệu để export', 'warning'); return; }
      const result = await window.api.dialog.saveFile(`${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
      if (result.canceled) return;
      await window.api.excel.write(result.filePath, data, moduleConfig?.label || fileName);
      showToast('Đã export thành công!', 'success');
    } catch (e) { showToast('Lỗi export: ' + e.message, 'error'); }
  },

  async importModule(moduleName) {
    try {
      const result = await window.api.dialog.openFile();
      if (result.canceled || !result.filePaths.length) return;
      const moduleConfig = this.moduleConfig(moduleName);
      const workbook = window.api.excel.readWorkbook ? await window.api.excel.readWorkbook(result.filePaths[0]) : await window.api.excel.read(result.filePaths[0]);
      const rows = this.normalizeImportRows(moduleName, workbook);
      if (!rows.length) { showToast('File Excel trống hoặc chưa đúng mẫu import', 'warning'); return; }

      const validation = rows.map(row => ({ row, errors: this.validateImportRow(moduleName, row) }));
      const validRows = validation.filter(item => item.errors.length === 0).map(item => {
        const clean = { ...item.row };
        delete clean._sourceRow;
        return clean;
      });
      const cols = Object.keys(rows[0]).filter(col => col !== '_sourceRow');
      const moduleLabel = moduleConfig ? ` cho ${this.escapeCell(moduleConfig.label)}` : '';
      let previewHTML = `<p style="color:var(--text-secondary);margin-bottom:12px">Tìm thấy <strong>${rows.length}</strong> dòng${moduleLabel}, hợp lệ <strong>${validRows.length}</strong>, lỗi <strong>${rows.length - validRows.length}</strong></p>`;
      previewHTML += '<div style="max-height:300px;overflow:auto"><table style="width:100%"><thead><tr><th>Dòng</th>';
      cols.forEach(col => previewHTML += `<th>${this.escapeCell(col)}</th>`);
      previewHTML += '<th>Lỗi</th></tr></thead><tbody>';
      validation.slice(0, 8).forEach(item => {
        previewHTML += '<tr>';
        previewHTML += `<td>${this.escapeCell(item.row._sourceRow || '')}</td>`;
        cols.forEach(col => previewHTML += `<td>${this.escapeCell(item.row[col] || '')}</td>`);
        previewHTML += `<td style="color:${item.errors.length ? 'var(--color-danger)' : 'var(--color-success)'}">${this.escapeCell(item.errors.join('; ') || 'OK')}</td>`;
        previewHTML += '</tr>';
      });
      if (rows.length > 8) previewHTML += `<tr><td colspan="${cols.length + 2}" style="text-align:center;color:var(--text-muted)">... và ${rows.length - 8} dòng khác</td></tr>`;
      previewHTML += '</tbody></table></div>';
      openModal('Xem trước dữ liệu import', previewHTML,
        `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
         <button class="btn btn-primary" ${validRows.length ? '' : 'disabled'} onclick="excelHelper.confirmImport('${moduleName}')">Import ${validRows.length} dòng hợp lệ</button>`);
      window._pendingImportRows = validRows;
      window._pendingImportModule = moduleName;
      window._pendingImportErrors = validation.filter(item => item.errors.length);
    } catch (e) { showToast('Lỗi đọc file: ' + e.message, 'error'); }
  },

  async prepareImportRow(moduleName, row) {
    const clean = { ...row };
    if (moduleName === 'warehouses') {
      const unitNames = ['cap_1', 'cap_2', 'cap_3', 'cap_4', 'cap_5', 'cap_6'].map(key => clean[key]).filter(Boolean);
      if (unitNames.length) {
        const warehouseLevel = clean.cap_6 ? 6 : 5;
        const unit = await window.api.units.findOrCreatePath(unitNames, warehouseLevel);
        const ancestors = await window.api.units.getAncestors(unit.id);
        const parent = ancestors[ancestors.length - 2];
        clean.unit_id = unit.id;
        clean.parent_unit_id = parent ? parent.id : null;
        clean.name = unit.name;
      }
      ['cap_1', 'cap_2', 'cap_3', 'cap_4', 'cap_5', 'cap_6', 'unit_type'].forEach(key => delete clean[key]);
    }
    return clean;
  },

  async confirmImport(moduleName) {
    const rows = window._pendingImportRows;
    if (!rows) return;
    let count = 0;
    const errors = [];
    for (const [index, row] of rows.entries()) {
      try {
        await window.api[moduleName].create(await this.prepareImportRow(moduleName, row));
        count++;
      } catch (e) { errors.push(`Dòng ${index + 1}: ${e.message}`); }
    }
    closeModal();
    showToast(`Đã import ${count}/${rows.length} dòng${errors.length ? `, lỗi ${errors.length}` : ''}`, count === rows.length ? 'success' : 'warning');
    if (errors.length) console.warn('Import errors:', errors);
    window._pendingImportRows = null;
    window._pendingImportErrors = null;
    if (window.api.search && window.api.search.rebuildIndex) await window.api.search.rebuildIndex();
    await this.reloadModule(moduleName);
  }
};

