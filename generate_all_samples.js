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
// 1. Warehouses Sample (Nhà kho)
// ============================================================
const warehouseData = [
  {
    name: 'Kho VKTB Tổng hợp 01',
    address: 'Phường Bạch Đằng, TP Hải Phòng',
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
    fire_need: 'Cần thiết',
    fire_existing: 'Có',
    notes: 'Dữ liệu mẫu — kho chiến thuật vùng 1'
  },
  {
    name: 'Kho Xăng dầu K02',
    address: 'Phường Hà Tu, TP Hạ Long, Quảng Ninh',
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
    fire_need: 'Cần thiết',
    fire_existing: 'Có',
    notes: 'Kho chiến dịch — xăng dầu'
  },
  {
    name: 'Kho Lương thực K03',
    address: 'Xã Hải An, Huyện Thủy Nguyên, Hải Phòng',
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
    fire_need: 'Cần thiết',
    fire_existing: 'Có',
    notes: 'Kho lương thực dự trữ'
  }
];

const whWs = XLSX.utils.json_to_sheet(warehouseData);
const whWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(whWb, whWs, 'Nha_kho');
XLSX.writeFile(whWb, path.join(outDir, 'mau_nhap_nha_kho.xlsx'));
console.log('✓ docs/mau_nhap_nha_kho.xlsx — 3 dòng');

// ============================================================
// 2. Cameras Sample (Camera an ninh)
// ============================================================
const cameraData = [
  {
    unit_measure: 'Hệ thống',
    quantity: 1,
    year_installed: 2022,
    year_repaired: null,
    screen_count: 4,
    camera_count: 24,
    investor: 'Cục HC-KT',
    status: 'Hoạt động bình thường',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Camera an ninh vòng ngoài kho K01'
  },
  {
    unit_measure: 'Bộ',
    quantity: 2,
    year_installed: 2020,
    year_repaired: 2024,
    screen_count: 2,
    camera_count: 12,
    investor: 'Phòng HC-KT Vùng',
    status: 'Đã sửa chữa',
    repair_need: 0,
    new_install_need: 1,
    notes: 'Camera khu vực kho K02'
  },
  {
    unit_measure: 'Hệ thống',
    quantity: 1,
    year_installed: 2024,
    year_repaired: null,
    screen_count: 6,
    camera_count: 32,
    investor: 'Ban QLDA',
    status: 'Mới lắp đặt',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Hệ thống camera AI mới'
  }
];

const camWs = XLSX.utils.json_to_sheet(cameraData);
const camWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(camWb, camWs, 'Camera');
XLSX.writeFile(camWb, path.join(outDir, 'mau_nhap_camera.xlsx'));
console.log('✓ docs/mau_nhap_camera.xlsx — 3 dòng');

// ============================================================
// 3. Fire Systems Sample (Hệ thống cứu hỏa)
// ============================================================
const fireData = [
  {
    unit_measure: 'Hệ thống',
    quantity: 1,
    year_installed: 2019,
    year_repaired: 2023,
    pump_house_count: 2,
    hydrant_count: 8,
    investor: 'Cục HC-KT',
    status: 'Hoạt động bình thường',
    repair_need: 0,
    new_install_need: 0,
    notes: 'Hệ thống cứu hỏa tập trung kho K01'
  },
  {
    unit_measure: 'Hệ thống',
    quantity: 1,
    year_installed: 2021,
    year_repaired: null,
    pump_house_count: 1,
    hydrant_count: 6,
    investor: 'Phòng HC-KT Vùng',
    status: 'Hoạt động bình thường',
    repair_need: 1,
    new_install_need: 0,
    notes: 'Cần bảo trì định kỳ'
  }
];

const fireWs = XLSX.utils.json_to_sheet(fireData);
const fireWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(fireWb, fireWs, 'Cuu_hoa');
XLSX.writeFile(fireWb, path.join(outDir, 'mau_nhap_cuuhoa.xlsx'));
console.log('✓ docs/mau_nhap_cuuhoa.xlsx — 2 dòng');

// ============================================================
// 4. Constructions Sample (Công trình)
// ============================================================
const constructionData = [
  {
    name: 'Sửa chữa, nâng cấp Kho VKTB K01',
    construction_type: 'SỬA CHỮA, NÂNG CẤP',
    year_completed: 2025,
    approval_decision_no: 'QĐ 123/QP-2024',
    contract_number: 'HĐ-01/2024',
    contractor_name: 'Công ty CP Xây dựng Quân đội',
    contractor_address: 'Hà Nội',
    contractor_tax_code: '0123456789',
    review_authority: 'Ban Kiểm toán QP',
    work_volume: '350m² nhà kho',
    start_date: '01/03/2024',
    end_date: '30/11/2024',
    status: 'Đang thi công',
    approved_investment: 5500000000,
    estimated_cost: 4800000000,
    contract_value: 4500000000,
    settlement_approved: 0,
    total_estimated: 5000000000,
    settlement_decision_no: '',
    settlement_value: 0,
    total_investment: 5500000000,
    investor: 'Cục HC-KT',
    description: 'Sửa chữa mái, gia cố tường, nâng nền kho K01',
    notes: 'Tiến độ đúng kế hoạch'
  },
  {
    name: 'Xây mới nhà kho lương thực K03',
    construction_type: 'Xây mới',
    year_completed: null,
    approval_decision_no: 'QĐ 456/QP-2025',
    contract_number: 'HĐ-02/2025',
    contractor_name: 'Công ty TNHH Hải Dương',
    contractor_address: 'Hải Dương',
    contractor_tax_code: '9876543210',
    review_authority: 'Viện Thiết kế QP',
    work_volume: '600m² nhà kho mới',
    start_date: '15/01/2025',
    end_date: '31/12/2025',
    status: 'Đang thi công',
    approved_investment: 12000000000,
    estimated_cost: 10500000000,
    contract_value: 9800000000,
    settlement_approved: 0,
    total_estimated: 11000000000,
    settlement_decision_no: '',
    settlement_value: 0,
    total_investment: 12000000000,
    investor: 'Ban QLDA',
    description: 'Xây mới kho lương thực 600m² tại Thủy Nguyên',
    notes: 'Dự án năm 2025'
  }
];

const conWs = XLSX.utils.json_to_sheet(constructionData);
const conWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(conWb, conWs, 'Cong_trinh');
XLSX.writeFile(conWb, path.join(outDir, 'mau_nhap_congtrinh.xlsx'));
console.log('✓ docs/mau_nhap_congtrinh.xlsx — 2 dòng');

console.log('\n✅ All sample Excel files generated successfully!');
