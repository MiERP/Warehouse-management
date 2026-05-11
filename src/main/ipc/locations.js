const { ipcMain } = require("electron");
const queries = require("../database/queries/locations");

module.exports = function register() {
  ipcMain.handle("locations:getProvinces", () => queries.getProvinces());
  ipcMain.handle("locations:getWardsByProvince", (_, provinceId) => queries.getWardsByProvince(provinceId));
  ipcMain.handle("locations:createProvince", (_, data) => queries.createProvince(data));
  ipcMain.handle("locations:updateProvince", (_, id, data) => queries.updateProvince(id, data));
  ipcMain.handle("locations:deleteProvince", (_, id) => { queries.deleteProvince(id); return { success: true }; });
  ipcMain.handle("locations:createWard", (_, data) => queries.createWard(data));
  ipcMain.handle("locations:updateWard", (_, id, data) => queries.updateWard(id, data));
  ipcMain.handle("locations:deleteWard", (_, id) => { queries.deleteWard(id); return { success: true }; });
};