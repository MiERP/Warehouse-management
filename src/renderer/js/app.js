// === APP.JS - Router, Modal, Toast, Dashboard, Global Search ===

const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages = document.querySelectorAll('.page');
const headerTitle = document.getElementById('header-title');

const PAGE_TITLES = {
  'dashboard': 'Dashboard',
  'warehouses': 'Quản lý Nhà kho',
  'fire-systems': 'Hệ thống Cứu hỏa tập trung',
  'cameras': 'Camera An ninh',
  'constructions': 'Công trình',
  'config': 'Cấu hình hệ thống',
  'documents': 'Quản lý Tài liệu'
};

function navigateTo(pageId) {
  navItems.forEach(item => item.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add('active');
  pages.forEach(page => page.classList.remove('active'));
  const activePage = document.getElementById(`page-${pageId}`);
  if (activePage) activePage.classList.add('active');
  headerTitle.textContent = PAGE_TITLES[pageId] || 'Dashboard';
  onPageLoad(pageId);
}

navItems.forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

async function onPageLoad(pageId) {
  if (pageId === 'dashboard') loadDashboard();
  else if (pageId === 'warehouses' && typeof warehouseModule !== 'undefined') warehouseModule.loadList();
  else if (pageId === 'cameras' && typeof cameraModule !== 'undefined') cameraModule.loadList();
  else if (pageId === 'fire-systems' && typeof fireModule !== 'undefined') fireModule.loadList();
  else if (pageId === 'constructions' && typeof constructionModule !== 'undefined') constructionModule.loadList();
  else if (pageId === 'documents' && typeof documentsModule !== 'undefined') documentsModule.loadList();
  else if (pageId === 'config' && typeof configModule !== 'undefined') configModule.loadAll();
}

// Config sub-tabs
document.getElementById('config-tabs')?.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab-item');
  if (!tab) return;
  document.querySelectorAll('#config-tabs .tab-item').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('#page-config .tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tab.dataset.tab)?.classList.add('active');
  if (tab.dataset.tab === 'config-safety' && window.configModule) configModule.loadSafety();
  if (tab.dataset.tab === 'config-duplicates' && window.configModule) configModule.loadDuplicates();
});

// Modal
function openModal(title, bodyHTML, footerHTML) {
  document.getElementById('modal-title').textContent = title;
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  clearElement(modalBody);
  clearElement(modalFooter);
  if (bodyHTML) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyHTML;
    modalBody.append(...tempDiv.children);
  }
  if (footerHTML) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = footerHTML;
    modalFooter.append(...tempDiv.children);
  }
  document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }
document.getElementById('modal-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleNewShortcut(); }
});

function handleNewShortcut() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const id = activePage.id;
  if (id === 'page-warehouses') warehouseModule.showForm();
  else if (id === 'page-cameras') cameraModule.showForm();
  else if (id === 'page-fire-systems') fireModule.showForm();
  else if (id === 'page-constructions') constructionModule.showForm();
}

// Toast
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 300ms ease'; setTimeout(() => toast.remove(), 300); }, duration);
}

// Confirm dialog
let _confirmSeq = 0;
const _confirmCallbacks = new Map();

function confirmAction(message) {
  return new Promise((resolve) => {
    const id = ++_confirmSeq;
    _confirmCallbacks.set(id, resolve);
    openModal('Xác nhận', `<p style="color:var(--text-secondary)">${escapeHTML(message)}</p>`, '');

    const footer = document.getElementById('modal-footer');
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Hủy';
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-danger';
    confirmButton.textContent = 'Xác nhận';

    const resolveConfirm = (result) => {
      const cb = _confirmCallbacks.get(id);
      if (cb) {
        cb(result);
        _confirmCallbacks.delete(id);
      }
      closeModal();
    };

    cancelButton.addEventListener('click', () => resolveConfirm(false));
    confirmButton.addEventListener('click', () => resolveConfirm(true));
    footer.replaceChildren(cancelButton, confirmButton);
  });
}

// Helper: build <select> options
function buildOptions(items, valueField = 'id', textField = 'name', placeholder = '-- Chọn --') {
  let html = `<option value="">${placeholder}</option>`;
  items.forEach(i => { html += `<option value="${i[valueField]}">${i[textField]}</option>`; });
  return html;
}

function openDashboardFilter(moduleName, filter) {
  if (moduleName === 'warehouses') return warehouseModule.openFiltered(filter);
  if (moduleName === 'constructions') return constructionModule.openFiltered(filter);
  navigateTo(moduleName);
}

