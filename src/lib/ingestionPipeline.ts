// ═══════════════════════════════════════════════
// Ingestion Pipeline — Evidence-Grade Data Processing
// 9-Pass Architecture: Full-workbook ingestion producing
// MASTER_TASK_FACT + Bronze/Silver/Gold Snapshot Package.
//
// All normalization, matching, and scoring imported from
// canonical modules (no inline duplication).
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
  TabClassification,
  TabVersionStatus,
} from "./canonicalTypes";
import { getIntegrationConfig } from "./integrationConfigStore";

import type { RawSheetData, RawTab } from "./ingestion/types";

// ─── Canonical Modules (no duplication) ───
import { analyze, selectBestTab } from "./ingestion/SmartSchemaDetector";
import { generateHypotheses } from "./ingestion/HypothesisEngine";
import { checkContradictions } from "./ingestion/ContradictionChecker";
import { computeFingerprint } from "./ingestion/SourceFingerprint";
import { createDecisionLog, addStep } from "./ingestion/IngestionDecisionLog";
import { buildTabRejectionReason } from "./ingestion/ReasoningTextBuilder";
import { generateMockSheetData } from "./ingestion/mockDataGenerator";
import { resolveEntities, type RawIdentity } from "./ingestion/EntityResolver";
import { buildRetrievalIndex } from "./ingestion/RetrievalIndexBuilder";
import { computeQualityReport, computeStructuralDrift } from "./ingestion/QualityScorer";
import { detectAnomalies } from "./ingestion/AnomalyDetector";
import { buildGoldLayer, computeDerivedInsights } from "./ingestion/GoldViewBuilder";
import { profileTab } from "./ingestion/TabProfiler";

// ─── New Pipeline Modules ───
import { detectTableBlocks, selectBestBlock } from "./ingestion/TableBlockDetector";
import { detectTabLifecycles } from "./ingestion/TabLifecycleDetector";
import { buildMasterTaskFact } from "./ingestion/MasterTaskFactBuilder";
import { computeDriftScore } from "./ingestion/DriftScorer";
import type { SnapshotMeta } from "./ingestion/MasterTaskFactTypes";

// ─── Linguistic Engine (single source of truth) ───
import {
  normalizeString,
  normalizeHeader,
  matchHeader,
  analyzeHeaders,
  parseFlexibleDate,
  normalizeStatus,
  normalizePriority,
  normalizePercentage,
  nameFingerprint,
  isDateLike,
  isEmailLike,
  isPercentLike,
  isStatusLike,
  isPriorityLike,
  isNameLike,
  detectLanguage,
} from "./ingestion/LinguisticEngine";

// ─── Snapshot Types ───
import type {
  SnapshotPackage,
  SnapshotManifest,
  SnapshotProvenance,
  BronzeLayer,
  BronzeTab,
  SilverLayer,
  GoldLayer,
  RetrievalIndex,
  QualityReport,
  StructuralDriftReport,
  EntityResolutionReport,
  LinguisticNormalizationReport,
  TabLifecycleReport,
  CanonicalRisk,
  CanonicalBlocker,
  CanonicalEffort,
} from "./ingestion/SnapshotTypes";

// ─── Mock Gate ───
const ALLOW_MOCK = typeof import.meta !== 'undefined'
  && import.meta.env?.VITE_ALLOW_MOCK === 'true';

// ─── Pipeline Options ───

export interface PipelineOptions {
  /** Pre-fetched raw data from backend connector or CSV parser */
  rawData?: RawSheetData;
  /** Force mock mode (demo only — requires VITE_ALLOW_MOCK=true) */
  mock?: boolean;
  debug?: boolean;
  strict?: boolean;
  /** Previous snapshot for drift detection */
  previousSnapshot?: SnapshotPackage | null;
}

