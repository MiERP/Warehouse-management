function toNullableInt(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
function toNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function cleanString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}
function currentMaxYear() { return new Date().getFullYear() + 1; }
function validateYear(value, field, errors) {
  const year = toNullableInt(value);
  if (year !== null && (year < 1900 || year > currentMaxYear())) errors.push(`${field} phải nằm trong khoảng 1900-${currentMaxYear()}`);
  return year;
}
function nonNegative(value, field, errors) {
  const number = toNumber(value, 0);
  if (number < 0) errors.push(`${field} không được âm`);
  return number;
}
function required(value, field, errors) {
  const text = cleanString(value);
  if (!text) errors.push(`${field} là bắt buộc`);
  return text;
}
function nullableId(value) { return toNullableInt(value); }
function assertValid(errors) {
  if (errors.length) {
    const error = new Error(errors.join('; '));
    error.validationErrors = errors;
    throw error;
  }
}
module.exports = { toNullableInt, toNumber, cleanString, validateYear, nonNegative, required, nullableId, assertValid };
