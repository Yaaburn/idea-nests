// ═══════════════════════════════════════════════
// Snapshot Types — Fixed Package Per Sync
// Defines Bronze/Silver/Gold data layers,
// retrieval index, quality report, provenance,
// and analysis model contracts.
// ═══════════════════════════════════════════════

import type {
  CanonicalProjectData,
  CanonicalTask,
  CanonicalMember,
  CanonicalMilestone,
  CanonicalStatus,
  ColumnMapping,
  SheetTabEvaluation,
  IngestionWarning,
  SourceTrustLevel,
  TabVersionStatus,
} from '../canonicalTypes';
import type {
  RawTab,
  TabProfile,
  ContradictionReport,
  SourceFingerprintData,
  DetectionHypothesis,
} from './types';
import type { MasterTaskFact, TeamDim, MilestoneDim, SnapshotMeta } from './MasterTaskFactTypes';

// ═══════════════════════════════════════════════
// MANIFEST
// ═══════════════════════════════════════════════

export interface SnapshotManifest {
  snapshot_id: string;
  project_id: string;
  integration_id: string;
  created_at: string; // ISO 8601
  version: number;
  source_mode: 'oauth_user' | 'service_account_bot' | 'csv_snapshot' | 'xlsx_snapshot' | 'mock';
  layers_present: ('bronze' | 'silver' | 'gold')[];
  artifact_keys: string[];
  fingerprint_sha256: string;
}

// ═══════════════════════════════════════════════
// PROVENANCE (immutable per snapshot)
// ═══════════════════════════════════════════════

export interface SnapshotProvenance {
  snapshot_id: string;
  source_url: string;
  spreadsheet_id: string;
  spreadsheet_title: string;
  access_mode: 'api_key' | 'oauth_token' | 'service_account' | 'csv_upload';
  trust_level: SourceTrustLevel;
  fetched_at: string;
  tabs_total: number;
  tabs_ingested: string[];
  tabs_rejected: TabRejection[];
  fingerprint: SourceFingerprintData;
  previous_snapshot_id: string | null;
}

export interface TabRejection {
  tab_name: string;
  reason: string;
  score: number;
}

// ═══════════════════════════════════════════════
// BRONZE LAYER — Raw Source Fidelity
// ═══════════════════════════════════════════════

export interface BronzeLayer {
  workbook_title: string;
  tabs: BronzeTab[];
  total_tabs: number;
  total_rows: number;
  fetched_at: string;
}

export interface BronzeTab {
  tab_name: string;
  tab_index: number;
  headers: string[];
  rows: string[][];
  row_count: number;
  col_count: number;
  profile: TabProfile;
}

// ═══════════════════════════════════════════════
// SILVER LAYER — Canonicalized Project Data
// ═══════════════════════════════════════════════

export interface SilverLayer {
  tasks: CanonicalTask[];
  members: CanonicalMember[];
  milestones: CanonicalMilestone[];
  risks: CanonicalRisk[];
  blockers: CanonicalBlocker[];
  efforts: CanonicalEffort[];
  master_task_fact: MasterTaskFact[];
  team_dim: TeamDim[];
  milestone_dim: MilestoneDim[];
  column_mappings: ColumnMapping[];
  tab_evaluations: SheetTabEvaluation[];
  entity_resolution: EntityResolutionReport;
  linguistic_normalization: LinguisticNormalizationReport;
  mapping_confidence: number; // 0–1
}

export interface CanonicalRisk {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  related_task: string | null;
  related_milestone: string | null;
  source_tab: string;
  source_row: number;
}

export interface CanonicalBlocker {
  description: string;
  blocking_task: string | null;
  blocked_by: string | null;
  status: 'active' | 'resolved';
  source_tab: string;
  source_row: number;
}

export interface CanonicalEffort {
  task_name: string;
  member_name: string | null;
  planned_hours: number | null;
  actual_hours: number | null;
  variance: number | null; // actual - planned
  source_tab: string;
  source_row: number;
}

// ═══════════════════════════════════════════════
// GOLD LAYER — Analysis-Ready Views
// ═══════════════════════════════════════════════

