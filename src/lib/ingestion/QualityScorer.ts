// ═══════════════════════════════════════════════
// Quality Scorer — Composite Quality Assessment
// Computes completeness, contradiction, ambiguity,
// trust, stability, and freshness scores.
// ═══════════════════════════════════════════════

import type {
  QualityReport,
  AnomalyRecord,
  SilverLayer,
  BronzeLayer,
  StructuralDriftReport,
  SnapshotPackage,
} from './SnapshotTypes';
import type { ContradictionReport } from './types';
import type { SourceTrustLevel } from '../canonicalTypes';

export function computeQualityReport(
  snapshotId: string,
  silver: SilverLayer,
  bronze: BronzeLayer,
  contradictions: ContradictionReport,
  anomalies: AnomalyRecord[],
  trustLevel: SourceTrustLevel,
  drift: StructuralDriftReport | null
): QualityReport {
  // Completeness: how many core fields are mapped with confidence
  const coreFields = ['task_name', 'task_status', 'task_assignee', 'deadline'];
  const mappedCore = coreFields.filter(f =>
    silver.column_mappings.some(m => m.canonical_field === f && m.confidence >= 0.5)
  );
  const completenessScore = mappedCore.length / coreFields.length;

  // Contradiction score (0 = no contradictions, 1 = fully contradictory)
  const contradictionScore = contradictions.is_contradictory
    ? Math.min(1, contradictions.downgrade_delta * 2)
    : 0;

  // Ambiguity score
  const lowConfidenceMappings = silver.column_mappings.filter(
    m => m.canonical_field !== 'ignore' && m.confidence < 0.7
  );
  const ambiguityScore = silver.column_mappings.length > 0
    ? lowConfidenceMappings.length / silver.column_mappings.filter(m => m.canonical_field !== 'ignore').length
    : 1;

  // Retrieval confidence (aggregate mapping confidence)
  const retrieval = silver.mapping_confidence;

  // Structural stability (from drift report)
  let stabilityScore = 1.0;
  if (drift && drift.drift_detected) {
    switch (drift.severity) {
      case 'breaking': stabilityScore = 0.2; break;
      case 'major': stabilityScore = 0.5; break;
      case 'minor': stabilityScore = 0.8; break;
      default: stabilityScore = 1.0;
    }
  }

  // Freshness (always 1.0 at generation time)
  const freshnessScore = 1.0;

  // Trust level score
  const trustScores: Record<string, number> = {
    'service_account_verified': 0.95,
    'authenticated_private_sheet': 0.90,
    'authenticated_user_access': 0.85,
    'csv_upload_unverified': 0.70,
    'public_unverified': 0.50,
    'shared_but_unverified_owner': 0.40,
    'insufficient_provenance': 0.20,
  };
  const trustScore = trustScores[trustLevel] ?? 0.30;

  // Overall composite quality
  const overallQuality =
    0.25 * completenessScore +
    0.20 * (1 - contradictionScore) +
    0.15 * (1 - ambiguityScore) +
    0.15 * retrieval +
    0.10 * stabilityScore +
    0.10 * trustScore +
    0.05 * freshnessScore;

  // Count anomaly severity
  const errorAnomalies = anomalies.filter(a => a.severity === 'error').length;
  const warningAnomalies = anomalies.filter(a => a.severity === 'warning').length;

  return {
    snapshot_id: snapshotId,
    completeness_score: Math.round(completenessScore * 100) / 100,
    contradiction_score: Math.round(contradictionScore * 100) / 100,
    ambiguity_score: Math.round(ambiguityScore * 100) / 100,
    retrieval_confidence: Math.round(retrieval * 100) / 100,
    source_trust_level: trustLevel,
    structural_stability_score: Math.round(stabilityScore * 100) / 100,
    freshness_score: freshnessScore,
    overall_quality: Math.round(overallQuality * 100) / 100,
    anomalies,
    contradiction_report: contradictions,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Compute structural drift between two snapshots.
 */
export function computeStructuralDrift(
  previousBronze: BronzeLayer | null,
  currentBronze: BronzeLayer,
  previousSnapshotId: string,
  currentSnapshotId: string
): StructuralDriftReport {
  if (!previousBronze) {
    return {
      previous_snapshot_id: previousSnapshotId,
      current_snapshot_id: currentSnapshotId,
      drift_detected: false,
      headers_added: [],
      headers_removed: [],
      tabs_added: [],
      tabs_removed: [],
      meaning_shifts: [],
      coverage_delta: 0,
      row_count_delta: 0,
      severity: 'none',
    };
  }

  const prevTabNames = new Set(previousBronze.tabs.map(t => t.tab_name));
  const currTabNames = new Set(currentBronze.tabs.map(t => t.tab_name));

  const tabsAdded = [...currTabNames].filter(t => !prevTabNames.has(t));
  const tabsRemoved = [...prevTabNames].filter(t => !currTabNames.has(t));

  // Headers comparison (across all tabs)
  const prevHeaders = new Set(previousBronze.tabs.flatMap(t => t.headers));
  const currHeaders = new Set(currentBronze.tabs.flatMap(t => t.headers));
  const headersAdded = [...currHeaders].filter(h => !prevHeaders.has(h));
  const headersRemoved = [...prevHeaders].filter(h => !currHeaders.has(h));

  const rowCountDelta = currentBronze.total_rows - previousBronze.total_rows;

  // Determine severity
  let severity: StructuralDriftReport['severity'] = 'none';
  const driftDetected = tabsAdded.length > 0 || tabsRemoved.length > 0 ||
    headersAdded.length > 0 || headersRemoved.length > 0;

  if (tabsRemoved.length > 0 || headersRemoved.length > 3) {
    severity = 'major';
  } else if (headersRemoved.length > 0 || Math.abs(rowCountDelta) > previousBronze.total_rows * 0.5) {
    severity = 'minor';
  }

  if (tabsRemoved.length > previousBronze.tabs.length * 0.5) {
    severity = 'breaking';
  }

  return {
    previous_snapshot_id: previousSnapshotId,
    current_snapshot_id: currentSnapshotId,
    drift_detected: driftDetected,
    headers_added: headersAdded,
    headers_removed: headersRemoved,
    tabs_added: tabsAdded,
    tabs_removed: tabsRemoved,
    meaning_shifts: [],
    coverage_delta: 0,
    row_count_delta: rowCountDelta,
    severity,
  };
}
