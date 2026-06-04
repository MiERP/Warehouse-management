const { ipcMain } = require("electron");
const queries = require("../database/queries/catalogs");
const { writeAudit } = require("../audit");

module.exports = function register() {
  ipcMain.handle("catalogs:getAll", (_, tableName) => queries.getAll(tableName));
  ipcMain.handle("catalogs:create", (_, tableName, data) => {
    const result = queries.create(tableName, data);
    writeAudit({ module: "catalogs", action: "create", recordId: result.id, after: data });
    return result;
  });
  ipcMain.handle("catalogs:update", (_, tableName, id, data) => {
    const result = queries.update(tableName, id, data);
    writeAudit({ module: "catalogs", action: "update", recordId: id, after: data });
    return result;
  });
  ipcMain.handle("catalogs:delete", (_, tableName, id) => {
    queries.remove(tableName, id);
    writeAudit({ module: "catalogs", action: "delete", recordId: id });
    return { success: true };
  });
};