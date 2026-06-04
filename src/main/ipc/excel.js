const { ipcMain } = require("electron");
const XLSX = require("xlsx");
const { assertAllowedPath } = require("../file_guard");

const EXCEL_EXTENSIONS = ["xls", "xlsx"];

function readWorkbookRows(filePath) {
  const safePath = assertAllowedPath(filePath, EXCEL_EXTENSIONS);
  const wb = XLSX.readFile(safePath, { cellDates: true });
  const sheets = {};
  for (const name of wb.SheetNames) {
    sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
  }
  return { sheetNames: wb.SheetNames, sheets };
}

module.exports = function register() {
  ipcMain.handle("excel:read", async (_, filePath) => {
    const workbook = readWorkbookRows(filePath);
    return workbook.sheets[workbook.sheetNames[0]] || [];
  });
  ipcMain.handle("excel:write", async (_, filePath, data, sheetName) => {
    const safePath = assertAllowedPath(filePath, EXCEL_EXTENSIONS);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data || []);
    XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
    XLSX.writeFile(wb, safePath);
    return { success: true };
  });
  ipcMain.handle("excel:readWorkbook", async (_, filePath) => readWorkbookRows(filePath));
};