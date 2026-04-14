// ═══════════════════════════════════════════════
// Ingestion Decision Log
// Human-readable decision trace per pipeline run.
// ═══════════════════════════════════════════════

import type {
  IngestionDecisionLogData,
  DecisionStep,
  DecisionStepName,
} from './types';

export function createDecisionLog(): IngestionDecisionLogData {
  return {
    run_id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    steps: [],
  };
}

export function addStep(
  log: IngestionDecisionLogData,
  step: DecisionStepName,
  summaryVi: string,
  evidence: string[] = [],
  severity: DecisionStep['severity'] = 'info'
): void {
  log.steps.push({
    step,
    summary_vi: summaryVi,
    evidence,
    severity,
  });
}
