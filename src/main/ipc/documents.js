const { ipcMain } = require("electron");
const documentService = require("../documents");
const { assertAllowedPath } = require("../file_guard");

module.exports = function register() {
  ipcMain.handle("documents:list", (_, filters) => documentService.listDocuments(filters || {}));
  ipcMain.handle("documents:getById", (_, id) => documentService.getDocument(id));
  ipcMain.handle("documents:createFromFile", (_, filePath, metadata) =>
    documentService.createDocumentFromFile(assertAllowedPath(filePath, documentService.ALLOWED_EXTENSIONS), metadata || {}));
  ipcMain.handle("documents:update", (_, id, metadata) => documentService.updateDocument(id, metadata || {}));
  ipcMain.handle("documents:delete", (_, id) => documentService.deleteDocument(id));
  ipcMain.handle("documents:listLinks", (_, documentId) => documentService.listLinks(documentId));
  ipcMain.handle("documents:listLinkableRecords", (_, entityType, query) => documentService.listLinkableRecords(entityType, query));
  ipcMain.handle("documents:link", (_, documentId, entityType, entityId, relationType, note) =>
    documentService.linkDocument(documentId, entityType, entityId, relationType, note));
  ipcMain.handle("documents:unlink", (_, linkId) => documentService.unlinkDocument(linkId));
  ipcMain.handle("documents:listForEntity", (_, entityType, entityId) => documentService.listDocumentsForEntity(entityType, entityId));
  ipcMain.handle("documents:open", (_, id) => documentService.openDocument(id));
  ipcMain.handle("documents:reveal", (_, id) => documentService.revealDocument(id));
};