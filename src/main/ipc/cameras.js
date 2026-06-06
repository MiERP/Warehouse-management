const { ipcMain } = require("electron");
const queries = require("../database/queries/cameras");
const { writeAudit } = require("../audit");
const validator = require("../validation").cameras;

module.exports = function register() {
  ipcMain.handle("cameras:getAll", () => queries.getAll());
  ipcMain.handle("cameras:getById", (_, id) => queries.getById(id));
  ipcMain.handle("cameras:create", (_, data) => {
    const payload = validator(data);
    const result = queries.create(payload);
    writeAudit({ module: "cameras", action: "create", recordId: result.id, after: payload });
    return result;
  });
  ipcMain.handle("cameras:update", (_, id, data) => {
    const before = queries.getById(id);
    const payload = validator(data);
    const result = queries.update(id, payload);
    writeAudit({ module: "cameras", action: "update", recordId: id, before, after: payload });
    return result;
  });
  ipcMain.handle("cameras:delete", (_, id) => {
    const before = queries.getById(id);
    queries.remove(id);
    writeAudit({ module: "cameras", action: "delete", recordId: id, before });
    return { success: true };
  });
};