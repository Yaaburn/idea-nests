// ═══════════════════════════════════════════════
// Linguistic Engine — Unified Multilingual Processing
// Vietnamese, English, mixed-language support.
// All normalization, similarity, and entity detection
// in one canonical module. No duplication.
// ═══════════════════════════════════════════════

import type { CanonicalFieldName } from '../canonicalTypes';
import type { HeaderNormalization } from './SnapshotTypes';

// ═══════════════════════════════════════════════
// SECTION A: Unicode / Vietnamese Normalization
// ═══════════════════════════════════════════════

const VIET_CHAR_MAP: Record<string, string> = {};

function addChars(chars: string, target: string): void {
  for (const c of chars) {
    VIET_CHAR_MAP[c] = target;
    VIET_CHAR_MAP[c.toUpperCase()] = target.toUpperCase();
  }
}

addChars('àáảãạ', 'a');
addChars('ăắặằẳẵ', 'a');
addChars('âấầẩẫậ', 'a');
addChars('đ', 'd');
addChars('èéẻẽẹ', 'e');
addChars('êếềểễệ', 'e');
addChars('ìíỉĩị', 'i');
addChars('òóỏõọ', 'o');
addChars('ôốồổỗộ', 'o');
addChars('ơớờởỡợ', 'o');
addChars('ùúủũụ', 'u');
addChars('ưứừửữự', 'u');
addChars('ỳýỷỹỵ', 'y');

/** Remove Vietnamese diacritics. Pure, no external deps. */
export function unaccent(s: string): string {
  let result = '';
  for (const c of s) {
    result += VIET_CHAR_MAP[c] ?? c;
  }
  return result;
}

/** NFC normalize + unaccent + lowercase + strip non-alphanumeric + collapse spaces */
export function normalizeString(s: string): string {
  return unaccent(s.normalize('NFC'))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Header normalization: unaccent + lowercase + strip all separators */
export function normalizeHeader(h: string): string {
  return unaccent(h.normalize('NFC').toLowerCase())
    .replace(/[%#@$&*!?]/g, '')
    .replace(/[\s\-_./]+/g, '')
    .trim();
}

// ═══════════════════════════════════════════════
// SECTION B: String Similarity Stack
// ═══════════════════════════════════════════════

/** Levenshtein distance — inline, no deps */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Jaro similarity (0–1, higher = more similar) */
export function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
  );
}

/** Jaro-Winkler similarity (0–1, higher = more similar) */
export function jaroWinkler(s1: string, s2: string, prefixScale = 0.1): number {
  const jaroSim = jaro(s1, s2);
  let prefixLen = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefixLen++;
    else break;
  }
  return jaroSim + prefixLen * prefixScale * (1 - jaroSim);
}

