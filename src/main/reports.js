const XLSX = require('xlsx');
const db = require('./database/db');
const warehouseQueries = require('./database/queries/warehouses');
const cameraQueries = require('./database/queries/cameras');
const fireSystemQueries = require('./database/queries/fire_systems');
const constructionQueries = require('./database/queries/constructions');
const { moduleRegistry, getModule } = require('../shared/module_registry');
const { writeAudit } = require('./audit');

const DATA_SOURCES = {
  warehouses: warehouseQueries,
  cameras: cameraQueries,
  fireSystems: fireSystemQueries,
  constructions: constructionQueries
};

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function stringifyJson(value, fallback) {
  return JSON.stringify(value === undefined ? fallback : value);
}

function cleanText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function normalizeCategory(row) {
  if (!row) return null;
  return row;
}

function normalizeTemplate(row) {
  if (!row) return null;
  return {
    ...row,
    page_config_json: parseJson(row.page_config_json, {}),
    layout_json: parseJson(row.layout_json, {}),
    filter_config_json: parseJson(row.filter_config_json, {})
  };
}

function assertDataSource(dataSource) {
  if (!DATA_SOURCES[dataSource] || !getModule(dataSource)) {
    throw new Error('Nguồn dữ liệu báo cáo không hợp lệ');
  }
}

function listCategories() {
  return db.prepare('SELECT * FROM report_categories ORDER BY sort_order, name').all().map(normalizeCategory);
}

function createCategory(data = {}) {
  const name = cleanText(data.name);
  if (!name) throw new Error('Tên loại báo cáo là bắt buộc');
  const result = db.prepare('INSERT INTO report_categories (name, description, sort_order) VALUES (?, ?, ?)')
    .run(name, cleanText(data.description), Number(data.sort_order) || 0);
  const category = db.prepare('SELECT * FROM report_categories WHERE id = ?').get(result.lastInsertRowid);
  writeAudit({ module: 'reports', action: 'category:create', recordId: result.lastInsertRowid, after: category });
  return normalizeCategory(category);
}

