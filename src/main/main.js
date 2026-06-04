const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("./database/db");
const { runMigrations } = require("./database/migrations");
const { runHardeningMigrations } = require("./database/hardening_migrations");
const smartSearch = require("./search/smart_search");
const log = require("./logger");

// Load external license config
let LICENSE_KEY = "20261231";
try {
  const licPath = path.join(__dirname, "license.json");
  if (fs.existsSync(licPath)) {
    const cfg = JSON.parse(fs.readFileSync(licPath, "utf-8"));
    LICENSE_KEY = cfg.key || LICENSE_KEY;
  }
} catch (_) { /* fallback to default */ }

const DEFAULT_PASSWORD = "123456";

let mainWindow = null;
let loginWindow = null;
let currentSession = null;
const APP_ICON = path.join(__dirname, "../../icon.png");

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
  if (!expiry) return { valid: false, daysLeft: 0, reason: "License key khong hop le" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry - today) / 86400000);
  if (daysLeft < 0) return { valid: false, daysLeft, reason: "License da het han ngay " + expiry.toLocaleDateString("vi-VN") };
  return { valid: true, daysLeft };
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    frame: true, backgroundColor: "#0F1923",
    title: "Dang nhap ? Warehouse Management",
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  loginWindow.loadFile(path.join(__dirname, "../renderer/login.html"));
  if (process.argv.includes("--dev")) { loginWindow.webContents.openDevTools(); }
  loginWindow.on("closed", () => { loginWindow = null; });
}

function createWindow(sessionInfo) {
  currentSession = sessionInfo;
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    title: "Warehouse Management",
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false
    },
    frame: true, backgroundColor: "#0F1923", show: false
  });
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.webContents.send("session:info", sessionInfo);
  });
  if (process.argv.includes("--dev")) { mainWindow.webContents.openDevTools(); }
  mainWindow.on("closed", () => { mainWindow = null; });
}

// Shared: incremental search index update after mutation
function withSearchSync(module, operation) {
  const result = operation();
  try {
    const id = result && (result.id || result.lastInsertRowid);
    if (id) { smartSearch.updateRecord(module, id); }
  } catch (e) { log.error("Search index update error", e.message); }
  return result;
}

function withSearchDelete(module, id, operation) {
  const before = operation();
  try { smartSearch.deleteRecord(module, id); } catch (e) { log.error("Search delete error", e.message); }
  return before;
}

function registerIpcHandlers() {
  // Auth
  ipcMain.handle("login:authenticate", (_, sessionInfo) => {
    const { password } = sessionInfo || {};
    if (password !== DEFAULT_PASSWORD) {
      throw new Error("Mat khau khong dung");
    }
    const license = checkLicense();
    sessionInfo.license = license;
    sessionInfo.theme = sessionInfo.theme || "dark";
    sessionInfo.userName = sessionInfo.userName || "Admin";
    log.info("Login", { user: sessionInfo.userName, license });
    createWindow(sessionInfo);
    if (loginWindow) {
      loginWindow.close();
      loginWindow = null;
    }
    return sessionInfo;
  });
  ipcMain.handle("app:logout", () => {
    log.info("Logout", { user: currentSession ? currentSession.userName : "unknown" });
    if (mainWindow) { mainWindow.close(); mainWindow = null; }
    createLoginWindow();
  });

  // Delegate IPC handlers to separate modules
  require("./ipc/units")();
  require("./ipc/locations")();
  require("./ipc/catalogs")();
  require("./ipc/warehouses")();
  require("./ipc/cameras")();
  require("./ipc/fire_systems")();
  require("./ipc/constructions")();
  require("./ipc/excel")();
  require("./ipc/dialog")(mainWindow);
  require("./ipc/stats")();
  require("./ipc/search")();
  require("./ipc/backup")();
  require("./ipc/documents")();
  require("./ipc/reports")();
}

app.whenReady().then(() => {
  runMigrations();
  runHardeningMigrations();
  log.info("App started");
  registerIpcHandlers();
  try { smartSearch.rebuild(); } catch (e) { log.error("Smart search index error", e.message); }
  createLoginWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createLoginWindow();
  });
});

app.on("window-all-closed", () => {
  log.info("App closing");
  db.close();
  if (process.platform !== "darwin") app.quit();
});
