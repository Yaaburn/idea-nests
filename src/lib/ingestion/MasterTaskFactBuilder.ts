// ═══════════════════════════════════════════════
// MASTER_TASK_FACT Builder — §10
// Merges ALL relevant tabs into one flat
// MASTER_TASK_FACT table.
// ONE ROW = ONE TASK RECORD PER SNAPSHOT.
// ═══════════════════════════════════════════════

import type {
  MasterTaskFact,
  TeamDim,
  MilestoneDim,
} from './MasterTaskFactTypes';
import { createEmptyMasterTaskFact, STATUS_GROUPS } from './MasterTaskFactTypes';
import type { TabAnalysis, EnhancedColumnMapping } from './SmartSchemaDetector';
import type { EntityResolutionReport } from './SnapshotTypes';
import type { TabLifecycleResult } from './SnapshotTypes';
import type { CanonicalMember } from '../canonicalTypes';
import {
  normalizeString,
  nameFingerprint,
  parseFlexibleDate,
  normalizeStatus,
  normalizePriority,
  detectLanguage,
} from './LinguisticEngine';

// ─── Configuration ───

interface BuildContext {
  projectId: string;
  snapshotId: string;
  integrationId: string;
  workbookId: string;
  workbookTitle: string;
  sourceMode: string;
  trustLevel: string;
}

// ─── Main Entry ───

/**
 * Build the MASTER_TASK_FACT array from all analyzed tabs.
 *
 * Strategy per §10:
 * 1. Task-operational tabs → primary rows
 * 2. Member-dimension tabs → denormalize member context
 * 3. Timeline/schedule tabs → denormalize date/milestone context
 * 4. Notes/admin tabs → annotations (linked only by task name/ID)
 * 5. Summary tabs → never override row-level truth
 */
