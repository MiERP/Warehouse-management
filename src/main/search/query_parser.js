const { normalizeVietnamese } = require('./normalize');
const { MODULE_KEYWORDS, EXPANSIONS, STATUS_KEYWORDS } = require('./dictionary');

function hasAny(normalizedQuery, phrases) {
  return phrases.some(phrase => normalizedQuery.includes(normalizeVietnamese(phrase)));
}

function detectModules(normalizedQuery) {
  const modules = Object.entries(MODULE_KEYWORDS)
    .filter(([, phrases]) => hasAny(normalizedQuery, phrases))
    .map(([module]) => module);
  return [...new Set(modules)];
}

function expandTerms(normalizedQuery) {
  const terms = new Set(normalizedQuery.split(' ').filter(Boolean));
  const expandedPhrases = [normalizedQuery];

  Object.entries(EXPANSIONS).forEach(([key, values]) => {
    const normalizedKey = normalizeVietnamese(key.replace(/_/g, ' '));
    if (normalizedQuery.includes(normalizedKey)) {
      values.forEach(value => {
        expandedPhrases.push(normalizeVietnamese(value));
        normalizeVietnamese(value).split(' ').forEach(token => terms.add(token));
      });
    }
  });

  return {
    terms: [...terms],
    expandedQuery: [...new Set(expandedPhrases)].join(' ')
  };
}

function parseYearFilters(normalizedQuery) {
  const filters = [];
  const before = normalizedQuery.match(/(?:truoc|duoi|nho hon)\s+(20\d{2}|19\d{2})/);
  const after = normalizedQuery.match(/(?:sau|tren|lon hon|hon)\s+(20\d{2}|19\d{2})/);
  const exact = normalizedQuery.match(/(?:nam|năm)\s+(20\d{2}|19\d{2})/);
  const between = normalizedQuery.match(/tu\s+(20\d{2}|19\d{2})\s+(?:den|toi)\s+(20\d{2}|19\d{2})/);

  if (between) filters.push({ type: 'year', op: 'between', value: [Number(between[1]), Number(between[2])] });
  else if (before) filters.push({ type: 'year', op: '<', value: Number(before[1]) });
  else if (after) filters.push({ type: 'year', op: '>', value: Number(after[1]) });
  else if (exact) filters.push({ type: 'year', op: '=', value: Number(exact[1]) });

  return filters;
}

function parseNumericFilters(normalizedQuery) {
  const filters = [];
  const patterns = [
    { type: 'storage_capacity', re: /(?:suc chua|tru luong|tan)\s+(?:tren|hon|lon hon)\s+(\d+)/, op: '>' },
    { type: 'storage_capacity', re: /(?:suc chua|tru luong|tan)\s+(?:duoi|it hon|nho hon)\s+(\d+)/, op: '<' },
    { type: 'camera_count', re: /(?:camera|cam)\s+(?:tren|hon|lon hon)\s+(\d+)/, op: '>' },
    { type: 'camera_count', re: /(?:camera|cam)\s+(?:duoi|it hon|nho hon)\s+(\d+)/, op: '<' },
    { type: 'screen_count', re: /(?:man hinh)\s+(?:tren|hon|lon hon)\s+(\d+)/, op: '>' },
    { type: 'hydrant_count', re: /(?:hong|so hong)\s+(?:tren|hon|lon hon)\s+(\d+)/, op: '>' }
  ];

  patterns.forEach(pattern => {
    const match = normalizedQuery.match(pattern.re);
    if (match) filters.push({ type: pattern.type, op: pattern.op, value: Number(match[1]) });
  });

  return filters;
}

function parseStatusFlags(normalizedQuery) {
  return Object.fromEntries(
    Object.entries(STATUS_KEYWORDS).map(([key, phrases]) => [key, hasAny(normalizedQuery, phrases)])
  );
}

function parseQuery(query) {
  const normalizedQuery = normalizeVietnamese(query);
  const expanded = expandTerms(normalizedQuery);

  return {
    originalQuery: query,
    normalizedQuery,
    expandedQuery: normalizeVietnamese(`${normalizedQuery} ${expanded.expandedQuery}`),
    modules: detectModules(normalizedQuery),
    terms: expanded.terms,
    yearFilters: parseYearFilters(normalizedQuery),
    numericFilters: parseNumericFilters(normalizedQuery),
    statusFlags: parseStatusFlags(normalizedQuery)
  };
}

module.exports = { parseQuery, hasAny };

