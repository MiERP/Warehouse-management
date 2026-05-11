const { ipcMain, dialog } = require("electron");
const XLSX = require("xlsx");
const { rememberDialogResult } = require("../file_guard");

module.exports = function register() {
  ipcMain.handle("excel:read", async (_, filePath) => {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  });
  ipcMain.handle("excel:write", async (_, filePath, data, sheetName) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data || []);
    XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
    XLSX.writeFile(wb, filePath);
    return { success: true };
  });
  ipcMain.handle("excel:readWorkbook", async (_, filePath) => {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const sheets = {};
    for (const name of wb.SheetNames) {
      sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
    }
    return sheets;
  });
};