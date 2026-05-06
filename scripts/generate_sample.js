const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'docs');

// We will create simple flat files that match the DB schema expected by create() methods.

// 1. Warehouses Sample
const whData = [
  {
    name: 'Kho VKTB 01',
    address: 'PhÆ°á»ng Báº¡ch Äáº±ng, TP Háº£i PhÃ²ng',
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
    notes: 'Dá»¯ liá»‡u máº«u nháº­p qua chá»©c nÄƒng Import'
  },
  {
    name: 'Kho XÄƒng dáº§u 02',
    address: 'PhÆ°á»ng HÃ  Tu, Tá»‰nh Quáº£ng Ninh',
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
    notes: 'Kho chiáº¿n dá»‹ch quan trá»ng'
  }
];

const whWs = XLSX.utils.json_to_sheet(whData);
const whWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(whWb, whWs, 'Nha_kho');
XLSX.writeFile(whWb, path.join(outDir, 'mau_nhap_nha_kho.xlsx'));

// 2. Cameras Sample
const camData = [
  {
    unit_measure: 'Há»‡ thá»‘ng',
    quantity: 1,
    year_installed: 2024,
    screen_count: 2,
    camera_count: 15,
    investor: 'Cá»¥c HC-KT',
    status: 'Hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Há»‡ thá»‘ng camera an ninh vÃ²ng ngoÃ i'
  }
];

const camWs = XLSX.utils.json_to_sheet(camData);
const camWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(camWb, camWs, 'Camera');
XLSX.writeFile(camWb, path.join(outDir, 'mau_nhap_camera.xlsx'));

console.log('Sample files generated in docs/ directory.');

