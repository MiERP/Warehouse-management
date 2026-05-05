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
function createBackup(targetPath) {
  const outputPath = targetPath || path.join(defaultBackupDir(), `warehouse-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  fs.copyFileSync(dbPath(), outputPath);
  try { db.prepare('INSERT INTO backup_history (file_path, action) VALUES (?, ?)').run(outputPath, 'backup'); } catch (_) {}
  writeAudit({ module: 'system', action: 'backup', metadata: { outputPath } });
  return { success: true, filePath: outputPath };
}
function restoreBackup(sourcePath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('File backup không tồn tại');
  const beforeRestore = createBackup();
  db.close();
  fs.copyFileSync(sourcePath, dbPath());
  return { success: true, restoredFrom: sourcePath, safetyBackup: beforeRestore.filePath };
}
module.exports = { createBackup, restoreBackup };
