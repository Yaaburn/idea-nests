// ═══════════════════════════════════════════════
// Anomaly Detector — Rule-Based + MAD Outlier Detection
// Flags impossible values, duplicates, outliers.
// Explainable, no external ML deps.
// ═══════════════════════════════════════════════

import { getWeights } from './WeightConfig';
import { parseFlexibleDate, normalizeString, nameFingerprint } from './LinguisticEngine';
import type { AnomalyRecord } from './SnapshotTypes';
import type { CanonicalTask, CanonicalMember } from '../canonicalTypes';

/**
 * Run all anomaly detection checks on canonicalized data.
 */
export function detectAnomalies(
  tasks: CanonicalTask[],
  members: CanonicalMember[],
  rawRows: Array<{ tab: string; row: number; values: string[] }>
): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];
  const thresholds = getWeights().anomaly_thresholds;

  // 1. Progress overflow
  for (const task of tasks) {
    if (task.progress_pct !== null && task.progress_pct > thresholds.max_progress_pct) {
      anomalies.push({
        type: 'progress_overflow',
        description: `Task "${task.task_name}" has progress ${task.progress_pct}% (exceeds ${thresholds.max_progress_pct}%)`,
        severity: 'warning',
        location: { row: task._source_row, column: 'progress_pct' },
        value: String(task.progress_pct),
      });
    }
  }

  // 2. Impossible dates (start > deadline)
  for (const task of tasks) {
    if (task.start_date && task.deadline) {
      if (task.start_date > task.deadline) {
        anomalies.push({
          type: 'impossible_date',
          description: `Task "${task.task_name}" starts (${task.start_date}) after deadline (${task.deadline})`,
          severity: 'warning',
          location: { row: task._source_row },
          value: `start:${task.start_date} > deadline:${task.deadline}`,
        });
      }
    }
  }

  // 3. Negative effort (from raw values — check if any numeric column has negatives)
  for (const task of tasks) {
    // We don't have planned/actual effort on CanonicalTask directly,
    // but we can check via notes or other signals. Flag future-extensible.
  }

  // 4. Duplicate entities
  const memberFingerprints = new Map<string, string[]>();
  for (const member of members) {
    const fp = nameFingerprint(member.name);
    if (!memberFingerprints.has(fp)) {
      memberFingerprints.set(fp, []);
    }
    memberFingerprints.get(fp)!.push(member.name);
  }
  for (const [fp, names] of memberFingerprints) {
    if (names.length > 1) {
      anomalies.push({
        type: 'duplicate_entity',
        description: `Possible duplicate members: ${names.join(', ')} (same fingerprint: "${fp}")`,
        severity: 'info',
        location: {},
      });
    }
  }

  // 5. Status cardinality anomaly
  const statusValues = tasks.map(t => t.task_status);
  const uniqueStatuses = new Set(statusValues);
  if (uniqueStatuses.size > thresholds.status_max_cardinality) {
    anomalies.push({
      type: 'status_cardinality',
      description: `${uniqueStatuses.size} unique status values detected (threshold: ${thresholds.status_max_cardinality})`,
      severity: 'warning',
      location: { column: 'task_status' },
    });
  }

  // 6. Sparse rows
  for (const rawRow of rawRows) {
    const filledCount = rawRow.values.filter(v => v.trim() !== '').length;
    const fillRatio = rawRow.values.length > 0 ? filledCount / rawRow.values.length : 0;
    if (fillRatio < thresholds.sparse_row_threshold && rawRow.values.length >= 3) {
      anomalies.push({
        type: 'sparse_row',
        description: `Row ${rawRow.row} in "${rawRow.tab}" is ${Math.round(fillRatio * 100)}% filled (threshold: ${Math.round(thresholds.sparse_row_threshold * 100)}%)`,
        severity: 'info',
        location: { tab: rawRow.tab, row: rawRow.row },
      });
    }
  }

  // 7. MAD-based outlier detection on numeric columns
  const progressValues = tasks
    .filter(t => t.progress_pct !== null)
    .map(t => t.progress_pct!);

  if (progressValues.length >= 5) {
    const outliers = detectMADOutliers(progressValues, thresholds.mad_z_threshold);
    for (const outlierVal of outliers) {
      const task = tasks.find(t => t.progress_pct === outlierVal);
      if (task) {
        anomalies.push({
          type: 'outlier_value',
          description: `Progress value ${outlierVal}% is a statistical outlier for task "${task.task_name}"`,
          severity: 'info',
          location: { row: task._source_row, column: 'progress_pct' },
          value: String(outlierVal),
        });
      }
    }
  }

  return anomalies;
}

/**
 * MAD-based outlier detection.
 * MAD = Median Absolute Deviation.
 * More robust than standard deviation for non-normal data.
 */
function detectMADOutliers(values: number[], threshold: number): number[] {
  if (values.length < 3) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const absDeviations = values.map(v => Math.abs(v - median));
  const sortedDev = [...absDeviations].sort((a, b) => a - b);
  const mad = sortedDev[Math.floor(sortedDev.length / 2)];

  if (mad === 0) return []; // All values are the same

  // Modified z-score using MAD
  const outliers: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const modifiedZ = 0.6745 * (values[i] - median) / mad;
    if (Math.abs(modifiedZ) > threshold) {
      outliers.push(values[i]);
    }
  }

  return outliers;
}
