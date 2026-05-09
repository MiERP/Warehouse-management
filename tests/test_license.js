// === TEST LICENSE LOGIC ===
// Test parseLicenseKey and checkLicense functions

function parseLicenseKey(key) {
  if (!key || key.length !== 8 || !/^\d{8}$/.test(key)) return null;
  const year = parseInt(key.slice(0, 4), 10);
  const month = parseInt(key.slice(4, 6), 10) - 1;
  const day = parseInt(key.slice(6, 8), 10);
  const expiry = new Date(year, month, day);
  if (expiry.getFullYear() !== year || expiry.getMonth() !== month || expiry.getDate() !== day) return null;
  return expiry;
}

function checkLicense(key) {
  const expiry = parseLicenseKey(key);
  if (!expiry) return { valid: false, daysLeft: 0, reason: 'License key khong hop le' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry - today) / 86400000);
  if (daysLeft <= 0) return { valid: false, daysLeft, reason: 'License da het han ngay ' + expiry.toLocaleDateString('vi-VN') };
  return { valid: true, daysLeft };
}

// Test cases
const tests = [
  { key: '20260731', expectValid: true, desc: 'Valid future date' },
  { key: '20250508', expectValid: false, desc: 'Expired date (past)' },
  { key: '20260509', expectValid: false, desc: 'Today date (expired, daysLeft=0)' },
  { key: '20260510', expectValid: true, desc: 'Tomorrow' },
  { key: '20260231', expectValid: false, desc: 'Invalid date (Feb 31)' },
  { key: 'abcdefgh', expectValid: false, desc: 'Non-numeric' },
  { key: '2026073', expectValid: false, desc: 'Too short' },
  { key: '202607311', expectValid: false, desc: 'Too long' },
  { key: '', expectValid: false, desc: 'Empty string' },
  { key: null, expectValid: false, desc: 'Null' },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const result = checkLicense(t.key);
  const ok = result.valid === t.expectValid;
  if (ok) {
    passed++;
    console.log('PASS:', t.desc, '- key:', t.key, '- valid:', result.valid, '- daysLeft:', result.daysLeft);
  } else {
    failed++;
    console.log('FAIL:', t.desc, '- key:', t.key, '- expected valid:', t.expectValid, '- got:', result.valid, '- reason:', result.reason);
  }
}

console.log('');
console.log('Results:', passed, 'passed,', failed, 'failed');
if (failed === 0) console.log('All tests passed!');
else process.exit(1);