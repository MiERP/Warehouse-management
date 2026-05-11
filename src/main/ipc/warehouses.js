const { ipcMain } = require("electron");
const queries = require("../database/queries/warehouses");
const { writeAudit } = require("../audit");
const validator = require("../validation").warehouses;
const log = require("../logger");

module.exports = function register() {
  ipcMain.handle("warehouses:getAll", () => queries.getAll());
  ipcMain.handle("warehouses:getById", (_, id) => queries.getById(id));
  ipcMain.handle("warehouses:search", (_, query) => queries.search(query));
  ipcMain.handle("warehouses:create", (_, data) => {
    const payload = validator(data);
    const result = queries.create(payload);
    writeAudit({ module: "warehouses", action: "create", recordId: result.id, after: payload });
    log.info("Warehouse created", { id: result.id });
    return result;
  });
  ipcMain.handle("warehouses:update", (_, id, data) => {
    const before = queries.getById(id);
    const payload = validator(data);
    const result = queries.update(id, payload);
    writeAudit({ module: "warehouses", action: "update", recordId: id, before, after: payload });
    return result;
  });
  ipcMain.handle("warehouses:delete", (_, id) => {
    const before = queries.getById(id);
    queries.delete(id);
    writeAudit({ module: "warehouses", action: "delete", recordId: id, before });
    log.info("Warehouse deleted", { id });
    return { success: true };
  });
};