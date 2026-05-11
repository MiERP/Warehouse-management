// === LOGIN.JS ===

const DEFAULT_PASSWORD = '123456';
const THEME_KEY = 'wm_theme_preference';
const LICENSE_KEY = '20260731'; // YYYYMMDD - han su dung den ngay nay

const form = document.getElementById('login-form');
const unitInput = document.getElementById('unit-name');
const userInput = document.getElementById('user-name');
const passwordInput = document.getElementById('password');
const errorEl = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const themeToggle = document.getElementById('theme-toggle');
const licenseInfoEl = document.getElementById('license-info');

// === THEME MANAGEMENT ===
function getPreferredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

applyTheme(getPreferredTheme());

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});

// === LICENSE MANAGEMENT ===
function parseLicenseKey(key) {
  if (!key || key.length !== 8 || !/^\d{8}$/.test(key)) return null;
  const year = parseInt(key.slice(0, 4), 10);
  const month = parseInt(key.slice(4, 6), 10) - 1;
  const day = parseInt(key.slice(6, 8), 10);
  const expiry = new Date(year, month, day);
  if (expiry.getFullYear() !== year || expiry.getMonth() !== month || expiry.getDate() !== day) return null;
  return expiry;
}

function checkLicense() {
  const expiry = parseLicenseKey(LICENSE_KEY);
  if (!expiry) {
    showLicense('License key khong hop le', 'expired');
    lockLogin('License key khong hop le');
    return { valid: false, daysLeft: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry - today) / 86400000);

  if (daysLeft < 0) {
    const expiredDate = expiry.toLocaleDateString('vi-VN');
    showLicense('License da het han ngay ' + expiredDate, 'expired');
    lockLogin('License da het han ngay ' + expiredDate);
    return { valid: false, daysLeft };
  }

  if (daysLeft <= 7) {
    showLicense('demo - còn ' + daysLeft + ' ngày', 'warning');
  } else {
    showLicense('demo - còn ' + daysLeft + ' ngày', 'valid');
  }
  return { valid: true, daysLeft };
}

function showLicense(message, type) {
  if (!licenseInfoEl) return;
  licenseInfoEl.textContent = message;
  licenseInfoEl.className = 'license-info ' + type;
  licenseInfoEl.style.display = 'block';
}

function lockLogin(message) {
  passwordInput.disabled = true;
  passwordInput.placeholder = 'Da khoa - ' + message;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Da khoa';
}

const licenseStatus = checkLicense();

// === FORM HANDLING ===
function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function hideError() {
  errorEl.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  if (!licenseStatus.valid) {
    showError('Khong the dang nhap: License da het han hoac khong hop le');
    return;
  }

  const unitName = unitInput.value.trim();
  const userName = userInput.value.trim();
  const password = passwordInput.value;

  if (!unitName) {
    showError('Vui long nhap ten don vi su dung');
    unitInput.focus();
    return;
  }

  if (!userName) {
    showError('Vui long nhap ten nguoi su dung');
    userInput.focus();
    return;
  }

  if (!password) {
    showError('Vui long nhap mat khau');
    passwordInput.focus();
    return;
  }

  if (password !== DEFAULT_PASSWORD) {
    showError('Mat khau khong dung');
    passwordInput.focus();
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Dang dang nhap...';

  try {
    const sessionInfo = {
      unitName,
      userName,
      password,
      loginTime: new Date().toISOString(),
      theme: getPreferredTheme(),
      licenseKey: LICENSE_KEY,
      licenseExpiry: parseLicenseKey(LICENSE_KEY) ? parseLicenseKey(LICENSE_KEY).toISOString() : null
    };

    await window.loginApi.authenticate(sessionInfo);
  } catch (err) {
    showError('Loi dang nhap: ' + err.message);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Dang nhap';
  }
});

unitInput.focus();