/** Token overlap ratio: |intersection| / |union| */
export function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(normalizeString(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeString(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/** Check if one string contains the other as a prefix/suffix */
export function prefixSuffixContainment(source: string, target: string): boolean {
  const s = normalizeHeader(source);
  const t = normalizeHeader(target);
  if (s.length < 3 || t.length < 3) return false;
  return s.startsWith(t) || s.endsWith(t) || t.startsWith(s) || t.endsWith(s);
}

/** Acronym/initials match: "Tên công việc" → "tcv" */
export function acronymMatch(header: string, synonym: string): boolean {
  const headerNorm = normalizeString(header);
  const synNorm = normalizeString(synonym);
  const headerTokens = headerNorm.split(' ').filter(Boolean);
  const synTokens = synNorm.split(' ').filter(Boolean);

  if (headerTokens.length < 2 && synTokens.length < 2) return false;

  const headerAcronym = headerTokens.map(t => t[0]).join('');
  const synAcronym = synTokens.map(t => t[0]).join('');

  // Check if one is the acronym of the other
  const headerStripped = normalizeHeader(header);
  const synStripped = normalizeHeader(synonym);

  return (
    (headerAcronym.length >= 2 && headerAcronym === synStripped) ||
    (synAcronym.length >= 2 && synAcronym === headerStripped) ||
    (headerAcronym === synAcronym && headerAcronym.length >= 2)
  );
}

/** Fuzzy match with configurable max Levenshtein distance */
export function fuzzyMatch(source: string, target: string, maxDist = 2): boolean {
  const s = normalizeString(source);
  const t = normalizeString(target);
  if (s === t) return true;
  if (Math.abs(s.length - t.length) > maxDist) return false;
  return levenshtein(s, t) <= maxDist;
}

// ═══════════════════════════════════════════════
// SECTION C: Unified Synonym Dictionary
// ═══════════════════════════════════════════════

/**
 * Master synonym dictionary. Keys are canonical field names.
 * Values are arrays of normalized (unaccented, lowercased, stripped) synonyms.
 * Includes Vietnamese (with and without diacritics), English, mixed, abbreviations.
 */
export const UNIFIED_SYNONYMS: Record<string, string[]> = {
  task_name: [
    // Vietnamese
    'tencongviec', 'tencv', 'nhiemvu', 'congviec', 'hangmuc', 'dauviec',
    'vieccanlam', 'tieude', 'noidung', 'tennhiemvu', 'tencongtac', 'congtac',
    // English
    'task', 'taskname', 'title', 'name', 'description', 'item', 'workitem',
    'userstory', 'story', 'deliverable', 'jobs', 'job',
    // Mixed / Abbreviations
    'cv', 'ten',
  ],
  task_status: [
    // Vietnamese
    'trangthai', 'tinhtrang', 'trangthainv', 'trangthaicongtac',
    'ketqua', 'tiendophan',
    // English
    'status', 'state', 'result', 'outcome', 'progressstatus',
  ],
  task_assignee: [
    // Vietnamese
    'nguoiphutrach', 'nguoithuchien', 'phutrach', 'thuchien',
    'giacho', 'nguoilam',
    // English
    'assignee', 'owner', 'pic', 'responsible', 'executor', 'implementer',
    'assigned', 'assignedto',
    // Mixed
    'member', 'thanhvien',
  ],
  task_priority: [
    // Vietnamese
    'douutien', 'mucdouutien', 'capdo', 'cap',
    // English
    'priority', 'prioritylevel', 'urgency', 'important', 'level', 'mucdo',
  ],
  deadline: [
    // Vietnamese
    'hanchot', 'ngayhethan', 'ngayhoan', 'ketthuc', 'hannop', 'hankan',
    'ngayketthuc', 'ngayhoanthanhdukien',
    // English
    'deadline', 'duedate', 'due', 'enddate', 'finishdate', 'completiondate',
    'targetdate',
  ],
  start_date: [
    // Vietnamese
    'ngaybatdau', 'batdau', 'ngaybd', 'ngaykhoidan', 'khoidan',
    'ngaytao', 'ngaykhoitao',
    // English
    'startdate', 'start', 'begindate', 'begin', 'createddate',
  ],
  completion_date: [
    // Vietnamese
    'ngayhoanthanh', 'ngayxong',
    // English
    'completedat', 'completed', 'finishedat', 'doneat', 'donedate',
  ],
  progress_pct: [
    // Vietnamese
    'tiendophancan', 'tiendophan', 'tiendo', 'hoanthanh', 'hoantat',
    'phantram', 'tyle',
    // English
    'progress', 'percent', 'completion', 'complete', 'donepercent',
  ],
  sprint_name: [
    // Vietnamese
    'giaidoan', 'ky', 'dot', 'vonglap',
    // English
    'sprint', 'sprintname', 'iteration', 'phase', 'cycle',
  ],
  milestone_name: [
    // Vietnamese
    'cotmoc', 'moc', 'muctieu', 'moctiendo',
    // English
    'milestone', 'milestonename', 'target', 'deliverable',
  ],
  planned_effort: [
    // Vietnamese
    'uoctinh', 'dukien', 'sogiodukie', 'thoigiandukie',
    // English
    'planned', 'planhours', 'estimatedhours', 'estimate',
  ],
  actual_effort: [
    // Vietnamese
    'thucte', 'sogiothucte', 'thoigianthucte',
    // English
    'actual', 'actualhours', 'realhours', 'timespent', 'loggedhours',
  ],
  member_name: [
    // Vietnamese
    'hovaten', 'hoten', 'thanhvien', 'tenthanvien', 'nguoidung',
    'nhanvien', 'nguoi', 'ten',
    // English
    'fullname', 'membername', 'name',
  ],
  member_role: [
    // Vietnamese
    'vaitro', 'chucvu', 'chucnang', 'vitri', 'phongban',
    // English
    'role', 'position', 'function', 'jobtitle', 'department', 'title',
  ],
  member_email: [
    // Vietnamese
    'diachimail', 'lienhe',
    // English
    'email', 'mail', 'emailaddress', 'contact',
  ],
  notes: [
    // Vietnamese
    'ghichu', 'binhlu', 'nhanxet', 'motathem', 'chitiet', 'mota',
    // English
    'notes', 'note', 'comment', 'remark', 'remarks', 'additional', 'description',
  ],
};

// ═══════════════════════════════════════════════
// SECTION D: Header → Field Matching (layered)
// ═══════════════════════════════════════════════

export interface HeaderMatchResult {
  field: CanonicalFieldName;
  confidence: number;
  method: 'exact' | 'fuzzy_levenshtein' | 'jaro_winkler' | 'token_overlap'
    | 'prefix_suffix' | 'acronym' | 'none';
  reasoning: string;
}

/**
 * Multi-strategy header matching.
 * Tries exact → containment → token overlap → Levenshtein → Jaro-Winkler → acronym.
 * Returns best match with confidence and method.
 */
export function matchHeader(
  rawHeader: string,
  usedFields?: Set<string>
): HeaderMatchResult {
  const nh = normalizeHeader(rawHeader);
  if (!nh) {
    return { field: 'ignore', confidence: 0, method: 'none', reasoning: 'Empty header' };
  }

  let bestField: CanonicalFieldName = 'ignore';
  let bestConfidence = 0;
  let bestMethod: HeaderMatchResult['method'] = 'none';
  let bestReasoning = '';

  for (const [field, synonyms] of Object.entries(UNIFIED_SYNONYMS)) {
    if (usedFields?.has(field)) continue;

    for (const syn of synonyms) {
      // Strategy 1: Exact match (highest confidence)
      if (nh === syn) {
        if (1.0 > bestConfidence) {
          bestField = field as CanonicalFieldName;
          bestConfidence = 1.0;
          bestMethod = 'exact';
          bestReasoning = `"${rawHeader}" exact match → ${field}`;
        }
        break;
      }
    }
    if (bestConfidence >= 1.0) break;

    // Strategy 2: Prefix/suffix containment
    if (bestConfidence < 0.90) {
      for (const syn of synonyms) {
        if (prefixSuffixContainment(nh, syn)) {
          const conf = 0.88;
          if (conf > bestConfidence) {
            bestField = field as CanonicalFieldName;
            bestConfidence = conf;
            bestMethod = 'prefix_suffix';
            bestReasoning = `"${rawHeader}" contains/contained by synonym of ${field}`;
          }
          break;
        }
      }
    }

    // Strategy 3: Levenshtein fuzzy (distance ≤ 2)
    if (bestConfidence < 0.85) {
      for (const syn of synonyms) {
        if (syn.length < 3 || nh.length < 3) continue;
        const dist = levenshtein(nh, syn);
        if (dist <= 2 && dist < (nh.length * 0.4)) {
          const conf = 0.80 - dist * 0.05;
          if (conf > bestConfidence) {
            bestField = field as CanonicalFieldName;
            bestConfidence = conf;
            bestMethod = 'fuzzy_levenshtein';
            bestReasoning = `"${rawHeader}" fuzzy match → ${field} (distance: ${dist})`;
          }
          break;
        }
      }
    }

    // Strategy 4: Jaro-Winkler (threshold ≥ 0.85)
    if (bestConfidence < 0.78) {
      for (const syn of synonyms) {
        if (syn.length < 3 || nh.length < 3) continue;
        const jw = jaroWinkler(nh, syn);
        if (jw >= 0.85) {
          const conf = jw * 0.85;
          if (conf > bestConfidence) {
            bestField = field as CanonicalFieldName;
            bestConfidence = conf;
            bestMethod = 'jaro_winkler';
            bestReasoning = `"${rawHeader}" Jaro-Winkler match → ${field} (${(jw * 100).toFixed(0)}%)`;
          }
          break;
        }
      }
    }

    // Strategy 5: Token overlap (threshold ≥ 0.5)
    if (bestConfidence < 0.70) {
      const headerStr = normalizeString(rawHeader);
      for (const syn of synonyms) {
        if (syn.length < 3) continue;
        // Reconstruct with spaces for token comparison
        const overlap = tokenOverlap(headerStr, syn);
        if (overlap >= 0.5) {
          const conf = overlap * 0.70;
          if (conf > bestConfidence) {
            bestField = field as CanonicalFieldName;
            bestConfidence = conf;
            bestMethod = 'token_overlap';
            bestReasoning = `"${rawHeader}" token overlap → ${field} (${(overlap * 100).toFixed(0)}%)`;
          }
        }
      }
    }

    // Strategy 6: Acronym match
    if (bestConfidence < 0.60) {
      for (const syn of synonyms) {
        if (acronymMatch(rawHeader, syn)) {
          const conf = 0.55;
          if (conf > bestConfidence) {
            bestField = field as CanonicalFieldName;
            bestConfidence = conf;
            bestMethod = 'acronym';
            bestReasoning = `"${rawHeader}" acronym match → ${field}`;
          }
          break;
        }
      }
    }
  }

  return {
    field: bestField,
    confidence: bestConfidence,
    method: bestMethod,
    reasoning: bestReasoning || 'No match found',
  };
}

/**
 * Analyze all headers and produce a linguistic normalization report.
 */
export function analyzeHeaders(headers: string[]): HeaderNormalization[] {
  return headers.map(h => {
    const match = matchHeader(h);
    return {
      original: h,
      normalized: normalizeHeader(h),
      language: detectLanguage(h),
      matched_field: match.field === 'ignore' ? null : match.field,
      match_method: match.method === 'none' ? null : match.method,
      match_confidence: match.confidence,
    };
  });
}

// ═══════════════════════════════════════════════
// SECTION E: Language Detection
// ═══════════════════════════════════════════════

const VIET_DIACRITICS = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
const ASCII_ONLY = /^[a-zA-Z0-9\s\-_./]+$/;

export function detectLanguage(text: string): 'vi' | 'en' | 'mixed' | 'unknown' {
  if (!text || text.trim().length === 0) return 'unknown';
  const hasViet = VIET_DIACRITICS.test(text);
  const isAscii = ASCII_ONLY.test(text);

  if (hasViet && !isAscii) return 'vi';
  if (!hasViet && isAscii) return 'en';
  if (hasViet) return 'mixed';

  // Check unaccented Vietnamese patterns
  const lower = text.toLowerCase();
  const vietWords = ['cong', 'viec', 'trang', 'thai', 'nguoi', 'ngay', 'thanh', 'vien'];
  const hasVietWord = vietWords.some(w => lower.includes(w));
  if (hasVietWord) return 'vi';

  return 'unknown';
}

// ═══════════════════════════════════════════════
// SECTION F: Value Pattern Detection (canonical)
// ═══════════════════════════════════════════════

/** Check if a value looks like a date */
export function isDateLike(val: string): boolean {
  if (!val || val.trim().length < 3) return false;
  const s = val.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return true;
  if (/^\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}$/.test(s)) return true;
  if (/^\d{1,2}[/.\-]\d{1,2}$/.test(s)) return true;
  if (/\d{1,2}\s*tháng\s*\d{1,2}/i.test(s)) return true;
  if (/tháng\s*\d{1,2}\s*năm\s*\d{4}/i.test(s)) return true;
  if (/^T\d{1,2}\/\d{4}$/i.test(s)) return true;
  if (/^Q[1-4]\s*\/?\s*\d{4}$/i.test(s)) return true;
  if (/^[A-Za-z]{3}\s+\d{1,2}$/i.test(s) || /^\d{1,2}\s+[A-Za-z]{3}$/i.test(s)) return true;
  return false;
}

/** Check if a value looks like an email */
export function isEmailLike(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/** Check if a value looks like a percentage (0–100) */
export function isPercentLike(val: string): boolean {
  const s = val.trim();
  if (s.endsWith('%')) return true;
  const n = parseFloat(s);
  return !isNaN(n) && n >= 0 && n <= 100 && s.length <= 6 && /^\d/.test(s);
}

/** Status keywords — Vietnamese + English */
const STATUS_KEYWORDS = new Set([
  'todo', 'done', 'doing', 'in progress', 'hoàn thành', 'xong',
  'đang làm', 'chưa bắt đầu', 'blocked', 'cancelled', 'đã hủy',
  'pending', 'open', 'closed', 'active', 'wip', 'review', 'chờ duyệt',
  'tạm dừng', 'not started', 'completed', 'in review', 'đang xử lý',
  'chờ phản hồi', 'đã xong', 'hoàn tất', 'đang tiến hành', 'mới',
  'on hold', 'paused', 'stuck', 'chốt', 'đang chờ',
]);

export function isStatusLike(val: string): boolean {
  const lower = val.trim().toLowerCase();
  if (STATUS_KEYWORDS.has(lower)) return true;
  const unaccented = normalizeString(val);
  for (const kw of STATUS_KEYWORDS) {
    if (normalizeString(kw) === unaccented) return true;
  }
  return false;
}

/** Priority keywords */
const PRIORITY_KEYWORDS = new Set([
  'urgent', 'critical', 'high', 'medium', 'low', 'normal', 'minor',
  'khẩn cấp', 'cao', 'trung bình', 'thấp', 'bình thường',
  'rất cao', 'p0', 'p1', 'p2', 'p3', 'p4',
]);

export function isPriorityLike(val: string): boolean {
  const lower = val.trim().toLowerCase();
  if (PRIORITY_KEYWORDS.has(lower)) return true;
  const unaccented = normalizeString(val);
  for (const kw of PRIORITY_KEYWORDS) {
    if (normalizeString(kw) === unaccented) return true;
  }
  return false;
}

/** Check if a value looks like a person's name */
export function isNameLike(val: string): boolean {
  const s = val.trim();
  if (s.length < 2 || s.length > 60) return false;
  const words = s.split(/\s+/);
  if (words.length < 2) return false;
  return words.every(w => /^[a-zA-ZÀ-ỿ]+$/.test(w));
}

// ═══════════════════════════════════════════════
// SECTION G: Flexible Date Parser
// ═══════════════════════════════════════════════

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseFlexibleDate(value: string): string | null {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  // DD/MM/YYYY or D/M/YYYY
  const slashDMY = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (slashDMY) {
    const day = parseInt(slashDMY[1]);
    const month = parseInt(slashDMY[2]);
    let year = parseInt(slashDMY[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }

  // DD/MM (assume current year)
  const shortDM = s.match(/^(\d{1,2})[/.\-](\d{1,2})$/);
  if (shortDM) {
    const day = parseInt(shortDM[1]);
    const month = parseInt(shortDM[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = new Date().getFullYear();
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }

  // "15 tháng 3" or "tháng 3 năm 2025"
  const thangMatch = s.match(/(\d{1,2})\s*tháng\s*(\d{1,2})/i);
  if (thangMatch) {
    const day = parseInt(thangMatch[1]);
    const month = parseInt(thangMatch[2]);
    const yearMatch = s.match(/năm\s*(\d{4})/i);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  // "Mar 15" or "15 Mar"
  const engMatch = s.match(/^(\w{3})\s+(\d{1,2})$/i) || s.match(/^(\d{1,2})\s+(\w{3})$/i);
  if (engMatch) {
    const [, a, b] = engMatch;
    const monthStr = isNaN(Number(a)) ? a : b;
    const dayStr = isNaN(Number(a)) ? b : a;
    const monthIdx = MONTH_NAMES[monthStr.toLowerCase().slice(0, 3)];
    if (monthIdx !== undefined) {
      const year = new Date().getFullYear();
      const d = new Date(year, monthIdx, parseInt(dayStr));
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }

  // Last resort
  const fallback = new Date(s);
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 1990) {
    return fallback.toISOString().slice(0, 10);
  }

  return null;
}

// ═══════════════════════════════════════════════
// SECTION H: Status & Priority Normalization
// ═══════════════════════════════════════════════

import type { CanonicalStatus, CanonicalPriority } from '../canonicalTypes';

const STATUS_MAP: Record<string, CanonicalStatus> = {
  // Vietnamese
  'chua bat dau': 'todo', 'cho': 'todo', 'moi': 'todo',
  'cho duyet': 'in_review', 'cho phan hoi': 'in_review',
  'dang xu ly': 'in_progress', 'dang lam': 'in_progress',
  'dang thuc hien': 'in_progress', 'dang tien hanh': 'in_progress',
  'dang cho': 'in_review',
  'hoan thanh': 'done', 'xong': 'done', 'da xong': 'done',
  'da hoan thanh': 'done', 'hoan tat': 'done', 'chot': 'done',
  'bi chan': 'blocked', 'dang chan': 'blocked', 'tam dung': 'blocked',
  'huy': 'cancelled', 'da huy': 'cancelled',
  // English
  'todo': 'todo', 'to do': 'todo', 'to-do': 'todo',
  'not started': 'todo', 'new': 'todo', 'open': 'todo',
  'backlog': 'todo', 'pending': 'todo',
  'in progress': 'in_progress', 'in-progress': 'in_progress',
  'doing': 'in_progress', 'active': 'in_progress',
  'wip': 'in_progress', 'working': 'in_progress',
  'in review': 'in_review', 'in-review': 'in_review',
  'review': 'in_review', 'waiting': 'in_review',
  'testing': 'in_review', 'qa': 'in_review',
  'done': 'done', 'complete': 'done', 'completed': 'done',
  'finished': 'done', 'closed': 'done', 'resolved': 'done',
  'blocked': 'blocked', 'stuck': 'blocked', 'on hold': 'blocked',
  'on-hold': 'blocked', 'paused': 'blocked',
  'cancelled': 'cancelled', 'canceled': 'cancelled',
  'removed': 'cancelled', 'dropped': 'cancelled',
};

export function normalizeStatus(raw: string): CanonicalStatus {
  const s = normalizeString(String(raw));
  return STATUS_MAP[s] ?? 'unknown';
}

const PRIORITY_MAP: Record<string, CanonicalPriority> = {
  // Vietnamese
  'khan cap': 'urgent', 'rat cao': 'urgent',
  'cao': 'high',
  'trung binh': 'medium', 'binh thuong': 'medium',
  'thap': 'low',
  // English
  'urgent': 'urgent', 'critical': 'urgent', 'p0': 'urgent',
  'high': 'high', 'important': 'high', 'p1': 'high',
  'medium': 'medium', 'normal': 'medium', 'moderate': 'medium', 'p2': 'medium',
  'low': 'low', 'minor': 'low', 'p3': 'low', 'p4': 'low',
};

export function normalizePriority(raw: string): CanonicalPriority {
  const s = normalizeString(String(raw));
  return PRIORITY_MAP[s] ?? null;
}

export function normalizePercentage(raw: string | number): number | null {
  const s = String(raw).trim().replace('%', '');
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

// ═══════════════════════════════════════════════
// SECTION I: Name Fingerprinting
// ═══════════════════════════════════════════════

/** Fingerprint for deduplication: sorted normalized tokens */
export function nameFingerprint(name: string): string {
  return normalizeString(name).split(' ').filter(Boolean).sort().join(' ');
}

/** Extract initials from a name */
export function nameInitials(name: string): string {
  return normalizeString(name)
    .split(' ')
    .filter(Boolean)
    .map(t => t[0])
    .join('');
}
