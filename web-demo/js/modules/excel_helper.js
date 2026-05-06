// === EXCEL HELPER ===
const excelHelper = {
  isTechnicalRows(rows) {
    return Array.isArray(rows[0]) && rows[0].some(cell => ['name', 'unit_measure', 'quantity'].includes(String(cell).trim()));
  },

  rowsFromTechnicalSheet(rawRows) {
    const headers = rawRows[0].map(header => String(header).trim());
    return rawRows.slice(1)
      .filter(row => row.some(cell => cell !== ''))
      .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || null])));
  },

  rowsFromOfficialTemplate(moduleName, rawRows) {
    const rows = rawRows.filter(row => row.some(cell => cell !== ''));
    if (!rows.length) return [];

    if (moduleName === 'cameras' || moduleName === 'fireSystems') {
      return rows.slice(7)
        .filter(row => row[1] && !String(row[1]).toLowerCase().includes('tổng cộng'))
        .map(row => ({
          unit_measure: row[2] || null,
          quantity: Number(row[3]) || 0,
          year_installed: Number(row[4]) || null,
          year_repaired: Number(row[5]) || null,
          ...(moduleName === 'cameras'
            ? { screen_count: Number(row[6]) || 0, camera_count: Number(row[7]) || 0 }
            : { pump_house_count: Number(row[6]) || 0, hydrant_count: Number(row[7]) || 0 }),
          investor: row[8] || null,
          status: row[9] || null,
          repair_need: Number(row[10]) || 0,
          new_install_need: Number(row[11]) || 0,
          notes: row[1] || null
        }));
    }

    return [];
  },

  normalizeImportRows(moduleName, rawRows) {
    if (!Array.isArray(rawRows) || !rawRows.length) return [];
    if (this.isTechnicalRows(rawRows)) return this.rowsFromTechnicalSheet(rawRows);
    return this.rowsFromOfficialTemplate(moduleName, rawRows);
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
      if (!data.length) { showToast('Không có dữ liệu để export', 'warning'); return; }
      const result = await window.api.dialog.saveFile(`${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
      if (result.canceled) return;
      await window.api.excel.write(result.filePath, data, fileName);
      showToast('Đã export thành công!', 'success');
    } catch (e) { showToast('Lỗi export: ' + e.message, 'error'); }
  },

  async importModule(moduleName) {
    try {
      const result = await window.api.dialog.openFile();
      if (result.canceled || !result.filePaths.length) return;
      const rawRows = await window.api.excel.read(result.filePaths[0]);
      const rows = this.normalizeImportRows(moduleName, rawRows);
      if (!rows.length) { showToast('File Excel trống hoặc chưa đúng mẫu import', 'warning'); return; }

      const cols = Object.keys(rows[0]);
      let previewHTML = `<p style="color:var(--text-secondary);margin-bottom:12px">Tìm thấy <strong>${rows.length}</strong> dòng dữ liệu</p>`;
      previewHTML += '<div style="max-height:300px;overflow:auto"><table style="width:100%"><thead><tr>';
      cols.forEach(col => previewHTML += `<th>${col}</th>`);
      previewHTML += '</tr></thead><tbody>';
      rows.slice(0, 5).forEach(row => {
        previewHTML += '<tr>';
        cols.forEach(col => previewHTML += `<td>${row[col] || ''}</td>`);
        previewHTML += '</tr>';
      });
      if (rows.length > 5) previewHTML += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-muted)">... và ${rows.length - 5} dòng khác</td></tr>`;
      previewHTML += '</tbody></table></div>';
      openModal('Xem trước dữ liệu import', previewHTML,
        `<button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
         <button class="btn btn-primary" onclick="excelHelper.confirmImport('${moduleName}')">Import ${rows.length} dòng</button>`);
      window._pendingImportRows = rows;
      window._pendingImportModule = moduleName;
    } catch (e) { showToast('Lỗi đọc file: ' + e.message, 'error'); }
  },

  async confirmImport(moduleName) {
    const rows = window._pendingImportRows;
    if (!rows) return;
    let count = 0;
    for (const row of rows) {
      try {
        await window.api[moduleName].create(row);
        count++;
      } catch (e) { console.warn('Skip row:', e.message); }
    }
    closeModal();
    showToast(`Đã import ${count}/${rows.length} dòng`, count === rows.length ? 'success' : 'warning');
    window._pendingImportRows = null;
    await this.reloadModule(moduleName);
  }
};
