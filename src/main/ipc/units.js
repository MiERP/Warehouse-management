const { ipcMain } = require("electron");
const queries = require("../database/queries/units");
const { writeAudit } = require("../audit");
const log = require("../logger");

module.exports = function register() {
  ipcMain.handle("units:getAll", () => queries.getAll());
  ipcMain.handle("units:getTree", () => queries.getTree());
  ipcMain.handle("units:create", (_, data) => {
    const result = queries.create(data);
    writeAudit({ module: "units", action: "create", recordId: result.id, after: data });
    log.info("Unit created", { id: result.id });
    return result;
  });
  ipcMain.handle("units:update", (_, id, data) => {
    const before = queries.getById(id);
    const result = queries.update(id, data);
    writeAudit({ module: "units", action: "update", recordId: id, before, after: data });
    return result;
  });
  ipcMain.handle("units:delete", (_, id) => {
    const before = queries.getById(id);
    queries.delete(id);
    writeAudit({ module: "units", action: "delete", recordId: id, before });
    log.info("Unit deleted", { id });
    return { success: true };
  });
};