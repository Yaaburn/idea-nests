// ═══════════════════════════════════════════════
// Ingestion Pipeline — Evidence-Grade Data Processing
// Transforms raw data → Canonical Project Data
// Phase 4: Backend-centric, connector-agnostic.
// ═══════════════════════════════════════════════

import type {
  CanonicalProjectData,
  CanonicalTask,
  CanonicalMember,
  CanonicalMilestone,
  CanonicalStatus,
  CanonicalPriority,
  CanonicalFieldName,
  ColumnMapping,
  DetectionMethod,
  SheetTabEvaluation,
  SheetTabType,
  TabDecision,
  TabScoreComponents,
  IngestionWarning,
  DerivedInsights,
  SourceProvenance,
  IngestionMetadata,
  SourceTrustLevel,
} from "./canonicalTypes";
import { getIntegrationConfig } from "./integrationConfigStore";

import type { RawSheetData, RawTab } from "./ingestion/types";

// Evidence-grade ingestion modules
import { analyze, selectBestTab } from "./ingestion/SmartSchemaDetector";
import { generateHypotheses } from "./ingestion/HypothesisEngine";
import { checkContradictions } from "./ingestion/ContradictionChecker";
import { computeFingerprint } from "./ingestion/SourceFingerprint";
import { createDecisionLog, addStep } from "./ingestion/IngestionDecisionLog";
import { buildTabRejectionReason } from "./ingestion/ReasoningTextBuilder";

// Mock fallback (self-contained, no external dependencies)
import { generateMockSheetData } from "./ingestion/mockDataGenerator";

// ─── Pipeline Options ───

export interface PipelineOptions {
  /** Pre-fetched raw data from backend connector or CSV parser */
  rawData?: RawSheetData;
  /** Force mock mode (demo only) */
  mock?: boolean;
  debug?: boolean;
  strict?: boolean;
}

// ═══════════════════════════════════════════════
// SYNONYM DICTIONARIES (Vietnamese + English)
// ═══════════════════════════════════════════════

const FIELD_SYNONYMS: Record<CanonicalFieldName, string[]> = {
  task_name: [
    "tên công việc", "ten cong viec", "công việc", "cong viec",
    "nhiệm vụ", "nhiem vu", "task", "task name", "title", "tên",
    "ten", "nội dung", "noi dung", "mô tả", "mo ta", "description",
    "hạng mục", "hang muc", "item", "work item", "user story", "story",
    "tiêu đề", "tieu de", "việc cần làm", "viec can lam",
  ],
  task_status: [
    "trạng thái", "trang thai", "status", "state", "tình trạng",
    "tinh trang", "tiến độ", "tien do", "progress status",
  ],
  task_assignee: [
    "người phụ trách", "nguoi phu trach", "assignee", "owner",
    "người thực hiện", "nguoi thuc hien", "phụ trách", "phu trach",
    "assigned to", "responsible", "người làm", "nguoi lam",
    "thực hiện bởi", "thuc hien boi", "giao cho", "assigned",
  ],
  task_priority: [
    "ưu tiên", "uu tien", "priority", "mức độ ưu tiên",
    "muc do uu tien", "level", "urgency", "độ quan trọng",
    "do quan trong", "importance",
  ],
  deadline: [
    "hạn chót", "han chot", "deadline", "due date", "due",
    "ngày hết hạn", "ngay het han", "ngày hoàn thành dự kiến",
    "ngay hoan thanh du kien", "target date", "end date",
    "ngày kết thúc", "ngay ket thuc",
  ],
  start_date: [
    "ngày bắt đầu", "ngay bat dau", "start date", "start",
    "bắt đầu", "bat dau", "begin date", "ngày khởi tạo",
    "ngay khoi tao", "created date", "ngày tạo", "ngay tao",
  ],
  completion_date: [
    "ngày hoàn thành", "ngay hoan thanh", "completed date",
    "completion date", "done date", "finished date",
    "ngày xong", "ngay xong",
  ],
  progress_pct: [
    "% hoàn thành", "% hoan thanh", "progress", "tiến độ",
    "tien do", "phần trăm", "phan tram", "completion %",
    "hoàn thành", "hoan thanh", "% done", "percent",
  ],
  sprint_name: [
    "sprint", "iteration", "sprint name", "giai đoạn",
    "giai doan", "phase", "đợt", "dot", "vòng lặp", "vong lap",
  ],
  milestone_name: [
    "milestone", "cột mốc", "cot moc", "mốc", "moc",
    "mục tiêu", "muc tieu", "target", "milestone name",
  ],
  notes: [
    "ghi chú", "ghi chu", "notes", "note", "comment",
    "bình luận", "binh luan", "nhận xét", "nhan xet",
    "mô tả thêm", "mo ta them", "remarks", "chi tiết", "chi tiet",
  ],
  member_name: [
    "tên thành viên", "ten thanh vien", "thành viên", "thanh vien",
    "member", "member name", "họ tên", "ho ten", "fullname",
    "full name", "name", "tên", "ten", "nhân viên", "nhan vien",
    "người", "nguoi",
  ],
  member_role: [
    "vai trò", "vai tro", "role", "position", "chức vụ",
    "chuc vu", "vị trí", "vi tri", "title", "job title",
    "phòng ban", "phong ban", "department",
  ],
  member_email: [
    "email", "e-mail", "mail", "địa chỉ email", "dia chi email",
    "contact", "liên hệ", "lien he",
  ],
  planned_effort: [
    "số giờ dự kiến", "so gio du kien", "planned hours",
    "giờ dự kiến", "gio du kien", "estimated hours",
    "estimate", "ước tính", "uoc tinh", "planned effort",
  ],
  actual_effort: [
    "số giờ thực tế", "so gio thuc te", "actual hours",
    "giờ thực tế", "gio thuc te", "actual effort",
    "logged hours", "time spent", "thời gian thực",
    "thoi gian thuc",
  ],
  ignore: [],
};

// ─── Status Normalization Map ───

