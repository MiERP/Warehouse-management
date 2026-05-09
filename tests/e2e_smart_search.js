const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'recordings');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const app = await electron.launch({ args: [ROOT], cwd: ROOT, recordVideo: { dir: OUT, size: { width: 1365, height: 768 } } });
  const page = await app.firstWindow();
  await page.waitForSelector('#global-search', { timeout: 15000 });
  const bugs = [];
  page.on('pageerror', e => bugs.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') bugs.push(msg.text()); });

  async function check(query, file) {
    await page.fill('#global-search', '');
    await page.fill('#global-search', query);
    await page.waitForSelector('#search-results .search-result-item', { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    const count = await page.locator('#search-results .search-result-item').count();
    const first = await page.locator('#search-results .search-result-item').first().innerText();
    console.log(query, count, first.replace(/\n/g, ' | '));
  }

  await check('camera hong', 'smart_search_camera_hong.png');
  await check('kho xang dau k02', 'smart_search_kho_k02.png');
  await check('cong trinh dang thi cong', 'smart_search_cong_trinh.png');

  const video = await page.video();
  await app.close();
  const videoPath = await video.path();
  const finalVideo = path.join(ROOT, 'docs', 'smart_search_ui_demo.webm');
  fs.copyFileSync(videoPath, finalVideo);
  fs.writeFileSync(path.join(ROOT, 'docs', 'smart_search_ui_report.json'), JSON.stringify({ timestamp: new Date().toISOString(), bugs, video: finalVideo }, null, 2));
  console.log('Video:', finalVideo);
  console.log('Bugs:', bugs.length);
})().catch(e => { console.error(e); process.exit(1); });


