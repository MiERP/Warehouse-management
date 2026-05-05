const { normalizeVietnamese, compactCode } = require('./normalize');

function containsAny(text, terms) {
  return terms.some(term => term && text.includes(normalizeVietnamese(term)));
}

function exactCodeBoost(parsed, row) {
  const codes = parsed.normalizedQuery.match(/\b[a-z]+\s*\d+\b|\bk\s*\d+\b|\b\d{4}\b/g) || [];
  if (!codes.length) return 0;
  const rowCodeText = compactCode(`${row.title} ${row.subtitle} ${row.unit_name} ${row.address} ${row.status} ${row.notes}`);
  return codes.reduce((score, code) => score + (rowCodeText.includes(compactCode(code)) ? 50 : 0), 0);
}

function moduleBoost(parsed, row) {
  return parsed.modules.includes(row.module) ? 20 : 0;
}

function fieldBoost(parsed, row) {
  const terms = parsed.terms.filter(term => term.length > 1);
  const title = normalizeVietnamese(row.title);
  const unit = normalizeVietnamese(row.unit_name || row.subtitle);
  const status = normalizeVietnamese(row.status);
  const investor = normalizeVietnamese(row.investor);
  const address = normalizeVietnamese(row.address);
  const notes = normalizeVietnamese(row.notes);

  let score = 0;
  if (containsAny(title, terms)) score += 30;
  if (containsAny(unit, terms)) score += 12;
  if (containsAny(status, terms)) score += 15;
  if (containsAny(investor, terms)) score += 8;
  if (containsAny(address, terms)) score += 8;
  if (containsAny(notes, terms)) score += 3;
  return score;
}

function statusBoost(parsed, row) {
  const text = normalizeVietnamese(`${row.status} ${row.notes} ${row.normalized_text}`);
  let score = 0;
  if ((parsed.statusFlags.broken || parsed.statusFlags.repair) && /hong|loi|sua chua|bao tri|khong hoat dong|mat tin hieu/.test(text)) score += 20;
  if (parsed.statusFlags.missing && /khong|chua co|thieu|0/.test(text)) score += 10;
  if (parsed.statusFlags.unsettled && row.module === 'construction' && /quyet toan|0/.test(text)) score += 15;
  if (parsed.statusFlags.inProgress && /dang thi cong|dang thuc hien|thi cong/.test(text)) score += 15;
  if (parsed.statusFlags.completed && /hoan thanh/.test(text)) score += 15;
  return score;
}

function matchedReasons(parsed, row) {
  const reasons = [];
  const text = normalizeVietnamese(`${row.title} ${row.subtitle} ${row.unit_name} ${row.status} ${row.notes}`);
  parsed.terms.forEach(term => {
    if (term.length > 1 && text.includes(term) && !reasons.includes(term)) reasons.push(term);
  });
  if (parsed.modules.includes(row.module)) reasons.push('đúng phân hệ');
  if (parsed.yearFilters.length || parsed.numericFilters.length) reasons.push('khớp điều kiện lọc');
  return reasons.slice(0, 5);
}

function rankRows(parsed, rows) {
  return rows.map(row => {
    const score = Number(row.fts_score || 0)
      + moduleBoost(parsed, row)
      + exactCodeBoost(parsed, row)
      + fieldBoost(parsed, row)
      + statusBoost(parsed, row);
    return { ...row, score, matched_reason: matchedReasons(parsed, row) };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

module.exports = { rankRows };
