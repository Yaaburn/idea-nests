// ═══════════════════════════════════════════════
// Drift Scorer — §7.F
// Compute structural drift score between snapshots.
// Classifies: stable | mildly_changed |
//             structurally_changed | breaking_change
// ═══════════════════════════════════════════════

import type { StructuralDriftReport } from './SnapshotTypes';

export type DriftClass = 'stable' | 'mildly_changed' | 'structurally_changed' | 'breaking_change';

export interface DriftScoreResult {
  header_change_ratio: number;
  tab_change_ratio: number;
  semantic_shift_ratio: number;
  coverage_drop_ratio: number;
  drift_score: number;
  drift_class: DriftClass;
}

/**
 * Compute DriftScore per §7.F formula:
 *
 * DriftScore =
 *   0.35 * header_change_ratio +
 *   0.25 * tab_change_ratio +
 *   0.20 * semantic_shift_ratio +
 *   0.20 * coverage_drop_ratio
 */
export function computeDriftScore(drift: StructuralDriftReport): DriftScoreResult {
  if (!drift.drift_detected) {
    return {
      header_change_ratio: 0,
      tab_change_ratio: 0,
      semantic_shift_ratio: 0,
      coverage_drop_ratio: 0,
      drift_score: 0,
      drift_class: 'stable',
    };
  }

  // Header change ratio
  const totalHeaderChanges = drift.headers_added.length + drift.headers_removed.length;
  const estimatedTotalHeaders = Math.max(
    totalHeaderChanges,
    drift.headers_added.length + drift.headers_removed.length + 10,
  );
  const headerChangeRatio = Math.min(1, totalHeaderChanges / estimatedTotalHeaders);

  // Tab change ratio
  const totalTabChanges = drift.tabs_added.length + drift.tabs_removed.length;
  const estimatedTotalTabs = Math.max(
    totalTabChanges,
    drift.tabs_added.length + drift.tabs_removed.length + 3,
  );
  const tabChangeRatio = Math.min(1, totalTabChanges / estimatedTotalTabs);

  // Semantic shift ratio (from meaning_shifts)
  const semanticShiftRatio = drift.meaning_shifts.length > 0
    ? Math.min(1, drift.meaning_shifts.length / 5)
    : 0;

  // Coverage drop ratio
  const coverageDropRatio = drift.coverage_delta < 0
    ? Math.min(1, Math.abs(drift.coverage_delta))
    : 0;

  // Composite
  const driftScore =
    0.35 * headerChangeRatio +
    0.25 * tabChangeRatio +
    0.20 * semanticShiftRatio +
    0.20 * coverageDropRatio;

  // Classification
  let driftClass: DriftClass;
  if (driftScore < 0.10) driftClass = 'stable';
  else if (driftScore < 0.30) driftClass = 'mildly_changed';
  else if (driftScore < 0.60) driftClass = 'structurally_changed';
  else driftClass = 'breaking_change';

  return {
    header_change_ratio: round(headerChangeRatio),
    tab_change_ratio: round(tabChangeRatio),
    semantic_shift_ratio: round(semanticShiftRatio),
    coverage_drop_ratio: round(coverageDropRatio),
    drift_score: round(driftScore),
    drift_class: driftClass,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
