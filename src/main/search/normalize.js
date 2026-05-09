function normalizeVietnamese(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactCode(value) {
  return normalizeVietnamese(value).replace(/\s+/g, '');
}

function tokenize(value) {
  const normalized = normalizeVietnamese(value);
  return normalized ? normalized.split(' ') : [];
}

module.exports = { normalizeVietnamese, compactCode, tokenize };