function uniqueDashboardValues(rows, field) {
  return [...new Set(rows.map(row => String(row[field] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
}

function setupDashboardConstructionFilter(rows) {
  const fieldSelect = document.getElementById('dash-con-filter-field');
  const valueSelect = document.getElementById('dash-con-filter-value');
  const countEl = document.getElementById('dash-con-count');
  const body = document.getElementById('dash-con-body');
  if (!fieldSelect || !valueSelect || !countEl || !body) return;

  const renderRows = () => {
    const field = fieldSelect.value;
    const value = valueSelect.value;
    const filtered = value ? rows.filter(row => String(row[field] || '') === value) : rows;
    countEl.textContent = `${filtered.length} dự án`;
    clearElement(body);
    filtered.forEach(c => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => openSearchResult('construction', c.id));
      const tdName = document.createElement('td');
      tdName.textContent = c.name || '';
      const tdType = document.createElement('td');
      tdType.textContent = c.construction_type || '-';
      const tdStatus = document.createElement('td');
      if (c.status) {
        const span = document.createElement('span');
        span.className = 'badge ' + (c.status === 'Hoàn thành' ? 'success' : 'info');
        span.textContent = c.status;
        tdStatus.appendChild(span);
      } else {
        tdStatus.textContent = '-';
      }
      const tdUnit = document.createElement('td');
      tdUnit.textContent = c.parent_unit_name || '-';
      tr.append(tdName, tdType, tdStatus, tdUnit);
      body.appendChild(tr);
    });
  };

  const refreshValues = () => {
    const values = uniqueDashboardValues(rows, fieldSelect.value);
    clearElement(valueSelect);
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = 'Tất cả';
    valueSelect.appendChild(allOpt);
    values.forEach(value => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      valueSelect.appendChild(opt);
    });
    renderRows();
  };

  fieldSelect.addEventListener('change', refreshValues);
  valueSelect.addEventListener('change', renderRows);
  refreshValues();
}

// === DASHBOARD ===
async function loadDashboard() {
  try {
    const stats = await window.api.stats.overview();

    // Stat cards
    document.getElementById('stat-chien-dich').textContent = stats.khoChienDich || 0;
    document.getElementById('stat-chien-thuat').textContent = stats.khoChienThuat || 0;
    document.getElementById('stat-cameras').textContent = stats.cameras || 0;
    document.getElementById('stat-fire').textContent = stats.fireSystems || 0;
    document.getElementById('stat-chien-dich').closest('.stat-card').onclick = () => openDashboardFilter('warehouses', { warehouse_category: 'chien_dich', label: 'Kho Chi?n d?ch' });
    document.getElementById('stat-chien-thuat').closest('.stat-card').onclick = () => openDashboardFilter('warehouses', { warehouse_category: 'chien_thuat', label: 'Kho Chi?n thu?t' });

    // Warehouse by type (list)
    const whTypeContainer = document.getElementById('dashboard-warehouse-types');
    clearElement(whTypeContainer);
    if (stats.warehouseByType && stats.warehouseByType.length) {
      const table = document.createElement('table');
      table.style.width = '100%';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Phân loại kho', 'Số lượng', 'Tổng DT (m²)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        if (text !== 'Phân loại kho') th.style.textAlign = 'center';
        else th.style.textAlign = 'left';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      stats.warehouseByType.forEach(w => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => openDashboardFilter('warehouses', { warehouse_type_id: w.type_id === null ? null : w.type_id, label: 'Loại kho: ' + (w.type_name || '') }));
        const tdName = document.createElement('td');
        tdName.textContent = w.type_name || '';
        const tdCount = document.createElement('td');
        tdCount.style.textAlign = 'center';
        tdCount.textContent = w.count || 0;
        const tdArea = document.createElement('td');
        tdArea.style.textAlign = 'center';
        tdArea.textContent = w.total_area ? Math.round(w.total_area) : 0;
        tr.append(tdName, tdCount, tdArea);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      whTypeContainer.appendChild(table);
    } else {
      const p = document.createElement('p');
      p.style.color = 'var(--text-muted)';
      p.textContent = 'Chưa có dữ liệu';
      whTypeContainer.appendChild(p);
    }

    // Constructions by year (list)
    const conContainer = document.getElementById('dashboard-constructions');
    clearElement(conContainer);
    if (stats.constructionsByYear && stats.constructionsByYear.length) {
      const filterBar = document.createElement('div');
      filterBar.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:12px';

      const fieldSelect = document.createElement('select');
      fieldSelect.className = 'form-control';
      fieldSelect.id = 'dash-con-filter-field';
      fieldSelect.style.maxWidth = '170px';
      const fieldOptions = [
        { value: 'status', text: 'Trạng thái' },
        { value: 'parent_unit_name', text: 'Đơn vị' },
        { value: 'year_started', text: 'Năm bắt đầu' },
        { value: 'year_completed', text: 'Năm hoàn thành' },
        { value: 'construction_type', text: 'Loại' }
      ];
      fieldOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        fieldSelect.appendChild(option);
      });

      const valueSelect = document.createElement('select');
      valueSelect.className = 'form-control';
      valueSelect.id = 'dash-con-filter-value';
      valueSelect.style.maxWidth = '240px';

      const countStrong = document.createElement('strong');
      countStrong.id = 'dash-con-count';
      countStrong.textContent = `${stats.constructionsByYear.length} dự án`;

      filterBar.append(fieldSelect, valueSelect, countStrong);
      conContainer.appendChild(filterBar);

      const table = document.createElement('table');
      table.style.width = '100%';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Tên công trình', 'Loại', 'Trạng thái', 'Đơn vị'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.textAlign = text === 'Tên công trình' ? 'left' : 'center';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      tbody.id = 'dash-con-body';
      stats.constructionsByYear.forEach(c => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => openSearchResult('construction', c.id));
        const tdName = document.createElement('td');
        tdName.textContent = c.name || '';
        const tdType = document.createElement('td');
        tdType.style.textAlign = 'center';
        tdType.textContent = c.construction_type || '-';
        const tdStatus = document.createElement('td');
        tdStatus.style.textAlign = 'center';
        if (c.status) {
          const span = document.createElement('span');
          span.className = 'badge ' + (c.status === 'Hoàn thành' ? 'success' : 'info');
          span.textContent = c.status;
          tdStatus.appendChild(span);
        } else {
          tdStatus.textContent = '-';
        }
        const tdUnit = document.createElement('td');
        tdUnit.style.textAlign = 'center';
        tdUnit.textContent = c.parent_unit_name || '-';
        tr.append(tdName, tdType, tdStatus, tdUnit);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      conContainer.appendChild(table);
      setupDashboardConstructionFilter(stats.constructionsByYear);
    } else {
      const p = document.createElement('p');
      p.style.color = 'var(--text-muted)';
      p.textContent = 'Không có dự án trong năm nay';
      conContainer.appendChild(p);
    }

    // Alerts
    const alertContainer = document.getElementById('dashboard-alerts');
    clearElement(alertContainer);
    if (stats.alerts && stats.alerts.length) {
      const typeLabels = { warehouse: 'Nhà kho', fire_system: 'Cứu hỏa', camera: 'Camera' };
      const table = document.createElement('table');
      table.style.width = '100%';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Tên', 'Loại', 'Năm XD', 'Năm SC', 'Đơn vị'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.textAlign = text === 'Tên' ? 'left' : 'center';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      stats.alerts.forEach(a => {
        const tr = document.createElement('tr');
        tr.style.color = 'var(--color-warning)';
        const tdName = document.createElement('td');
        tdName.textContent = a.name || '-';
        const tdType = document.createElement('td');
        tdType.style.textAlign = 'center';
        const span = document.createElement('span');
        span.className = 'badge warning';
        span.textContent = typeLabels[a.type] || a.type || '';
        tdType.appendChild(span);
        const tdYearBuilt = document.createElement('td');
        tdYearBuilt.style.textAlign = 'center';
        tdYearBuilt.textContent = a.year_built || '-';
        const tdYearRenovated = document.createElement('td');
        tdYearRenovated.style.textAlign = 'center';
        tdYearRenovated.textContent = a.year_renovated || '-';
        const tdUnit = document.createElement('td');
        tdUnit.style.textAlign = 'center';
        tdUnit.textContent = a.parent_unit_name || '-';
        tr.append(tdName, tdType, tdYearBuilt, tdYearRenovated, tdUnit);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      alertContainer.appendChild(table);
    } else {
      const p = document.createElement('p');
      p.style.color = 'var(--text-success)';
      p.textContent = '✓ Không có cảnh báo';
      alertContainer.appendChild(p);
    }
  } catch (e) { console.error('Dashboard error:', e); }
}