export function buildMasterTaskFact(
  tabAnalyses: TabAnalysis[],
  members: CanonicalMember[],
  entityReport: EntityResolutionReport,
  tabLifecycles: TabLifecycleResult[],
  ctx: BuildContext,
): { masterFacts: MasterTaskFact[]; teamDim: TeamDim[]; milestoneDim: MilestoneDim[] } {

  // Classify tabs
  const taskTabs = tabAnalyses.filter(a =>
    a.score.tab_type === 'task_list' || a.score.tab_type === 'mixed_tracker'
  );
  const memberTabs = tabAnalyses.filter(a => a.score.tab_type === 'member_list');

  // Build member lookup
  const memberLookup = buildMemberLookup(members);

  // Build team dimensions
  const teamDim: TeamDim[] = members.map((m, i) => ({
    member_id: `member_${i}`,
    name: m.name,
    normalized_key: m.normalized_key,
    email: m.email,
    role: m.role,
    team: null,
    aliases: m.alias_group ?? [],
    source_tabs: [],
    resolution_confidence: 1.0,
  }));

  // Build milestone dimensions from all tabs
  const milestoneDim: MilestoneDim[] = [];

  // Process task-operational tabs → primary rows
  const masterFacts: MasterTaskFact[] = [];
  let taskCounter = 0;

  for (const analysis of taskTabs) {
    const lifecycle = tabLifecycles.find(l => l.tab_name === analysis.tab.tab_name);
    const mappings = analysis.mappings;

    // Build column index map
    const colMap = buildColumnMap(mappings, analysis.tab.headers);

    for (let r = 0; r < analysis.tab.rows.length; r++) {
      const row = analysis.tab.rows[r];
      if (!row) continue;

      // Skip empty rows
      const filled = row.filter(v => v && v.trim() !== '').length;
      if (filled < 2) continue;

      taskCounter++;
      const taskId = `task_${ctx.snapshotId}_${taskCounter}`;

      const fact = createEmptyMasterTaskFact(
        ctx.projectId,
        ctx.snapshotId,
        ctx.integrationId,
        ctx.workbookId,
        ctx.workbookTitle,
        ctx.sourceMode,
        ctx.trustLevel,
      ) as MasterTaskFact;

      // ── Identifiers ──
      fact.task_id = taskId;
      fact.source_tab_name = analysis.tab.tab_name;
      fact.source_tab_type = analysis.score.tab_type;
      fact.source_tab_index = analysis.tab.tab_index;
      fact.source_tab_version_status = lifecycle?.version_status ?? 'new';
      fact.source_row_index = r;

      // ── Task Core ──
      fact.task_name = getVal(row, colMap, 'task_name');
      fact.task_name_normalized = normalizeString(fact.task_name);
      fact.task_description = getValOrNull(row, colMap, 'task_description');
      fact.task_category = getValOrNull(row, colMap, 'task_category');
      fact.epic_name = getValOrNull(row, colMap, 'epic_name');

      // ── Ownership ──
      const rawAssignee = getValOrNull(row, colMap, 'task_assignee');
      if (rawAssignee) {
        fact.assignee_name = rawAssignee;
        fact.assignee_name_normalized = normalizeString(rawAssignee);
        // Denormalize member info
        const memberInfo = memberLookup.get(nameFingerprint(rawAssignee));
        if (memberInfo) {
          fact.assignee_email = memberInfo.email;
          fact.assignee_role = memberInfo.role;
          fact.entity_resolution_confidence = 1.0;
        }
      }

      fact.reviewer_name = getValOrNull(row, colMap, 'reviewer_name');
      fact.creator_name = getValOrNull(row, colMap, 'creator_name');
      fact.reporter_name = getValOrNull(row, colMap, 'reporter_name');

      // ── Timeline ──
      const startRaw = getValOrNull(row, colMap, 'start_date');
      const deadlineRaw = getValOrNull(row, colMap, 'deadline');
      const completionRaw = getValOrNull(row, colMap, 'completion_date');

      fact.planned_start_date = startRaw ? parseFlexibleDate(startRaw) : null;
      fact.deadline = deadlineRaw ? parseFlexibleDate(deadlineRaw) : null;
      fact.planned_end_date = fact.deadline;
      fact.completed_at = completionRaw ? parseFlexibleDate(completionRaw) : null;
      fact.actual_end_date = fact.completed_at;

      // Derived date metrics
      if (fact.planned_start_date && fact.deadline) {
        const start = new Date(fact.planned_start_date);
        const end = new Date(fact.deadline);
        fact.duration_planned_days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
      }
      if (fact.planned_start_date && fact.actual_end_date) {
        const start = new Date(fact.planned_start_date);
        const end = new Date(fact.actual_end_date);
        fact.duration_actual_days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
      }
      if (fact.deadline && !fact.completion_flag) {
        const now = Date.now();
        const dl = new Date(fact.deadline).getTime();
        if (now > dl) {
          fact.delay_days = Math.round((now - dl) / 86400000);
        }
      }

      // ── Status ──
      const statusRaw = getValOrNull(row, colMap, 'task_status');
      fact.status_raw = statusRaw;
      fact.status_normalized = statusRaw ? normalizeStatus(statusRaw) : 'unknown';
      fact.status_group = STATUS_GROUPS[fact.status_normalized] ?? 'unknown';
      fact.completion_flag = fact.status_normalized === 'done';

      // ── Progress ──
      const progressRaw = getValOrNull(row, colMap, 'progress_pct');
      fact.progress_pct_raw = progressRaw;
      if (progressRaw) {
        const pct = parseFloat(progressRaw.replace('%', '').trim());
        fact.progress_pct = isNaN(pct) ? null : Math.round(pct);
      }

      // ── Priority ──
      const priorityRaw = getValOrNull(row, colMap, 'task_priority');
      fact.priority_raw = priorityRaw;
      fact.priority_normalized = priorityRaw ? normalizePriority(priorityRaw) : null;

      // ── Effort ──
      const plannedEffort = getValOrNull(row, colMap, 'planned_effort');
      const actualEffort = getValOrNull(row, colMap, 'actual_effort');
      if (plannedEffort) {
        const n = parseFloat(plannedEffort);
        fact.planned_effort_hours = isNaN(n) ? null : n;
      }
      if (actualEffort) {
        const n = parseFloat(actualEffort);
        fact.actual_effort_hours = isNaN(n) ? null : n;
      }
      if (fact.planned_effort_hours != null && fact.actual_effort_hours != null) {
        fact.variance_effort_hours = fact.actual_effort_hours - fact.planned_effort_hours;
        fact.variance_effort_pct = fact.planned_effort_hours > 0
          ? Math.round((fact.variance_effort_hours / fact.planned_effort_hours) * 100)
          : null;
      }

      const storyPtsRaw = getValOrNull(row, colMap, 'story_points');
      if (storyPtsRaw) {
        const n = parseFloat(storyPtsRaw);
        fact.story_points = isNaN(n) ? null : n;
      }

      // ── Agile context ──
      fact.sprint_name = getValOrNull(row, colMap, 'sprint_name');
      fact.milestone_name = getValOrNull(row, colMap, 'milestone_name');
      fact.phase_name = getValOrNull(row, colMap, 'phase_name');

      // ── Blocker ──
      const blockerRaw = getValOrNull(row, colMap, 'blocked_reason');
      if (blockerRaw && blockerRaw.trim().length > 0) {
        fact.is_blocked = true;
        fact.blocker_flag = true;
        fact.blocked_reason = blockerRaw;
      }

      // ── Notes ──
      fact.note_text = getValOrNull(row, colMap, 'note');

      // ── Confidence ──
      const mappingConfidences = mappings
        .filter(m => m.canonical_field !== 'ignore' && m.confidence > 0)
        .map(m => m.confidence);
      fact.canonical_confidence = mappingConfidences.length > 0
        ? Math.round((mappingConfidences.reduce((a, b) => a + b, 0) / mappingConfidences.length) * 100) / 100
        : 0;

      // ── Language ──
      fact.detected_language = detectLanguage(fact.task_name);
      fact.header_language = detectLanguage(analysis.tab.headers.join(' '));

      masterFacts.push(fact);
    }
  }

  // Enrich from member tabs (denormalize email/role for assignees without resolution)
  if (memberTabs.length > 0) {
    enrichFromMemberTabs(masterFacts, memberTabs, memberLookup);
  }

  return { masterFacts, teamDim, milestoneDim };
}

