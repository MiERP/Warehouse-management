const { ipcMain } = require("electron");
const reportService = require("../reports");
const { assertAllowedPath } = require("../file_guard");

module.exports = function register() {
  ipcMain.handle("reports:listCategories", () => reportService.listCategories());
  ipcMain.handle("reports:createCategory", (_, data) => reportService.createCategory(data || {}));
  ipcMain.handle("reports:updateCategory", (_, id, data) => reportService.updateCategory(id, data || {}));
  ipcMain.handle("reports:deleteCategory", (_, id) => reportService.deleteCategory(id));
  ipcMain.handle("reports:listTemplates", (_, filters) => reportService.listTemplates(filters || {}));
  ipcMain.handle("reports:getTemplate", (_, id) => reportService.getTemplate(id));
  ipcMain.handle("reports:createTemplate", (_, data) => reportService.createTemplate(data || {}));
  ipcMain.handle("reports:updateTemplate", (_, id, data) => reportService.updateTemplate(id, data || {}));
  ipcMain.handle("reports:deleteTemplate", (_, id) => reportService.deleteTemplate(id));
  ipcMain.handle("reports:getAvailableFields", (_, dataSource) => reportService.getAvailableFields(dataSource));
  ipcMain.handle("reports:renderTemplate", (_, id, params) => reportService.renderTemplate(id, params || {}));
  ipcMain.handle("reports:exportTemplateToExcel", (_, id, params, filePath) =>
    reportService.exportTemplateToExcel(id, params || {}, assertAllowedPath(filePath, ["xlsx"])));
};