const STATUS_MAP: Record<string, CanonicalStatus> = {
  // Vietnamese
  "chưa bắt đầu": "todo", "chua bat dau": "todo",
  "chờ": "todo", "cho": "todo",
  "chờ duyệt": "in_review", "cho duyet": "in_review",
  "mới": "todo", "moi": "todo",
  "đang xử lý": "in_progress", "dang xu ly": "in_progress",
  "đang làm": "in_progress", "dang lam": "in_progress",
  "đang thực hiện": "in_progress", "dang thuc hien": "in_progress",
  "đang tiến hành": "in_progress", "dang tien hanh": "in_progress",
  "đang chờ": "in_review", "dang cho": "in_review",
  "hoàn thành": "done", "hoan thanh": "done",
  "xong": "done",
  "đã xong": "done", "da xong": "done",
  "đã hoàn thành": "done", "da hoan thanh": "done",
  "hoàn tất": "done", "hoan tat": "done",
  "bị chặn": "blocked", "bi chan": "blocked",
  "đang chặn": "blocked", "dang chan": "blocked",
  "hủy": "cancelled", "huy": "cancelled",
  "đã hủy": "cancelled", "da huy": "cancelled",
  "tạm dừng": "blocked", "tam dung": "blocked",
  // English
  "todo": "todo", "to do": "todo", "to-do": "todo",
  "not started": "todo", "new": "todo", "open": "todo",
  "backlog": "todo", "pending": "todo",
  "in progress": "in_progress", "in-progress": "in_progress",
  "doing": "in_progress", "active": "in_progress",
  "wip": "in_progress", "working": "in_progress",
  "in review": "in_review", "in-review": "in_review",
  "review": "in_review", "waiting": "in_review",
  "testing": "in_review", "qa": "in_review",
  "done": "done", "complete": "done", "completed": "done",
  "finished": "done", "closed": "done", "resolved": "done",
  "blocked": "blocked", "stuck": "blocked", "on hold": "blocked",
  "on-hold": "blocked", "paused": "blocked",
  "cancelled": "cancelled", "canceled": "cancelled",
  "removed": "cancelled", "dropped": "cancelled",
};

// ─── Priority Map ───

const PRIORITY_MAP: Record<string, CanonicalPriority> = {
  // Vietnamese
  "khẩn cấp": "urgent", "khan cap": "urgent",
  "rất cao": "urgent", "rat cao": "urgent",
  "cao": "high",
  "trung bình": "medium", "trung binh": "medium",
  "bình thường": "medium", "binh thuong": "medium",
  "thấp": "low", "thap": "low",
  // English
  "urgent": "urgent", "critical": "urgent", "p0": "urgent",
  "high": "high", "important": "high", "p1": "high",
  "medium": "medium", "normal": "medium", "moderate": "medium", "p2": "medium",
  "low": "low", "minor": "low", "p3": "low", "p4": "low",
};

// ═══════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════

// ─── Vietnamese Unaccent ───

