const db = require('../db');

const constructionQueries = {
  getAll() {
    return db.prepare(`
      SELECT c.*, COALESCE(u.name, cu.name) as unit_name, COALESCE(pu.name, up.name) as parent_unit_name, cu.name as child_unit_name
      FROM constructions c
      LEFT JOIN units u ON c.unit_id = u.id
      LEFT JOIN units up ON u.parent_id = up.id
      LEFT JOIN units pu ON c.parent_unit_id = pu.id
      LEFT JOIN units cu ON c.child_unit_id = cu.id
      ORDER BY COALESCE(up.name, pu.name), c.name
    `).all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM constructions WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO constructions (name, unit_id, parent_unit_id, child_unit_id, construction_type,
        year_started, year_completed, status, budget, investor, description, progress,
        approval_decision_no, contract_number, contractor_name, contractor_address,
        contractor_tax_code, review_authority, work_volume, start_date, end_date,
        approved_investment, estimated_cost, contract_value, settlement_approved,
        total_estimated, settlement_decision_no, settlement_value, total_investment, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const r = stmt.run(
      data.name, data.unit_id || data.child_unit_id || data.parent_unit_id || null, data.parent_unit_id, data.child_unit_id, data.construction_type,
      data.year_started, data.year_completed, data.status, data.budget,
      data.investor, data.description, data.progress,
      data.approval_decision_no, data.contract_number, data.contractor_name,
      data.contractor_address, data.contractor_tax_code, data.review_authority,
      data.work_volume, data.start_date, data.end_date,
      data.approved_investment, data.estimated_cost, data.contract_value,
      data.settlement_approved, data.total_estimated, data.settlement_decision_no,
      data.settlement_value, data.total_investment, data.notes
    );
    return { id: r.lastInsertRowid, ...data };
  },

  update(id, data) {
    db.prepare(`
      UPDATE constructions SET name=?, unit_id=?, parent_unit_id=?, child_unit_id=?, construction_type=?,
        year_started=?, year_completed=?, status=?, budget=?, investor=?, description=?, progress=?,
        approval_decision_no=?, contract_number=?, contractor_name=?, contractor_address=?,
        contractor_tax_code=?, review_authority=?, work_volume=?, start_date=?, end_date=?,
        approved_investment=?, estimated_cost=?, contract_value=?, settlement_approved=?,
        total_estimated=?, settlement_decision_no=?, settlement_value=?, total_investment=?, notes=?
      WHERE id=?
    `).run(
      data.name, data.unit_id || data.child_unit_id || data.parent_unit_id || null, data.parent_unit_id, data.child_unit_id, data.construction_type,
      data.year_started, data.year_completed, data.status, data.budget,
      data.investor, data.description, data.progress,
      data.approval_decision_no, data.contract_number, data.contractor_name,
      data.contractor_address, data.contractor_tax_code, data.review_authority,
      data.work_volume, data.start_date, data.end_date,
      data.approved_investment, data.estimated_cost, data.contract_value,
      data.settlement_approved, data.total_estimated, data.settlement_decision_no,
      data.settlement_value, data.total_investment, data.notes, id
    );
    return { id, ...data };
  },

  remove(id) {
    db.prepare('DELETE FROM constructions WHERE id = ?').run(id);
    return { success: true };
  },

  // Dự án theo năm hiện tại
  getByCurrentYear() {
    const year = new Date().getFullYear();
    return db.prepare(`
      SELECT c.*, COALESCE(u.name, pu.name) as parent_unit_name, u.name as unit_name
      FROM constructions c
      LEFT JOIN units u ON c.unit_id = u.id
      LEFT JOIN units pu ON c.parent_unit_id = pu.id
      WHERE c.year_started = ? OR c.year_completed = ?
      ORDER BY c.name
    `).all(year, year);
  }
};

module.exports = constructionQueries;