export interface GoldLayer {
  views: Record<string, AnalysisReadyView>;
  generated_at: string;
}

export interface AnalysisReadyView {
  view_key: string;
  intent: string;
  data: Record<string, unknown>[];
  row_count: number;
  confidence: number;
  source_entities: string[];
  source_fields: string[];
  transformation_formula: string;
  freshness: string;
  contradiction_impact: number;
  explanation_vi: string;
  explanation_en: string;
  warnings: string[];
  generated_from: 'silver' | 'bronze' | 'master_task_fact';
}

// Pre-defined Gold view keys
export type GoldViewKey =
  | 'workload_by_member'
  | 'status_distribution'
  | 'completion_trajectory'
  | 'overdue_risk'
  | 'milestone_health'
  | 'sprint_health'
  | 'effort_variance'
  | 'blocker_overview'
  | 'team_participation'
  | 'contradiction_summary'
  | 'data_quality_panel';

// ═══════════════════════════════════════════════
// RETRIEVAL INDEX
// ═══════════════════════════════════════════════

export interface RetrievalIndex {
  snapshot_id: string;
  routes: RetrievalRoute[];
  generated_at: string;
}

export interface RetrievalRoute {
  intent_key: string;
  preferred_gold_view: string | null;
  required_silver_entities: string[];
  required_silver_fields: string[];
  fallback_bronze_tabs: string[];
  confidence: number; // 0–1
  explanation: string;
  contradictions_affecting: string[];
  available: boolean;
}

// ═══════════════════════════════════════════════
// QUALITY REPORT
// ═══════════════════════════════════════════════

export interface QualityReport {
  snapshot_id: string;
  completeness_score: number;    // 0–1
  contradiction_score: number;   // 0–1 (0 = no contradictions)
  ambiguity_score: number;       // 0–1
  retrieval_confidence: number;  // 0–1
  source_trust_level: SourceTrustLevel;
  structural_stability_score: number; // 0–1 (vs previous snapshot)
  freshness_score: number;       // 0–1
  overall_quality: number;       // 0–1 composite
  anomalies: AnomalyRecord[];
  contradiction_report: ContradictionReport;
  generated_at: string;
}

export interface AnomalyRecord {
  type: 'impossible_date' | 'progress_overflow' | 'negative_effort'
    | 'duplicate_entity' | 'status_cardinality' | 'sparse_row'
    | 'summary_vs_operational_mismatch' | 'outlier_value';
  description: string;
  severity: 'info' | 'warning' | 'error';
  location: {
    tab?: string;
    row?: number;
    column?: string;
  };
  value?: string;
}

// ═══════════════════════════════════════════════
// STRUCTURAL DRIFT
// ═══════════════════════════════════════════════

export interface StructuralDriftReport {
  previous_snapshot_id: string;
  current_snapshot_id: string;
  drift_detected: boolean;
  headers_added: string[];
  headers_removed: string[];
  tabs_added: string[];
  tabs_removed: string[];
  meaning_shifts: MeaningShift[];
  coverage_delta: number; // negative = dropped
  row_count_delta: number;
  severity: 'none' | 'minor' | 'major' | 'breaking';
}

export interface MeaningShift {
  header: string;
  previous_mapping: string;
  current_mapping: string;
  tab: string;
}

// ═══════════════════════════════════════════════
// ENTITY RESOLUTION REPORT
// ═══════════════════════════════════════════════

export interface EntityResolutionReport {
  total_raw_names: number;
  total_resolved_entities: number;
  merges: EntityMerge[];
  conflicts: EntityConflict[];
  unresolved: string[];
}

export interface EntityMerge {
  canonical_name: string;
  aliases: string[];
  merge_confidence: number;
  merge_signals: string[];
}

export interface EntityConflict {
  name_a: string;
  name_b: string;
  similarity_score: number;
  reason: string;
  resolution: 'merged' | 'kept_separate' | 'needs_review';
}

// ═══════════════════════════════════════════════
// LINGUISTIC NORMALIZATION REPORT
// ═══════════════════════════════════════════════

