// ═══════════════════════════════════════════════
// Contradiction Checker
// Challenges the best hypothesis before acceptance.
// ═══════════════════════════════════════════════

import type { ContradictionReport } from './types';
import type { TabAnalysis, EnhancedColumnMapping } from './SmartSchemaDetector';
import { isDateLike, isEmailLike, isPercentLike, isStatusLike } from './TabProfiler';

export function checkContradictions(
  analysis: TabAnalysis
): ContradictionReport {
  const contradictions: string[] = [];
  let severity: ContradictionReport['severity'] = 'low';
  let downgradeDelta = 0;

  const sampleRows = analysis.tab.rows.slice(0, 20);

  for (const mapping of analysis.mappings) {
    if (mapping.canonical_field === 'ignore') continue;
    if (mapping.confidence < 0.5) continue;

    const colIdx = analysis.tab.headers.indexOf(mapping.source_header);
    if (colIdx < 0) continue;

    const values = sampleRows.map((r) => r[colIdx] ?? '').filter((v) => v.trim() !== '');
    if (values.length < 3) continue;

    // Check: status column with high cardinality free text
    if (mapping.canonical_field === 'task_status') {
      const unique = new Set(values);
      const statusR = values.filter(isStatusLike).length / values.length;
      if (unique.size > 15 || statusR < 0.2) {
        contradictions.push(
          `Cột "${mapping.source_header}" được ánh xạ thành trạng thái nhưng có ${unique.size} giá trị khác nhau và chỉ ${Math.round(statusR * 100)}% giống trạng thái`
        );
        downgradeDelta += 0.15;
      }
    }

    // Check: email column but <30% contain '@'
    if (mapping.canonical_field === 'member_email') {
      const emailR = values.filter(isEmailLike).length / values.length;
      if (emailR < 0.3) {
        contradictions.push(
          `Cột "${mapping.source_header}" được ánh xạ thành email nhưng chỉ ${Math.round(emailR * 100)}% giá trị chứa @`
        );
        downgradeDelta += 0.1;
      }
    }

    // Check: date column but dates are unparseable
    if (['deadline', 'start_date', 'completion_date'].includes(mapping.canonical_field)) {
      const dateR = values.filter(isDateLike).length / values.length;
      if (dateR < 0.3) {
        contradictions.push(
          `Cột "${mapping.source_header}" được ánh xạ thành ngày nhưng chỉ ${Math.round(dateR * 100)}% giá trị có thể phân tích được`
        );
        downgradeDelta += 0.1;
      }
    }

    // Check: task_name mostly numeric IDs
    if (mapping.canonical_field === 'task_name') {
      const numericR = values.filter((v) => /^\d+$/.test(v.trim())).length / values.length;
      if (numericR > 0.7) {
        contradictions.push(
          `Cột "${mapping.source_header}" được ánh xạ thành tên công việc nhưng ${Math.round(numericR * 100)}% giá trị là số`
        );
        downgradeDelta += 0.2;
      }
    }

    // Check: progress_pct with values > 100
    if (mapping.canonical_field === 'progress_pct') {
      const overR = values.filter((v) => {
        const n = parseFloat(v.replace('%', ''));
        return !isNaN(n) && n > 100;
      }).length / values.length;
      if (overR > 0.2) {
        contradictions.push(
          `Cột "${mapping.source_header}" có ${Math.round(overR * 100)}% giá trị vượt quá 100%`
        );
        downgradeDelta += 0.1;
      }
    }
  }

  // Check: summary dashboard selected but row-level tab exists elsewhere
  if (analysis.profile.likely_shape === 'summary') {
    contradictions.push(
      `Tab "${analysis.tab.tab_name}" có vẻ là bảng tổng hợp, không phải danh sách công việc chi tiết`
    );
    downgradeDelta += 0.15;
  }

  // Determine severity
  if (contradictions.length === 0) {
    severity = 'low';
  } else if (downgradeDelta > 0.25 || contradictions.length >= 3) {
    severity = 'high';
  } else if (downgradeDelta > 0.1 || contradictions.length >= 2) {
    severity = 'medium';
  }

  return {
    is_contradictory: contradictions.length > 0,
    severity,
    contradictions,
    downgrade_delta: Math.min(downgradeDelta, 0.5),
    fallback_recommendation: severity === 'high'
      ? 'Bạn nên kiểm tra lại ánh xạ cột trước khi lưu cấu hình.'
      : null,
  };
}
