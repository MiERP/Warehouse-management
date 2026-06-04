const { ipcMain } = require("electron");
const queries = require("../database/queries/constructions");
const { writeAudit } = require("../audit");
const validator = require("../validation").constructions;

module.exports = function register() {
  ipcMain.handle("constructions:getAll", () => queries.getAll());
  ipcMain.handle("constructions:getById", (_, id) => queries.getById(id));
  ipcMain.handle("constructions:create", (_, data) => {
    const payload = validator(data);
    const result = queries.create(payload);
    writeAudit({ module: "constructions", action: "create", recordId: result.id, after: payload });
    return result;
  });
  ipcMain.handle("constructions:update", (_, id, data) => {
    const before = queries.getById(id);
    const payload = validator(data);
    const result = queries.update(id, payload);
    writeAudit({ module: "constructions", action: "update", recordId: id, before, after: payload });
    return result;
  });
  ipcMain.handle("constructions:delete", (_, id) => {
    const before = queries.getById(id);
    queries.remove(id);
    writeAudit({ module: "constructions", action: "delete", recordId: id, before });
    return { success: true };
  });
};