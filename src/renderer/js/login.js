// === LOGIN.JS ===

const DEFAULT_PASSWORD = '123456';
const THEME_KEY = 'wm_theme_preference';

const form = document.getElementById('login-form');
const unitInput = document.getElementById('unit-name');
const userInput = document.getElementById('user-name');
const passwordInput = document.getElementById('password');
const errorEl = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const themeToggle = document.getElementById('theme-toggle');

// === THEME MANAGEMENT ===
function getPreferredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Initialize theme on load
applyTheme(getPreferredTheme());

// Theme toggle handler
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
});

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

  const unitName = unitInput.value.trim();
  const userName = userInput.value.trim();
  const password = passwordInput.value;

  if (!unitName) {
    showError('Vui lòng nhập tên đơn vị sử dụng');
    unitInput.focus();
    return;
  }

  if (!userName) {
    showError('Vui lòng nhập tên người sử dụng');
    userInput.focus();
    return;
  }

  if (!password) {
    showError('Vui lòng nhập mật khẩu');
    passwordInput.focus();
    return;
  }

  if (password !== DEFAULT_PASSWORD) {
    showError('Mật khẩu không đúng');
    passwordInput.focus();
    return;
  }

  // Disable button during processing
  loginBtn.disabled = true;
  loginBtn.textContent = 'Đang đăng nhập...';

  try {
    const sessionInfo = {
      unitName,
      userName,
      loginTime: new Date().toISOString(),
      theme: getPreferredTheme()
    };

    // Send to main process
    await window.loginApi.authenticate(sessionInfo);
  } catch (err) {
    showError('Lỗi đăng nhập: ' + err.message);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Đăng nhập';
  }
});

// Focus first field on load
unitInput.focus();
