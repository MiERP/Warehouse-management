const { cleanString, validateYear, nonNegative, required, nullableId, assertValid } = require('./common');
function validateWarehouse(data) {
  const errors = [];
  const normalized = {
    ...data,
    name: required(data.name, 'Tên kho', errors),
    parent_unit_id: nullableId(data.parent_unit_id),
    child_unit_id: nullableId(data.child_unit_id),
    province_id: nullableId(data.province_id),
    ward_id: nullableId(data.ward_id),
    address: cleanString(data.address),
    warehouse_category: cleanString(data.warehouse_category),
    quantity: nonNegative(data.quantity, 'Số nhà kho', errors),
    land_area: nonNegative(data.land_area, 'DT chiếm đất', errors),
    warehouse_area: nonNegative(data.warehouse_area, 'DT nhà kho', errors),
    warehouse_land_area: nonNegative(data.warehouse_land_area, 'DT kho chiếm đất', errors),
    year_built: validateYear(data.year_built, 'Năm xây dựng', errors),
    year_renovated: validateYear(data.year_renovated, 'Năm sửa/nâng cấp', errors),
    warehouse_type_id: nullableId(data.warehouse_type_id),
    goods_type_id: nullableId(data.goods_type_id),
    quality_grade_id: nullableId(data.quality_grade_id),
    renovation_potential: cleanString(data.renovation_potential),
    storage_capacity: nonNegative(data.storage_capacity, 'Trữ lượng dự trữ', errors),
    current_stock: nonNegative(data.current_stock, 'Trữ lượng hiện tại', errors),
    quality_grade_23_area: nonNegative(data.quality_grade_23_area, 'DT cấp 2,3', errors),
    quality_grade_4_area: nonNegative(data.quality_grade_4_area, 'DT cấp 4', errors),
    temp_house_area: nonNegative(data.temp_house_area, 'Nhà tạm', errors),
    lightning_grade_area: nonNegative(data.lightning_grade_area, 'Diện tích chống sét', errors),
    lightning_existing_count: nonNegative(data.lightning_existing_count, 'Số chống sét', errors),
    fire_need: cleanString(data.fire_need),
    fire_existing: cleanString(data.fire_existing),
    notes: cleanString(data.notes)
  };
  assertValid(errors);
  return normalized;
}
module.exports = validateWarehouse;