export interface LinguisticNormalizationReport {
  headers_normalized: HeaderNormalization[];
  languages_detected: string[];
  code_switched_columns: string[];
  generated_at: string;
}

export interface HeaderNormalization {
  original: string;
  normalized: string;
  language: 'vi' | 'en' | 'mixed' | 'unknown';
  matched_field: string | null;
  match_method: string | null;
  match_confidence: number;
}

// ═══════════════════════════════════════════════
// ANALYSIS MODEL CONTRACT
// ═══════════════════════════════════════════════

export interface AnalysisModelSpec {
  intent_key: string;
  required_entities: string[];
  required_fields: string[];
  preferred_view_key?: string;
  fallback_generation_strategy?: 'compute_from_silver' | 'aggregate_from_bronze' | 'unavailable';
  min_confidence?: number;
}

// ═══════════════════════════════════════════════
// WIDGET SOURCE TRACE
// ═══════════════════════════════════════════════

export interface WidgetSourceTrace {
  widget_id: string;
  intent_key: string;
  source_view: string | null;
  source_layer: 'gold' | 'silver' | 'bronze' | 'unavailable';
  confidence: number;
  freshness_seconds: number;
  contradictions: string[];
  explanation: string;
}

// ═══════════════════════════════════════════════
// TAB LIFECYCLE REPORT
// ═══════════════════════════════════════════════

export interface TabLifecycleResult {
  tab_name: string;
  version_status: import('../canonicalTypes').TabVersionStatus;
  similarity_score: number;
  matched_previous_tab: string | null;
  tab_name_similarity: number;
  header_jaccard_similarity: number;
  semantic_profile_similarity: number;
  row_scale_similarity: number;
}

export interface TabLifecycleReport {
  results: TabLifecycleResult[];
  new_tabs: string[];
  deprecated_tabs: string[];
  changed_tabs: string[];
  unchanged_tabs: string[];
  ambiguous_tabs: string[];
  generated_at: string;
}

// ═══════════════════════════════════════════════
// FULL SNAPSHOT PACKAGE
// ═══════════════════════════════════════════════

export interface SnapshotPackage {
  manifest: SnapshotManifest;
  provenance: SnapshotProvenance;
  bronze: BronzeLayer;
  silver: SilverLayer;
  gold: GoldLayer;
  retrieval_index: RetrievalIndex;
  quality_report: QualityReport;
  structural_drift: StructuralDriftReport | null;
  tab_lifecycle: TabLifecycleReport | null;
  snapshot_meta: SnapshotMeta;
}

// ═══════════════════════════════════════════════
// API RESPONSE CONTRACTS (locked)
// ═══════════════════════════════════════════════

/**
 * GET /api/snapshots/:projectId/latest
 */
export interface SnapshotLatestResponse {
  found: boolean;
  snapshot_id: string | null;
  project_id: string;
  created_at: string | null;
  source_mode: string | null;
  trust_level: SourceTrustLevel | null;
  gold: GoldLayer | null;
  silver_summary: {
    task_count: number;
    member_count: number;
    milestone_count: number;
    mapping_confidence: number;
  } | null;
  quality_overview: {
    overall_quality: number;
    completeness_score: number;
    contradiction_score: number;
    anomaly_count: number;
  } | null;
  warnings: IngestionWarning[];
  is_mock: boolean;
}

/**
 * GET /api/snapshots/:projectId/quality
 */
export interface SnapshotQualityResponse {
  found: boolean;
  snapshot_id: string | null;
  quality_report: QualityReport | null;
  structural_drift: StructuralDriftReport | null;
}

/**
 * GET /api/snapshots/:projectId/retrieval-index
 */
export interface SnapshotRetrievalIndexResponse {
  found: boolean;
  snapshot_id: string | null;
  retrieval_index: RetrievalIndex | null;
}

/**
 * GET /api/snapshots/:projectId/provenance
 */
export interface SnapshotProvenanceResponse {
  found: boolean;
  snapshot_id: string | null;
  provenance: SnapshotProvenance | null;
  manifest: SnapshotManifest | null;
}
