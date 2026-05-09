const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const db = require('./database/db');
const { writeAudit } = require('./audit');
function dbPath() { return path.join(app.getPath('userData'), 'warehouse.db'); }
function defaultBackupDir() {
  const dir = path.join(app.getPath('userData'), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
async function createBackup(targetPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = targetPath || path.join(defaultBackupDir(), `warehouse-${timestamp}.db`);
  await db.backup(outputPath);
  try { db.prepare('INSERT INTO backup_history (file_path, action) VALUES (?, ?)').run(outputPath, 'backup'); } catch (_) {}
  writeAudit({ module: 'system', action: 'backup', metadata: { outputPath } });
  return { success: true, filePath: outputPath };
}
async function restoreBackup(sourcePath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('File backup không tồn tại');
  const beforeRestore = await createBackup();
  db.close();
  fs.copyFileSync(sourcePath, dbPath());
  return {
    success: true,
    restoredFrom: sourcePath,
    safetyBackup: beforeRestore.filePath,
    restartRequired: true,
    message: 'Restore đã thay thế file database. Vui lòng khởi động lại ứng dụng trước khi tiếp tục thao tác dữ liệu.'
  };
}
function listBackups(limit = 50) {
  return db.prepare(`SELECT id, file_path, action, created_at FROM backup_history ORDER BY id DESC LIMIT ?`).all(Number(limit) || 50);
}
module.exports = { createBackup, restoreBackup, listBackups };