// ─── Column Map Builder ───

interface ColumnIndex {
  colIdx: number;
  confidence: number;
}

function buildColumnMap(
  mappings: EnhancedColumnMapping[],
  headers: string[],
): Map<string, ColumnIndex> {
  const map = new Map<string, ColumnIndex>();

  for (const m of mappings) {
    if (m.canonical_field === 'ignore') continue;
    const idx = headers.indexOf(m.source_header);
    if (idx < 0) continue;

    const existing = map.get(m.canonical_field);
    if (!existing || m.confidence > existing.confidence) {
      map.set(m.canonical_field, { colIdx: idx, confidence: m.confidence });
    }
  }

  return map;
}

function getVal(row: string[], colMap: Map<string, ColumnIndex>, field: string): string {
  const ci = colMap.get(field);
  if (!ci) return '';
  return (row[ci.colIdx] ?? '').trim();
}

function getValOrNull(row: string[], colMap: Map<string, ColumnIndex>, field: string): string | null {
  const val = getVal(row, colMap, field);
  return val.length > 0 ? val : null;
}

// ─── Member Lookup ───

function buildMemberLookup(members: CanonicalMember[]): Map<string, CanonicalMember> {
  const lookup = new Map<string, CanonicalMember>();
  for (const m of members) {
    lookup.set(m.normalized_key, m);
    for (const alias of m.alias_group ?? []) {
      lookup.set(nameFingerprint(alias), m);
    }
  }
  return lookup;
}

// ─── Enrichment from Member Tabs ───

function enrichFromMemberTabs(
  facts: MasterTaskFact[],
  memberTabs: TabAnalysis[],
  memberLookup: Map<string, CanonicalMember>,
): void {
  for (const fact of facts) {
    if (!fact.assignee_name || fact.assignee_email) continue;

    const fp = nameFingerprint(fact.assignee_name);
    const member = memberLookup.get(fp);
    if (member) {
      fact.assignee_email = fact.assignee_email ?? member.email;
      fact.assignee_role = fact.assignee_role ?? member.role;
      fact.entity_resolution_confidence = 0.85;
    }
  }
}
