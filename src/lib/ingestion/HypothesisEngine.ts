// ═══════════════════════════════════════════════
// Hypothesis Engine
// Generate competing interpretations of spreadsheet structure.
// ═══════════════════════════════════════════════

import type { DetectionHypothesis } from './types';
import type { TabAnalysis } from './SmartSchemaDetector';

let counter = 0;

function nextId(): string {
  return `hyp_${++counter}_${Date.now()}`;
}

export function generateHypotheses(analyses: TabAnalysis[]): DetectionHypothesis[] {
  const hypotheses: DetectionHypothesis[] = [];

  if (analyses.length === 0) {
    hypotheses.push({
      hypothesis_id: nextId(),
      primary_tab_name: null,
      supporting_tab_names: [],
      inferred_mode: 'unknown',
      predicted_output_coverage: 0,
      confidence: 0,
      evidence_for: [],
      evidence_against: ['Không tìm thấy tab nào có dữ liệu phù hợp'],
      contradictions: [],
      tab_type: 'unknown',
    });
    return hypotheses;
  }

  // Primary hypothesis: best tab as primary
  const best = analyses[0];
  const memberTabs = analyses.filter(
    (a) => a.score.tab_type === 'member_list' && a !== best
  );
  const supportingNames = memberTabs.slice(0, 1).map((a) => a.tab.tab_name);

  const mappedFields = best.mappings.filter(
    (m) => m.canonical_field !== 'ignore' && m.confidence >= 0.5
  ).length;
  const coverage = Math.min(1, mappedFields / 5); // 5 core fields

  hypotheses.push({
    hypothesis_id: nextId(),
    primary_tab_name: best.tab.tab_name,
    supporting_tab_names: supportingNames,
    inferred_mode: supportingNames.length > 0 ? 'fused_tabs' : 'single_tab',
    predicted_output_coverage: coverage,
    confidence: best.score.final_score / 100,
    evidence_for: best.score.reasons.slice(0, 5),
    evidence_against: [],
    contradictions: [],
    tab_type: best.score.tab_type,
  });

  // Competing hypothesis: second-best as primary (if exists and close)
  if (analyses.length >= 2) {
    const second = analyses[1];
    const scoreDiff = best.score.final_score - second.score.final_score;

    const secondMapped = second.mappings.filter(
      (m) => m.canonical_field !== 'ignore' && m.confidence >= 0.5
    ).length;
    const secondCoverage = Math.min(1, secondMapped / 5);

    hypotheses.push({
      hypothesis_id: nextId(),
      primary_tab_name: second.tab.tab_name,
      supporting_tab_names: [],
      inferred_mode: 'single_tab',
      predicted_output_coverage: secondCoverage,
      confidence: second.score.final_score / 100,
      evidence_for: second.score.reasons.slice(0, 5),
      evidence_against: scoreDiff > 10
        ? [`Tab "${best.tab.tab_name}" có điểm cao hơn ${scoreDiff} điểm`]
        : [],
      contradictions: [],
      tab_type: second.score.tab_type,
    });
  }

  // Null hypothesis (skeptical challenge)
  if (best.score.final_score < 40) {
    hypotheses.push({
      hypothesis_id: nextId(),
      primary_tab_name: null,
      supporting_tab_names: [],
      inferred_mode: 'unknown',
      predicted_output_coverage: 0,
      confidence: 0.1,
      evidence_for: ['Không có tab nào đạt ngưỡng tin cậy tối thiểu'],
      evidence_against: best.score.reasons,
      contradictions: ['Điểm cao nhất chỉ là ' + best.score.final_score],
      tab_type: 'unknown',
    });
  }

  return hypotheses;
}
