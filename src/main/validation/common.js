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
function parseDateString(value) {
  const text = cleanString(value);
  if (!text) return null;
  let day, month, year;
  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) [, day, month, year] = match;
  else {
    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return { invalid: true, value: text };
    [, year, month, day] = match;
  }
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    return { invalid: true, value: text };
  }
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}
function validateDate(value, field, errors) {
  const parsed = parseDateString(value);
  if (parsed && parsed.invalid) errors.push(`${field} phải đúng định dạng DD/MM/YYYY và là ngày hợp lệ`);
  return parsed && !parsed.invalid ? parsed : null;
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
module.exports = { toNullableInt, toNumber, cleanString, validateYear, validateDate, nonNegative, required, nullableId, assertValid };
