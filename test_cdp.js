const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Đang kết nối tới Electron qua cổng 9222...');
  
  // Connect to the running Electron instance
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  // Find the active page
  const contexts = browser.contexts();
  let page = null;
  for (const ctx of contexts) {
    const pages = ctx.pages();
    for (const p of pages) {
      if (p.url().includes('index.html')) {
        page = p;
        break;
      }
    }
    if (page) break;
  }
  
  if (!page) {
    console.error('Không tìm thấy trang index.html');
    process.exit(1);
  }

  console.log('Đã tìm thấy trang chính:', page.url());

  // To record video, we need to create a new page in a context that supports recording.
  // BUT connectOverCDP doesn't allow recording the existing context!
  // Workaround: We can't record an existing CDP session using Playwright's built-in recordVideo!
  // The user prompt specifically says: "All browser interactions are automatically recorded and saved as WebP videos to the artifacts directory. This is the ONLY way you can record a browser session video/animation."
  console.log('Done CDP connection check.');
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
