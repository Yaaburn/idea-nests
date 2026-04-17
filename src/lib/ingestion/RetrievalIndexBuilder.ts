// ═══════════════════════════════════════════════
// Retrieval Index Builder
// Maps analysis intents → best data sources.
// Each route: preferred Gold → required Silver → fallback Bronze.
// ═══════════════════════════════════════════════

import type {
  RetrievalIndex,
  RetrievalRoute,
  GoldLayer,
  SilverLayer,
  BronzeLayer,
  AnalysisModelSpec,
  GoldViewKey,
} from './SnapshotTypes';
import type { ContradictionReport } from './types';

// ═══════════════════════════════════════════════
// STANDARD ANALYSIS INTENTS
// ═══════════════════════════════════════════════

export const ANALYSIS_INTENTS: AnalysisModelSpec[] = [
  {
    intent_key: 'workload_by_member',
    required_entities: ['member', 'task'],
    required_fields: ['task_assignee', 'task_status'],
    preferred_view_key: 'workload_by_member',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.5,
  },
  {
    intent_key: 'status_distribution',
    required_entities: ['task'],
    required_fields: ['task_status'],
    preferred_view_key: 'status_distribution',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.4,
  },
  {
    intent_key: 'completion_trajectory',
    required_entities: ['task'],
    required_fields: ['task_status', 'completion_date'],
    preferred_view_key: 'completion_trajectory',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.5,
  },
  {
    intent_key: 'overdue_risk',
    required_entities: ['task'],
    required_fields: ['task_status', 'deadline'],
    preferred_view_key: 'overdue_risk',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.5,
  },
  {
    intent_key: 'milestone_health',
    required_entities: ['milestone'],
    required_fields: ['milestone_name'],
    preferred_view_key: 'milestone_health',
    fallback_generation_strategy: 'unavailable',
    min_confidence: 0.5,
  },
  {
    intent_key: 'effort_variance',
    required_entities: ['task'],
    required_fields: ['planned_effort', 'actual_effort'],
    preferred_view_key: 'effort_variance',
    fallback_generation_strategy: 'unavailable',
    min_confidence: 0.5,
  },
  {
    intent_key: 'team_participation',
    required_entities: ['member', 'task'],
    required_fields: ['task_assignee'],
    preferred_view_key: 'team_participation',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.4,
  },
  {
    intent_key: 'contradiction_summary',
    required_entities: [],
    required_fields: [],
    preferred_view_key: 'contradiction_summary',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.0,
  },
  {
    intent_key: 'data_quality_panel',
    required_entities: [],
    required_fields: [],
    preferred_view_key: 'data_quality_panel',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.0,
  },
  {
    intent_key: 'sprint_health',
    required_entities: ['task'],
    required_fields: ['task_status', 'sprint_name'],
    preferred_view_key: 'sprint_health',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.4,
  },
  {
    intent_key: 'blocker_overview',
    required_entities: ['task'],
    required_fields: ['blocked_reason', 'task_status'],
    preferred_view_key: 'blocker_overview',
    fallback_generation_strategy: 'compute_from_silver',
    min_confidence: 0.3,
  },
];

// ═══════════════════════════════════════════════
// BUILD RETRIEVAL INDEX
// ═══════════════════════════════════════════════

export function buildRetrievalIndex(
  snapshotId: string,
  gold: GoldLayer,
  silver: SilverLayer,
  bronze: BronzeLayer,
  contradictions: ContradictionReport
): RetrievalIndex {
  const routes: RetrievalRoute[] = ANALYSIS_INTENTS.map(spec =>
    buildRoute(spec, gold, silver, bronze, contradictions)
  );

  return {
    snapshot_id: snapshotId,
    routes,
    generated_at: new Date().toISOString(),
  };
}

function buildRoute(
  spec: AnalysisModelSpec,
  gold: GoldLayer,
  silver: SilverLayer,
  bronze: BronzeLayer,
  contradictions: ContradictionReport
): RetrievalRoute {
  // Check Gold availability
  const goldView = spec.preferred_view_key ? gold.views[spec.preferred_view_key] : null;
  const goldAvailable = goldView && goldView.row_count > 0;

  // Check Silver availability
  const silverFields = spec.required_fields;
  const silverMapped = silverFields.filter(field =>
    silver.column_mappings.some(m => m.canonical_field === field && m.confidence >= 0.5)
  );
  const silverAvailable = silverMapped.length >= silverFields.length * 0.6;

  // Check entity availability
  const entityAvailable = spec.required_entities.every(entity => {
    switch (entity) {
      case 'task': return silver.tasks.length > 0;
      case 'member': return silver.members.length > 0;
      case 'milestone': return silver.milestones.length > 0;
      default: return false;
    }
  });

  // Determine confidence using §7.G RetrievalScore formula:
  // RetrievalScore = 0.40*gold_availability + 0.25*silver_completeness +
  //                  0.15*source_confidence + 0.10*freshness + 0.10*structural_stability
  let goldAvailability = 0;
  let silverCompleteness = 0;
  let explanation: string;

  if (goldAvailable) {
    goldAvailability = goldView!.confidence;
    silverCompleteness = 1.0;
    explanation = `Gold view "${spec.preferred_view_key}" available with ${goldView!.row_count} records`;
  } else if (silverAvailable && entityAvailable) {
    goldAvailability = 0;
    silverCompleteness = silverMapped.length / Math.max(silverFields.length, 1);
    explanation = `Silver entities available; ${silverMapped.length}/${silverFields.length} required fields mapped`;
  } else if (silverAvailable) {
    goldAvailability = 0;
    silverCompleteness = silverMapped.length / Math.max(silverFields.length, 1) * 0.6;
    explanation = `Silver fields partially available but missing entities: ${spec.required_entities.join(', ')}`;
  } else {
    explanation = `Insufficient data: ${silverMapped.length}/${silverFields.length} fields mapped`;
  }

  const sourceConfidence = silver.mapping_confidence;
  const freshness = 1.0; // Always fresh at generation time
  const structuralStability = 1.0; // Will be downgraded by drift if applicable

  let confidence =
    0.40 * goldAvailability +
    0.25 * silverCompleteness +
    0.15 * sourceConfidence +
    0.10 * freshness +
    0.10 * structuralStability;

  // Apply contradiction penalty
  const contradictionsAffecting: string[] = [];
  if (contradictions.is_contradictory) {
    for (const c of contradictions.contradictions) {
      // Check if contradiction mentions any required field
      const affects = spec.required_fields.some(f => c.toLowerCase().includes(f.replace('_', ' ')));
      if (affects) {
        contradictionsAffecting.push(c);
        confidence *= (1 - contradictions.downgrade_delta / contradictions.contradictions.length);
      }
    }
  }

  // Fallback bronze tabs
  const fallbackBronzeTabs = bronze.tabs
    .filter(t => t.row_count >= 3)
    .map(t => t.tab_name)
    .slice(0, 3);

  const available = confidence >= (spec.min_confidence ?? 0.4);

  return {
    intent_key: spec.intent_key,
    preferred_gold_view: goldAvailable ? spec.preferred_view_key! : null,
    required_silver_entities: spec.required_entities,
    required_silver_fields: spec.required_fields,
    fallback_bronze_tabs: fallbackBronzeTabs,
    confidence: Math.max(0, Math.min(1, confidence)),
    explanation,
    contradictions_affecting: contradictionsAffecting,
    available,
  };
}
