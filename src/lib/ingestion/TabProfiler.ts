// ═══════════════════════════════════════════════
// Tab Profiler — Fast, pure profiling per tab
// Runs BEFORE schema detection. Output reused everywhere.
// ═══════════════════════════════════════════════

import type { RawTab, TabProfile } from './types';

// ─── Value Pattern Detectors (pure functions) ───

export function isDateLike(val: string): boolean {
  if (!val || val.trim().length < 3) return false;
  const s = val.trim();
  // ISO
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return true;
  // DD/MM/YYYY or variants
  if (/^\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}$/.test(s)) return true;
  // DD/MM short
  if (/^\d{1,2}[/.\-]\d{1,2}$/.test(s)) return true;
  // "15 tháng 3" pattern
  if (/\d{1,2}\s*tháng\s*\d{1,2}/i.test(s)) return true;
  // English month pattern: "Mar 15" or "15 Mar"
  if (/^[A-Za-z]{3}\s+\d{1,2}$/i.test(s) || /^\d{1,2}\s+[A-Za-z]{3}$/i.test(s)) return true;
  return false;
}

export function isEmailLike(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export function isPercentLike(val: string): boolean {
  const s = val.trim();
  if (s.endsWith('%')) return true;
  const n = parseFloat(s);
  return !isNaN(n) && n >= 0 && n <= 100 && s.length <= 6 && /^\d/.test(s);
}

const STATUS_KEYWORDS = new Set([
  'todo', 'done', 'doing', 'in progress', 'hoàn thành', 'xong',
  'đang làm', 'chưa bắt đầu', 'blocked', 'cancelled', 'đã hủy',
  'pending', 'open', 'closed', 'active', 'wip', 'review', 'chờ duyệt',
  'tạm dừng', 'not started', 'completed', 'in review', 'đang xử lý',
]);

export function isStatusLike(val: string): boolean {
  const lower = val.trim().toLowerCase();
  if (STATUS_KEYWORDS.has(lower)) return true;
  // Unaccented check
  const unaccented = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  for (const kw of STATUS_KEYWORDS) {
    const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    if (unaccented === kwNorm) return true;
  }
  return false;
}

export function isNameLike(val: string): boolean {
  const s = val.trim();
  if (s.length < 2 || s.length > 60) return false;
  const words = s.split(/\s+/);
  if (words.length < 2) return false;
  return words.every((w) => /^[a-zA-ZÀ-ỿ]+$/.test(w));
}

// ─── Tab Profiler ───

export function profileTab(tab: RawTab): TabProfile {
  const { headers, rows, tab_name, tab_index, row_count, col_count } = tab;
  const warnings: string[] = [];

  const sampleSize = Math.min(20, rows.length);
  const sampleRows = rows.slice(0, sampleSize);

  // Non-empty ratio
  let filledCells = 0;
  const totalCells = rows.length * headers.length;
  for (const row of rows) {
    for (let c = 0; c < headers.length; c++) {
      if (row[c] && row[c].trim() !== '') filledCells++;
    }
  }
  const nonEmptyRatio = totalCells > 0 ? filledCells / totalCells : 0;

  // Header quality
  const nonEmptyHeaders = headers.filter((h) => h.length > 0).length;
  const uniqueHeaders = new Set(headers.filter((h) => h.length > 0));
  const repeatedHeaderPenalty = 1 - uniqueHeaders.size / Math.max(nonEmptyHeaders, 1);
  const headerQuality = nonEmptyHeaders / Math.max(headers.length, 1);

  if (repeatedHeaderPenalty > 0.2) {
    warnings.push(`${Math.round(repeatedHeaderPenalty * 100)}% header trùng lặp`);
  }

  // Per-column pattern detection
  const dateLikeCols: number[] = [];
  const percentLikeCols: number[] = [];
  const emailLikeCols: number[] = [];
  const nameLikeCols: number[] = [];
  const statusLikeCols: number[] = [];
  const noteLikeCols: number[] = [];
  const lowCardinalityCols: number[] = [];

  for (let c = 0; c < headers.length; c++) {
    const values = sampleRows
      .map((r) => r[c] ?? '')
      .filter((v) => v.trim() !== '');

    if (values.length === 0) continue;

    const dateR = values.filter(isDateLike).length / values.length;
    const pctR = values.filter(isPercentLike).length / values.length;
    const emailR = values.filter(isEmailLike).length / values.length;
    const nameR = values.filter(isNameLike).length / values.length;
    const statusR = values.filter(isStatusLike).length / values.length;

    if (dateR > 0.5) dateLikeCols.push(c);
    if (pctR > 0.6) percentLikeCols.push(c);
    if (emailR > 0.4) emailLikeCols.push(c);
    if (nameR > 0.5) nameLikeCols.push(c);
    if (statusR > 0.4) statusLikeCols.push(c);

    // Cardinality
    const unique = new Set(values);
    if (unique.size <= 8 && values.length >= 3) lowCardinalityCols.push(c);

    // Notes: long text, high cardinality
    const avgLen = values.reduce((s, v) => s + v.length, 0) / values.length;
    if (avgLen > 40 && unique.size > values.length * 0.7) noteLikeCols.push(c);
  }

  // Row quality
  const validRows = rows.filter((row) => {
    const filled = headers.reduce((s, _, i) => s + ((row[i] ?? '').trim() !== '' ? 1 : 0), 0);
    return filled >= Math.max(2, headers.length * 0.3);
  });
  const rowQuality = rows.length > 0 ? validRows.length / rows.length : 0;

  // Noise penalty
  const normalizedName = tab_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  const NOISE_NAMES = new Set([
    'sheet1', 'sheet2', 'sheet3', 'data', 'table', 'bang',
    'overview', 'tongquan', 'readme', 'huongdan', 'notes',
    'ghichu', 'template', 'mau', 'config', 'settings',
    'archive', 'backup', 'temp', 'test', 'hidden',
  ]);
  const noisePenalty = NOISE_NAMES.has(normalizedName) ? 0.3 : 0;

  // Determine likely shape
  let likelyShape: TabProfile['likely_shape'] = 'unknown';
  if (row_count >= 5 && statusLikeCols.length > 0) {
    likelyShape = 'row_level';
  } else if (row_count >= 5 && col_count >= 3) {
    likelyShape = 'row_level';
  } else if (row_count < 10 && col_count >= 4) {
    likelyShape = 'summary';
  } else if (noteLikeCols.length >= col_count * 0.5) {
    likelyShape = 'notes';
  }

  return {
    tab_name,
    tab_index,
    row_count,
    col_count,
    non_empty_ratio: nonEmptyRatio,
    row_quality_score: rowQuality,
    header_quality_score: headerQuality,
    low_cardinality_columns: lowCardinalityCols,
    date_like_columns: dateLikeCols,
    percent_like_columns: percentLikeCols,
    email_like_columns: emailLikeCols,
    name_like_columns: nameLikeCols,
    status_like_columns: statusLikeCols,
    note_like_columns: noteLikeCols,
    repeated_header_penalty: repeatedHeaderPenalty,
    noise_penalty: noisePenalty,
    likely_shape: likelyShape,
    warnings,
  };
}
