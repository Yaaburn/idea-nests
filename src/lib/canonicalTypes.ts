// ═══════════════════════════════════════════════
// Canonical Data Contract
// The typed interface between Ingestion ↔ Analysis
// Connector-agnostic: works for any future data source
// ═══════════════════════════════════════════════

// ─── Canonical Task ───

export type CanonicalStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked"
  | "cancelled"
  | "unknown";

export type CanonicalPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | null;

export interface CanonicalTask {
  task_name: string;
  task_status: CanonicalStatus;
  task_assignee: string | null;
  task_priority: CanonicalPriority;
  deadline: string | null;        // ISO 8601
  start_date: string | null;      // ISO 8601
  completion_date: string | null;  // ISO 8601
  progress_pct: number | null;    // 0-100
  sprint_name: string | null;
  milestone_name: string | null;
  notes: string | null;
  _source_row: number;            // original row index for tracing
}

// ─── Canonical Member ───

export interface CanonicalMember {
  name: string;
  normalized_key: string;         // unaccented, lowercased, fingerprint
  role: string | null;
  email: string | null;
  alias_group: string[];          // all name variants that resolved to this person
}

// ─── Canonical Milestone ───

export interface CanonicalMilestone {
  name: string;
  date: string | null;            // ISO 8601
  status: CanonicalStatus;
}

// ─── Column Mapping ───

export type DetectionMethod =
  | "exact_match"
  | "fuzzy_match"
  | "value_pattern"
  | "positional"
  | "cross_column"
  | "manual_override";

export type CanonicalFieldName =
  | "task_name"
  | "task_status"
  | "task_assignee"
  | "task_priority"
  | "deadline"
  | "start_date"
  | "completion_date"
  | "progress_pct"
  | "sprint_name"
  | "milestone_name"
  | "notes"
  | "member_name"
  | "member_role"
  | "member_email"
  | "planned_effort"
  | "actual_effort"
  | "ignore";

export interface ColumnMapping {
  source_header: string;
  canonical_field: CanonicalFieldName;
  confidence: number;             // 0–1
  detection_method: DetectionMethod;
  reasoning: string;
}

// ─── Sheet Tab Evaluation ───

export type SheetTabType =
  | "task_list"
  | "member_list"
  | "timeline"
  | "mixed_tracker"
  | "summary_dashboard"
  | "notes_log"
  | "quality_log"
  | "irrelevant"
  | "ambiguous"
  | "unknown";

// ─── Tab Classification (§5) ───

export type TabClassification =
  | "task_operational"
  | "member_dimension"
  | "timeline_schedule"
  | "summary_dashboard"
  | "notes_admin"
  | "quality_log"
  | "irrelevant"
  | "ambiguous";

// ─── Tab Version Status (§9) ───

export type TabVersionStatus =
  | "new"
  | "existing_unchanged"
  | "existing_changed"
  | "deprecated_missing"
  | "ambiguous_match";

export type TabDecision = "use_primary" | "use_supporting" | "ignore";

export interface TabScoreComponents {
  header_semantics: number;
  cell_pattern_signal: number;
  data_density: number;
  canonical_field_coverage: number;
  cross_column_consistency: number;
  row_quality: number;
  user_value: number;
  noise_penalty: number;
}

export interface SheetTabEvaluation {
  tab_name: string;
  tab_index: number;
  likely_type: SheetTabType;
  tab_classification: TabClassification;
  tab_version_status: TabVersionStatus;
  confidence: number;             // 0–1
  final_score: number;
  score_components: TabScoreComponents;
  detected_columns: string[];
  evidence: string[];
  decision: TabDecision;
  warning_notes: string[];
  table_block_score: number;      // §5 composite
  header_row_detected: number;    // actual header row index
}

// ─── Ingestion Errors & Warnings ───

export type IngestionErrorCode =
  | "FETCH_FAILED"
  | "NO_SUITABLE_TAB"
  | "INSUFFICIENT_MAPPING"
  | "AUTH_REQUIRED"
  | "INVALID_SOURCE"
  | "EMPTY_DATA"
  | "PARTIAL_DATA_WARNING";

export interface IngestionWarning {
  code: IngestionErrorCode;
  message_vi: string;             // User-facing Vietnamese message
  detail: string;                 // Technical detail for debugging
  severity: "info" | "warning" | "error";
}

// ─── Source Trust Level ───

export type SourceTrustLevel =
  | "public_unverified"
  | "authenticated_user_access"
  | "authenticated_private_sheet"
  | "service_account_verified"
  | "csv_upload_unverified"
  | "shared_but_unverified_owner"
  | "insufficient_provenance";

// ─── Source Provenance ───

export interface SourceProvenance {
  provider: string;
  source_url: string;
  fetched_at: string;             // ISO 8601
  tab_used: string;
  tabs_inspected: string[];       // all tabs that were evaluated
  tabs_rejected: string[];        // tabs that were scored but not selected
  row_count_raw: number;
  row_count_valid: number;
  rows_skipped: number;
  access_mode: "api_key" | "oauth_token" | "service_account" | "csv_upload";
  trust_level: SourceTrustLevel;
  spreadsheet_title: string;
  fingerprint_sha256: string;
}

// ─── Ingestion Metadata (per-run, ephemeral) ───

export interface IngestionMetadata {
  is_mock: boolean;
  hypothesis_count: number;
  contradiction_count: number;
  ambiguity_score: number;        // 0–1
  fusion_used: boolean;
  decision_log_summary: string[];
  tab_selection_reason_vi: string;
  rejected_tab_reasons_vi: string[];
}

// ─── Derived Insights ───

export interface DerivedInsights {
  overall_completion_pct: number;
  total_tasks: number;
  tasks_by_status: Record<CanonicalStatus, number>;
  tasks_by_assignee: Record<string, number>;
  completion_rate_by_assignee: Record<string, number>; // 0–100
  milestone_completion_pct: number;
  overdue_count: number;
  blocked_count: number;
  avg_progress_pct: number;
}

// ─── Canonical Project Data (Top-Level Output) ───

export interface CanonicalProjectData {
  project_id: string;
  tasks: CanonicalTask[];
  members: CanonicalMember[];
  milestones: CanonicalMilestone[];
  column_mappings: ColumnMapping[];
  tab_evaluations: SheetTabEvaluation[];
  derived: DerivedInsights;
  warnings: IngestionWarning[];
  mapping_confidence: number;     // 0–1 aggregate
  source: SourceProvenance;
  metadata: IngestionMetadata;
  ingested_at: string;            // ISO 8601
}

export type ConnectorMode = "google_oauth" | "service_account" | "csv_upload" | "xlsx_upload";

export interface ProjectIntegrationConfig {
  project_id: string;
  sheet_url: string;
  sheet_title?: string;            // display name of the sheet
  provider: "google_sheets" | "csv_upload";  // extensible union
  connector_mode: ConnectorMode;
  sync_interval: number;          // minutes
  sync_mode?: "manual" | "auto";  // manual or auto sync
  sync_frequency?: number;        // minutes: 15, 60, 720, 1440
  column_overrides: ColumnMapping[];
  configured_by: string;
  configured_at: string;
  csv_filename?: string;           // only for csv_upload mode
  last_connected_at?: string;      // ISO 8601
  last_synced_at?: string;         // ISO 8601
  last_disconnected_at?: string;   // ISO 8601
  status?: "active" | "error";     // connection health
  status_message?: string;         // error details
}
