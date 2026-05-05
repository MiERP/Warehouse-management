const { cleanString, validateYear, nonNegative, nullableId, assertValid } = require('./common');
function validateCamera(data) {
  const errors = [];
  const normalized = {
    ...data,
    parent_unit_id: nullableId(data.parent_unit_id),
    child_unit_id: nullableId(data.child_unit_id),
    unit_measure: cleanString(data.unit_measure),
    quantity: nonNegative(data.quantity, 'Số lượng', errors),
    year_installed: validateYear(data.year_installed, 'Năm lắp đặt', errors),
    year_repaired: validateYear(data.year_repaired, 'Năm sửa chữa', errors),
    screen_count: nonNegative(data.screen_count, 'Số màn hình', errors),
    camera_count: nonNegative(data.camera_count, 'Số CAM', errors),
    investor: cleanString(data.investor),
    status: cleanString(data.status),
    repair_need: nonNegative(data.repair_need, 'Nhu cầu sửa chữa', errors),
    new_install_need: nonNegative(data.new_install_need, 'Nhu cầu lắp mới', errors),
    notes: cleanString(data.notes)
  };
  assertValid(errors);
  return normalized;
}
module.exports = validateCamera;
