const moduleRegistry = {
  warehouses: {
    key: 'warehouses',
    label: 'Nhà kho',
    page: 'warehouses',
    table: 'warehouses',
    api: 'warehouses',
    templateNames: ['KHO.xls', 'mau_nhap_nha_kho.xlsx'],
    primaryText: 'name',
    listColumns: [
      { field: 'name', label: 'Tên kho' },
      { field: 'parent_unit_name', label: 'Đơn vị cha' },
      { field: 'child_unit_name', label: 'Đơn vị con' },
      { field: 'warehouse_category', label: 'Phân loại' },
      { field: 'warehouse_area', label: 'DT nhà kho' },
      { field: 'year_built', label: 'Năm xây dựng' },
      { field: 'storage_capacity', label: 'Khả năng cất chứa' }
    ],
    fields: [
      { name: 'name', label: 'Tên kho', type: 'text', required: true },
      { name: 'parent_unit_id', label: 'Đơn vị cha', type: 'unit' },
      { name: 'child_unit_id', label: 'Đơn vị con', type: 'unit' },
      { name: 'province_id', label: 'Tỉnh/Thành', type: 'province' },
      { name: 'ward_id', label: 'Xã/Phường', type: 'ward' },
      { name: 'address', label: 'Địa chỉ', type: 'text' },
      { name: 'warehouse_category', label: 'Phân loại kho', type: 'select' },
      { name: 'quantity', label: 'Số lượng', type: 'number' },
      { name: 'land_area', label: 'Diện tích chiếm đất', type: 'number' },
      { name: 'warehouse_area', label: 'Diện tích nhà kho', type: 'number' },
      { name: 'year_built', label: 'Năm xây dựng', type: 'year' },
      { name: 'year_renovated', label: 'Năm sửa chữa/nâng cấp', type: 'year' },
      { name: 'warehouse_type_id', label: 'Loại nhà kho', type: 'catalog', catalog: 'warehouse_types' },
      { name: 'storage_capacity', label: 'Khả năng cất chứa', type: 'number' },
      { name: 'current_stock', label: 'Trữ lượng hiện nay', type: 'number' },
      { name: 'goods_type_id', label: 'Loại hàng', type: 'catalog', catalog: 'goods_types' },
      { name: 'quality_grade_id', label: 'Phân cấp chất lượng', type: 'catalog', catalog: 'quality_grades' },
      { name: 'fire_need', label: 'Nhu cầu hệ thống cứu hỏa', type: 'text' },
      { name: 'fire_existing', label: 'Hiện có hệ thống cứu hỏa', type: 'text' },
      { name: 'notes', label: 'Ghi chú', type: 'text' }
    ],
    searchFields: ['name', 'address', 'warehouse_category', 'notes', 'parent_unit_name', 'child_unit_name'],
    duplicateRules: [{ fields: ['name', 'address'], label: 'Trùng tên kho và địa chỉ' }],
    documents: { enabled: true }
  },

  cameras: {
    key: 'cameras',
    label: 'Hệ thống camera',
    page: 'cameras',
    table: 'cameras',
    api: 'cameras',
    templateNames: ['CAMERA.xls', 'mau_nhap_camera.xlsx'],
    primaryText: 'child_unit_name',
    listColumns: [
      { field: 'parent_unit_name', label: 'Đơn vị cha' },
      { field: 'child_unit_name', label: 'Đơn vị con' },
      { field: 'quantity', label: 'Số lượng' },
      { field: 'year_installed', label: 'Năm lắp đặt' },
      { field: 'camera_count', label: 'Số camera' },
      { field: 'status', label: 'Tình trạng' }
    ],
    fields: [
      { name: 'parent_unit_id', label: 'Đơn vị cha', type: 'unit' },
      { name: 'child_unit_id', label: 'Đơn vị con', type: 'unit' },
      { name: 'unit_measure', label: 'Đơn vị tính', type: 'text' },
      { name: 'quantity', label: 'Số lượng', type: 'number' },
      { name: 'year_installed', label: 'Năm lắp đặt', type: 'year' },
      { name: 'year_repaired', label: 'Năm sửa chữa', type: 'year' },
      { name: 'screen_count', label: 'Số màn hình', type: 'number' },
      { name: 'camera_count', label: 'Số camera', type: 'number' },
      { name: 'investor', label: 'Cơ quan đầu tư', type: 'text' },
      { name: 'status', label: 'Tình trạng', type: 'text' },
      { name: 'repair_need', label: 'Nhu cầu sửa chữa', type: 'number' },
      { name: 'new_install_need', label: 'Nhu cầu lắp mới', type: 'number' },
      { name: 'notes', label: 'Ghi chú', type: 'text' }
    ],
    searchFields: ['parent_unit_name', 'child_unit_name', 'status', 'notes', 'investor'],
    duplicateRules: [{ fields: ['child_unit_id', 'year_installed'], label: 'Trùng đơn vị con và năm lắp đặt' }],
    documents: { enabled: true }
  },

  fireSystems: {
    key: 'fireSystems',
    label: 'Hệ thống cứu hỏa',
    page: 'fire-systems',
    table: 'fire_systems',
    api: 'fireSystems',
    templateNames: ['CUU-HOA.xls', 'mau_nhap_cuuhoa.xlsx'],
    primaryText: 'child_unit_name',
    listColumns: [
      { field: 'parent_unit_name', label: 'Đơn vị cha' },
      { field: 'child_unit_name', label: 'Đơn vị con' },
      { field: 'quantity', label: 'Số lượng' },
      { field: 'year_installed', label: 'Năm lắp đặt' },
      { field: 'pump_house_count', label: 'Nhà bơm' },
      { field: 'hydrant_count', label: 'Họng nước' },
      { field: 'status', label: 'Tình trạng' }
    ],
    fields: [
      { name: 'parent_unit_id', label: 'Đơn vị cha', type: 'unit' },
      { name: 'child_unit_id', label: 'Đơn vị con', type: 'unit' },
      { name: 'unit_measure', label: 'Đơn vị tính', type: 'text' },
      { name: 'quantity', label: 'Số lượng', type: 'number' },
      { name: 'year_installed', label: 'Năm lắp đặt', type: 'year' },
      { name: 'year_repaired', label: 'Năm sửa chữa', type: 'year' },
      { name: 'pump_house_count', label: 'Số nhà bơm', type: 'number' },
      { name: 'hydrant_count', label: 'Số họng nước', type: 'number' },
      { name: 'investor', label: 'Cơ quan đầu tư', type: 'text' },
      { name: 'status', label: 'Tình trạng', type: 'text' },
      { name: 'repair_need', label: 'Nhu cầu sửa chữa', type: 'number' },
      { name: 'new_install_need', label: 'Nhu cầu lắp mới', type: 'number' },
      { name: 'notes', label: 'Ghi chú', type: 'text' }
    ],
    searchFields: ['parent_unit_name', 'child_unit_name', 'status', 'notes', 'investor'],
    duplicateRules: [{ fields: ['child_unit_id', 'year_installed'], label: 'Trùng đơn vị con và năm lắp đặt' }],
    documents: { enabled: true }
  },

  constructions: {
    key: 'constructions',
    label: 'Công trình xây dựng',
    page: 'constructions',
    table: 'constructions',
    api: 'constructions',
    templateNames: ['CONG-TRINH.xlsx', 'mau_nhap_congtrinh.xlsx'],
    primaryText: 'name',
    listColumns: [
      { field: 'name', label: 'Tên công trình' },
      { field: 'construction_type', label: 'Loại' },
      { field: 'year_started', label: 'Năm khởi công' },
      { field: 'status', label: 'Trạng thái' },
      { field: 'contractor_name', label: 'Nhà thầu' },
      { field: 'contract_value', label: 'Giá trị hợp đồng' }
    ],
    fields: [
      { name: 'name', label: 'Tên công trình', type: 'text', required: true },
      { name: 'parent_unit_id', label: 'Đơn vị cha', type: 'unit' },
      { name: 'child_unit_id', label: 'Đơn vị con', type: 'unit' },
      { name: 'construction_type', label: 'Loại công trình', type: 'text' },
      { name: 'year_started', label: 'Năm khởi công', type: 'year' },
      { name: 'year_completed', label: 'Năm hoàn thành', type: 'year' },
      { name: 'status', label: 'Trạng thái', type: 'text' },
      { name: 'approval_decision_no', label: 'Quyết định phê duyệt', type: 'text' },
      { name: 'contract_number', label: 'Số hợp đồng', type: 'text' },
      { name: 'contractor_name', label: 'Nhà thầu', type: 'text' },
      { name: 'contractor_address', label: 'Địa chỉ nhà thầu', type: 'text' },
      { name: 'review_authority', label: 'Cơ quan thẩm tra', type: 'text' },
      { name: 'start_date', label: 'Ngày bắt đầu', type: 'text' },
      { name: 'end_date', label: 'Ngày kết thúc', type: 'text' },
      { name: 'estimated_cost', label: 'Dự toán', type: 'number' },
      { name: 'contract_value', label: 'Giá trị hợp đồng', type: 'number' },
      { name: 'settlement_value', label: 'Giá trị quyết toán', type: 'number' },
      { name: 'notes', label: 'Ghi chú', type: 'text' }
    ],
    searchFields: ['name', 'construction_type', 'status', 'contractor_name', 'approval_decision_no', 'contract_number', 'notes'],
    duplicateRules: [{ fields: ['name'], label: 'Trùng tên công trình' }],
    documents: { enabled: true }
  }
};

function getModule(key) {
  return moduleRegistry[key] || null;
}

function listModules() {
  return Object.values(moduleRegistry);
}

if (typeof window !== 'undefined') {
  window.moduleRegistry = moduleRegistry;
  window.getModuleConfig = getModule;
}

if (typeof module !== 'undefined') {
  module.exports = { moduleRegistry, getModule, listModules };
}


