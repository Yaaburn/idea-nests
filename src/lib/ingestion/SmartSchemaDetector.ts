// ═══════════════════════════════════════════════
// Smart Schema Detector v2.5
// Multi-pass detection: Profile → Score → Hypothesize → Contradict → Select
// 4-strategy column mapping with action tiers.
// ═══════════════════════════════════════════════

import type { RawTab, TabProfile, MappingActionTier } from './types';
import type { CanonicalFieldName, ColumnMapping, DetectionMethod, SheetTabType } from '../canonicalTypes';
import {
  profileTab,
  isDateLike,
  isEmailLike,
  isPercentLike,
  isStatusLike,
  isNameLike,
} from './TabProfiler';

// ═══════════════════════════════════════════════
// SECTION A: Vietnamese Unaccent (inline, no library)
// ═══════════════════════════════════════════════

const CHAR_MAP: Record<string, string> = {};

function addChars(chars: string, target: string) {
  for (const c of chars) {
    CHAR_MAP[c] = target;
    CHAR_MAP[c.toUpperCase()] = target;
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

export function unaccent(s: string): string {
  let result = '';
  for (const c of s) {
    result += CHAR_MAP[c] ?? c;
  }
  return result;
}

export function normalizeHeader(h: string): string {
  return unaccent(h.toLowerCase())
    .replace(/[%#@$&*!?]/g, '')
    .replace(/[\s\-_./]+/g, '')
    .trim();
}

export function normalizeString(s: string): string {
  return unaccent(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ═══════════════════════════════════════════════
// SECTION B: Synonym Dictionary
// ═══════════════════════════════════════════════

export const SYNONYM_MAP: Record<string, string[]> = {
  task_name: [
    'tencongviec','tencv','nhiemvu','ten','task','congviec',
    'title','name','mota','description','tennhiemvu','congviec','jobs',
    'tencongtac','congtac','hangmuc','dauviec','item','taskname',
    'vieccanlam','tieude','noidung','workitem','userstory','story',
  ],
  task_status: [
    'trangthai','status','state','tinhtrang','trangthainv',
    'trangthaicongtac','ketqua','result','outcome',
    'progressstatus','tiendophan',
  ],
  task_assignee: [
    'nguoiphutrach','assignee','nguoithuchien','member','thanhvien',
    'owner','pic','responsible','nguoilam','executor','implementer',
    'phutrach','thuchien','giacho','assigned','assignedto',
  ],
  deadline: [
    'hanchot','deadline','duedate','due','ngayhethan',
    'ngayhoan','enddate','ketthuc','hannop','hankan',
    'ngayketthuc','finishdate','completiondate','ngayhoanthanhdukien',
  ],
  start_date: [
    'ngaybatdau','startdate','start','batdau',
    'begindate','begin','ngaybd','ngaykhoidan','khoidan',
    'createddate','ngaytao','ngaykhoitao',
  ],
  completion_date: [
    'ngayhoanthanh','completedat','completed','finishedat',
    'doneat','ngayxong',
  ],
  member_name: [
    'hovaten','hoten','fullname','thanhvien','tenthanvien',
    'membername','nguoidung','name','ten','nhanvien','nguoi',
  ],
  member_role: [
    'vaitro','role','chucvu','chucnang','position',
    'nhiemvu','function','jobtitle','vitri','phongban','department',
  ],
  member_email: [
    'email','mail','emailaddress','diachimail','contact','lienhe',
  ],
  progress_pct: [
    'tiendophancan','progress','tiendophan','percent','hoantat',
    'complete','tyle','phantram','tiendo','hoanthanh','donepercent',
    'completion',
  ],
  task_priority: [
    'douutien','priority','mucdo','urgent','important',
    'mucdouutien','capdo','cap','level','prioritylevel','urgency',
  ],
  sprint_name: [
    'sprint','sprintname','iteration','phase','giaidoan',
    'ky','cycle','dot','vonglap',
  ],
  milestone_name: [
    'milestone','cotmoc','moc','muctieu','target',
    'deliverable','moctiendo','milestonename',
  ],
  planned_effort: [
    'uoctinh','planned','dukien','estimate','planhours',
    'estimatedhours','sogiodukie','thoigiandukie',
  ],
  actual_effort: [
    'thuchien','actual','thucte','realhours','actualhours',
    'sogiothucte','thoigianthucte',
  ],
  notes: [
    'ghichu','notes','note','comment','binhlu','nhanxet',
    'motathem','additional','remark','remarks','chitiet',
  ],
};

// ═══════════════════════════════════════════════
// SECTION C: Levenshtein Distance (inline, pure)
// ═══════════════════════════════════════════════

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

// ═══════════════════════════════════════════════
// SECTION D: Tab Scoring
// ═══════════════════════════════════════════════

export interface TabScore {
  tab_name: string;
  task_score: number;
  member_score: number;
  tab_type: SheetTabType;
  final_score: number;
  reasons: string[];
  profile: TabProfile;
}

export function scoreTab(tab: RawTab, profile: TabProfile): TabScore {
  const reasons: string[] = [];
  let taskScore = 0;
  let memberScore = 0;

  const normalizedHeaders = tab.headers.map(normalizeHeader);

  // Header matching score
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const nh = normalizedHeaders[i];
    if (!nh) continue;

    const field = matchHeaderSynonym(nh);
    if (!field) continue;

    if (['task_name', 'taskname'].some((k) => field === 'task_name')) {
      taskScore += 30;
      reasons.push(`Header "${tab.headers[i]}" → task_name`);
    } else if (field === 'task_status') {
      taskScore += 25;
      // Bonus if column has low cardinality (real status column)
      if (profile.low_cardinality_columns.includes(i)) {
        taskScore += 5;
        reasons.push(`Header "${tab.headers[i]}" → task_status (xác nhận bằng cardinality thấp)`);
      } else {
        reasons.push(`Header "${tab.headers[i]}" → task_status`);
      }
    } else if (field === 'task_assignee') {
      taskScore += 20;
      reasons.push(`Header "${tab.headers[i]}" → task_assignee`);
    } else if (field === 'deadline' || field === 'start_date') {
      taskScore += 15;
      reasons.push(`Header "${tab.headers[i]}" → ${field}`);
    } else if (field === 'member_name') {
      memberScore += 30;
      reasons.push(`Header "${tab.headers[i]}" → member_name`);
    } else if (field === 'member_email') {
      memberScore += 25;
      reasons.push(`Header "${tab.headers[i]}" → member_email`);
    } else if (field === 'member_role') {
      memberScore += 20;
      reasons.push(`Header "${tab.headers[i]}" → member_role`);
    }
  }

  // Value pattern bonuses (from profiler output)
  if (profile.date_like_columns.length > 0) {
    taskScore += 10;
    reasons.push(`Có ${profile.date_like_columns.length} cột ngày tháng`);
  }
  if (profile.status_like_columns.length > 0) {
    taskScore += 15;
    reasons.push(`Có ${profile.status_like_columns.length} cột trạng thái (xác nhận bằng giá trị)`);
  }
  if (profile.email_like_columns.length > 0) {
    memberScore += 15;
    reasons.push(`Có ${profile.email_like_columns.length} cột email`);
  }

  // Row count bonus
  if (tab.row_count >= 5) {
    taskScore += 10;
  }
  if (tab.row_count < 50) {
    memberScore += 10; // member lists are typically short
  }

  // Noise penalty
  taskScore -= profile.noise_penalty * 20;
  memberScore -= profile.noise_penalty * 20;

  // Row-level bonus: prefer row-level over summary
  if (profile.likely_shape === 'row_level') {
    taskScore += 10;
    reasons.push('Dữ liệu theo hàng — phù hợp cho danh sách công việc');
  } else if (profile.likely_shape === 'summary') {
    taskScore -= 15;
    reasons.push('Tab này có vẻ là bảng tổng hợp, không phải danh sách chi tiết');
  }

  // Determine type
  let tabType: SheetTabType = 'unknown';
  const finalScore = Math.max(taskScore, memberScore);

  if (taskScore > memberScore && taskScore >= 30) {
    tabType = profile.status_like_columns.length > 0 ? 'task_list' : 'mixed_tracker';
  } else if (memberScore > taskScore && memberScore >= 30) {
    tabType = 'member_list';
  } else if (profile.date_like_columns.length >= 2) {
    tabType = 'timeline';
  } else if (profile.likely_shape === 'summary') {
    tabType = 'summary_dashboard';
  } else if (profile.likely_shape === 'notes') {
    tabType = 'notes_log';
  }

  return {
    tab_name: tab.tab_name,
    task_score: taskScore,
    member_score: memberScore,
    tab_type: tabType,
    final_score: Math.max(0, finalScore),
    reasons,
    profile,
  };
}

function matchHeaderSynonym(normalizedHeader: string): CanonicalFieldName | null {
  for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const syn of synonyms) {
      if (normalizedHeader === syn) return field as CanonicalFieldName;
    }
    // Fuzzy
    for (const syn of synonyms) {
      if (syn.length >= 4 && normalizedHeader.length >= 4) {
        if (levenshtein(normalizedHeader, syn) <= 2) {
          return field as CanonicalFieldName;
        }
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════
// SECTION E: Column Mapping (4 strategies)
// ═══════════════════════════════════════════════

export interface EnhancedColumnMapping extends ColumnMapping {
  action_tier: MappingActionTier;
  evidence_source: 'header' | 'value' | 'both' | 'heuristic';
}

export function detectMappings(
  tab: RawTab,
  profile: TabProfile
): EnhancedColumnMapping[] {
  const mappings: EnhancedColumnMapping[] = [];
  const usedFields = new Set<string>();
  const sampleRows = tab.rows.slice(0, 15);

  for (let colIdx = 0; colIdx < tab.headers.length; colIdx++) {
    const header = tab.headers[colIdx];
    const nh = normalizeHeader(header);
    if (!nh && !header.trim()) {
      mappings.push(makeMapping(header, 'ignore', 0, 'exact_match', 'Cột trống', 'leave_unmapped', 'heuristic'));
      continue;
    }

    let bestField: CanonicalFieldName = 'ignore';
    let bestConfidence = 0;
    let bestMethod: DetectionMethod = 'exact_match';
    let bestReasoning = '';
    let evidenceSource: 'header' | 'value' | 'both' | 'heuristic' = 'heuristic';

    // Strategy 1: Exact match
    for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (usedFields.has(field)) continue;
      if (synonyms.includes(nh)) {
        bestField = field as CanonicalFieldName;
        bestConfidence = 1.0;
        bestMethod = 'exact_match';
        bestReasoning = `Header "${header}" khớp chính xác với "${field}"`;
        evidenceSource = 'header';
        break;
      }
    }

    // Strategy 2: Fuzzy match
    if (bestConfidence < 0.9) {
      let minDist = 999;
      let minField: CanonicalFieldName | null = null;

      for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
        if (usedFields.has(field)) continue;
        for (const syn of synonyms) {
          if (syn.length < 3 || nh.length < 3) continue;
          const d = levenshtein(nh, syn);
          if (d <= 2 && d < minDist) {
            minDist = d;
            minField = field as CanonicalFieldName;
          }
        }
      }

      if (minField && minDist <= 2 && (bestConfidence < 0.8 || minDist === 0)) {
        bestField = minField;
        bestConfidence = 0.8;
        bestMethod = 'fuzzy_match';
        bestReasoning = `Header "${header}" gần giống với "${minField}" (khoảng cách: ${minDist})`;
        evidenceSource = 'header';
      }
    }

    // Strategy 3: Value pattern detection
    if (bestConfidence < 0.7) {
      const values = sampleRows.map((r) => r[colIdx] ?? '').filter((v) => v.trim() !== '');
      if (values.length > 0) {
        const valueResult = detectByValuePattern(values, colIdx, usedFields, profile);
        if (valueResult && valueResult.confidence > bestConfidence) {
          bestField = valueResult.field;
          bestConfidence = valueResult.confidence;
          bestMethod = 'value_pattern';
          bestReasoning = valueResult.reasoning;
          evidenceSource = bestConfidence > 0 && bestField !== 'ignore' ? 'both' : 'value';
        }
      }
    }

    // Strategy 4: Positional heuristic
    if (bestConfidence < 0.4) {
      if (colIdx === 0 && !usedFields.has('task_name')) {
        bestField = 'task_name';
        bestConfidence = 0.5;
        bestMethod = 'positional';
        bestReasoning = 'Cột đầu tiên thường là tên công việc';
        evidenceSource = 'heuristic';
      } else if (colIdx === tab.headers.length - 1 && !usedFields.has('notes')) {
        bestField = 'notes';
        bestConfidence = 0.25;
        bestMethod = 'positional';
        bestReasoning = 'Cột cuối thường là ghi chú';
        evidenceSource = 'heuristic';
      }
    }

    // Cross-validate: header says one thing, values say another?
    if (bestConfidence >= 0.8 && evidenceSource === 'header') {
      const crossCheck = crossValidateMapping(bestField, tab.rows.slice(0, 15), colIdx);
      if (!crossCheck.valid) {
        bestConfidence *= 0.7; // Downgrade
        bestReasoning += ` ⚠ ${crossCheck.reason}`;
        evidenceSource = 'header'; // Values didn't confirm
      } else {
        evidenceSource = 'both';
      }
    }

    if (bestField !== 'ignore') {
      usedFields.add(bestField);
    }

    // Determine action tier
    let actionTier: MappingActionTier = 'leave_unmapped';
    if (bestField !== 'ignore') {
      if (bestConfidence >= 0.90) actionTier = 'auto_apply';
      else if (bestConfidence >= 0.65) actionTier = 'suggest_review';
      else actionTier = 'leave_unmapped';
    }

    mappings.push(makeMapping(
      header, bestField, bestConfidence, bestMethod,
      bestReasoning || 'Không tìm thấy ánh xạ phù hợp',
      actionTier, evidenceSource
    ));
  }

  return mappings;
}

function detectByValuePattern(
  values: string[],
  colIdx: number,
  usedFields: Set<string>,
  _profile: TabProfile
): { field: CanonicalFieldName; confidence: number; reasoning: string } | null {
  const dateR = values.filter(isDateLike).length / values.length;
  const emailR = values.filter(isEmailLike).length / values.length;
  const pctR = values.filter(isPercentLike).length / values.length;
  const statusR = values.filter(isStatusLike).length / values.length;
  const nameR = values.filter(isNameLike).length / values.length;

  if (emailR > 0.5 && !usedFields.has('member_email')) {
    return { field: 'member_email', confidence: 0.85, reasoning: `${pct(emailR)} giá trị là email` };
  }
  if (statusR > 0.5 && !usedFields.has('task_status')) {
    return { field: 'task_status', confidence: 0.8, reasoning: `${pct(statusR)} giá trị khớp trạng thái` };
  }
  if (pctR > 0.6 && !usedFields.has('progress_pct')) {
    return { field: 'progress_pct', confidence: 0.75, reasoning: `${pct(pctR)} giá trị là phần trăm` };
  }
  if (dateR > 0.5) {
    const field = !usedFields.has('deadline') ? 'deadline' : !usedFields.has('start_date') ? 'start_date' : null;
    if (field) {
      return { field, confidence: 0.7, reasoning: `${pct(dateR)} giá trị là ngày tháng` };
    }
  }
  if (nameR > 0.5 && !usedFields.has('task_assignee')) {
    return { field: 'task_assignee', confidence: 0.6, reasoning: `${pct(nameR)} giá trị giống tên người` };
  }

  return null;
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function crossValidateMapping(
  field: CanonicalFieldName,
  sampleRows: string[][],
  colIdx: number
): { valid: boolean; reason: string } {
  const values = sampleRows.map((r) => r[colIdx] ?? '').filter((v) => v.trim() !== '');
  if (values.length < 3) return { valid: true, reason: '' }; // Not enough data to contradict

  switch (field) {
    case 'task_status': {
      const r = values.filter(isStatusLike).length / values.length;
      if (r < 0.3) return { valid: false, reason: 'Giá trị không khớp kiểu trạng thái' };
      break;
    }
    case 'member_email': {
      const r = values.filter(isEmailLike).length / values.length;
      if (r < 0.3) return { valid: false, reason: 'Ít giá trị là email (<30%)' };
      break;
    }
    case 'deadline':
    case 'start_date':
    case 'completion_date': {
      const r = values.filter(isDateLike).length / values.length;
      if (r < 0.3) return { valid: false, reason: 'Giá trị không phải ngày tháng' };
      break;
    }
    case 'progress_pct': {
      const r = values.filter(isPercentLike).length / values.length;
      if (r < 0.3) return { valid: false, reason: 'Giá trị không phải phần trăm' };
      break;
    }
    case 'task_assignee':
    case 'member_name': {
      const r = values.filter(isNameLike).length / values.length;
      // Name-like check is less reliable, be lenient
      if (r < 0.15) return { valid: false, reason: 'Giá trị không giống tên người' };
      break;
    }
  }

  return { valid: true, reason: '' };
}

function makeMapping(
  header: string,
  field: CanonicalFieldName,
  confidence: number,
  method: DetectionMethod,
  reasoning: string,
  actionTier: MappingActionTier,
  evidenceSource: 'header' | 'value' | 'both' | 'heuristic'
): EnhancedColumnMapping {
  return {
    source_header: header,
    canonical_field: field,
    confidence,
    detection_method: method,
    reasoning,
    action_tier: actionTier,
    evidence_source: evidenceSource,
  };
}

// ═══════════════════════════════════════════════
// SECTION F: Main analyze() + selectBestTab()
// ═══════════════════════════════════════════════

export interface TabAnalysis {
  tab: RawTab;
  profile: TabProfile;
  score: TabScore;
  mappings: EnhancedColumnMapping[];
}

export function analyze(tabs: RawTab[]): TabAnalysis[] {
  // Pass 0: Profile all tabs
  const results: TabAnalysis[] = [];

  for (const tab of tabs) {
    // Skip obviously empty tabs
    if (tab.row_count < 2 || tab.col_count < 2) continue;

    const profile = profileTab(tab);
    const score = scoreTab(tab, profile);
    const mappings = detectMappings(tab, profile);

    results.push({ tab, profile, score, mappings });
  }

  // Sort by score descending
  results.sort((a, b) => b.score.final_score - a.score.final_score);

  return results;
}

export interface BestTabSelection {
  best: TabAnalysis;
  isAmbiguous: boolean;
  ambiguity_score: number;
  runner_up: TabAnalysis | null;
  explanation_vi: string;
}

export function selectBestTab(analyses: TabAnalysis[]): BestTabSelection | null {
  if (analyses.length === 0) return null;

  const best = analyses[0];
  const runnerUp = analyses.length > 1 ? analyses[1] : null;

  const scoreDiff = runnerUp ? best.score.final_score - runnerUp.score.final_score : 999;
  const isAmbiguous = runnerUp !== null && scoreDiff < 15;
  const ambiguityScore = runnerUp ? Math.max(0, 1 - scoreDiff / 30) : 0;

  let explanation = `Chọn tab "${best.tab.tab_name}" vì `;
  if (best.score.tab_type === 'task_list') {
    explanation += 'có cấu trúc danh sách công việc rõ ràng';
  } else if (best.score.tab_type === 'mixed_tracker') {
    explanation += 'có cấu trúc theo dõi dự án';
  } else if (best.score.tab_type === 'member_list') {
    explanation += 'có danh sách thành viên';
  } else {
    explanation += 'điểm cao nhất trong các tab';
  }

  if (best.score.reasons.length > 0) {
    explanation += ': ' + best.score.reasons.slice(0, 3).join(', ');
  }

  if (isAmbiguous && runnerUp) {
    explanation += `. ⚠ Tab "${runnerUp.tab.tab_name}" cũng có điểm gần (${scoreDiff} điểm chênh lệch). Bạn nên xác nhận lại.`;
  }

  return {
    best,
    isAmbiguous,
    ambiguity_score: ambiguityScore,
    runner_up: runnerUp,
    explanation_vi: explanation,
  };
}
