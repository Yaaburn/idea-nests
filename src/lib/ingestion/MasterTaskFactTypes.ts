// ═══════════════════════════════════════════════
// MASTER_TASK_FACT Types — Canonical Master Schema
// ONE ROW = ONE TASK RECORD FOR ONE SNAPSHOT
// The single source of truth for analysis models.
// ═══════════════════════════════════════════════

// ─── Field-Level Metadata ───

export interface FieldMeta {
  confidence: number;          // 0–1
  source_tab: string | null;
  source_row: number | null;
  derivation: 'direct' | 'normalized' | 'computed' | 'enriched' | 'default';
}

// ─── MASTER_TASK_FACT — Primary Grain ───

export interface MasterTaskFact {
  // ═══ A. IDENTIFIERS ═══
  project_id: string;
  integration_id: string;
  snapshot_id: string;
  workbook_id: string;
  workbook_title: string;
  source_mode: string;
  source_trust_level: string;
  source_tab_name: string;
  source_tab_type: string;
  source_tab_index: number;
  source_tab_version_status: string;
  source_tab_first_seen_at: string | null;
  source_tab_last_seen_at: string | null;
  source_row_index: number;
  source_block_id: string | null;
  source_cell_ref_start: string | null;
  source_cell_ref_end: string | null;
  task_id: string;
  parent_task_id: string | null;
  epic_id: string | null;
  milestone_id: string | null;
  sprint_id: string | null;

  // ═══ B. TASK CORE ═══
  task_name: string;
  task_name_normalized: string;
  task_aliases: string[];
  task_description: string | null;
  task_type: string | null;
  task_category: string | null;
  task_scope: string | null;
  task_domain: string | null;
  epic_name: string | null;
  story_name: string | null;
  deliverable_name: string | null;
  work_item_type: string | null;
  is_subtask: boolean;
  is_blocked: boolean;
  is_rework: boolean;
  is_deleted_logically: boolean;

  // ═══ C. OWNERSHIP / RESPONSIBILITY ═══
  assignee_name: string | null;
  assignee_name_normalized: string | null;
  assignee_email: string | null;
  assignee_role: string | null;
  assignee_team: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
  reviewer_role: string | null;
  checker_name: string | null;
  checker_email: string | null;
  approver_name: string | null;
  approver_email: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  creator_name: string | null;
  creator_email: string | null;

  // ═══ D. TIMELINE / DATE ═══
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  deadline: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  duration_planned_days: number | null;
  duration_actual_days: number | null;
  delay_days: number | null;
  age_days: number | null;
  cycle_time_days: number | null;
  lead_time_days: number | null;

  // ═══ E. STATUS / PROGRESS ═══
  status_raw: string | null;
  status_normalized: string;
  status_group: string;
  progress_pct_raw: string | null;
  progress_pct: number | null;
  completion_flag: boolean;
  acceptance_status: string | null;
  review_status: string | null;
  qa_status: string | null;
  blocked_reason: string | null;
  blocker_flag: boolean;
  blocker_type: string | null;

  // ═══ F. PRIORITY / RISK / SEVERITY ═══
  priority_raw: string | null;
  priority_normalized: string | null;
  severity_raw: string | null;
  severity_normalized: string | null;
  risk_level: string | null;
  risk_score: number | null;
  risk_reason: string | null;
  escalation_flag: boolean;

  // ═══ G. EFFORT / WORKLOAD ═══
  planned_effort_hours: number | null;
  actual_effort_hours: number | null;
  remaining_effort_hours: number | null;
  workload_points: number | null;
  story_points: number | null;
  complexity_score: number | null;
  estimation_confidence: number | null;
  variance_effort_hours: number | null;
  variance_effort_pct: number | null;

  // ═══ H. AGILE / DELIVERY CONTEXT ═══
  sprint_name: string | null;
  sprint_goal: string | null;
  sprint_order: number | null;
  milestone_name: string | null;
  phase_name: string | null;
  release_name: string | null;
  stream_name: string | null;
  workstream_name: string | null;
  board_name: string | null;