// ═══════════════════════════════════════════════
// MAIN PIPELINE — runIngestionPipeline
// Returns CanonicalProjectData (backward-compatible).
// Also generates SnapshotPackage when possible.
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

  // If explicitly mock mode — gated behind env var
  if (options.mock === true) {
    if (!ALLOW_MOCK) {
      throw createIngestionError(
        'MOCK_DISABLED',
        'Chế độ mock đã bị tắt. Vui lòng kết nối nguồn dữ liệu thật.',
        'Mock mode disabled. Set VITE_ALLOW_MOCK=true to enable.'
      );
    }
    return runMockPipeline(projectId, config);
  }

  // No rawData and no mock — error. Callers must provide data.
  throw createIngestionError(
    'INVALID_SOURCE',
    'Chưa có dữ liệu. Vui lòng kết nối nguồn dữ liệu hoặc tải file lên.',
    'Pipeline requires rawData in options or explicit mock mode. Direct API calls are handled by backend.'
  );
}

/**
 * ═══════════════════════════════════════════════
 * 9-PASS SNAPSHOT PIPELINE
 * Full-workbook ingestion producing:
 *   MASTER_TASK_FACT + Bronze/Silver/Gold
 *
 * Pass 1: Workbook Profiling → BronzeLayer
 * Pass 2: Table-Block Detection → patched headers
 * Pass 3: Column Semantic Typing → EnhancedColumnMapping[]
 * Pass 4: Tab Classification & Scoring → TabAnalysis[]
 * Pass 5: Multi-Hypothesis Generation → DetectionHypothesis[]
 * Pass 6: Contradiction Checking → ContradictionReport
 * Pass 7: Entity Resolution → members + report
 * Pass 8: MASTER_TASK_FACT Generation → MasterTaskFact[]
 * Pass 9: Gold Layer + Retrieval + Quality
 * ═══════════════════════════════════════════════
 */