// === GLOBAL SEARCH ===
let searchTimeout = null;
const searchInput = document.getElementById('global-search');
const searchResults = document.getElementById('search-results');

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

async function openSearchResult(module, id) {
  const modulePages = { warehouse: 'warehouses', camera: 'cameras', fire: 'fire-systems', construction: 'constructions', documents: 'documents' };
  navigateTo(modulePages[module]);
  searchResults.style.display = 'none';
  searchInput.value = '';
  await new Promise(resolve => setTimeout(resolve, 150));
  if (module === 'warehouse' && window.warehouseModule) return warehouseModule.edit(id);
  if (module === 'camera' && window.cameraModule) return cameraModule.edit(id);
  if (module === 'fire' && window.fireModule) return fireModule.edit(id);
  if (module === 'construction' && window.constructionModule) return constructionModule.edit(id);
  if (module === 'documents' && window.documentsModule) return documentsModule.showDetail(id);
}

function renderSearchResults(results) {
  const moduleLabels = { warehouse: 'Nhà kho', camera: 'Camera', fire: 'Cứu hỏa', construction: 'Công trình', documents: 'Tài liệu' };
  searchResults.replaceChildren();

  if (!results.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:12px;color:var(--text-muted)';
    empty.textContent = 'Không tìm thấy';
    searchResults.appendChild(empty);
    return;
  }

  results.forEach(r => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.style.cssText = 'padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-color);transition:background 0.15s';
    item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg-hover)'; });
    item.addEventListener('mouseleave', () => { item.style.background = ''; });
    item.addEventListener('click', () => openSearchResult(r.module, Number(r.id || r.record_id)));

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;gap:8px;align-items:center';
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;font-size:13px';
    title.textContent = r.title || '';
    const score = document.createElement('div');
    score.style.cssText = 'font-size:10px;color:var(--text-muted)';
    score.textContent = String(Math.round(r.score || 0));
    header.append(title, score);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:11px;color:var(--text-muted)';
    subtitle.textContent = `${moduleLabels[r.module] || r.module} • ${r.subtitle || r.status || ''}`;
    item.append(header, subtitle);

    if (Array.isArray(r.matched_reason) && r.matched_reason.length) {
      const reasons = document.createElement('div');
      reasons.style.cssText = 'margin-top:4px;display:flex;gap:4px;flex-wrap:wrap';
      r.matched_reason.forEach(reason => {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:10px;padding:2px 6px;border-radius:999px;background:rgba(59,130,246,.15);color:var(--color-primary)';
        badge.textContent = reason;
        reasons.appendChild(badge);
      });
      item.appendChild(reasons);
    }
    searchResults.appendChild(item);
  });
}
searchInput?.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (q.length < 2) { searchResults.style.display = 'none'; return; }
  searchTimeout = setTimeout(async () => {
    try {
      const results = await window.api.search.smart(q, { limit: 20 });
      renderSearchResults(results);
      searchResults.style.display = 'block';
    } catch (e) {
      console.error('Search error:', e);
      clearElement(searchResults);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'padding:12px;color:var(--color-danger)';
      errorDiv.textContent = 'Lỗi tìm kiếm';
      searchResults.appendChild(errorDiv);
      searchResults.style.display = 'block';
    }
  }, 250);
});

