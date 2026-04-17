// ═══════════════════════════════════════════════
// Weight Configuration — Centralized, Tunable, Auditable
// All scoring weights in one place.
// Every weight has a JSDoc explaining its role.
// ═══════════════════════════════════════════════

export interface TabScoringWeights {
  /** Header semantic match ratio (synonym hits / total headers) */
  structural_signal: number;
  /** Multilingual synonym match quality */
  semantic_signal: number;
  /** Value-pattern detection (dates, statuses, emails, names) */
  value_pattern_signal: number;
  /** Non-empty ratio × row quality */
  completeness_signal: number;
  /** Presence of task cluster + member cluster */
  cross_tab_consistency: number;
  /** Penalty from contradiction checker */
  contradiction_penalty: number;
  /** Penalty for generic/noise tab names */
  noise_penalty: number;
  /** Penalty for competing close-score tabs */
  ambiguity_penalty: number;
}

export interface EntityResolutionWeights {
  /** Jaro-Winkler or normalized name similarity */
  normalized_name_similarity: number;
  /** Exact or near-exact email match */
  email_equality: number;
  /** Initials/fingerprint comparison */
  initials_match: number;
  /** Same role detected across tabs */
  role_context_match: number;
  /** Co-occurrence in same rows */
  co_occurrence_score: number;
}

export interface EntityResolutionThresholds {
  /** Score >= this → auto-merge */
  auto_merge: number;
  /** Score >= this but < auto_merge → suggest review */
  suggest_review: number;
  /** Score < suggest_review → keep separate */
  keep_separate: number;
}

export interface ConfidenceThresholds {
  /** Column mapping confidence: auto-apply threshold */
  column_auto_apply: number;
  /** Column mapping confidence: suggest-review threshold */
  column_suggest_review: number;
  /** Tab selection: minimum score to consider */
  tab_minimum_score: number;
  /** Tab selection: ambiguity threshold (score diff) */
  tab_ambiguity_threshold: number;
  /** Retrieval: minimum confidence to mark route as available */
  retrieval_minimum: number;
  /** Widget: minimum confidence to render data */
  widget_minimum: number;
}

export interface AnomalyThresholds {
  /** Robust z-score threshold for MAD-based outlier detection */
  mad_z_threshold: number;
  /** Minimum row fill ratio (non-empty cells / total cells) */
  sparse_row_threshold: number;
  /** Maximum valid progress percentage */
  max_progress_pct: number;
  /** Status column: max unique values before flagging high cardinality */
  status_max_cardinality: number;
}

export interface ColumnTypeScoringWeights {
  /** Header similarity (synonym match) */
  header_similarity: number;
  /** Value pattern score (dates, emails, statuses) */
  value_pattern_score: number;
  /** Statistical profile (cardinality, distribution) */
  statistical_profile_score: number;
  /** Contextual neighbor (adjacent column signals) */
  contextual_neighbor_score: number;
  /** Tab category prior (task tab vs member tab) */
  tab_category_prior: number;
  /** Multilingual support quality */
  multilingual_support_score: number;
}

export interface DriftScoringWeights {
  /** Header change ratio weight */
  header_change_ratio: number;
  /** Tab change ratio weight */
  tab_change_ratio: number;
  /** Semantic shift ratio weight */
  semantic_shift_ratio: number;
  /** Coverage drop ratio weight */
  coverage_drop_ratio: number;
}

export interface RetrievalScoringWeights {
  /** Gold view availability weight */
  gold_availability: number;
  /** Silver completeness weight */
  silver_completeness: number;
  /** Source confidence weight */
  source_confidence: number;
  /** Freshness weight */
  freshness: number;
  /** Structural stability weight */
  structural_stability: number;
}

export interface WeightConfiguration {
  tab_scoring: TabScoringWeights;
  column_type_scoring: ColumnTypeScoringWeights;
  entity_resolution: EntityResolutionWeights;
  entity_resolution_thresholds: EntityResolutionThresholds;
  confidence_thresholds: ConfidenceThresholds;
  anomaly_thresholds: AnomalyThresholds;
  drift_scoring: DriftScoringWeights;
  retrieval_scoring: RetrievalScoringWeights;
  version: string;
}

// ═══════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════

export const DEFAULT_WEIGHTS: WeightConfiguration = {
  tab_scoring: {
    structural_signal: 0.20,
    semantic_signal: 0.24,
    value_pattern_signal: 0.18,
    completeness_signal: 0.12,
    cross_tab_consistency: 0.10,
    contradiction_penalty: 0.06,
    noise_penalty: 0.05,
    ambiguity_penalty: 0.05,
  },

  column_type_scoring: {
    header_similarity: 0.30,
    value_pattern_score: 0.25,
    statistical_profile_score: 0.15,
    contextual_neighbor_score: 0.15,
    tab_category_prior: 0.10,
    multilingual_support_score: 0.05,
  },

  entity_resolution: {
    normalized_name_similarity: 0.40,
    email_equality: 0.25,
    initials_match: 0.15,
    role_context_match: 0.10,
    co_occurrence_score: 0.10,
  },

  entity_resolution_thresholds: {
    auto_merge: 0.75,
    suggest_review: 0.50,
    keep_separate: 0.50,
  },

  confidence_thresholds: {
    column_auto_apply: 0.90,
    column_suggest_review: 0.65,
    tab_minimum_score: 20,
    tab_ambiguity_threshold: 15,
    retrieval_minimum: 0.50,
    widget_minimum: 0.40,
  },

  anomaly_thresholds: {
    mad_z_threshold: 3.0,
    sparse_row_threshold: 0.20,
    max_progress_pct: 100,
    status_max_cardinality: 15,
  },

  drift_scoring: {
    header_change_ratio: 0.35,
    tab_change_ratio: 0.25,
    semantic_shift_ratio: 0.20,
    coverage_drop_ratio: 0.20,
  },

  retrieval_scoring: {
    gold_availability: 0.40,
    silver_completeness: 0.25,
    source_confidence: 0.15,
    freshness: 0.10,
    structural_stability: 0.10,
  },

  version: '2.0.0',
};

/**
 * Get the active weight configuration.
 * In future, this could load from a config file or database.
 */
export function getWeights(): WeightConfiguration {
  return DEFAULT_WEIGHTS;
}
