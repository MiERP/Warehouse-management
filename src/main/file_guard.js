const path = require('path');
const fs = require('fs');

// Dialog approvals are intentionally process-local. A path must be selected
// again after restarting the app so stale file permissions are not reused.
const allowedDialogPaths = new Set();
function rememberDialogResult(result) {
  if (result && Array.isArray(result.filePaths)) result.filePaths.forEach(filePath => allowedDialogPaths.add(path.resolve(filePath)));
  if (result && result.filePath) allowedDialogPaths.add(path.resolve(result.filePath));
  return result;
}
function assertAllowedPath(filePath, extensions) {
  const resolved = path.resolve(filePath || '');
  if (!allowedDialogPaths.has(resolved)) throw new Error('Ðu?ng d?n file chua du?c ch?n qua h?p tho?i c?a ?ng d?ng');
  const ext = path.extname(resolved).toLowerCase().replace('.', '');
  if (extensions && !extensions.includes(ext)) throw new Error(`Ð?nh d?ng file không du?c h? tr?: .${ext}`);
  if (fs.existsSync(resolved)) {
    const sizeMb = fs.statSync(resolved).size / (1024 * 1024);
    if (sizeMb > 25) throw new Error('File vu?t quá gi?i h?n 25MB');
  }
  return resolved;
}
module.exports = { rememberDialogResult, assertAllowedPath };
