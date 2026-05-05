const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Khởi chạy Electron qua Playwright...');
  
  const app = await electron.launch({
    args: ['.'],
    recordVideo: {
      dir: path.join(__dirname, 'docs'),
      size: { width: 1280, height: 720 }
    }
  });

  const page = await app.firstWindow();
  console.log('Đã mở cửa sổ chính.');
  await page.waitForTimeout(2000);

  // MOCK NATIVE DIALOGS IN MAIN PROCESS
  await app.evaluate(({ dialog }) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: ['D:\\PROJECT\\Agentic-AI\\Warehouse-management\\docs\\mau_nhap_nha_kho.xlsx']
    });
    dialog.showSaveDialog = async (win, opts) => ({
      canceled: false,
      filePath: 'D:\\PROJECT\\Agentic-AI\\Warehouse-management\\docs\\export_kho_demo.xlsx'
    });
  });

  console.log('Chuyển sang tab Nhà Kho...');
  await page.click('#nav-warehouses');
  await page.waitForTimeout(1000);

  console.log('Thực hiện Import dữ liệu...');
  await page.click('button:has-text("Import Excel")');
  await page.waitForTimeout(1000);
  
  await page.click('button.btn-primary:has-text("Import")');
  await page.waitForTimeout(2000);
  
  console.log('Thêm mới dữ liệu bằng tay...');
  await page.click('button:has-text("Thêm nhà kho")');
  await page.waitForTimeout(1000);
  
  await page.fill('input[name="name"]', 'Kho Tự Động Test (Remote Debug)');
  await page.fill('input[name="warehouse_area"]', '1000');
  await page.fill('input[name="storage_capacity"]', '500');
  await page.fill('input[name="current_stock"]', '20');
  await page.selectOption('select[name="warehouse_category"]', 'chien_luoc');
  
  await page.click('button[type="submit"]:has-text("Lưu")');
  await page.waitForTimeout(2000);
  
  console.log('Thực hiện Export dữ liệu...');
  await page.click('button:has-text("Export Excel")');
  await page.waitForTimeout(2000);
  
  console.log('Hoàn thành các bước, đóng ứng dụng...');
  
  const video = await page.video();
  const videoPath = await video.path();
  
  await app.close();
  
  const finalPath = path.join(__dirname, 'docs', 'demo_import_export.webm');
  if (fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, finalPath);
    fs.unlinkSync(videoPath);
    console.log(`Video đã được lưu tại: ${finalPath}`);
  }
})().catch(err => {
  console.error('Lỗi trong quá trình chạy script:', err);
  process.exit(1);
});