export async function runSnapshotPipeline(
  projectId: string,
  integrationId: string,
  rawData: RawSheetData,
  sourceMode: SnapshotManifest['source_mode'],
  previousSnapshot: SnapshotPackage | null = null
): Promise<SnapshotPackage> {
  const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // ═══════════════════════════════════════════════
  // PASS 1: WORKBOOK PROFILING → BRONZE LAYER
  // Raw source fidelity — preserve everything.
  // ═══════════════════════════════════════════════
  const bronze: BronzeLayer = buildBronzeLayer(rawData);

  // ═══════════════════════════════════════════════
  // PASS 2: TABLE-BLOCK DETECTION
  // Scan each tab for actual data regions.
  // Patch headers to use detected header rows.
  // ═══════════════════════════════════════════════
  const patchedTabs: RawTab[] = [];
  for (const tab of rawData.tabs) {
    const allRows = [tab.headers, ...tab.rows];
    const blocks = detectTableBlocks(allRows, tab.col_count);
    const bestBlock = selectBestBlock(blocks);

    if (bestBlock && bestBlock.header_row > 0) {
      // Detected header is NOT row 0 — patch the tab
      const newHeaders = bestBlock.headers;
      const newRows = allRows.slice(bestBlock.header_row + 1, bestBlock.end_row + 1);
      patchedTabs.push({
        ...tab,
        headers: newHeaders,
        rows: newRows,
        row_count: newRows.length,
        col_count: newHeaders.length,
      });
    } else {
      patchedTabs.push(tab);
    }
  }

  // ═══════════════════════════════════════════════
  // PASS 3: COLUMN SEMANTIC TYPING
  // Tab profiling + schema detection on ALL tabs.
  // ═══════════════════════════════════════════════
  const tabAnalyses = analyze(patchedTabs);

  // ═══════════════════════════════════════════════
  // PASS 4: TAB CLASSIFICATION & SCORING
  // All tabs scored; classify each tab's role.
  // ═══════════════════════════════════════════════
  // (Handled inside analyze() — tabAnalyses already has
  //  tab_type per tab. We no longer select only ONE tab.)

  // ═══════════════════════════════════════════════
  // PASS 5: MULTI-HYPOTHESIS GENERATION
  // Generate competing interpretations of structure.
  // ═══════════════════════════════════════════════
  const hypotheses = generateHypotheses(tabAnalyses);

  // ═══════════════════════════════════════════════
  // PASS 6: CONTRADICTION CHECKING
  // Challenge the best hypothesis per tab.
  // ═══════════════════════════════════════════════
  const selection = selectBestTab(tabAnalyses);
  const contradictions = selection
    ? checkContradictions(selection.best)
    : { is_contradictory: false, severity: 'low' as const, contradictions: [], downgrade_delta: 0, fallback_recommendation: null };

  // ═══════════════════════════════════════════════
  // PASS 7: ENTITY RESOLUTION
  // Collect identities from ALL tabs, resolve across them.
  // ═══════════════════════════════════════════════
  const allIdentities = collectIdentities(patchedTabs, tabAnalyses);
  const { members, report: entityReport } = resolveEntities(allIdentities);

  // ═══════════════════════════════════════════════
  // PASS 8: MASTER_TASK_FACT GENERATION
  // Merge all task-operational tabs into flat rows.
  // Also produces backward-compatible CanonicalTask[].
  // ═══════════════════════════════════════════════

  // Tab lifecycle detection
  const previousBronzeTabs = previousSnapshot?.bronze.tabs ?? null;
  const tabLifecycleReport = detectTabLifecycles(bronze.tabs, previousBronzeTabs);
  const tabLifecycles = tabLifecycleReport.results;

  // Build MASTER_TASK_FACT
  const trustLevel = determineTrustLevel(rawData.access_mode, sourceMode);
  const { masterFacts, teamDim, milestoneDim } = buildMasterTaskFact(
    tabAnalyses,
    members,
    entityReport,
    tabLifecycles,
    {
      projectId,
      snapshotId,
      integrationId,
      workbookId: rawData.spreadsheet_id,
      workbookTitle: rawData.title,
      sourceMode,
      trustLevel,
    },
  );

  // Backward-compatible CanonicalTask[] from MASTER_TASK_FACT
  const tasks: CanonicalTask[] = masterFacts.map((f, i) => ({
    task_name: f.task_name,
    task_status: f.status_normalized as CanonicalStatus,
    task_assignee: f.assignee_name ?? null,
    task_priority: (f.priority_normalized ?? 'medium') as CanonicalPriority,
    start_date: f.planned_start_date ?? null,
    deadline: f.deadline ?? null,
    completion_date: f.completed_at ?? null,
    progress_pct: f.progress_pct ?? null,
    description: f.task_description ?? null,
    notes: f.note_text ?? null,
    _source_tab: f.source_tab_name,
    _source_row: f.source_row_index,
  }));

  // Column mappings from all tabs (merged)
  const allColumnMappings: ColumnMapping[] = [];
  for (const analysis of tabAnalyses) {
    for (const m of analysis.mappings) {
      allColumnMappings.push({
        source_header: m.source_header,
        canonical_field: m.canonical_field,
        confidence: m.confidence,
        detection_method: m.detection_method,
        reasoning: m.reasoning,
      });
    }
  }

  // Tab evaluations for all tabs
  const primaryTabName = selection?.best.tab.tab_name ?? patchedTabs[0]?.tab_name ?? '';
  const tabEvaluations = buildTabEvaluations(tabAnalyses, primaryTabName);

  // Mapping confidence (average across all mapped columns)
  const mappedColumns = allColumnMappings.filter(m => m.canonical_field !== 'ignore');
  let mappingConfidence = mappedColumns.length > 0
    ? mappedColumns.reduce((s, m) => s + m.confidence, 0) / mappedColumns.length
    : 0;
  mappingConfidence = Math.max(0, mappingConfidence - contradictions.downgrade_delta);

  // Linguistic report
  const linguisticReport = buildLinguisticReport(patchedTabs);

  // Milestones from dimension
  const milestones: CanonicalMilestone[] = milestoneDim.map(m => ({
    name: m.name,
    date: m.date,
    status: m.status as 'upcoming' | 'completed' | 'overdue',
  }));

  const silver: SilverLayer = {
    tasks,
    members,
    milestones,
    risks: [],
    blockers: [],
    efforts: [],
    master_task_fact: masterFacts,
    team_dim: teamDim,
    milestone_dim: milestoneDim,
    column_mappings: allColumnMappings,
    tab_evaluations: tabEvaluations,
    entity_resolution: entityReport,
    linguistic_normalization: linguisticReport,
    mapping_confidence: Math.round(mappingConfidence * 100) / 100,
  };

  // ═══════════════════════════════════════════════
  // PASS 9: GOLD LAYER + RETRIEVAL + QUALITY
  // Analysis-ready views, routing index, quality report.
  // ═══════════════════════════════════════════════

  // Anomaly detection (across all tabs)
  const rawRows: Array<{ tab: string; row: number; values: string[] }> = [];
  for (const tab of patchedTabs) {
    for (let r = 0; r < tab.rows.length; r++) {
      rawRows.push({ tab: tab.tab_name, row: r, values: tab.rows[r] });
    }
  }
  const anomalies = detectAnomalies(tasks, members, rawRows);

  // Gold layer
  const gold = buildGoldLayer(silver, contradictions);

  // Retrieval index
  const retrievalIndex = buildRetrievalIndex(
    snapshotId, gold, silver, bronze, contradictions,
  );

  // Structural drift
  const drift = previousSnapshot
    ? computeStructuralDrift(
        previousSnapshot.bronze,
        bronze,
        previousSnapshot.manifest.snapshot_id,
        snapshotId,
      )
    : null;

  // Quality report
  const qualityReport = computeQualityReport(
    snapshotId, silver, bronze, contradictions, anomalies, trustLevel, drift,
  );

  // Fingerprint (content-based, not timestamp-based)
  const fingerprint = await computeFingerprint(
    rawData.spreadsheet_id,
    rawData.title,
    patchedTabs,
    rawData.tabs.map(t => t.tab_name),
  );

  // Manifest
  const manifest: SnapshotManifest = {
    snapshot_id: snapshotId,
    project_id: projectId,
    integration_id: integrationId,
    created_at: now,
    version: 2,
    source_mode: sourceMode,
    layers_present: ['bronze', 'silver', 'gold'],
    artifact_keys: [
      'manifest', 'provenance', 'bronze', 'silver', 'gold',
      'retrieval_index', 'quality_report', 'tab_lifecycle',
    ],
    fingerprint_sha256: fingerprint.fingerprint_sha256,
  };

  // Provenance
  const provenance: SnapshotProvenance = {
    snapshot_id: snapshotId,
    source_url: rawData.spreadsheet_id,
    spreadsheet_id: rawData.spreadsheet_id,
    spreadsheet_title: rawData.title,
    access_mode: rawData.access_mode as SnapshotProvenance['access_mode'],
    trust_level: trustLevel,
    fetched_at: now,
    tabs_total: rawData.tabs.length,
    tabs_ingested: patchedTabs.map(t => t.tab_name),
    tabs_rejected: [],
    fingerprint,
    previous_snapshot_id: previousSnapshot?.manifest.snapshot_id ?? null,
  };

  // Snapshot meta
  const snapshotMeta: SnapshotMeta = {
    snapshot_id: snapshotId,
    project_id: projectId,
    integration_id: integrationId,
    created_at: now,
    source_mode: sourceMode,
    total_tabs: rawData.tabs.length,
    tabs_ingested: patchedTabs.length,
    total_raw_rows: bronze.total_rows,
    total_master_rows: masterFacts.length,
    overall_quality: qualityReport.overall_quality,
    mapping_confidence: Math.round(mappingConfidence * 100) / 100,
  };

  return {
    manifest,
    provenance,
    bronze,
    silver,
    gold,
    retrieval_index: retrievalIndex,
    quality_report: qualityReport,
    structural_drift: drift,
    tab_lifecycle: tabLifecycleReport,
    snapshot_meta: snapshotMeta,
  };
}

