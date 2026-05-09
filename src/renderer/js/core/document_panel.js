const documentPanel = {
  async render(container, entityType, entityId) {
    clearElement(container);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = 'var(--space-lg)';
    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Tài liệu liên quan';
    header.appendChild(title);
    card.appendChild(header);

    if (!entityId) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Lưu bản ghi trước khi đính kèm tài liệu.';
      card.appendChild(empty);
      container.appendChild(card);
      return;
    }

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
    toolbar.appendChild(createButton('Upload tài liệu mới', 'btn btn-primary', async () => {
      await documentsModule.uploadDocument({ entityType, entityId });
      await this.render(container, entityType, entityId);
    }));
    toolbar.appendChild(createButton('Gắn tài liệu có sẵn', 'btn btn-secondary', async () => {
      const linked = await documentsModule.attachExistingToEntity(entityType, entityId);
      if (linked) await this.render(container, entityType, entityId);
    }));
    card.appendChild(toolbar);

    const docs = await window.api.documents.listForEntity(entityType, entityId);
    if (!docs.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Chưa có tài liệu liên quan';
      card.appendChild(empty);
    } else {
      docs.forEach(doc => {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 120px 180px 220px;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--border-color)';
        const name = document.createElement('div');
        name.textContent = doc.title;
        const type = document.createElement('div');
        type.textContent = doc.document_type || '-';
        const date = document.createElement('div');
        date.textContent = doc.created_at || '-';
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px';
        actions.appendChild(createButton('Mở', 'btn btn-sm btn-secondary', () => documentsModule.open(doc.id)));
        actions.appendChild(createButton('Chi tiết', 'btn btn-sm btn-secondary', () => { navigateTo('documents'); setTimeout(() => documentsModule.showDetail(doc.id), 100); }));
        actions.appendChild(createButton('Gỡ', 'btn btn-sm btn-danger', async () => { await window.api.documents.unlink(doc.link_id); await this.render(container, entityType, entityId); }));
        row.append(name, type, date, actions);
        card.appendChild(row);
      });
    }
    container.appendChild(card);
  }
};
window.documentPanel = documentPanel;
