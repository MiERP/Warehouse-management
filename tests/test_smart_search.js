const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const queries = [
  'kho xang dau',
  'kho k02',
  'camera hong',
  'cam can sua chua',
  'cuu hoa pccc',
  'cong trinh chua quyet toan',
  'cong trinh dang thi cong',
  'kho xay truoc 2010',
  'camera lap truoc 2020',
  'kho suc chua tren 100'
];

(async () => {
  const app = await electron.launch({ args: [ROOT], cwd: ROOT });
  const page = await app.firstWindow();
  await page.waitForSelector('#global-search', { timeout: 15000 });
  const results = [];
  for (const query of queries) {
    const rows = await page.evaluate(q => window.api.search.smart(q, { limit: 5 }), query);
    results.push({ query, count: rows.length, top: rows.slice(0, 3) });
    console.log('\nQUERY:', query);
    rows.slice(0, 3).forEach((row, index) => console.log(index + 1, row.module, row.title, row.score, (row.matched_reason || []).join(', ')));
  }
  const reportPath = path.join(DOCS, 'smart_search_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2), 'utf8');
  await app.close();
  console.log('\nReport:', reportPath);
})().catch(err => { console.error(err); process.exit(1); });