  // ═══ I. QUALITY / DEFECT / CHECKING ═══
  bug_count: number | null;
  reopened_count: number | null;
  defect_flag: boolean;
  defect_severity: string | null;
  verification_flag: boolean;
  test_case_ref: string | null;
  review_comment_count: number | null;
  rejection_count: number | null;

  // ═══ J. COMMUNICATION / EVIDENCE ═══
  note_text: string | null;
  note_count: number | null;
  comment_count: number | null;
  update_count: number | null;
  meeting_ref: string | null;
  decision_ref: string | null;
  document_ref: string | null;
  artifact_ref: string | null;
  source_comment_excerpt: string | null;

  // ═══ K. DEPENDENCY / LINKAGE ═══
  dependency_ids: string[];
  dependency_count: number;
  dependent_task_ids: string[];
  linked_member_ids: string[];
  linked_milestone_ids: string[];
  linked_risk_ids: string[];

  // ═══ L. ANALYTICS / PIPELINE METADATA ═══
  canonical_confidence: number;
  retrieval_confidence: number | null;
  anomaly_score: number | null;
  contradiction_count: number;
  contradiction_severity: string | null;
  structural_stability_score: number | null;
  freshness_score: number | null;
  completeness_score: number | null;
  ambiguity_score: number | null;
  entity_resolution_confidence: number | null;
  linguistic_confidence: number | null;
  routing_view_key: string | null;
  routing_intent_key: string | null;
  route_explanation_vi: string | null;
  route_explanation_en: string | null;

  // ═══ M. MULTILINGUAL / NORMALIZATION METADATA ═══
  detected_language: string | null;
  header_language: string | null;
  source_header_raw: string | null;
  source_header_normalized: string | null;
  source_value_pattern: string | null;
  transliteration_key: string | null;
  normalized_entity_key: string | null;
}

// ─── Factory: Create empty/default MasterTaskFact ───

export function createEmptyMasterTaskFact(
  projectId: string,
  snapshotId: string,
  integrationId: string,
  workbookId: string,
  workbookTitle: string,
  sourceMode: string,
  trustLevel: string,
): Partial<MasterTaskFact> {
  const now = new Date().toISOString();
  return {
    project_id: projectId,
    integration_id: integrationId,
    snapshot_id: snapshotId,
    workbook_id: workbookId,
    workbook_title: workbookTitle,
    source_mode: sourceMode,
    source_trust_level: trustLevel,
    task_aliases: [],
    is_subtask: false,
    is_blocked: false,
    is_rework: false,
    is_deleted_logically: false,
    completion_flag: false,
    blocker_flag: false,
    escalation_flag: false,
    defect_flag: false,
    verification_flag: false,
    dependency_ids: [],
    dependency_count: 0,
    dependent_task_ids: [],
    linked_member_ids: [],
    linked_milestone_ids: [],
    linked_risk_ids: [],
    canonical_confidence: 0,
    contradiction_count: 0,
    first_seen_at: now,
    last_seen_at: now,
    status_normalized: 'unknown',
    status_group: 'unknown',
    task_name: '',
    task_name_normalized: '',
  };
}

// ─── Supporting Dimension Types ───

export interface TeamDim {
  member_id: string;
  name: string;
  normalized_key: string;
  email: string | null;
  role: string | null;
  team: string | null;
  aliases: string[];
  source_tabs: string[];
  resolution_confidence: number;
}

export interface MilestoneDim {
  milestone_id: string;
  name: string;
  date: string | null;
  status: string;
  source_tab: string;
}

export interface SnapshotMeta {
  snapshot_id: string;
  project_id: string;
  integration_id: string;
  created_at: string;
  source_mode: string;
  total_tabs: number;
  tabs_ingested: number;
  total_raw_rows: number;
  total_master_rows: number;
  overall_quality: number;
  mapping_confidence: number;
}

// ─── Status Group Mapping ───

export const STATUS_GROUPS: Record<string, string> = {
  todo: 'not_started',
  in_progress: 'active',
  in_review: 'active',
  done: 'completed',
  blocked: 'blocked',
  cancelled: 'cancelled',
  unknown: 'unknown',
};
