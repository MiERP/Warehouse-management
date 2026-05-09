// === CAMERA MODULE ===
const cameraModule = createAssetCrudModule({
  api: 'cameras',
  entityType: 'cameras',
  prefix: 'cam',
  tableBodyId: 'camera-table-body',
  formContainerId: 'camera-form-container',
  emptyText: 'Chưa có dữ liệu camera',
  addTitle: 'Thêm hệ thống camera',
  editTitle: 'Sửa hệ thống camera',
  createdToast: 'Đã thêm camera',
  deleteConfirm: 'Xóa hệ thống camera này?',
  exportName: 'Camera',
  columns: [
    { field: 'parent_unit_name' },
    { field: 'child_unit_name' },
    { field: 'unit_measure' },
    { field: 'quantity', fallback: '0' },
    { field: 'year_installed' },
    { field: 'year_repaired' },
    { field: 'screen_count', fallback: '0' },
    { field: 'camera_count', fallback: '0' },
    { field: 'investor' },
    { field: 'status', type: 'badge' },
    { field: 'repair_need', fallback: '0' },
    { field: 'new_install_need', fallback: '0' }
  ],
  technicalFields: [
    { name: 'quantity', id: 'qty', label: 'Số lượng' },
    { name: 'year_installed', id: 'year', label: 'Năm lắp đặt' },
    { name: 'year_repaired', id: 'repair-year', label: 'Năm sửa chữa' },
    { name: 'screen_count', id: 'screen', label: 'Số màn hình' },
    { name: 'camera_count', id: 'count', label: 'Số camera' },
    { name: 'investor', id: 'investor', label: 'Cơ quan chủ đầu tư', type: 'text' },
    { name: 'status', id: 'status', label: 'Tình trạng', type: 'text', full: true }
  ],
  collectExtra(prefix) {
    return {
      screen_count: numberValue(document.getElementById(`${prefix}-screen`).value),
      camera_count: numberValue(document.getElementById(`${prefix}-count`).value)
    };
  }
});

window.cameraModule = cameraModule;

