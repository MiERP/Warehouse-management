const { cleanString, validateYear, nonNegative, nullableId, assertValid } = require('./common');
function validateFireSystem(data) {
  const errors = [];
  const normalized = {
    ...data,
    parent_unit_id: nullableId(data.parent_unit_id),
    child_unit_id: nullableId(data.child_unit_id),
    unit_measure: cleanString(data.unit_measure),
    equipment_type: cleanString(data.equipment_type),
    quantity: nonNegative(data.quantity, 'Số lượng', errors),
    year_installed: validateYear(data.year_installed, 'Năm lắp đặt', errors),
    year_repaired: validateYear(data.year_repaired, 'Năm sửa chữa', errors),
    pump_house_count: nonNegative(data.pump_house_count, 'Số nhà bơm', errors),
    hydrant_count: nonNegative(data.hydrant_count, 'Số họng', errors),
    investor: cleanString(data.investor),
    status: cleanString(data.status),
    repair_need: nonNegative(data.repair_need, 'Nhu cầu sửa chữa', errors),
    new_install_need: nonNegative(data.new_install_need, 'Nhu cầu lắp mới', errors),
    notes: cleanString(data.notes)
  };
  assertValid(errors);
  return normalized;
}
module.exports = validateFireSystem;
