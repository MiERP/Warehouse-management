// Unit test: Smart Search Ranking
const { rankRows } = require('../../src/main/search/ranking');
const { hasAny } = require('../../src/main/search/query_parser');

const mockParsed = {
  originalQuery: 'kho xang dau',
  normalizedQuery: 'kho xang dau',
  expandedQuery: 'kho xang dau nha kho',
  modules: ['warehouse'],
  terms: ['kho', 'xang', 'dau'],
  yearFilters: [],
  numericFilters: [],
  statusFlags: { broken: false, repair: false, missing: false, unsettled: false, inProgress: false, completed: false }
};

const mockRows = [
  {
    module: 'warehouse', record_id: 1,
    title: 'Kho Xang Dau K01', subtitle: 'Don vi A',
    unit_name: 'Don vi A', address: '', status: 'chien dich', investor: '', notes: '',
    normalized_text: 'kho xang dau k01 don vi a chien dich',
    fts_score: 80
  },
  {
    module: 'camera', record_id: 5,
    title: 'Camera Khu Vuc', subtitle: 'Don vi B',
    unit_name: 'Don vi B', address: '', status: 'hoat dong', investor: '', notes: '',
    normalized_text: 'camera khu vuc don vi b hoat dong',
    fts_score: 50
  },
  {
    module: 'warehouse', record_id: 2,
    title: 'Kho Luong Thuc', subtitle: 'Don vi C',
    unit_name: 'Don vi C', address: '', status: '', investor: '', notes: '',
    normalized_text: 'kho luong thuc don vi c',
    fts_score: 60
  }
];

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  OK: ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL: ${name} - ${e.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log('=== Smart Search Tests ===');

test('ranks warehouse higher than camera for kho query', () => {
  const ranked = rankRows(mockParsed, [...mockRows]);
  assert(ranked.length === 3, 'should return 3 results');
  assert(ranked[0].module === 'warehouse', 'top result should be warehouse');
});

test('adds moduleBoost for matching module', () => {
  const ranked = rankRows(mockParsed, [...mockRows]);
  const warehouse = ranked.find(r => r.module === 'warehouse');
  const camera = ranked.find(r => r.module === 'camera');
  assert(warehouse.score > camera.score, 'warehouse should outrank camera');
});

test('assigns matched_reason array', () => {
  const ranked = rankRows(mockParsed, [...mockRows]);
  ranked.forEach(row => {
    assert(Array.isArray(row.matched_reason), 'matched_reason should be array');
  });
});

test('handles empty rows', () => {
  const ranked = rankRows(mockParsed, []);
  assert(ranked.length === 0, 'empty input -> empty output');
});

console.log('');
console.log('=== Query Parser Tests ===');

test('hasAny detects keywords', () => {
  assert(hasAny('kho xang dau', ['kho', 'nha kho']), 'should detect kho');
  assert(!hasAny('kho xang dau', ['camera', 'cuu hoa']), 'should not detect camera');
});

console.log('');
if (failed === 0) {
  console.log(`All ${passed} tests passed!`);
  process.exit(0);
} else {
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(1);
}
