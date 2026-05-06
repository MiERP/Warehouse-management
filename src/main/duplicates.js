const db = require('./database/db');

function groupedDuplicates(table, titleExpr, subtitleExpr, groupExpr, minCount = 2) {
  return db.prepare(`
    SELECT ${groupExpr} as duplicate_key, COUNT(*) as count,
      json_group_array(json_object('id', id, 'title', ${titleExpr}, 'subtitle', ${subtitleExpr})) as records
    FROM ${table}
    WHERE TRIM(COALESCE(${titleExpr}, '')) <> ''
    GROUP BY ${groupExpr}
    HAVING COUNT(*) >= ?
    ORDER BY count DESC, duplicate_key
  `).all(minCount).map(row => ({
    ...row,
    records: JSON.parse(row.records || '[]')
  }));
}

function reviewDuplicates() {
  return {
    warehouses: groupedDuplicates('warehouses', 'name', "COALESCE(address, '')", "lower(trim(name))"),
    constructions: groupedDuplicates('constructions', 'name', "COALESCE(status, '')", "lower(trim(name))"),
    cameras: db.prepare(`
      SELECT COALESCE(c.child_unit_id, -1) || ':' || COALESCE(c.year_installed, '') as duplicate_key,
        COUNT(*) as count,
        json_group_array(json_object('id', c.id, 'title', COALESCE(u.name, 'Camera chưa gắn đơn vị'), 'subtitle', COALESCE(c.status, ''))) as records
      FROM cameras c LEFT JOIN units u ON c.child_unit_id = u.id
      GROUP BY c.child_unit_id, c.year_installed
      HAVING COUNT(*) >= 2
      ORDER BY count DESC
    `).all().map(row => ({ ...row, records: JSON.parse(row.records || '[]') })),
    fireSystems: db.prepare(`
      SELECT COALESCE(f.child_unit_id, -1) || ':' || COALESCE(f.year_installed, '') as duplicate_key,
        COUNT(*) as count,
        json_group_array(json_object('id', f.id, 'title', COALESCE(u.name, 'Cứu hỏa chưa gắn đơn vị'), 'subtitle', COALESCE(f.status, ''))) as records
      FROM fire_systems f LEFT JOIN units u ON f.child_unit_id = u.id
      GROUP BY f.child_unit_id, f.year_installed
      HAVING COUNT(*) >= 2
      ORDER BY count DESC
    `).all().map(row => ({ ...row, records: JSON.parse(row.records || '[]') }))
  };
}

module.exports = { reviewDuplicates };
