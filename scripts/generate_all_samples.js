/**
 * Generate sample Excel data files for all 4 modules
 * Output: docs/mau_nhap_*.xlsx
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ============================================================
// 1. Warehouses Sample (NhÃ  kho)
// ============================================================
const warehouseData = [
  {
    name: 'Kho VKTB Tá»•ng há»£p 01',
    address: 'PhÆ°á»ng Báº¡ch Äáº±ng, TP Háº£i PhÃ²ng',
    warehouse_category: 'chien_thuat',
    quantity: 1,
    land_area: 500,
    warehouse_area: 350,
    warehouse_land_area: 450,
    year_built: 2015,
    year_renovated: 2023,
    storage_capacity: 80,
    current_stock: 55,
    quality_grade_23_area: 200,
    quality_grade_4_area: 100,
    temp_house_area: 50,
    lightning_grade_area: 350,
    lightning_existing_count: 2,
    fire_need: 'Cáº§n thiáº¿t',
    fire_existing: 'CÃ³',
    notes: 'Dá»¯ liá»‡u máº«u â€” kho chiáº¿n thuáº­t vÃ¹ng 1'
  },
  {
    name: 'Kho XÄƒng dáº§u K02',
    address: 'PhÆ°á»ng HÃ  Tu, TP Háº¡ Long, Quáº£ng Ninh',
    warehouse_category: 'chien_dich',
    quantity: 1,
    land_area: 1200,
    warehouse_area: 900,
    warehouse_land_area: 1100,
    year_built: 2010,
    year_renovated: 2024,
    storage_capacity: 250,
    current_stock: 180,
    quality_grade_23_area: 500,
    quality_grade_4_area: 300,
    temp_house_area: 100,
    lightning_grade_area: 900,
    lightning_existing_count: 4,
    fire_need: 'Cáº§n thiáº¿t',
    fire_existing: 'CÃ³',
    notes: 'Kho chiáº¿n dá»‹ch â€” xÄƒng dáº§u'
  },
  {
    name: 'Kho LÆ°Æ¡ng thá»±c K03',
    address: 'XÃ£ Háº£i An, Huyá»‡n Thá»§y NguyÃªn, Háº£i PhÃ²ng',
    warehouse_category: 'chien_thuat',
    quantity: 2,
    land_area: 800,
    warehouse_area: 600,
    warehouse_land_area: 750,
    year_built: 2018,
    year_renovated: null,
    storage_capacity: 120,
    current_stock: 90,
    quality_grade_23_area: 400,
    quality_grade_4_area: 150,
    temp_house_area: 50,
    lightning_grade_area: 600,
    lightning_existing_count: 3,
    fire_need: 'Cáº§n thiáº¿t',
    fire_existing: 'CÃ³',
    notes: 'Kho lÆ°Æ¡ng thá»±c dá»± trá»¯'
  }
];

const whWs = XLSX.utils.json_to_sheet(warehouseData);
const whWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(whWb, whWs, 'Nha_kho');
XLSX.writeFile(whWb, path.join(outDir, 'mau_nhap_nha_kho.xlsx'));
console.log('âœ“ docs/mau_nhap_nha_kho.xlsx â€” 3 dÃ²ng');

// ============================================================
// 2. Cameras Sample (Camera an ninh)
// ============================================================
const cameraData = [
  {
    unit_measure: 'Há»‡ thá»‘ng',
    quantity: 1,
    year_installed: 2022,
    year_repaired: null,
    screen_count: 4,
    camera_count: 24,
    investor: 'Cá»¥c HC-KT',
    status: 'Hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Camera an ninh vÃ²ng ngoÃ i kho K01'
  },
  {
    unit_measure: 'Bá»™',
    quantity: 2,
    year_installed: 2020,
    year_repaired: 2024,
    screen_count: 2,
    camera_count: 12,
    investor: 'PhÃ²ng HC-KT VÃ¹ng',
    status: 'ÄÃ£ sá»­a chá»¯a',
    repair_need: 0,
    new_install_need: 1,
    notes: 'Camera khu vá»±c kho K02'
  },
  {
    unit_measure: 'Há»‡ thá»‘ng',
    quantity: 1,
    year_installed: 2024,
    year_repaired: null,
    screen_count: 6,
    camera_count: 32,
    investor: 'Ban QLDA',
    status: 'Má»›i láº¯p Ä‘áº·t',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Há»‡ thá»‘ng camera AI má»›i'
  }
];

const camWs = XLSX.utils.json_to_sheet(cameraData);
const camWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(camWb, camWs, 'Camera');
XLSX.writeFile(camWb, path.join(outDir, 'mau_nhap_camera.xlsx'));
console.log('âœ“ docs/mau_nhap_camera.xlsx â€” 3 dÃ²ng');

// ============================================================
// 3. Fire Systems Sample (Há»‡ thá»‘ng cá»©u há»a)
// ============================================================
const fireData = [
  {
    unit_measure: 'Há»‡ thá»‘ng',
    quantity: 1,
    year_installed: 2019,
    year_repaired: 2023,
    pump_house_count: 2,
    hydrant_count: 8,
    investor: 'Cá»¥c HC-KT',
    status: 'Hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Há»‡ thá»‘ng cá»©u há»a táº­p trung kho K01'
  },
  {
    unit_measure: 'Há»‡ thá»‘ng',
    quantity: 1,
    year_installed: 2021,
    year_repaired: null,
    pump_house_count: 1,
    hydrant_count: 6,
    investor: 'PhÃ²ng HC-KT VÃ¹ng',
    status: 'Hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng',
    repair_need: 1,
    new_install_need: 0,
    notes: 'Cáº§n báº£o trÃ¬ Ä‘á»‹nh ká»³'
  }
];

const fireWs = XLSX.utils.json_to_sheet(fireData);
const fireWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(fireWb, fireWs, 'Cuu_hoa');
XLSX.writeFile(fireWb, path.join(outDir, 'mau_nhap_cuuhoa.xlsx'));
console.log('âœ“ docs/mau_nhap_cuuhoa.xlsx â€” 2 dÃ²ng');

// ============================================================
// 4. Constructions Sample (CÃ´ng trÃ¬nh)
// ============================================================
const constructionData = [
  {
    name: 'Sá»­a chá»¯a, nÃ¢ng cáº¥p Kho VKTB K01',
    construction_type: 'Sá»¬A CHá»®A, NÃ‚NG Cáº¤P',
    year_completed: 2025,
    approval_decision_no: 'QÄ 123/QP-2024',
    contract_number: 'HÄ-01/2024',
    contractor_name: 'CÃ´ng ty CP XÃ¢y dá»±ng QuÃ¢n Ä‘á»™i',
    contractor_address: 'HÃ  Ná»™i',
    contractor_tax_code: '0123456789',
    review_authority: 'Ban Kiá»ƒm toÃ¡n QP',
    work_volume: '350mÂ² nhÃ  kho',
    start_date: '01/03/2024',
    end_date: '30/11/2024',
    status: 'Äang thi cÃ´ng',
    approved_investment: 5500000000,
    estimated_cost: 4800000000,
    contract_value: 4500000000,
    settlement_approved: 0,
    total_estimated: 5000000000,
    settlement_decision_no: '',
    settlement_value: 0,
    total_investment: 5500000000,
    investor: 'Cá»¥c HC-KT',
    description: 'Sá»­a chá»¯a mÃ¡i, gia cá»‘ tÆ°á»ng, nÃ¢ng ná»n kho K01',
    notes: 'Tiáº¿n Ä‘á»™ Ä‘Ãºng káº¿ hoáº¡ch'
  },
  {
    name: 'XÃ¢y má»›i nhÃ  kho lÆ°Æ¡ng thá»±c K03',
    construction_type: 'XÃ¢y má»›i',
    year_completed: null,
    approval_decision_no: 'QÄ 456/QP-2025',
    contract_number: 'HÄ-02/2025',
    contractor_name: 'CÃ´ng ty TNHH Háº£i DÆ°Æ¡ng',
    contractor_address: 'Háº£i DÆ°Æ¡ng',
    contractor_tax_code: '9876543210',
    review_authority: 'Viá»‡n Thiáº¿t káº¿ QP',
    work_volume: '600mÂ² nhÃ  kho má»›i',
    start_date: '15/01/2025',
    end_date: '31/12/2025',
    status: 'Äang thi cÃ´ng',
    approved_investment: 12000000000,
    estimated_cost: 10500000000,
    contract_value: 9800000000,
    settlement_approved: 0,
    total_estimated: 11000000000,
    settlement_decision_no: '',
    settlement_value: 0,
    total_investment: 12000000000,
    investor: 'Ban QLDA',
    description: 'XÃ¢y má»›i kho lÆ°Æ¡ng thá»±c 600mÂ² táº¡i Thá»§y NguyÃªn',
    notes: 'Dá»± Ã¡n nÄƒm 2025'
  }
];

const conWs = XLSX.utils.json_to_sheet(constructionData);
const conWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(conWb, conWs, 'Cong_trinh');
XLSX.writeFile(conWb, path.join(outDir, 'mau_nhap_congtrinh.xlsx'));
console.log('âœ“ docs/mau_nhap_congtrinh.xlsx â€” 2 dÃ²ng');

console.log('\nâœ… All sample Excel files generated successfully!');

