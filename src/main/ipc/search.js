const { ipcMain } = require("electron");
const smartSearch = require("../search/smart_search");
const { listMigrations } = require("../database/hardening_migrations");
const { listAudit } = require("../audit");
const duplicateService = require("../duplicates");

module.exports = function register() {
  ipcMain.handle("search:global", (_, query) => smartSearch.search(query));
  ipcMain.handle("search:smart", (_, query, options) => smartSearch.search(query, options));
  ipcMain.handle("search:rebuildIndex", () => smartSearch.rebuild());
  ipcMain.handle("system:migrations", () => listMigrations());
  ipcMain.handle("audit:list", (_, limit) => listAudit(limit));
  ipcMain.handle("duplicates:review", () => duplicateService.reviewDuplicates());
};