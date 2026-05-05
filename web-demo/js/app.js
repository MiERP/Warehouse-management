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
  'config': 'Cấu hình hệ thống'
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
function confirmAction(message) {
  return new Promise((resolve) => {
    openModal('Xác nhận', `<p style="color:var(--text-secondary)">${message}</p>`,
      `<button class="btn btn-secondary" onclick="closeModal();window._cr(false)">Hủy</button>
       <button class="btn btn-danger" onclick="closeModal();window._cr(true)">Xác nhận</button>`);
    window._cr = resolve;
  });
}

// Helper: build <select> options
function buildOptions(items, valueField = 'id', textField = 'name', placeholder = '-- Chọn --') {
  let html = `<option value="">${placeholder}</option>`;
  items.forEach(i => { html += `<option value="${i[valueField]}">${i[textField]}</option>`; });
  return html;
}

// === DASHBOARD (Redesigned — matching mockup image 5) ===
async function loadDashboard() {
  try {
    const stats = await window.api.stats.overview();

    // Stat cards
    document.getElementById('stat-chien-dich').textContent = stats.khoChienDich || 0;
    document.getElementById('stat-chien-thuat').textContent = stats.khoChienThuat || 0;
    document.getElementById('stat-cameras').textContent = stats.cameras || 0;
    document.getElementById('stat-fire').textContent = stats.fireSystems || 0;

    // Current year
    const yearEl = document.getElementById('dashboard-current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Warehouse by type (list)
    const whTypeContainer = document.getElementById('dashboard-warehouse-types');
    if (stats.warehouseByType && stats.warehouseByType.length) {
      whTypeContainer.innerHTML = `<table style="width:100%"><thead><tr>
        <th style="text-align:left">Phân loại kho</th><th>Số lượng</th><th>Tổng DT (m²)</th>
      </tr></thead><tbody>${stats.warehouseByType.map(w => `
        <tr><td>${w.type_name}</td><td style="text-align:center">${w.count}</td>
        <td style="text-align:center">${w.total_area ? Math.round(w.total_area) : 0}</td></tr>
      `).join('')}</tbody></table>`;
    } else {
      whTypeContainer.innerHTML = '<p style="color:var(--text-muted)">Chưa có dữ liệu</p>';
    }

    // Constructions by year (list)
    const conContainer = document.getElementById('dashboard-constructions');
    if (stats.constructionsByYear && stats.constructionsByYear.length) {
      conContainer.innerHTML = `<table style="width:100%"><thead><tr>
        <th style="text-align:left">Tên công trình</th><th>Loại</th><th>Trạng thái</th><th>Đơn vị</th>
      </tr></thead><tbody>${stats.constructionsByYear.map(c => `
        <tr><td>${c.name}</td><td>${c.construction_type || '-'}</td>
        <td>${c.status ? '<span class="badge '+(c.status==='Hoàn thành'?'success':'info')+'">' + c.status + '</span>' : '-'}</td>
        <td>${c.parent_unit_name || '-'}</td></tr>
      `).join('')}</tbody></table>`;
    } else {
      conContainer.innerHTML = '<p style="color:var(--text-muted)">Không có dự án trong năm nay</p>';
    }

    // Alerts
    const alertContainer = document.getElementById('dashboard-alerts');
    if (stats.alerts && stats.alerts.length) {
      const typeLabels = { warehouse: 'Nhà kho', fire_system: 'Cứu hỏa', camera: 'Camera' };
      alertContainer.innerHTML = `<table style="width:100%"><thead><tr>
        <th style="text-align:left">Tên</th><th>Loại</th><th>Năm XD</th><th>Năm SC</th><th>Đơn vị</th>
      </tr></thead><tbody>${stats.alerts.map(a => `
        <tr style="color:var(--color-warning)">
          <td>${a.name || '-'}</td>
          <td><span class="badge warning">${typeLabels[a.type] || a.type}</span></td>
          <td>${a.year_built || '-'}</td><td>${a.year_renovated || '-'}</td>
          <td>${a.parent_unit_name || '-'}</td>
        </tr>
      `).join('')}</tbody></table>`;
    } else {
      alertContainer.innerHTML = '<p style="color:var(--text-success)">✓ Không có cảnh báo</p>';
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

function renderSearchResults(results) {
  const moduleLabels = { warehouse: 'Nhà kho', camera: 'Camera', fire: 'Cứu hỏa', construction: 'Công trình' };
  const modulePages = { warehouse: 'warehouses', camera: 'cameras', fire: 'fire-systems', construction: 'constructions' };

  if (!results.length) {
    searchResults.innerHTML = '<div style="padding:12px;color:var(--text-muted)">Không tìm thấy</div>';
    return;
  }

  searchResults.innerHTML = results.map(r => {
    const reasons = Array.isArray(r.matched_reason) && r.matched_reason.length
      ? `<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">${r.matched_reason.map(reason => `<span style="font-size:10px;padding:2px 6px;border-radius:999px;background:rgba(59,130,246,.15);color:var(--color-primary)">${escapeHTML(reason)}</span>`).join('')}</div>`
      : '';
    return `
      <div class="search-result-item" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-color);transition:background 0.15s"
        onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''"
        onclick="navigateTo('${modulePages[r.module]}');searchResults.style.display='none';searchInput.value=''">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div style="font-weight:600;font-size:13px">${escapeHTML(r.title)}</div>
          <div style="font-size:10px;color:var(--text-muted)">${Math.round(r.score || 0)}</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted)">${moduleLabels[r.module] || r.module} · ${escapeHTML(r.subtitle || r.status || '')}</div>
        ${reasons}
      </div>`;
  }).join('');
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
      searchResults.innerHTML = '<div style="padding:12px;color:var(--color-danger)">Lỗi tìm kiếm</div>';
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