function unaccent(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeString(str: string): string {
  return unaccent(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Inline Levenshtein (no external packages) ───

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(source: string, target: string, maxDist: number = 2): boolean {
  const s = normalizeString(source);
  const t = normalizeString(target);
  if (s === t) return true;
  if (Math.abs(s.length - t.length) > maxDist) return false;
  return levenshtein(s, t) <= maxDist;
}

// ─── Name Fingerprint (for member dedup) ───

function nameFingerprint(name: string): string {
  const tokens = normalizeString(name).split(" ").filter(Boolean);
  return tokens.sort().join(" ");
}

function nameInitials(name: string): string {
  return normalizeString(name)
    .split(" ")
    .filter(Boolean)
    .map((t) => t[0])
    .join("");
}

// ─── Flexible Date Parser ───

function parseFlexibleDate(value: string): string | null {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  // DD/MM/YYYY or D/M/YYYY
  const slashDMY = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
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

  // DD/MM (short, assume current year)
  const shortDM = s.match(/^(\d{1,2})[/.-](\d{1,2})$/);
  if (shortDM) {
    const day = parseInt(shortDM[1]);
    const month = parseInt(shortDM[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = new Date().getFullYear();
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }

  // "15 tháng 3" pattern
  const thangMatch = s.match(/(\d{1,2})\s*tháng\s*(\d{1,2})/i);
  if (thangMatch) {
    const day = parseInt(thangMatch[1]);
    const month = parseInt(thangMatch[2]);
    const year = new Date().getFullYear();
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  // "Mar 15" or "15 Mar" English month
  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const engMatch = s.match(/^(\w{3})\s+(\d{1,2})$/i) || s.match(/^(\d{1,2})\s+(\w{3})$/i);
  if (engMatch) {
    const [, a, b] = engMatch;
    const monthStr = isNaN(Number(a)) ? a : b;
    const dayStr = isNaN(Number(a)) ? b : a;
    const monthIdx = monthNames[monthStr.toLowerCase().slice(0, 3)];
    if (monthIdx !== undefined) {
      const year = new Date().getFullYear();
      const d = new Date(year, monthIdx, parseInt(dayStr));
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }

  // Last resort: try native Date parse
  const fallback = new Date(s);
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 1990) {
    return fallback.toISOString().slice(0, 10);
  }

  return null;
}

// ─── Value Pattern Detection ───

function isDateLike(val: string): boolean {
  return parseFlexibleDate(val) !== null;
}

function isEmailLike(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
}

function isPercentageLike(val: string | number): boolean {
  const s = String(val).trim();
  if (s.endsWith("%")) return true;
  const n = parseFloat(s);
  return !isNaN(n) && n >= 0 && n <= 100 && s.length <= 6;
}

function isStatusLike(val: string): boolean {
  const lower = normalizeString(val);
  return STATUS_MAP[lower] !== undefined;
}

function isPriorityLike(val: string): boolean {
  const lower = normalizeString(val);
  return PRIORITY_MAP[lower] !== undefined;
}

function isNameLike(val: string): boolean {
  const s = String(val).trim();
  if (s.length < 2 || s.length > 60) return false;
  // Multiple words, mostly letters
  const words = s.split(/\s+/);
  if (words.length < 2) return false;
  return words.every((w) => /^[a-zA-ZÀ-ỿ]+$/.test(w));
}

// ═══════════════════════════════════════════════
// STEP 3 — SHEET TAB EVALUATION
// ═══════════════════════════════════════════════

const IGNORE_TAB_NAMES = [
  "archive", "backup", "temp", "test", "hidden", "metadata",
  "lưu trữ", "bản sao", "tạm", "ẩn", "mẫu", "sample",
  "template", "config", "settings", "cấu hình",
];

function evaluateTab(
  tabName: string,
  tabIndex: number,
  headers: string[],
  rows: Record<string, string | number | boolean>[]
): SheetTabEvaluation {
  const warnings: string[] = [];
  const evidence: string[] = [];

  // Hard ignore checks
  const normalizedName = normalizeString(tabName);
  const isIgnoreName = IGNORE_TAB_NAMES.some(
    (n) => normalizedName.includes(normalizeString(n))
  );

  if (rows.length < 3 || headers.length < 2 || isIgnoreName) {
    return {
      tab_name: tabName,
      tab_index: tabIndex,
      likely_type: "irrelevant",
      confidence: 0,
      final_score: 0,
      score_components: emptyScoreComponents(),
      detected_columns: [],
      evidence: isIgnoreName
        ? [`Tab name "${tabName}" matches ignore pattern`]
        : [`Insufficient data: ${rows.length} rows, ${headers.length} cols`],
      decision: "ignore",
      warning_notes: [],
    };
  }

  // 1. Header Semantics Score
  let headerHits = 0;
  const detectedFields: CanonicalFieldName[] = [];
  for (const header of headers) {
    const field = matchHeaderToField(header);
    if (field && field !== "ignore") {
      headerHits++;
      detectedFields.push(field);
    }
  }
  const headerSemantics = Math.min(headerHits / Math.max(headers.length, 1), 1);

  // 2. Cell Pattern Signal
  let patternSignal = 0;
  const sampleRows = rows.slice(0, Math.min(10, rows.length));
  let dateColCount = 0;
  let statusColCount = 0;
  let nameColCount = 0;
  let emailColCount = 0;

  for (const header of headers) {
    const values = sampleRows.map((r) => String(r[header] ?? "")).filter(Boolean);
    if (values.length === 0) continue;

    const dateRatio = values.filter(isDateLike).length / values.length;
    const statusRatio = values.filter(isStatusLike).length / values.length;
    const nameRatio = values.filter(isNameLike).length / values.length;
    const emailRatio = values.filter(isEmailLike).length / values.length;

    if (dateRatio > 0.5) { dateColCount++; evidence.push(`Column "${header}" has dates (${(dateRatio*100).toFixed(0)}%)`); }
    if (statusRatio > 0.5) { statusColCount++; evidence.push(`Column "${header}" has status values (${(statusRatio*100).toFixed(0)}%)`); }
    if (nameRatio > 0.5) { nameColCount++; evidence.push(`Column "${header}" has person names (${(nameRatio*100).toFixed(0)}%)`); }
    if (emailRatio > 0.3) { emailColCount++; evidence.push(`Column "${header}" has emails (${(emailRatio*100).toFixed(0)}%)`); }
  }
  patternSignal = Math.min(
    (dateColCount * 0.2 + statusColCount * 0.3 + nameColCount * 0.2 + emailColCount * 0.1) / 1,
    1
  );

  // 3. Data Density
  let filledCells = 0;
  const totalCells = rows.length * headers.length;
  for (const row of rows) {
    for (const h of headers) {
      if (row[h] !== undefined && row[h] !== null && String(row[h]).trim() !== "") {
        filledCells++;
      }
    }
  }
  const dataDensity = totalCells > 0 ? filledCells / totalCells : 0;

  // 4. Canonical Field Coverage
  const taskFields: CanonicalFieldName[] = [
    "task_name", "task_status", "task_assignee", "deadline",
  ];
  const memberFields: CanonicalFieldName[] = [
    "member_name", "member_role", "member_email",
  ];
  const taskCoverage = taskFields.filter((f) => detectedFields.includes(f)).length / taskFields.length;
  const memberCoverage = memberFields.filter((f) => detectedFields.includes(f)).length / memberFields.length;
  const canonicalCoverage = Math.max(taskCoverage, memberCoverage);

  // 5. Cross-Column Consistency
  const hasTaskCluster = detectedFields.includes("task_name") &&
    (detectedFields.includes("task_status") || detectedFields.includes("task_assignee"));
  const hasMemberCluster = detectedFields.includes("member_name") &&
    (detectedFields.includes("member_role") || detectedFields.includes("member_email"));
  const crossCol = (hasTaskCluster ? 0.6 : 0) + (hasMemberCluster ? 0.4 : 0);

  // 6. Row Quality
  const validRowRatio = rows.filter((row) => {
    const vals = headers.map((h) => String(row[h] ?? "").trim());
    return vals.filter(Boolean).length >= Math.max(2, headers.length * 0.3);
  }).length / rows.length;

  // 7. User Value (row-level operational data > summary)
  const isRowLevel = rows.length >= 5 && headers.length >= 3;
  const userValue = isRowLevel ? 0.8 : 0.3;

  // 8. Noise Penalty
  const genericNames = ["sheet1", "sheet2", "data", "table", "bảng"];
  const isGeneric = genericNames.includes(normalizedName);
  const noisePenalty = isGeneric ? 0.5 : 0;

  // Compute final score
  const components: TabScoreComponents = {
    header_semantics: headerSemantics,
    cell_pattern_signal: patternSignal,
    data_density: dataDensity,
    canonical_field_coverage: canonicalCoverage,
    cross_column_consistency: crossCol,
    row_quality: validRowRatio,
    user_value: userValue,
    noise_penalty: noisePenalty,
  };

  const finalScore =
    0.24 * headerSemantics +
    0.22 * patternSignal +
    0.14 * dataDensity +
    0.14 * canonicalCoverage +
    0.10 * crossCol +
    0.08 * validRowRatio +
    0.08 * userValue +
    -0.10 * noisePenalty;

  // Determine tab type
  let likelyType: SheetTabType = "unknown";
  if (taskCoverage >= 0.5 || hasTaskCluster) {
    likelyType = statusColCount > 0 ? "task_list" : "mixed_tracker";
  } else if (memberCoverage >= 0.5 || hasMemberCluster) {
    likelyType = "member_list";
  } else if (dateColCount >= 2) {
    likelyType = "timeline";
  } else if (rows.length < 10 && headers.length >= 4) {
    likelyType = "summary_dashboard";
  }

  const confidence =
    finalScore >= 0.85 ? finalScore :
    finalScore >= 0.6 ? finalScore * 0.9 :
    finalScore * 0.7;

  return {
    tab_name: tabName,
    tab_index: tabIndex,
    likely_type: likelyType,
    confidence: Math.min(confidence, 1),
    final_score: Math.max(0, finalScore),
    score_components: components,
    detected_columns: detectedFields,
    evidence,
    decision: "ignore", // will be overridden by selector
    warning_notes: warnings,
  };
}

function emptyScoreComponents(): TabScoreComponents {
  return {
    header_semantics: 0,
    cell_pattern_signal: 0,
    data_density: 0,
    canonical_field_coverage: 0,
    cross_column_consistency: 0,
    row_quality: 0,
    user_value: 0,
    noise_penalty: 0,
  };
}

// ═══════════════════════════════════════════════
// STEP 4 — COLUMN MAPPING (5-Strategy Ensemble)
// ═══════════════════════════════════════════════

function matchHeaderToField(header: string): CanonicalFieldName | null {
  const normalized = normalizeString(header);
  const stripped = normalized.replace(/[\s_\-./]+/g, "");

  // Strategy 1: Exact match
  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const syn of synonyms) {
      const synNorm = normalizeString(syn);
      const synStripped = synNorm.replace(/[\s_\-./]+/g, "");
      if (normalized === synNorm || stripped === synStripped) {
        return field as CanonicalFieldName;
      }
    }
  }

  // Strategy 2: Fuzzy match
  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    for (const syn of synonyms) {
      if (fuzzyMatch(header, syn, 2)) {
        return field as CanonicalFieldName;
      }
    }
  }

  return null;
}

function mapColumns(
  headers: string[],
  rows: Record<string, string | number | boolean>[],
  overrides: ColumnMapping[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<CanonicalFieldName>();
  const sampleRows = rows.slice(0, Math.min(15, rows.length));

  // Apply manual overrides first
  for (const override of overrides) {
    if (headers.includes(override.source_header)) {
      mappings.push({ ...override, detection_method: "manual_override" });
      usedFields.add(override.canonical_field);
    }
  }

  for (const header of headers) {
    // Skip if already mapped by override
    if (mappings.some((m) => m.source_header === header)) continue;

    let bestField: CanonicalFieldName = "ignore";
    let bestConfidence = 0;
    let bestMethod: DetectionMethod = "exact_match";
    let bestReasoning = "";

    // Strategy 1+2: Header matching (exact + fuzzy)
    const headerField = matchHeaderToField(header);
    if (headerField && !usedFields.has(headerField)) {
      const normalized = normalizeString(header);
      const isExact = Object.values(FIELD_SYNONYMS).flat().some((syn) =>
        normalizeString(syn) === normalized
      );
      bestField = headerField;
      bestConfidence = isExact ? 0.95 : 0.75;
      bestMethod = isExact ? "exact_match" : "fuzzy_match";
      bestReasoning = `Header "${header}" matches field ${headerField}`;
    }

    // Strategy 3: Value Pattern Detection
    if (bestConfidence < 0.7) {
      const values = sampleRows
        .map((r) => String(r[header] ?? ""))
        .filter((v) => v.trim() !== "");

      if (values.length > 0) {
        const dateRatio = values.filter(isDateLike).length / values.length;
        const statusRatio = values.filter(isStatusLike).length / values.length;
        const emailRatio = values.filter(isEmailLike).length / values.length;
        const pctRatio = values.filter((v) => isPercentageLike(v)).length / values.length;
        const priorityRatio = values.filter(isPriorityLike).length / values.length;
        const nameRatio = values.filter(isNameLike).length / values.length;

        if (emailRatio > 0.5 && !usedFields.has("member_email")) {
          bestField = "member_email";
          bestConfidence = 0.85;
          bestMethod = "value_pattern";
          bestReasoning = `${(emailRatio * 100).toFixed(0)}% of values are email addresses`;
        } else if (statusRatio > 0.5 && !usedFields.has("task_status")) {
          bestField = "task_status";
          bestConfidence = 0.8;
          bestMethod = "value_pattern";
          bestReasoning = `${(statusRatio * 100).toFixed(0)}% of values match status patterns`;
        } else if (priorityRatio > 0.5 && !usedFields.has("task_priority")) {
          bestField = "task_priority";
          bestConfidence = 0.8;
          bestMethod = "value_pattern";
          bestReasoning = `${(priorityRatio * 100).toFixed(0)}% of values match priority patterns`;
        } else if (pctRatio > 0.6 && !usedFields.has("progress_pct")) {
          bestField = "progress_pct";
          bestConfidence = 0.7;
          bestMethod = "value_pattern";
          bestReasoning = `${(pctRatio * 100).toFixed(0)}% of values look like percentages`;
        } else if (dateRatio > 0.5 && !usedFields.has("deadline") && !usedFields.has("start_date")) {
          bestField = usedFields.has("start_date") ? "deadline" : "start_date";
          bestConfidence = 0.6;
          bestMethod = "value_pattern";
          bestReasoning = `${(dateRatio * 100).toFixed(0)}% of values are dates`;
        } else if (nameRatio > 0.5 && !usedFields.has("task_assignee") && !usedFields.has("member_name")) {
          bestField = "task_assignee";
          bestConfidence = 0.55;
          bestMethod = "value_pattern";
          bestReasoning = `${(nameRatio * 100).toFixed(0)}% of values look like person names`;
        }
      }
    }

    // Strategy 4: Positional Heuristics (weak)
    if (bestConfidence < 0.4) {
      const colIdx = headers.indexOf(header);
      if (colIdx === 0 && !usedFields.has("task_name")) {
        bestField = "task_name";
        bestConfidence = 0.35;
        bestMethod = "positional";
        bestReasoning = "First column is often the task name";
      } else if (colIdx === headers.length - 1 && !usedFields.has("notes")) {
        bestField = "notes";
        bestConfidence = 0.25;
        bestMethod = "positional";
        bestReasoning = "Last column is often notes";
      }
    }

    if (bestField !== "ignore") {
      usedFields.add(bestField);
    }

    mappings.push({
      source_header: header,
      canonical_field: bestField,
      confidence: bestConfidence,
      detection_method: bestMethod,
      reasoning: bestReasoning || "No match found",
    });
  }

  return mappings;
}

// ═══════════════════════════════════════════════
// STEP 5 — NORMALIZATION
// ═══════════════════════════════════════════════

function normalizeStatus(raw: string | number | boolean): CanonicalStatus {
  const s = normalizeString(String(raw));
  return STATUS_MAP[s] ?? "unknown";
}

function normalizePriority(raw: string | number | boolean): CanonicalPriority {
  const s = normalizeString(String(raw));
  return PRIORITY_MAP[s] ?? null;
}

function normalizePercentage(raw: string | number | boolean): number | null {
  const s = String(raw).trim().replace("%", "");
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

// ═══════════════════════════════════════════════
// STEP 6 — MEMBER IDENTITY RESOLUTION
// ═══════════════════════════════════════════════

function deduplicateMembers(
  names: string[]
): Map<string, { canonical: string; aliases: string[] }> {
  const groups = new Map<string, { canonical: string; aliases: string[] }>();

  for (const name of names) {
    if (!name || name.trim().length === 0) continue;
    const fp = nameFingerprint(name);
    const initials = nameInitials(name);

    let foundGroup = false;
    for (const [key, group] of groups) {
      const existingFp = nameFingerprint(group.canonical);
      const existingInitials = nameInitials(group.canonical);

      if (fp === existingFp || initials === existingInitials) {
        // Use longer name as canonical
        if (name.length > group.canonical.length) {
          group.canonical = name;
        }
        if (!group.aliases.includes(name)) {
          group.aliases.push(name);
        }
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.set(fp, { canonical: name, aliases: [name] });
    }
  }

  return groups;
}

// ═══════════════════════════════════════════════
// STEP 7 — CANONICALIZE ROWS
// ═══════════════════════════════════════════════

function canonicalizeTasks(
  rows: Record<string, string | number | boolean>[],
  mappings: ColumnMapping[]
): CanonicalTask[] {
  const fieldMap = new Map<CanonicalFieldName, string>();
  for (const m of mappings) {
    if (m.canonical_field !== "ignore") {
      fieldMap.set(m.canonical_field, m.source_header);
    }
  }

  const get = (row: Record<string, string | number | boolean>, field: CanonicalFieldName): string => {
    const header = fieldMap.get(field);
    if (!header) return "";
    return String(row[header] ?? "").trim();
  };

  return rows
    .map((row, idx) => {
      const taskName = get(row, "task_name");
      if (!taskName) return null;

      return {
        task_name: taskName,
        task_status: normalizeStatus(get(row, "task_status") || "unknown"),
        task_assignee: get(row, "task_assignee") || null,
        task_priority: get(row, "task_priority")
          ? normalizePriority(get(row, "task_priority"))
          : null,
        deadline: parseFlexibleDate(get(row, "deadline")),
        start_date: parseFlexibleDate(get(row, "start_date")),
        completion_date: parseFlexibleDate(get(row, "completion_date")),
        progress_pct: get(row, "progress_pct")
          ? normalizePercentage(get(row, "progress_pct"))
          : null,
        sprint_name: get(row, "sprint_name") || null,
        milestone_name: get(row, "milestone_name") || null,
        notes: get(row, "notes") || null,
        _source_row: idx,
      } as CanonicalTask;
    })
    .filter((t): t is CanonicalTask => t !== null);
}

function canonicalizeMembers(
  rows: Record<string, string | number | boolean>[],
  mappings: ColumnMapping[]
): CanonicalMember[] {
  const fieldMap = new Map<CanonicalFieldName, string>();
  for (const m of mappings) {
    if (m.canonical_field !== "ignore") {
      fieldMap.set(m.canonical_field, m.source_header);
    }
  }

  // Collect all assignee names from tasks
  const assigneeHeader = fieldMap.get("task_assignee");
  const memberNameHeader = fieldMap.get("member_name");
  const roleHeader = fieldMap.get("member_role");
  const emailHeader = fieldMap.get("member_email");

  const nameSet = new Set<string>();
  for (const row of rows) {
    if (assigneeHeader) {
      const val = String(row[assigneeHeader] ?? "").trim();
      if (val) nameSet.add(val);
    }
    if (memberNameHeader) {
      const val = String(row[memberNameHeader] ?? "").trim();
      if (val) nameSet.add(val);
    }
  }

  const deduped = deduplicateMembers(Array.from(nameSet));
  const members: CanonicalMember[] = [];

  for (const [, group] of deduped) {
    // Try to find role/email from rows
    let role: string | null = null;
    let email: string | null = null;

    if (memberNameHeader && (roleHeader || emailHeader)) {
      for (const row of rows) {
        const rowName = String(row[memberNameHeader] ?? "").trim();
        if (group.aliases.some((a) => nameFingerprint(a) === nameFingerprint(rowName))) {
          if (roleHeader && !role) role = String(row[roleHeader] ?? "").trim() || null;
          if (emailHeader && !email) email = String(row[emailHeader] ?? "").trim() || null;
        }
      }
    }

    members.push({
      name: group.canonical,
      normalized_key: nameFingerprint(group.canonical),
      role,
      email,
      alias_group: group.aliases,
    });
  }

  return members;
}

// ═══════════════════════════════════════════════
// STEP 8 — COMPUTE DERIVED INSIGHTS
// ═══════════════════════════════════════════════

function computeDerived(
  tasks: CanonicalTask[],
  _members: CanonicalMember[],
  _milestones: CanonicalMilestone[]
): DerivedInsights {
  const totalTasks = tasks.length;

  // Tasks by status
  const tasksByStatus: Record<CanonicalStatus, number> = {
    todo: 0, in_progress: 0, in_review: 0, done: 0,
    blocked: 0, cancelled: 0, unknown: 0,
  };
  for (const t of tasks) {
    tasksByStatus[t.task_status] = (tasksByStatus[t.task_status] || 0) + 1;
  }

  // Tasks by assignee
  const tasksByAssignee: Record<string, number> = {};
  const doneByAssignee: Record<string, number> = {};
  for (const t of tasks) {
    const assignee = t.task_assignee ?? "Chưa giao";
    tasksByAssignee[assignee] = (tasksByAssignee[assignee] || 0) + 1;
    if (t.task_status === "done") {
      doneByAssignee[assignee] = (doneByAssignee[assignee] || 0) + 1;
    }
  }

  // Completion rate by assignee
  const completionByAssignee: Record<string, number> = {};
  for (const [assignee, total] of Object.entries(tasksByAssignee)) {
    completionByAssignee[assignee] = Math.round(
      ((doneByAssignee[assignee] || 0) / total) * 100
    );
  }

  // Overall completion
  const doneTasks = tasksByStatus.done;
  const overallCompletion = totalTasks > 0
    ? Math.round((doneTasks / totalTasks) * 100)
    : 0;

  // Overdue
  const now = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(
    (t) => t.deadline && t.deadline < now && t.task_status !== "done" && t.task_status !== "cancelled"
  ).length;

  // Average progress
  const tasksWithProgress = tasks.filter((t) => t.progress_pct !== null);
  const avgProgress = tasksWithProgress.length > 0
    ? Math.round(
        tasksWithProgress.reduce((s, t) => s + (t.progress_pct ?? 0), 0) / tasksWithProgress.length
      )
    : overallCompletion;

  return {
    overall_completion_pct: overallCompletion,
    total_tasks: totalTasks,
    tasks_by_status: tasksByStatus,
    tasks_by_assignee: tasksByAssignee,
    completion_rate_by_assignee: completionByAssignee,
    milestone_completion_pct: 0, // computed from milestones if available
    overdue_count: overdue,
    blocked_count: tasksByStatus.blocked,
    avg_progress_pct: avgProgress,
  };
}

// ═══════════════════════════════════════════════
// MAIN PIPELINE — runIngestionPipeline
// Default: real Google Sheets connector.
// Fallback to mock ONLY when:
//   - options.mock === true, OR
//   - no Google API keys configured
// ═══════════════════════════════════════════════

export async function runIngestionPipeline(
  projectId: string,
  options: PipelineOptions = {}
): Promise<CanonicalProjectData> {
  const config = getIntegrationConfig(projectId);
  if (!config) {
    throw createIngestionError(
      "INVALID_SOURCE",
      "Chưa có cấu hình nguồn dữ liệu cho dự án này.",
      "No integration config found"
    );
  }

  // If pre-fetched data is provided (from backend connector or CSV parser), use it
  if (options.rawData) {
    return runRealPipeline(projectId, config, options, options.rawData);
  }

  // If explicitly mock mode
  if (options.mock === true) {
    return runMockPipeline(projectId, config);
  }

  // No rawData and no mock — error. Callers must provide data.
  throw createIngestionError(
    'INVALID_SOURCE',
    'Chưa có dữ liệu. Vui lòng kết nối nguồn dữ liệu hoặc tải file lên.',
    'Pipeline requires rawData in options or explicit mock mode. Direct API calls are handled by backend.'
  );
}

// ─── REAL PIPELINE (processes pre-fetched data) ───

async function runRealPipeline(
  projectId: string,
  config: { sheet_url: string; provider: string; column_overrides: ColumnMapping[] },
  options: PipelineOptions,
  rawData: RawSheetData
): Promise<CanonicalProjectData> {
  const decisionLog = createDecisionLog();

  // STEP 1: DATA RECEIVED (already fetched by connector layer)
  addStep(decisionLog, 'metadata_fetch',
    `Đã nhận dữ liệu từ "${rawData.title}" (${rawData.tabs.length} tab, ${rawData.access_mode})`,
    rawData.tabs.map(t => `Tab "${t.tab_name}": ${t.row_count} hàng, ${t.col_count} cột`),
  );

  // STEP 2: PROFILE + SCORE all tabs via SmartSchemaDetector
  const tabAnalyses = analyze(rawData.tabs);
  addStep(decisionLog, 'tab_profile',
    `Đã phân tích ${tabAnalyses.length} tab`,
    tabAnalyses.map(a => `"${a.tab.tab_name}": điểm ${a.score.final_score}, loại ${a.score.tab_type}`),
  );

  // STEP 3: HYPOTHESIS GENERATION
  const hypotheses = generateHypotheses(tabAnalyses);
  addStep(decisionLog, 'hypothesis_generation',
    `Tạo ${hypotheses.length} giả thuyết cấu trúc`,
    hypotheses.map(h => `${h.hypothesis_id}: "${h.primary_tab_name ?? 'null'}" (${h.confidence.toFixed(2)})`),
  );

  // STEP 4: SELECT best tab
  const selection = selectBestTab(tabAnalyses);
  if (!selection) {
    throw createIngestionError(
      'NO_SUITABLE_TAB',
      'Không tìm thấy bảng dữ liệu phù hợp để phân tích trong Google Sheet.',
      'No tab scored high enough'
    );
  }

  addStep(decisionLog, 'tab_selection',
    selection.explanation_vi,
    selection.best.score.reasons,
    selection.isAmbiguous ? 'warning' : 'info'
  );

  // STEP 5: CONTRADICTION CHECK
  const contradictions = checkContradictions(selection.best);
  if (contradictions.is_contradictory) {
    addStep(decisionLog, 'contradiction_check',
      `Phát hiện ${contradictions.contradictions.length} mâu thuẫn (mức ${contradictions.severity})`,
      contradictions.contradictions,
      contradictions.severity === 'high' ? 'critical' : 'warning'
    );
  }

  // If strict mode + high contradiction: refuse auto-connect
  if (options.strict && contradictions.severity === 'high') {
    throw createIngestionError(
      'INSUFFICIENT_MAPPING',
      `Dữ liệu có mâu thuẫn nghiêm trọng. ${contradictions.fallback_recommendation ?? 'Bạn nên kiểm tra lại.'}`,
      contradictions.contradictions.join('; ')
    );
  }

  // Use the selected tab
  const selectedTab = selection.best.tab;
  const selectedMappings = selection.best.mappings;

  // Convert raw tab rows (string[][]) to Record format for existing normalization functions
  const rowRecords = convertToRecordRows(selectedTab);

  // Build ColumnMapping[] from EnhancedColumnMapping[]
  const columnMappings: ColumnMapping[] = selectedMappings.map(m => ({
    source_header: m.source_header,
    canonical_field: m.canonical_field,
    confidence: m.confidence,
    detection_method: m.detection_method,
    reasoning: m.reasoning,
  }));

  // Apply manual overrides from config
  const overrides = config.column_overrides || [];
  for (const override of overrides) {
    const idx = columnMappings.findIndex(m => m.source_header === override.source_header);
    if (idx >= 0) {
      columnMappings[idx] = { ...override, detection_method: 'manual_override' };
    }
  }

  addStep(decisionLog, 'mapping_selection',
    `Ánh xạ ${columnMappings.filter(m => m.canonical_field !== 'ignore').length} cột`,
    columnMappings
      .filter(m => m.canonical_field !== 'ignore')
      .map(m => `"${m.source_header}" → ${m.canonical_field} (${Math.round(m.confidence * 100)}%)`),
  );

  // STEP 6+7: NORMALIZE → CANONICALIZE using existing functions
  const warnings: IngestionWarning[] = [];
  const tasks = canonicalizeTasks(rowRecords, columnMappings);
  const members = canonicalizeMembers(rowRecords, columnMappings);
  const milestones: CanonicalMilestone[] = [];

  if (tasks.length === 0 && members.length === 0) {
    throw createIngestionError(
      'INSUFFICIENT_MAPPING',
      'Không tìm thấy bảng dữ liệu phù hợp để phân tích. Hãy kiểm tra cấu hình cột.',
      `Mapped ${columnMappings.filter(m => m.canonical_field !== 'ignore').length} columns but produced no tasks or members`
    );
  }

  if (tasks.length === 0) {
    warnings.push({
      code: 'PARTIAL_DATA_WARNING',
      message_vi: 'Không tìm thấy công việc nào. Chỉ có dữ liệu thành viên.',
      detail: 'No task_name column mapped or all rows had empty task names',
      severity: 'warning',
    });
  }

  const skippedRows = selectedTab.row_count - tasks.length;
  if (skippedRows > selectedTab.row_count * 0.3) {
    warnings.push({
      code: 'PARTIAL_DATA_WARNING',
      message_vi: `Đã bỏ qua ${skippedRows} hàng không hợp lệ (${Math.round((skippedRows / selectedTab.row_count) * 100)}%).`,
      detail: `${skippedRows} of ${selectedTab.row_count} rows skipped`,
      severity: 'warning',
    });
  }

  if (contradictions.is_contradictory) {
    warnings.push({
      code: 'PARTIAL_DATA_WARNING',
      message_vi: `Phát hiện ${contradictions.contradictions.length} tín hiệu mâu thuẫn trong dữ liệu nguồn.`,
      detail: contradictions.contradictions.join('; '),
      severity: contradictions.severity === 'high' ? 'error' : 'warning',
    });
  }

  // STEP 8: COMPUTE DERIVED
  const derived = computeDerived(tasks, members, milestones);

  // Aggregate mapping confidence (with contradiction downgrade)
  const mappedColumns = columnMappings.filter(m => m.canonical_field !== 'ignore');
  let mappingConfidence = mappedColumns.length > 0
    ? mappedColumns.reduce((s, m) => s + m.confidence, 0) / mappedColumns.length
    : 0;
  mappingConfidence = Math.max(0, mappingConfidence - contradictions.downgrade_delta);

  // Source fingerprint
  const fingerprint = await computeFingerprint(
    rawData.spreadsheet_id,
    rawData.title,
    [selectedTab],
    rawData.tabs.map(t => t.tab_name)
  );

  // Determine trust level
  let trustLevel: SourceTrustLevel = 'public_unverified';
  if (rawData.access_mode === 'oauth_token') {
    trustLevel = 'authenticated_private_sheet';
  } else if (rawData.access_mode === 'api_key') {
    trustLevel = 'public_unverified';
  }

  // Build tab evaluations for backward compatibility
  const tabEvaluations: SheetTabEvaluation[] = tabAnalyses.map(a => ({
    tab_name: a.tab.tab_name,
    tab_index: a.tab.tab_index,
    likely_type: a.score.tab_type,
    confidence: Math.min(a.score.final_score / 100, 1),
    final_score: a.score.final_score,
    score_components: {
      header_semantics: a.profile.header_quality_score,
      cell_pattern_signal: (a.profile.status_like_columns.length + a.profile.date_like_columns.length) / Math.max(a.tab.col_count, 1),
      data_density: a.profile.non_empty_ratio,
      canonical_field_coverage: a.mappings.filter(m => m.canonical_field !== 'ignore').length / Math.max(a.tab.col_count, 1),
      cross_column_consistency: 0,
      row_quality: a.profile.row_quality_score,
      user_value: a.profile.likely_shape === 'row_level' ? 0.8 : 0.3,
      noise_penalty: a.profile.noise_penalty,
    },
    detected_columns: a.mappings.filter(m => m.canonical_field !== 'ignore').map(m => m.canonical_field),
    evidence: a.score.reasons,
    decision: a.tab.tab_name === selectedTab.tab_name ? 'use_primary' : 'ignore' as TabDecision,
    warning_notes: a.profile.warnings,
  }));

  // Rejected tab reasons
  const rejectedReasons = tabAnalyses
    .filter(a => a.tab.tab_name !== selectedTab.tab_name)
    .map(a => buildTabRejectionReason(a));

  addStep(decisionLog, 'final_validation',
    `Hoàn tất: ${tasks.length} công việc, ${members.length} thành viên`,
    [],
  );

  // STEP 9: RETURN
  return {
    project_id: projectId,
    tasks,
    members,
    milestones,
    column_mappings: columnMappings,
    tab_evaluations: tabEvaluations,
    derived,
    warnings,
    mapping_confidence: Math.round(mappingConfidence * 100) / 100,
    source: {
      provider: config.provider,
      source_url: config.sheet_url,
      fetched_at: new Date().toISOString(),
      tab_used: selectedTab.tab_name,
      tabs_inspected: rawData.tabs.map(t => t.tab_name),
      tabs_rejected: rawData.tabs.filter(t => t.tab_name !== selectedTab.tab_name).map(t => t.tab_name),
      row_count_raw: selectedTab.row_count,
      row_count_valid: tasks.length,
      rows_skipped: skippedRows,
      access_mode: rawData.access_mode,
      trust_level: trustLevel,
      spreadsheet_title: rawData.title,
      fingerprint_sha256: fingerprint.fingerprint_sha256,
    },
    metadata: {
      is_mock: false,
      hypothesis_count: hypotheses.length,
      contradiction_count: contradictions.contradictions.length,
      ambiguity_score: selection.ambiguity_score,
      fusion_used: false,
      decision_log_summary: decisionLog.steps.map(s => s.summary_vi),
      tab_selection_reason_vi: selection.explanation_vi,
      rejected_tab_reasons_vi: rejectedReasons,
    },
    ingested_at: new Date().toISOString(),
  };
}

// ─── MOCK PIPELINE (fallback for demo mode only) ───

async function runMockPipeline(
  projectId: string,
  config: { sheet_url: string; provider: string; column_overrides: ColumnMapping[] }
): Promise<CanonicalProjectData> {
  // Generate mock data using self-contained generator
  const mockData = generateMockSheetData(projectId);

  // Run full evidence-grade analysis on mock data
  const tabAnalyses = analyze(mockData.tabs);
  const selection = selectBestTab(tabAnalyses);

  if (!selection) {
    throw createIngestionError(
      'EMPTY_DATA',
      'Dữ liệu mô phỏng không hợp lệ.',
      'Mock data generated no analyzable tabs'
    );
  }

  const selectedTab = selection.best.tab;
  const selectedMappings = selection.best.mappings;
  const rowRecords = convertToRecordRows(selectedTab);

  const columnMappings: ColumnMapping[] = selectedMappings.map(m => ({
    source_header: m.source_header,
    canonical_field: m.canonical_field,
    confidence: m.confidence,
    detection_method: m.detection_method,
    reasoning: m.reasoning,
  }));

  // Apply manual overrides
  for (const override of config.column_overrides || []) {
    const idx = columnMappings.findIndex(m => m.source_header === override.source_header);
    if (idx >= 0) {
      columnMappings[idx] = { ...override, detection_method: 'manual_override' };
    }
  }

  const warnings: IngestionWarning[] = [{
    code: 'PARTIAL_DATA_WARNING',
    message_vi: '⚠ Đang sử dụng dữ liệu mô phỏng. Kết nối nguồn dữ liệu thực để phân tích chính xác.',
    detail: 'Mock mode active — no real data source connected',
    severity: 'warning',
  }];

  const tasks = canonicalizeTasks(rowRecords, columnMappings);
  const members = canonicalizeMembers(rowRecords, columnMappings);
  const milestones: CanonicalMilestone[] = [];
  const derived = computeDerived(tasks, members, milestones);
  const skippedRows = selectedTab.row_count - tasks.length;

  const mappedCols = columnMappings.filter(m => m.canonical_field !== 'ignore');
  const mappingConfidence = mappedCols.length > 0
    ? mappedCols.reduce((s, m) => s + m.confidence, 0) / mappedCols.length
    : 0;

  const tabEvaluations: SheetTabEvaluation[] = tabAnalyses.map(a => ({
    tab_name: a.tab.tab_name,
    tab_index: a.tab.tab_index,
    likely_type: a.score.tab_type,
    confidence: Math.min(a.score.final_score / 100, 1),
    final_score: a.score.final_score,
    score_components: {
      header_semantics: a.profile.header_quality_score,
      cell_pattern_signal: 0,
      data_density: a.profile.non_empty_ratio,
      canonical_field_coverage: a.mappings.filter(m => m.canonical_field !== 'ignore').length / Math.max(a.tab.col_count, 1),
      cross_column_consistency: 0,
      row_quality: a.profile.row_quality_score,
      user_value: 0.5,
      noise_penalty: a.profile.noise_penalty,
    },
    detected_columns: a.mappings.filter(m => m.canonical_field !== 'ignore').map(m => m.canonical_field),
    evidence: a.score.reasons,
    decision: a.tab.tab_name === selectedTab.tab_name ? 'use_primary' : 'ignore' as TabDecision,
    warning_notes: a.profile.warnings,
  }));

  return {
    project_id: projectId,
    tasks,
    members,
    milestones,
    column_mappings: columnMappings,
    tab_evaluations: tabEvaluations,
    derived,
    warnings,
    mapping_confidence: Math.round(mappingConfidence * 100) / 100,
    source: {
      provider: config.provider,
      source_url: config.sheet_url,
      fetched_at: new Date().toISOString(),
      tab_used: selectedTab.tab_name + ' (mock)',
      tabs_inspected: mockData.tabs.map(t => t.tab_name),
      tabs_rejected: [],
      row_count_raw: selectedTab.row_count,
      row_count_valid: tasks.length,
      rows_skipped: skippedRows,
      access_mode: 'api_key',
      trust_level: 'insufficient_provenance',
      spreadsheet_title: mockData.title,
      fingerprint_sha256: 'mock-' + projectId,
    },
    metadata: {
      is_mock: true,
      hypothesis_count: 0,
      contradiction_count: 0,
      ambiguity_score: 0,
      fusion_used: false,
      decision_log_summary: ['Đang sử dụng dữ liệu mô phỏng'],
      tab_selection_reason_vi: selection.explanation_vi,
      rejected_tab_reasons_vi: [],
    },
    ingested_at: new Date().toISOString(),
  };
}

// ─── Utility: Convert RawTab (string[][]) to Record[] for normalization ───

function convertToRecordRows(
  tab: RawTab
): Record<string, string | number | boolean>[] {
  return tab.rows.map(row => {
    const record: Record<string, string | number | boolean> = {};
    for (let i = 0; i < tab.headers.length; i++) {
      record[tab.headers[i]] = row[i] ?? '';
    }
    return record;
  });
}

// ─── Error Factory ───

interface IngestionError extends Error {
  code: string;
  detail: string;
}

function createIngestionError(
  code: string,
  messageVi: string,
  detail: string
): IngestionError {
  const err = new Error(messageVi) as IngestionError;
  err.code = code;
  err.detail = detail;
  return err;
}
