const Database = require('better-sqlite3');
const fs = require('fs');
const os = require('os');
const path = require('path');

function resolveDbPath() {
  if (process.env.WAREHOUSE_DB_PATH) {
    return path.resolve(process.env.WAREHOUSE_DB_PATH);
  }

  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'warehouse.db');
    }
  } catch (_) {}

  const dataDir = process.env.WAREHOUSE_DATA_DIR || path.join(os.homedir(), '.warehouse-management');
  return path.join(dataDir, 'warehouse.db');
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