// Hide search results on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) {
    searchResults.style.display = 'none';
  }
});
document.addEventListener('DOMContentLoaded', () => { loadDashboard(); });

// === THEME MANAGEMENT ===
const THEME_KEY = 'wm_theme_preference';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Initialize theme from session or localStorage
function initTheme(sessionTheme) {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = sessionTheme || saved || 'dark';
  applyTheme(theme);
}

// Theme toggle handler
document.getElementById('header-theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});

// === SESSION INFO ===
if (window.sessionApi) {
  window.sessionApi.onInfo((info) => {
    const userName = info.userName || 'Người dùng';
    const unitName = info.unitName || 'Đơn vị';
    const nameEl = document.getElementById('sidebar-user-name');
    const unitEl = document.getElementById('sidebar-user-unit');
    const headerUserEl = document.getElementById('header-user');
    if (nameEl) nameEl.textContent = userName;
    if (unitEl) unitEl.textContent = unitName;
    if (headerUserEl) {
      headerUserEl.textContent = userName.trim().charAt(0).toUpperCase() || 'N';
      headerUserEl.title = userName;
    }
    initTheme(info.theme);
  });
}

// === LOGOUT ===
document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
  const ok = await confirmAction('Bạn có chắc muốn đăng xuất?');
  if (ok && window.appApi) {
    await window.appApi.logout();
  }
});




