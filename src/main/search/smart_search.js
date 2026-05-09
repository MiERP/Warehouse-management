const db = require('../database/db');
const { parseQuery } = require('./query_parser');
const { normalizeVietnamese } = require('./normalize');
const { ensureTables, rebuild } = require('./search_index');
const { rankRows } = require('./ranking');

const MODULE_TABLES = {
  warehouse: {
    table: 'warehouses', alias: 'w', id: 'w.id',
    yearFields: ['w.year_built', 'w.year_renovated'],
    numericFields: { storage_capacity: 'w.storage_capacity' }
  },
  camera: {
    table: 'cameras', alias: 'c', id: 'c.id',
    yearFields: ['c.year_installed', 'c.year_repaired'],
    numericFields: { camera_count: 'c.camera_count', screen_count: 'c.screen_count' }
  },
  fire: {
    table: 'fire_systems', alias: 'f', id: 'f.id',
    yearFields: ['f.year_installed', 'f.year_repaired'],
    numericFields: { hydrant_count: 'f.hydrant_count' }
  },
  construction: {
    table: 'constructions', alias: 'c', id: 'c.id',
    yearFields: ['c.year_started', 'c.year_completed'],
    numericFields: {}
  }
};

function makeFtsQuery(parsed) {
  const terms = parsed.expandedQuery
    .split(' ')
    .filter(term => term.length > 1 && !['truoc', 'sau', 'tren', 'duoi', 'nam', 'can', 'chua', 'co'].includes(term));
  return [...new Set(terms)].slice(0, 8).map(term => `${term}*`).join(' OR ');
}

function runFts(parsed, limit) {
  const ftsQuery = makeFtsQuery(parsed);
  if (!ftsQuery) return [];

  let sql = `
    SELECT rowid, module, record_id, title, subtitle, unit_name, address, status, investor, notes, normalized_text,
      (100 - bm25(smart_search_fts)) as fts_score
    FROM smart_search_fts
    WHERE smart_search_fts MATCH ?
  `;
  const params = [ftsQuery];
  if (parsed.modules.length) {
    sql += ` AND module IN (${parsed.modules.map(() => '?').join(',')})`;
    params.push(...parsed.modules);
  }
  sql += ' LIMIT ?';
  params.push(limit * 4);
  return db.prepare(sql).all(...params);
}

function filterExpression(fields, filter) {
  if (!fields.length) return null;
  if (filter.op === 'between') {
    return `(${fields.map(field => `(${field} BETWEEN ? AND ?)`).join(' OR ')})`;
  }
  return `(${fields.map(field => `(${field} ${filter.op} ?)`).join(' OR ')})`;
}

function runStructuredFilters(parsed) {
  const targetModules = parsed.modules.length ? parsed.modules : Object.keys(MODULE_TABLES);
  const rows = [];

  targetModules.forEach(module => {
    const config = MODULE_TABLES[module];
    const clauses = [];
    const params = [];

    parsed.yearFilters.forEach(filter => {
      const expression = filterExpression(config.yearFields, filter);
      if (!expression) return;
      clauses.push(expression);
      if (filter.op === 'between') config.yearFields.forEach(() => params.push(filter.value[0], filter.value[1]));
      else config.yearFields.forEach(() => params.push(filter.value));
    });

    parsed.numericFilters.forEach(filter => {
      const field = config.numericFields[filter.type];
      if (!field) return;
      clauses.push(`${field} ${filter.op} ?`);
      params.push(filter.value);
    });

    if ((parsed.statusFlags.broken || parsed.statusFlags.repair) && (module === 'camera' || module === 'fire')) {
      const alias = config.alias;
      clauses.push(`(${alias}.repair_need > 0 OR LOWER(COALESCE(${alias}.status,'')) LIKE ?)`);
      params.push('%hỏng%');
    }
    if (parsed.statusFlags.missing && module === 'warehouse' && parsed.normalizedQuery.includes('cuu hoa')) {
      clauses.push(`(w.fire_existing IS NULL OR w.fire_existing = '' OR LOWER(w.fire_existing) LIKE ?)`);
      params.push('%không%');
    }
    if (parsed.statusFlags.unsettled && module === 'construction') {
      clauses.push(`(c.settlement_value IS NULL OR c.settlement_value = 0 OR c.settlement_decision_no IS NULL OR c.settlement_decision_no = '')`);
    }
    if (parsed.statusFlags.inProgress && module === 'construction') {
      clauses.push(`LOWER(COALESCE(c.status,'')) LIKE ?`);
      params.push('%thi công%');
    }

    if (!clauses.length) return;

    const docs = db.prepare(`
      SELECT s.module, s.record_id, s.title, s.subtitle, s.unit_name, s.address, s.status, s.investor, s.notes, s.normalized_text,
        60 as fts_score
      FROM smart_search_fts s
      JOIN ${config.table} ${config.alias} ON ${config.id} = s.record_id
      WHERE s.module = ? AND ${clauses.join(' AND ')}
      LIMIT 50
    `).all(module, ...params);
    rows.push(...docs);
  });

  return rows;
}

function dedupe(rows) {
  const map = new Map();
  rows.forEach(row => {
    const key = `${row.module}:${row.record_id}`;
    const existing = map.get(key);
    if (!existing || Number(row.fts_score || 0) > Number(existing.fts_score || 0)) map.set(key, row);
  });
  return [...map.values()];
}

function logSearch(query, normalizedQuery, resultCount) {
  try {
    db.prepare('INSERT INTO smart_search_logs (query, normalized_query, result_count) VALUES (?, ?, ?)')
      .run(query, normalizedQuery, resultCount);
  } catch (_) {}
}

function search(query, options = {}) {
  ensureTables();
  const limit = options.limit || 20;
  const parsed = parseQuery(query);
  if (!parsed.normalizedQuery || parsed.normalizedQuery.length < 2) return [];

  let rows = dedupe([...runFts(parsed, limit), ...runStructuredFilters(parsed)]);
  if (!rows.length) {
    rebuild();
    rows = dedupe([...runFts(parsed, limit), ...runStructuredFilters(parsed)]);
  }

  const ranked = rankRows(parsed, rows).slice(0, limit).map(row => ({
    module: row.module,
    id: row.record_id,
    title: row.title,
    subtitle: row.subtitle,
    status: row.status,
    score: Math.round(row.score),
    matched_reason: row.matched_reason
  }));
  logSearch(query, normalizeVietnamese(query), ranked.length);
  return ranked;
}

module.exports = { search, rebuild };