// ═══════════════════════════════════════════════
// REAL PIPELINE (backward-compatible CanonicalProjectData)
// ═══════════════════════════════════════════════

async function runRealPipeline(
  projectId: string,
  config: { sheet_url: string; provider: string; column_overrides: ColumnMapping[] },
  options: PipelineOptions,
  rawData: RawSheetData
): Promise<CanonicalProjectData> {
  const decisionLog = createDecisionLog();

  // STEP 1: DATA RECEIVED
  addStep(decisionLog, 'metadata_fetch',
    `Đã nhận dữ liệu từ "${rawData.title}" (${rawData.tabs.length} tab, ${rawData.access_mode})`,
    rawData.tabs.map(t => `Tab "${t.tab_name}": ${t.row_count} hàng, ${t.col_count} cột`),
  );

  // STEP 2: PROFILE + SCORE all tabs
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

  if (options.strict && contradictions.severity === 'high') {
    throw createIngestionError(
      'INSUFFICIENT_MAPPING',
      `Dữ liệu có mâu thuẫn nghiêm trọng. ${contradictions.fallback_recommendation ?? 'Bạn nên kiểm tra lại.'}`,
      contradictions.contradictions.join('; ')
    );
  }

  const selectedTab = selection.best.tab;
  const selectedMappings = selection.best.mappings;
  const rowRecords = convertToRecordRows(selectedTab);

  // Build ColumnMapping[]
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

  addStep(decisionLog, 'mapping_selection',
    `Ánh xạ ${columnMappings.filter(m => m.canonical_field !== 'ignore').length} cột`,
    columnMappings
      .filter(m => m.canonical_field !== 'ignore')
      .map(m => `"${m.source_header}" → ${m.canonical_field} (${Math.round(m.confidence * 100)}%)`),
  );

  // STEP 6+7: CANONICALIZE
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

  // STEP 8: COMPUTE DERIVED (using shared module)
  const derived = computeDerivedInsights(tasks, members);

  // Aggregate mapping confidence
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
  const trustLevel = determineTrustLevel(rawData.access_mode, undefined);

  // Tab evaluations
  const tabEvaluations = buildTabEvaluations(tabAnalyses, selectedTab.tab_name);

  // Rejected tab reasons
  const rejectedReasons = tabAnalyses
    .filter(a => a.tab.tab_name !== selectedTab.tab_name)
    .map(a => buildTabRejectionReason(a));

  addStep(decisionLog, 'final_validation',
    `Hoàn tất: ${tasks.length} công việc, ${members.length} thành viên`,
    [],
  );

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

// ═══════════════════════════════════════════════
// MOCK PIPELINE (explicit, never silent)
// ═══════════════════════════════════════════════

async function runMockPipeline(
  projectId: string,
  config: { sheet_url: string; provider: string; column_overrides: ColumnMapping[] }
): Promise<CanonicalProjectData> {
  const mockData = generateMockSheetData(projectId);
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
  const derived = computeDerivedInsights(tasks, members);
  const skippedRows = selectedTab.row_count - tasks.length;

  const mappedCols = columnMappings.filter(m => m.canonical_field !== 'ignore');
  const mappingConfidence = mappedCols.length > 0
    ? mappedCols.reduce((s, m) => s + m.confidence, 0) / mappedCols.length
    : 0;

  const tabEvaluations = buildTabEvaluations(tabAnalyses, selectedTab.tab_name);

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

// ═══════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════

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

  const assigneeHeader = fieldMap.get("task_assignee");
  const memberNameHeader = fieldMap.get("member_name");
  const roleHeader = fieldMap.get("member_role");
  const emailHeader = fieldMap.get("member_email");

  const nameToInfo = new Map<string, { role?: string; email?: string }>();

  for (const row of rows) {
    const names: string[] = [];
    if (assigneeHeader) {
      const val = String(row[assigneeHeader] ?? "").trim();
      if (val) names.push(val);
    }
    if (memberNameHeader) {
      const val = String(row[memberNameHeader] ?? "").trim();
      if (val) names.push(val);
    }

    for (const name of names) {
      if (!nameToInfo.has(name)) {
        const role = roleHeader ? String(row[roleHeader] ?? "").trim() || undefined : undefined;
        const email = emailHeader ? String(row[emailHeader] ?? "").trim() || undefined : undefined;
        nameToInfo.set(name, { role, email });
      }
    }
  }

  // Dedup
  const groups = new Map<string, { canonical: string; aliases: string[]; role?: string; email?: string }>();
  for (const [name, info] of nameToInfo) {
    const fp = nameFingerprint(name);
    if (groups.has(fp)) {
      const g = groups.get(fp)!;
      if (name.length > g.canonical.length) g.canonical = name;
      if (!g.aliases.includes(name)) g.aliases.push(name);
      if (!g.role && info.role) g.role = info.role;
      if (!g.email && info.email) g.email = info.email;
    } else {
      groups.set(fp, { canonical: name, aliases: [name], ...info });
    }
  }

  return Array.from(groups.values()).map(g => ({
    name: g.canonical,
    normalized_key: nameFingerprint(g.canonical),
    role: g.role || null,
    email: g.email || null,
    alias_group: g.aliases,
  }));
}

function buildBronzeLayer(rawData: RawSheetData): BronzeLayer {
  const bronzeTabs: BronzeTab[] = rawData.tabs.map(tab => {
    const profile = profileTab(tab);
    return {
      tab_name: tab.tab_name,
      tab_index: tab.tab_index,
      headers: tab.headers,
      rows: tab.rows,
      row_count: tab.row_count,
      col_count: tab.col_count,
      profile,
    };
  });

  return {
    workbook_title: rawData.title,
    tabs: bronzeTabs,
    total_tabs: rawData.tabs.length,
    total_rows: rawData.tabs.reduce((s, t) => s + t.row_count, 0),
    fetched_at: new Date().toISOString(),
  };
}

function buildTabEvaluations(
  tabAnalyses: ReturnType<typeof analyze>,
  selectedTabName: string
): SheetTabEvaluation[] {
  return tabAnalyses.map(a => ({
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
    decision: a.tab.tab_name === selectedTabName ? 'use_primary' : 'ignore' as TabDecision,
    warning_notes: a.profile.warnings,
  }));
}

function collectIdentities(
  tabs: RawTab[],
  tabAnalyses: ReturnType<typeof analyze>
): RawIdentity[] {
  const identities: RawIdentity[] = [];

  for (const analysis of tabAnalyses) {
    const assigneeMapping = analysis.mappings.find(m => m.canonical_field === 'task_assignee');
    const memberNameMapping = analysis.mappings.find(m => m.canonical_field === 'member_name');
    const emailMapping = analysis.mappings.find(m => m.canonical_field === 'member_email');
    const roleMapping = analysis.mappings.find(m => m.canonical_field === 'member_role');

    const nameIdx = assigneeMapping
      ? analysis.tab.headers.indexOf(assigneeMapping.source_header)
      : memberNameMapping
        ? analysis.tab.headers.indexOf(memberNameMapping.source_header)
        : -1;

    const emailIdx = emailMapping
      ? analysis.tab.headers.indexOf(emailMapping.source_header)
      : -1;

    const roleIdx = roleMapping
      ? analysis.tab.headers.indexOf(roleMapping.source_header)
      : -1;

    if (nameIdx < 0) continue;

    for (let r = 0; r < analysis.tab.rows.length; r++) {
      const row = analysis.tab.rows[r];
      const name = (row[nameIdx] ?? '').trim();
      if (!name) continue;

      identities.push({
        name,
        email: emailIdx >= 0 ? (row[emailIdx] ?? '').trim() || undefined : undefined,
        role: roleIdx >= 0 ? (row[roleIdx] ?? '').trim() || undefined : undefined,
        source_tab: analysis.tab.tab_name,
        source_row: r,
      });
    }
  }

  return identities;
}

function buildLinguisticReport(tabs: RawTab[]): LinguisticNormalizationReport {
  const allHeaders: string[] = [];
  const languagesDetected = new Set<string>();
  const codeSwitchedColumns: string[] = [];

  for (const tab of tabs) {
    for (const h of tab.headers) {
      allHeaders.push(h);
      const lang = detectLanguage(h);
      languagesDetected.add(lang);
      if (lang === 'mixed') codeSwitchedColumns.push(h);
    }
  }

  return {
    headers_normalized: analyzeHeaders(allHeaders),
    languages_detected: [...languagesDetected],
    code_switched_columns: codeSwitchedColumns,
    generated_at: new Date().toISOString(),
  };
}

function determineTrustLevel(
  accessMode: string,
  sourceMode?: string
): SourceTrustLevel {
  if (sourceMode === 'service_account_bot') return 'service_account_verified';
  if (sourceMode === 'csv_snapshot' || sourceMode === 'xlsx_snapshot') return 'csv_upload_unverified';
  if (sourceMode === 'mock') return 'insufficient_provenance';

  if (accessMode === 'oauth_token') return 'authenticated_private_sheet';
  if (accessMode === 'service_account') return 'service_account_verified';
  if (accessMode === 'csv_upload') return 'csv_upload_unverified';
  return 'public_unverified';
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
