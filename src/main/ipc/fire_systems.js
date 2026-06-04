const { ipcMain } = require("electron");
const queries = require("../database/queries/fire_systems");
const { writeAudit } = require("../audit");
const validator = require("../validation").fireSystems;

module.exports = function register() {
  ipcMain.handle("fireSystems:getAll", () => queries.getAll());
  ipcMain.handle("fireSystems:getById", (_, id) => queries.getById(id));
  ipcMain.handle("fireSystems:create", (_, data) => {
    const payload = validator(data);
    const result = queries.create(payload);
    writeAudit({ module: "fireSystems", action: "create", recordId: result.id, after: payload });
    return result;
  });
  ipcMain.handle("fireSystems:update", (_, id, data) => {
    const before = queries.getById(id);
    const payload = validator(data);
    const result = queries.update(id, payload);
    writeAudit({ module: "fireSystems", action: "update", recordId: id, before, after: payload });
    return result;
  });
  ipcMain.handle("fireSystems:delete", (_, id) => {
    const before = queries.getById(id);
    queries.remove(id);
    writeAudit({ module: "fireSystems", action: "delete", recordId: id, before });
    return { success: true };
  });
};