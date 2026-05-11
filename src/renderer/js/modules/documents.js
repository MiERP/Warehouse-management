// === DOCUMENTS MODULE ===
const documentsModule = {
  currentId: null,

  formatSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(bytes);
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
    return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
  },

  requestDocumentMetadata(originalName) {
    return new Promise((resolve) => {
      openModal('Upload tài liệu', `
        <div class="form-group"><label class="form-label">Tiêu đề tài liệu</label><input class="form-control" id="doc-upload-title"></div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Loại tài liệu</label><input class="form-control" id="doc-upload-type" placeholder="VD: Hợp đồng, Quyết định, Ảnh"></div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Tags</label><input class="form-control" id="doc-upload-tags" placeholder="Cách nhau bởi dấu phẩy"></div>`,
        `<button class="btn btn-secondary" id="doc-upload-cancel">Hủy</button>
         <button class="btn btn-primary" id="doc-upload-confirm">Upload</button>`);
      const titleInput = document.getElementById('doc-upload-title');
      titleInput.value = originalName || '';
      titleInput.focus();
      titleInput.select();
      document.getElementById('doc-upload-cancel').addEventListener('click', () => { closeModal(); resolve(null); });
      document.getElementById('doc-upload-confirm').addEventListener('click', () => {
        const title = titleInput.value.trim();
        if (!title) { showToast('Vui lòng nhập tiêu đề tài liệu', 'warning'); return; }
        const metadata = {
          title,
          document_type: document.getElementById('doc-upload-type').value.trim(),
          tags: document.getElementById('doc-upload-tags').value.trim()
        };
        closeModal();
        resolve(metadata);
      });
    });
  },

  requestLinkTarget(defaultEntityType = 'constructions') {
    return new Promise((resolve) => {
      openModal('Gắn tài liệu với bản ghi', `
        <div class="form-group"><label class="form-label">Module</label><select class="form-control" id="doc-link-entity-type">
          <option value="warehouses">Nhà kho</option>
          <option value="cameras">Camera</option>
          <option value="fireSystems">Hệ thống cứu hỏa</option>
          <option value="constructions">Công trình</option>
        </select></div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Tìm bản ghi</label><input class="form-control" id="doc-link-query" placeholder="Gõ tên, năm, trạng thái, đơn vị..."></div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Bản ghi</label><select class="form-control" id="doc-link-record" size="8"></select></div>`,
        `<button class="btn btn-secondary" id="doc-link-cancel">Hủy</button>
         <button class="btn btn-primary" id="doc-link-confirm">Gắn</button>`);
      const typeSelect = document.getElementById('doc-link-entity-type');
      const queryInput = document.getElementById('doc-link-query');
      const recordSelect = document.getElementById('doc-link-record');
      typeSelect.value = defaultEntityType;
      const loadRecords = async () => {
        const records = await window.api.documents.listLinkableRecords(typeSelect.value, queryInput.value.trim());
        recordSelect.replaceChildren();
        if (!records.length) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'Không tìm thấy bản ghi phù hợp';
          recordSelect.appendChild(option);
          return;
        }
        records.forEach(record => {
          const option = document.createElement('option');
          option.value = record.id;
          option.textContent = `#${record.id} - ${record.title}${record.subtitle ? ` (${record.subtitle})` : ''}`;
          recordSelect.appendChild(option);
        });
      };
      let timer = null;
      typeSelect.addEventListener('change', loadRecords);
      queryInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadRecords, 200); });
      queryInput.focus();
      loadRecords();
      document.getElementById('doc-link-cancel').addEventListener('click', () => { closeModal(); resolve(null); });
      document.getElementById('doc-link-confirm').addEventListener('click', () => {
        const entityId = parseInt(recordSelect.value, 10);
        if (!entityId) { showToast('Vui lòng nhập ID bản ghi hợp lệ', 'warning'); return; }
        const entityType = typeSelect.value;
        closeModal();
        resolve({ entityType, entityId });
      });
    });
  },

  async loadList() {
    const query = document.getElementById('documents-search')?.value.trim() || '';
    const docs = await window.api.documents.list({ query });
    const tbody = document.getElementById('documents-table-body');
    if (!tbody) return;
    clearElement(tbody);
    if (!docs.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 8;
      cell.className = 'empty-state';
      cell.textContent = 'Chưa có tài liệu';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }
    docs.forEach(doc => {
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => this.showDetail(doc.id));
      appendTextCell(row, doc.title);
      appendTextCell(row, doc.document_type);
      appendTextCell(row, doc.original_name);
      appendTextCell(row, doc.tags);
      appendTextCell(row, this.formatSize(doc.size_bytes));
      appendTextCell(row, doc.link_count || 0, '0');
      appendTextCell(row, doc.created_at);
      const action = document.createElement('td');
      action.appendChild(createButton('Mở', 'btn btn-sm btn-secondary', event => { event.stopPropagation(); this.open(doc.id); }));
      action.appendChild(createButton('Xóa', 'btn btn-sm btn-danger', event => { event.stopPropagation(); this.remove(doc.id); }));
      row.appendChild(action);
      tbody.appendChild(row);
    });
  },

  async uploadDocument(linkTarget = null) {
    try {
      const result = await window.api.dialog.openFile([{ name: 'Tài liệu', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip', 'rar'] }]);
      if (result.canceled || !result.filePaths?.length) return null;
      const filePath = result.filePaths[0];
      const originalName = filePath.split(/[\\/]/).pop();
      const metadata = await this.requestDocumentMetadata(originalName);
      if (!metadata) return null;
      const doc = await window.api.documents.createFromFile(filePath, metadata);
      if (linkTarget) await window.api.documents.link(doc.id, linkTarget.entityType, linkTarget.entityId, 'attachment', null);
      showToast('Đã upload tài liệu', 'success');
      await this.loadList();
      return doc;
    } catch (error) {
      showToast(`Không upload được tài liệu: ${error.message}`, 'error');
      console.error('Document upload failed:', error);
      return null;
    }
  },

  async showDetail(id) {
    const doc = await window.api.documents.getById(id);
    if (!doc) return;
    this.currentId = id;
    const links = await window.api.documents.listLinks(id);
    const container = document.getElementById('documents-detail-container');
    clearElement(container);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = 'var(--space-lg)';
    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = doc.title;
    header.appendChild(title);
    header.appendChild(createButton('Đóng', 'btn btn-secondary', () => clearElement(container)));
    card.appendChild(header);

    const info = document.createElement('div');
    info.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:16px';
    [['File', doc.original_name], ['Loại', doc.document_type || '-'], ['Tags', doc.tags || '-'], ['Dung lượng', this.formatSize(doc.size_bytes)], ['Đường dẫn', doc.stored_path]].forEach(([label, value]) => {
      const item = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = label;
      const div = document.createElement('div');
      div.textContent = value;
      item.append(strong, div);
      info.appendChild(item);
    });
    card.appendChild(info);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;margin-bottom:16px';
    actions.appendChild(createButton('Mở file', 'btn btn-primary', () => this.open(id)));
    actions.appendChild(createButton('Mở thư mục', 'btn btn-secondary', () => this.reveal(id)));
    actions.appendChild(createButton('Gắn với bản ghi', 'btn btn-secondary', () => this.linkExisting(id)));
    card.appendChild(actions);

    const linkTitle = document.createElement('h4');
    linkTitle.textContent = 'Liên kết nghiệp vụ';
    card.appendChild(linkTitle);
    if (!links.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Tài liệu chưa gắn với bản ghi nào';
      card.appendChild(empty);
    } else {
      links.forEach(link => {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border-color)';
        const text = document.createElement('span');
        text.textContent = `${link.entity_title || link.entity_type} #${link.entity_id}${link.entity_subtitle ? ` - ${link.entity_subtitle}` : ''} (${link.relation_type || 'attachment'})`;
        text.style.cursor = 'pointer';
        text.title = 'Mở bản ghi liên kết';
        text.addEventListener('click', () => this.openLinkedRecord(link.entity_type, link.entity_id));
        line.appendChild(text);
        line.appendChild(createButton('Gỡ', 'btn btn-sm btn-danger', async () => { await window.api.documents.unlink(link.id); await this.showDetail(id); }));
        card.appendChild(line);
      });
    }
    container.appendChild(card);
  },

  async linkExisting(documentId) {
    const target = await this.requestLinkTarget('constructions');
    if (!target) return;
    await window.api.documents.link(documentId, target.entityType, target.entityId, 'attachment', null);
    showToast('Đã gắn tài liệu', 'success');
    await this.showDetail(documentId);
  },

  openLinkedRecord(entityType, entityId) {
    const map = { warehouses: ['warehouses', 'warehouseModule'], cameras: ['cameras', 'cameraModule'], fireSystems: ['fire-systems', 'fireModule'], constructions: ['constructions', 'constructionModule'] };
    const target = map[entityType];
    if (!target) return;
    navigateTo(target[0]);
    setTimeout(() => window[target[1]]?.edit(entityId), 150);
  },

  async attachExistingToEntity(entityType, entityId) {
    const documentId = await new Promise((resolve) => {
      openModal('Gắn tài liệu có sẵn', `
        <div class="form-group"><label class="form-label">Tìm tài liệu</label><input class="form-control" id="doc-existing-query" placeholder="Gõ tiêu đề, file, tags..."></div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Tài liệu</label><select class="form-control" id="doc-existing-id" size="8"></select></div>`,
        `<button class="btn btn-secondary" id="doc-existing-cancel">Hủy</button>
         <button class="btn btn-primary" id="doc-existing-confirm">Gắn</button>`);
      const queryInput = document.getElementById('doc-existing-query');
      const select = document.getElementById('doc-existing-id');
      const loadDocuments = async () => {
        const docs = await window.api.documents.list({ query: queryInput.value.trim() });
        select.replaceChildren();
        if (!docs.length) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'Không tìm thấy tài liệu phù hợp';
          select.appendChild(option);
          return;
        }
        docs.forEach(doc => {
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = `#${doc.id} - ${doc.title || doc.original_name}`;
          select.appendChild(option);
        });
      };
      let timer = null;
      queryInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadDocuments, 200); });
      queryInput.focus();
      loadDocuments();
      document.getElementById('doc-existing-cancel').addEventListener('click', () => { closeModal(); resolve(null); });
      document.getElementById('doc-existing-confirm').addEventListener('click', () => {
        const id = parseInt(select.value, 10);
        if (!id) { showToast('Vui lòng nhập ID tài liệu hợp lệ', 'warning'); return; }
        closeModal();
        resolve(id);
      });
    });
    if (!documentId) return false;
    await window.api.documents.link(documentId, entityType, entityId, 'attachment', null);
    showToast('Đã gắn tài liệu', 'success');
    return true;
  },

  async open(id) { try { await window.api.documents.open(id); } catch (e) { showToast(e.message, 'error'); } },
  async reveal(id) { try { await window.api.documents.reveal(id); } catch (e) { showToast(e.message, 'error'); } },
  async remove(id) {
    if (!(await confirmAction('Xóa tài liệu này? Liên kết sẽ bị gỡ nhưng file vật lý vẫn được giữ trong kho.'))) return;
    await window.api.documents.delete(id);
    showToast('Đã xóa tài liệu', 'success');
    await this.loadList();
  }
};
window.documentsModule = documentsModule;
