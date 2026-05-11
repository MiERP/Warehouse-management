const { ipcMain, dialog } = require("electron");
const { rememberDialogResult } = require("../file_guard");

module.exports = function register(mainWindow) {
  ipcMain.handle("dialog:openFile", async (_, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: filters || [{ name: "All Files", extensions: ["*"] }]
    });
    return rememberDialogResult(result);
  });
  ipcMain.handle("dialog:saveFile", async (_, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName || "export.xlsx",
      filters: [{ name: "Excel", extensions: ["xlsx"] }]
    });
    return rememberDialogResult(result);
  });
};