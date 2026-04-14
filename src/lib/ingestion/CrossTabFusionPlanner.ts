// ═══════════════════════════════════════════════
// Cross-Tab Fusion Planner
// Plans multi-tab fusion when data is split across tabs.
// Max 3 tabs. Requires real join signals.
// ═══════════════════════════════════════════════

import type { FusionPlan } from './types';
import type { TabAnalysis } from './SmartSchemaDetector';
import { normalizeString } from './SmartSchemaDetector';

export function planFusion(analyses: TabAnalysis[]): FusionPlan {
  if (analyses.length === 0) {
    return {
      primary_tab: '',
      member_tab: null,
      timeline_tab: null,
      join_signals: [],
      fusion_feasible: false,
      rejection_reason: 'Không có tab nào',
    };
  }

  const primary = analyses[0];
  const memberCandidates = analyses.filter(
    (a) => a !== primary && a.score.tab_type === 'member_list'
  );
  const timelineCandidates = analyses.filter(
    (a) => a !== primary && a.score.tab_type === 'timeline'
  );

  const joinSignals: string[] = [];
  let memberTab: string | null = null;
  let timelineTab: string | null = null;

  // Check member tab join feasibility
  if (memberCandidates.length > 0) {
    const candidate = memberCandidates[0];
    // Look for shared name-like columns
    const primaryNameCols = primary.mappings
      .filter((m) => m.canonical_field === 'task_assignee')
      .map((m) => m.source_header);
    const memberNameCols = candidate.mappings
      .filter((m) => m.canonical_field === 'member_name')
      .map((m) => m.source_header);

    if (primaryNameCols.length > 0 && memberNameCols.length > 0) {
      // Sample join: check if assignee values appear in member names
      const primaryValues = new Set(
        primary.tab.rows.slice(0, 20)
          .map((r) => {
            const idx = primary.tab.headers.indexOf(primaryNameCols[0]);
            return idx >= 0 ? normalizeString(r[idx] ?? '') : '';
          })
          .filter(Boolean)
      );
      const memberValues = new Set(
        candidate.tab.rows.slice(0, 50)
          .map((r) => {
            const idx = candidate.tab.headers.indexOf(memberNameCols[0]);
            return idx >= 0 ? normalizeString(r[idx] ?? '') : '';
          })
          .filter(Boolean)
      );

      const overlap = [...primaryValues].filter((v) => memberValues.has(v));
      if (overlap.length >= 2) {
        memberTab = candidate.tab.tab_name;
        joinSignals.push(`${overlap.length} tên thành viên trùng khớp giữa 2 tab`);
      }
    }
  }

  // Timeline fusion (simpler: just check existence)
  if (timelineCandidates.length > 0) {
    timelineTab = timelineCandidates[0].tab.tab_name;
    joinSignals.push('Tab timeline phát hiện');
  }

  const hasFusion = memberTab !== null || timelineTab !== null;

  return {
    primary_tab: primary.tab.tab_name,
    member_tab: memberTab,
    timeline_tab: timelineTab,
    join_signals: joinSignals,
    fusion_feasible: hasFusion && joinSignals.length > 0,
    rejection_reason: !hasFusion ? 'Không tìm thấy tab phụ trợ phù hợp' : null,
  };
}
