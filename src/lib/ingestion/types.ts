// ═══════════════════════════════════════════════
// Ingestion Types — Shared across all ingestion modules
// These types define the raw/intermediate data shapes.
// ═══════════════════════════════════════════════

// ─── Raw Data from Connector ───

export interface RawTab {
  tab_name: string;
  tab_index: number;
  headers: string[];
  rows: string[][];    // 2D array: rows[row_index][col_index]
  row_count: number;
  col_count: number;
}

export interface RawSheetData {
  spreadsheet_id: string;
  title: string;
  tabs: RawTab[];
  access_mode: 'api_key' | 'oauth_token' | 'service_account' | 'csv_upload';
}

// ─── Tab Profiling ───

export interface TabProfile {
  tab_name: string;
  tab_index: number;
  row_count: number;
  col_count: number;
  non_empty_ratio: number;
  row_quality_score: number;
  header_quality_score: number;
  low_cardinality_columns: number[];
  date_like_columns: number[];
  percent_like_columns: number[];
  email_like_columns: number[];
  name_like_columns: number[];
  status_like_columns: number[];
  note_like_columns: number[];
  repeated_header_penalty: number;
  noise_penalty: number;
  likely_shape: 'row_level' | 'summary' | 'notes' | 'unknown';
  warnings: string[];
}

// ─── Hypothesis ───

export type TabHypothesisMode =
  | 'single_tab'
  | 'fused_tabs'
  | 'summary_only'
  | 'unknown';

export interface DetectionHypothesis {
  hypothesis_id: string;
  primary_tab_name: string | null;
  supporting_tab_names: string[];
  inferred_mode: TabHypothesisMode;
  predicted_output_coverage: number;
  confidence: number;
  evidence_for: string[];
  evidence_against: string[];
  contradictions: string[];
  tab_type: 'task_list' | 'member_list' | 'mixed_tracker' | 'unknown';
}

// ─── Contradiction ───

export interface ContradictionReport {
  is_contradictory: boolean;
  severity: 'low' | 'medium' | 'high';
  contradictions: string[];
  downgrade_delta: number;
  fallback_recommendation: string | null;
}

// ─── Source Fingerprint ───

export interface SourceFingerprintData {
  fingerprint_sha256: string;
  source_kind: 'google_sheets' | 'csv_upload';
  spreadsheet_id: string;
  inspected_tabs: string[];
  selected_tabs: string[];
  row_signature_count: number;
}

// ─── Decision Log ───

export type DecisionStepName =
  | 'access_test'
  | 'metadata_fetch'
  | 'tab_profile'
  | 'hypothesis_generation'
  | 'contradiction_check'
  | 'tab_selection'
  | 'mapping_selection'
  | 'normalization'
  | 'fusion'
  | 'canonicalization'
  | 'final_validation';

export interface DecisionStep {
  step: DecisionStepName;
  summary_vi: string;
  evidence: string[];
  severity: 'info' | 'warning' | 'critical';
}

export interface IngestionDecisionLogData {
  run_id: string;
  steps: DecisionStep[];
}

// ─── Trust Level ───

export type SourceTrustLevel =
  | 'public_unverified'
  | 'authenticated_user_access'
  | 'authenticated_private_sheet'
  | 'service_account_verified'
  | 'csv_upload_unverified'
  | 'shared_but_unverified_owner'
  | 'insufficient_provenance';

// ─── Mapping Action ───

export type MappingActionTier =
  | 'auto_apply'
  | 'suggest_review'
  | 'leave_unmapped';

// ─── Cross-Tab Fusion ───

export interface FusionPlan {
  primary_tab: string;
  member_tab: string | null;
  timeline_tab: string | null;
  join_signals: string[];
  fusion_feasible: boolean;
  rejection_reason: string | null;
}
