// === FIRE SYSTEM MODULE ===
const fireModule = createAssetCrudModule({
  api: 'fireSystems',
  entityType: 'fireSystems',
  prefix: 'fire',
  tableBodyId: 'fire-table-body',
  formContainerId: 'fire-form-container',
  emptyText: 'Chưa có dữ liệu cứu hỏa',
  addTitle: 'Thêm hệ thống cứu hỏa',
  editTitle: 'Sửa hệ thống cứu hỏa',
  createdToast: 'Đã thêm hệ thống cứu hỏa',
  deleteConfirm: 'Xóa hệ thống cứu hỏa này?',
  exportName: 'Cuu_hoa',
  columns: [
    { field: 'parent_unit_name' },
    { field: 'child_unit_name' },
    { field: 'unit_measure' },
    { field: 'quantity', fallback: '0' },
    { field: 'year_installed' },
    { field: 'year_repaired' },
    { field: 'pump_house_count', fallback: '0' },
    { field: 'hydrant_count', fallback: '0' },
    { field: 'investor' },
    { field: 'status', type: 'badge' },
    { field: 'repair_need', fallback: '0' },
    { field: 'new_install_need', fallback: '0' }
  ],
  technicalFields: [
    { name: 'quantity', id: 'qty', label: 'Số lượng' },
    { name: 'year_installed', id: 'year', label: 'Năm lắp đặt' },
    { name: 'year_repaired', id: 'repair-year', label: 'Năm sửa chữa' },
    { name: 'pump_house_count', id: 'pump', label: 'Số nhà bơm' },
    { name: 'hydrant_count', id: 'hydrant', label: 'Số họng nước' },
    { name: 'investor', id: 'investor', label: 'Cơ quan chủ đầu tư', type: 'text' },
    { name: 'status', id: 'status', label: 'Tình trạng', type: 'text', placeholder: 'Hoạt động bình thường', full: true }
  ],
  collectExtra(prefix) {
    return {
      equipment_type: null,
      pump_house_count: numberValue(document.getElementById(`${prefix}-pump`).value),
      hydrant_count: numberValue(document.getElementById(`${prefix}-hydrant`).value)
    };
  }
});

window.fireModule = fireModule;

