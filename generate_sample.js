const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'docs');

// We will create simple flat files that match the DB schema expected by create() methods.

// 1. Warehouses Sample
const whData = [
  {
    name: 'Kho VKTB 01',
    address: 'Phường Bạch Đằng, TP Hải Phòng',
    warehouse_category: 'chien_thuat',
    quantity: 1,
    land_area: 500,
    warehouse_area: 300,
    year_built: 2015,
    year_renovated: 2023,
    storage_capacity: 50,
    current_stock: 35,
    quality_grade_4_area: 0,
    lightning_existing_count: 1,
    notes: 'Dữ liệu mẫu nhập qua chức năng Import'
  },
  {
    name: 'Kho Xăng dầu 02',
    address: 'Phường Hà Tu, Tỉnh Quảng Ninh',
    warehouse_category: 'chien_dich',
    quantity: 1,
    land_area: 1200,
    warehouse_area: 800,
    year_built: 2010,
    year_renovated: 2024,
    storage_capacity: 200,
    current_stock: 150,
    quality_grade_4_area: 200,
    lightning_existing_count: 2,
    notes: 'Kho chiến dịch quan trọng'
  }
];

const whWs = XLSX.utils.json_to_sheet(whData);
const whWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(whWb, whWs, 'Nha_kho');
XLSX.writeFile(whWb, path.join(outDir, 'mau_nhap_nha_kho.xlsx'));

// 2. Cameras Sample
const camData = [
  {
    unit_measure: 'Hệ thống',
    quantity: 1,
    year_installed: 2024,
    screen_count: 2,
    camera_count: 15,
    investor: 'Cục HC-KT',
    status: 'Hoạt động bình thường',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Hệ thống camera an ninh vòng ngoài'
  }
];

const camWs = XLSX.utils.json_to_sheet(camData);
const camWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(camWb, camWs, 'Camera');
XLSX.writeFile(camWb, path.join(outDir, 'mau_nhap_camera.xlsx'));

console.log('Sample files generated in docs/ directory.');