function updateCategory(id, data = {}) {
  const before = db.prepare('SELECT * FROM report_categories WHERE id = ?').get(id);
  if (!before) throw new Error('Không tìm thấy loại báo cáo');
  const name = cleanText(data.name);
  if (!name) throw new Error('Tên loại báo cáo là bắt buộc');
  db.prepare('UPDATE report_categories SET name = ?, description = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, cleanText(data.description), Number(data.sort_order) || 0, id);
  const after = db.prepare('SELECT * FROM report_categories WHERE id = ?').get(id);
  writeAudit({ module: 'reports', action: 'category:update', recordId: id, before, after });
  return normalizeCategory(after);
}

function deleteCategory(id) {
  const before = db.prepare('SELECT * FROM report_categories WHERE id = ?').get(id);
  if (!before) return { success: true };
  db.prepare('UPDATE report_templates SET category_id = NULL WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM report_categories WHERE id = ?').run(id);
  writeAudit({ module: 'reports', action: 'category:delete', recordId: id, before });
  return { success: true };
}

function listTemplates(filters = {}) {
  const where = ['rt.status != ?'];
  const params = ['deleted'];
  if (filters.category_id) {
    where.push('rt.category_id = ?');
    params.push(filters.category_id);
  }
  if (filters.data_source) {
    assertDataSource(filters.data_source);
    where.push('rt.data_source = ?');
    params.push(filters.data_source);
  }
  if (filters.query) {
    where.push('(rt.name LIKE ? OR rt.description LIKE ?)');
    params.push(`%${filters.query}%`, `%${filters.query}%`);
  }
  return db.prepare(`
    SELECT rt.*, rc.name as category_name
    FROM report_templates rt
    LEFT JOIN report_categories rc ON rc.id = rt.category_id
    WHERE ${where.join(' AND ')}
    ORDER BY rt.updated_at DESC, rt.id DESC
  `).all(...params).map(normalizeTemplate);
}

function getTemplate(id) {
  return normalizeTemplate(db.prepare(`
    SELECT rt.*, rc.name as category_name
    FROM report_templates rt
    LEFT JOIN report_categories rc ON rc.id = rt.category_id
    WHERE rt.id = ? AND rt.status != 'deleted'
  `).get(id));
}

function normalizeTemplateInput(data = {}) {
  const name = cleanText(data.name);
  const dataSource = cleanText(data.data_source);
  if (!name) throw new Error('Tên mẫu báo cáo là bắt buộc');
  assertDataSource(dataSource);
  const layout = data.layout_json || {};
  const fields = Array.isArray(layout.fields) ? layout.fields : [];
  if (!fields.length) throw new Error('Mẫu báo cáo cần ít nhất một trường dữ liệu');
  const allowedFields = new Set(getAvailableFields(dataSource).map(field => field.field));
  const normalizedFields = fields.map((field, index) => normalizeReportField(field, index, allowedFields));
  return {
    category_id: data.category_id || null,
    name,
    description: cleanText(data.description),
    data_source: dataSource,
    page_config_json: data.page_config_json || layout.page || {},
    layout_json: { ...layout, fields: normalizedFields },
    filter_config_json: data.filter_config_json || {}
  };
}

function normalizeReportField(field, index, allowedFields) {
  if (Array.isArray(field.fields) || field.type === 'combined') {
    const childFields = (field.fields || []).map(value => String(value || '').trim()).filter(Boolean);
    if (childFields.length < 2) throw new Error('Cột ghép cần ít nhất hai trường dữ liệu');
    childFields.forEach(childField => {
      if (!allowedFields.has(childField)) throw new Error(`Trường báo cáo không hợp lệ: ${childField}`);
    });
    const key = cleanText(field.field) || `combined_${index + 1}`;
    return {
      ...field,
      type: 'combined',
      field: key,
      fields: childFields,
      separator: field.separator === undefined ? ', ' : String(field.separator),
      label: cleanText(field.label) || key
    };
  }
  const fieldName = cleanText(field.field);
  if (!allowedFields.has(fieldName)) throw new Error(`Trường báo cáo không hợp lệ: ${fieldName}`);
  return { ...field, field: fieldName, label: cleanText(field.label) || fieldName };
}

function createTemplate(data = {}) {
  const payload = normalizeTemplateInput(data);
  const result = db.prepare(`
    INSERT INTO report_templates
      (category_id, name, description, data_source, page_config_json, layout_json, filter_config_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    payload.category_id,
    payload.name,
    payload.description,
    payload.data_source,
    stringifyJson(payload.page_config_json, {}),
    stringifyJson(payload.layout_json, {}),
    stringifyJson(payload.filter_config_json, {})
  );
  const template = getTemplate(result.lastInsertRowid);
  writeAudit({ module: 'reports', action: 'template:create', recordId: result.lastInsertRowid, after: template });
  return template;
}

function updateTemplate(id, data = {}) {
  const before = getTemplate(id);
  if (!before) throw new Error('Không tìm thấy mẫu báo cáo');
  const payload = normalizeTemplateInput(data);
  db.prepare(`
    UPDATE report_templates
    SET category_id = ?, name = ?, description = ?, data_source = ?, page_config_json = ?,
      layout_json = ?, filter_config_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    payload.category_id,
    payload.name,
    payload.description,
    payload.data_source,
    stringifyJson(payload.page_config_json, {}),
    stringifyJson(payload.layout_json, {}),
    stringifyJson(payload.filter_config_json, {}),
    id
  );
  const after = getTemplate(id);
  writeAudit({ module: 'reports', action: 'template:update', recordId: id, before, after });
  return after;
}

function deleteTemplate(id) {
  const before = getTemplate(id);
  if (!before) return { success: true };
  db.prepare("UPDATE report_templates SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  writeAudit({ module: 'reports', action: 'template:delete', recordId: id, before });
  return { success: true };
}

function getAvailableFields(dataSource = null) {
  const modules = dataSource ? [getModule(dataSource)] : Object.values(moduleRegistry);
  return modules.filter(Boolean).flatMap(mod => mod.fields.map(field => ({
    module: mod.key,
    moduleLabel: mod.label,
    field: reportFieldName(field.name),
    label: field.label,
    type: field.type
  })).concat((mod.listColumns || []).map(column => ({
    module: mod.key,
    moduleLabel: mod.label,
    field: column.field,
    label: column.label,
    type: 'display'
  })))).filter((field, index, all) =>
    all.findIndex(item => item.module === field.module && item.field === field.field) === index
  );
}

function reportFieldName(name) {
  const displayFields = {
    parent_unit_id: 'parent_unit_name',
    child_unit_id: 'child_unit_name',
    province_id: 'province_name',
    ward_id: 'ward_name',
    warehouse_type_id: 'warehouse_type_name',
    goods_type_id: 'goods_type_name',
    quality_grade_id: 'quality_grade_name'
  };
  return displayFields[name] || name;
}

function applyRuntimeFilters(rows, params = {}) {
  let nextRows = rows;
  if (params.unit_id) {
    const unitId = Number(params.unit_id);
    nextRows = nextRows.filter(row =>
      Number(row.unit_id) === unitId || Number(row.parent_unit_id) === unitId || Number(row.child_unit_id) === unitId
    );
  }
  if (params.year) {
    const year = Number(params.year);
    nextRows = nextRows.filter(row =>
      Number(row.year_built) === year ||
      Number(row.year_installed) === year ||
      Number(row.year_started) === year ||
      Number(row.year_completed) === year
    );
  }
  return nextRows;
}

function renderTemplate(id, params = {}) {
  const template = getTemplate(id);
  if (!template) throw new Error('Không tìm thấy mẫu báo cáo');
  assertDataSource(template.data_source);
  const fields = template.layout_json.fields || [];
  const rows = applyRuntimeFilters(DATA_SOURCES[template.data_source].getAll(), params)
    .map(row => fields.reduce((result, field) => {
      result[field.field] = resolveReportValue(row, field);
      return result;
    }, {}));
  const columns = fields.map(field => ({ field: field.field, label: field.label || field.field }));
  return { template, columns, rows };
}

function resolveReportValue(row, field) {
  if (field.type === 'combined' || Array.isArray(field.fields)) {
    const separator = field.separator === undefined ? ', ' : String(field.separator);
    return (field.fields || [])
      .map(childField => row[childField] ?? '')
      .map(value => String(value).trim())
      .filter(Boolean)
      .join(separator);
  }
  return row[field.field] ?? '';
}

function exportTemplateToExcel(id, params = {}, filePath) {
  if (!filePath) throw new Error('Đường dẫn xuất báo cáo là bắt buộc');
  const rendered = renderTemplate(id, params);
  const data = rendered.rows.map(row => rendered.columns.reduce((result, column) => {
    result[column.label] = row[column.field];
    return result;
  }, {}));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Bao_cao');
  XLSX.writeFile(wb, filePath);
  db.prepare('INSERT INTO report_runs (template_id, params_json, output_type, output_path) VALUES (?, ?, ?, ?)')
    .run(id, stringifyJson(params, {}), 'xlsx', filePath);
  writeAudit({ module: 'reports', action: 'template:export', recordId: id, metadata: { filePath } });
  return { success: true, filePath, rowCount: rendered.rows.length };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAvailableFields,
  renderTemplate,
  exportTemplateToExcel
};
