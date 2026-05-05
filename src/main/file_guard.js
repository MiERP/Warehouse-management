const path = require('path');
const fs = require('fs');
const allowedDialogPaths = new Set();
function rememberDialogResult(result) {
  if (result && Array.isArray(result.filePaths)) result.filePaths.forEach(filePath => allowedDialogPaths.add(path.resolve(filePath)));
  if (result && result.filePath) allowedDialogPaths.add(path.resolve(result.filePath));
  return result;
}
function assertAllowedPath(filePath, extensions) {
  const resolved = path.resolve(filePath || '');
  if (!allowedDialogPaths.has(resolved)) throw new Error('Đường dẫn file chưa được chọn qua hộp thoại của ứng dụng');
  const ext = path.extname(resolved).toLowerCase().replace('.', '');
  if (extensions && !extensions.includes(ext)) throw new Error(`Định dạng file không được hỗ trợ: .${ext}`);
  if (fs.existsSync(resolved)) {
    const sizeMb = fs.statSync(resolved).size / (1024 * 1024);
    if (sizeMb > 25) throw new Error('File vượt quá giới hạn 25MB');
  }
  return resolved;
}
module.exports = { rememberDialogResult, assertAllowedPath };
