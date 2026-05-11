const { ipcMain } = require("electron");
const backupService = require("../backup");
const { assertAllowedPath } = require("../file_guard");

module.exports = function register() {
  ipcMain.handle("backup:create", () => backupService.createBackup());
  ipcMain.handle("backup:list", (_, limit) => backupService.listBackups(limit));
  ipcMain.handle("backup:restore", (_, filePath) =>
    backupService.restoreBackup(assertAllowedPath(filePath, ["db"])));
};