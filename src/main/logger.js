const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let logPath = null;
let currentLevel = LOG_LEVELS.INFO;

function ensureLogDir() {
  if (logPath) return logPath;
  const dir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  logPath = path.join(dir, `app-${date}.log`);
  return logPath;
}

function writeLog(level, message, data) {
  try {
    const fp = ensureLogDir();
    const ts = new Date().toISOString();
    const extra = data ? ' ' + JSON.stringify(data) : '';
    const line = `[${ts}] [${level}] ${message}${extra}\n`;
    fs.appendFileSync(fp, line, 'utf-8');
  } catch (_) { /* fail silently */ }
}

module.exports = {
  debug(msg, data) { if (currentLevel <= LOG_LEVELS.DEBUG) { console.debug(msg, data || ''); writeLog('DEBUG', msg, data); } },
  info(msg, data)  { if (currentLevel <= LOG_LEVELS.INFO)  { console.log(msg, data || '');   writeLog('INFO', msg, data); } },
  warn(msg, data)  { if (currentLevel <= LOG_LEVELS.WARN)  { console.warn(msg, data || '');  writeLog('WARN', msg, data); } },
  error(msg, data) { console.error(msg, data || ''); writeLog('ERROR', msg, data); }
};
