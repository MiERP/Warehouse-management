const { cleanString, validateYear, validateDate, nonNegative, required, nullableId, assertValid } = require('./common');
function validateConstruction(data) {
  const errors = [];
  const totalInvestment = nonNegative(data.total_investment, 'Tổng tiền từ đầu tư', errors);
  const settlementValue = nonNegative(data.settlement_value, 'Giá trị quyết toán', errors);
  if (totalInvestment > 0 && settlementValue > totalInvestment) errors.push('Giá trị quyết toán không được lớn hơn tổng tiền đầu tư');
  const normalized = {
    ...data,
    name: required(data.name, 'Tên công trình', errors),
    parent_unit_id: nullableId(data.parent_unit_id),
    child_unit_id: nullableId(data.child_unit_id),
    construction_type: cleanString(data.construction_type),
    year_started: validateYear(data.year_started, 'Năm bắt đầu', errors),
    year_completed: validateYear(data.year_completed, 'Năm hoàn thành', errors),
    status: cleanString(data.status),
    budget: nonNegative(data.budget, 'Dự toán', errors),
    investor: cleanString(data.investor),
    description: cleanString(data.description),
    progress: nonNegative(data.progress, 'Tiến độ', errors),
    approval_decision_no: cleanString(data.approval_decision_no),
    contract_number: cleanString(data.contract_number),
    contractor_name: cleanString(data.contractor_name),
    contractor_address: cleanString(data.contractor_address),
    contractor_tax_code: cleanString(data.contractor_tax_code),
    review_authority: cleanString(data.review_authority),
    work_volume: cleanString(data.work_volume),
    start_date: validateDate(data.start_date, 'Thời gian bắt đầu', errors),
    end_date: validateDate(data.end_date, 'Thời gian kết thúc', errors),
    approved_investment: nonNegative(data.approved_investment, 'Tổng mức đầu tư phê duyệt', errors),
    estimated_cost: nonNegative(data.estimated_cost, 'Dự toán', errors),
    contract_value: nonNegative(data.contract_value, 'Giá trị hợp đồng', errors),
    settlement_approved: nonNegative(data.settlement_approved, 'Quyết toán được duyệt', errors),
    total_estimated: nonNegative(data.total_estimated, 'Tổng dự toán', errors),
    settlement_decision_no: cleanString(data.settlement_decision_no),
    settlement_value: settlementValue,
    total_investment: totalInvestment,
    notes: cleanString(data.notes)
  };
  assertValid(errors);
  return normalized;
}
module.exports = validateConstruction;

