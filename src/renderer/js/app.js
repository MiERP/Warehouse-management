// === APP.JS - Router, Modal, Toast, Dashboard, Global Search ===

const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages = document.querySelectorAll('.page');
const headerTitle = document.getElementById('header-title');

const PAGE_TITLES = {
  'dashboard': 'Dashboard',
  'warehouses': 'Qu?n l� Nh� kho',
  'fire-systems': 'H? th?ng C?u h?a t?p trung',
  'cameras': 'Camera An ninh',
  'constructions': 'C�ng tr�nh',
  'config': 'C?u h�nh h? th?ng',
  'documents': 'Qu?n l� T�i li?u'
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
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML || '';
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
function buildOptions(items, valueField = 'id', textField = 'name', placeholder = '-- Ch?n --') {
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
    countEl.textContent = `${filtered.length} d? �n`;
    body.innerHTML = filtered.map(c => `
      <tr style="cursor:pointer" onclick="openSearchResult('construction',${c.id})"><td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.construction_type || '-')}</td>
      <td>${c.status ? '<span class="badge '+(c.status==='Ho�n th�nh'?'success':'info')+'">' + escapeHTML(c.status) + '</span>' : '-'}</td>
      <td>${escapeHTML(c.parent_unit_name || '-')}</td></tr>
    `).join('');
  };

  const refreshValues = () => {
    const values = uniqueDashboardValues(rows, fieldSelect.value);
    valueSelect.innerHTML = '<option value="">T?t c?</option>' + values.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('');
    renderRows();
  };

  fieldSelect.addEventListener('change', refreshValues);
  valueSelect.addEventListener('change', renderRows);
  refreshValues();
}

// === DASHBOARD (Redesigned � matching mockup image 5) ===
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
    if (stats.warehouseByType && stats.warehouseByType.length) {
      whTypeContainer.innerHTML = `<table style="width:100%"><thead><tr>
        <th style="text-align:left">Ph�n lo?i kho</th><th>S? lu?ng</th><th>T?ng DT (m�)</th>
      </tr></thead><tbody>${stats.warehouseByType.map(w => `
        <tr style="cursor:pointer" onclick="openDashboardFilter('warehouses',{warehouse_type_id:${w.type_id === null ? 'null' : w.type_id},label:'Lo?i kho: ${escapeHTML(w.type_name)}'})"><td>${escapeHTML(w.type_name)}</td><td style="text-align:center">${w.count}</td>
        <td style="text-align:center">${w.total_area ? Math.round(w.total_area) : 0}</td></tr>
      `).join('')}</tbody></table>`;
    } else {
      whTypeContainer.innerHTML = '<p style="color:var(--text-muted)">Chua c� d? li?u</p>';
    }

    // Constructions by year (list)
    const conContainer = document.getElementById('dashboard-constructions');
    if (stats.constructionsByYear && stats.constructionsByYear.length) {
      conContainer.innerHTML = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <select class="form-control" id="dash-con-filter-field" style="max-width:170px"><option value="status">Tr?ng th�i</option><option value="parent_unit_name">�on v?</option><option value="year_started">Nam b?t d?u</option><option value="year_completed">Nam ho�n th�nh</option><option value="construction_type">Lo?i</option></select>
        <select class="form-control" id="dash-con-filter-value" style="max-width:240px"></select>
        <strong id="dash-con-count">${stats.constructionsByYear.length} d? �n</strong>
      </div><table style="width:100%"><thead><tr>
        <th style="text-align:left">T�n c�ng tr�nh</th><th>Lo?i</th><th>Tr?ng th�i</th><th>�on v?</th>
      </tr></thead><tbody id="dash-con-body">${stats.constructionsByYear.map(c => `
        <tr style="cursor:pointer" onclick="openSearchResult('construction',${c.id})"><td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.construction_type || '-')}</td>
        <td>${c.status ? '<span class="badge '+(c.status==='Ho�n th�nh'?'success':'info')+'">' + escapeHTML(c.status) + '</span>' : '-'}</td>
        <td>${escapeHTML(c.parent_unit_name || '-')}</td></tr>
      `).join('')}</tbody></table>`;
      setupDashboardConstructionFilter(stats.constructionsByYear);
    } else {
      conContainer.innerHTML = '<p style="color:var(--text-muted)">Kh�ng c� d? �n trong nam nay</p>';
    }

    // Alerts
    const alertContainer = document.getElementById('dashboard-alerts');
    if (stats.alerts && stats.alerts.length) {
      const typeLabels = { warehouse: 'Nh� kho', fire_system: 'C?u h?a', camera: 'Camera' };
      alertContainer.innerHTML = `<table style="width:100%"><thead><tr>
        <th style="text-align:left">T�n</th><th>Lo?i</th><th>Nam XD</th><th>Nam SC</th><th>�on v?</th>
      </tr></thead><tbody>${stats.alerts.map(a => `
        <tr style="color:var(--color-warning)">
          <td>${a.name || '-'}</td>
          <td><span class="badge warning">${typeLabels[a.type] || a.type}</span></td>
          <td>${a.year_built || '-'}</td><td>${a.year_renovated || '-'}</td>
          <td>${a.parent_unit_name || '-'}</td>
        </tr>
      `).join('')}</tbody></table>`;
    } else {
      alertContainer.innerHTML = '<p style="color:var(--text-success)">? Kh�ng c� c?nh b�o</p>';
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
  const moduleLabels = { warehouse: 'Nh� kho', camera: 'Camera', fire: 'C?u h?a', construction: 'C�ng tr�nh', documents: 'T�i li?u' };
  searchResults.replaceChildren();

  if (!results.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:12px;color:var(--text-muted)';
    empty.textContent = 'Kh�ng t�m th?y';
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
    subtitle.textContent = `${moduleLabels[r.module] || r.module} � ${r.subtitle || r.status || ''}`;
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
      searchResults.innerHTML = '<div style="padding:12px;color:var(--color-danger)">L?i t�m ki?m</div>';
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
    const nameEl = document.getElementById('sidebar-user-name');
    const unitEl = document.getElementById('sidebar-user-unit');
    if (nameEl) nameEl.textContent = info.userName || '�';
    if (unitEl) unitEl.textContent = info.unitName || '�';
    // Apply theme from login
    initTheme(info.theme);
  });
}

// === LOGOUT ===
document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
  const ok = await confirmAction('B?n c� ch?c mu?n dang xu?t?');
  if (ok && window.appApi) {
    await window.appApi.logout();
  }
});




