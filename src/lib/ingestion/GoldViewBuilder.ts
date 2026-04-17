// ═══════════════════════════════════════════════
// Gold View Builder — Analysis-Ready View Generation
// Builds pre-computed views from Silver layer data.
// Each view is self-describing with confidence & source trace.
// ═══════════════════════════════════════════════

import type {
  GoldLayer,
  GoldViewKey,
  AnalysisReadyView,
  SilverLayer,
} from './SnapshotTypes';
import type {
  CanonicalTask,
  CanonicalMember,
  CanonicalStatus,
  DerivedInsights,
} from '../canonicalTypes';
import type { ContradictionReport } from './types';
import type { MasterTaskFact } from './MasterTaskFactTypes';

/**
 * Build all Gold-layer analysis-ready views from Silver data.
 */
export function buildGoldLayer(
  silver: SilverLayer,
  contradictions: ContradictionReport
): GoldLayer {
  const views: Record<string, AnalysisReadyView> = {};
  const mtf = silver.master_task_fact ?? [];

  views['workload_by_member'] = buildWorkloadByMember(silver);
  views['status_distribution'] = buildStatusDistribution(silver);
  views['completion_trajectory'] = buildCompletionTrajectory(silver);
  views['overdue_risk'] = buildOverdueRisk(silver);
  views['milestone_health'] = buildMilestoneHealth(silver);
  views['sprint_health'] = buildSprintHealth(mtf, silver);
  views['effort_variance'] = buildEffortVariance(silver);
  views['blocker_overview'] = buildBlockerOverview(mtf, silver);
  views['team_participation'] = buildTeamParticipation(silver);
  views['contradiction_summary'] = buildContradictionSummary(contradictions);
  views['data_quality_panel'] = buildDataQualityPanel(silver);

  return {
    views,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Build derived insights from Silver layer (backward-compatible).
 */
export function computeDerivedInsights(
  tasks: CanonicalTask[],
  members: CanonicalMember[]
): DerivedInsights {
  const totalTasks = tasks.length;

  const tasksByStatus: Record<CanonicalStatus, number> = {
    todo: 0, in_progress: 0, in_review: 0, done: 0,
    blocked: 0, cancelled: 0, unknown: 0,
  };
  for (const t of tasks) {
    tasksByStatus[t.task_status] = (tasksByStatus[t.task_status] || 0) + 1;
  }

  const tasksByAssignee: Record<string, number> = {};
  const doneByAssignee: Record<string, number> = {};
  for (const t of tasks) {
    const assignee = t.task_assignee ?? 'Chưa giao';
    tasksByAssignee[assignee] = (tasksByAssignee[assignee] || 0) + 1;
    if (t.task_status === 'done') {
      doneByAssignee[assignee] = (doneByAssignee[assignee] || 0) + 1;
    }
  }

  const completionByAssignee: Record<string, number> = {};
  for (const [assignee, total] of Object.entries(tasksByAssignee)) {
    completionByAssignee[assignee] = Math.round(
      ((doneByAssignee[assignee] || 0) / total) * 100
    );
  }

  const doneTasks = tasksByStatus.done;
  const overallCompletion = totalTasks > 0
    ? Math.round((doneTasks / totalTasks) * 100)
    : 0;

  const now = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(
    t => t.deadline && t.deadline < now && t.task_status !== 'done' && t.task_status !== 'cancelled'
  ).length;

  const tasksWithProgress = tasks.filter(t => t.progress_pct !== null);
  const avgProgress = tasksWithProgress.length > 0
    ? Math.round(
        tasksWithProgress.reduce((s, t) => s + (t.progress_pct ?? 0), 0) / tasksWithProgress.length
      )
    : overallCompletion;

  return {
    overall_completion_pct: overallCompletion,
    total_tasks: totalTasks,
    tasks_by_status: tasksByStatus,
    tasks_by_assignee: tasksByAssignee,
    completion_rate_by_assignee: completionByAssignee,
    milestone_completion_pct: 0,
    overdue_count: overdue,
    blocked_count: tasksByStatus.blocked,
    avg_progress_pct: avgProgress,
  };
}

// ═══════════════════════════════════════════════
// INDIVIDUAL VIEW BUILDERS
// ═══════════════════════════════════════════════

function buildWorkloadByMember(silver: SilverLayer): AnalysisReadyView {
  const workload: Record<string, { total: number; done: number; in_progress: number; blocked: number }> = {};

  for (const task of silver.tasks) {
    const assignee = task.task_assignee ?? 'Chưa giao';
    if (!workload[assignee]) {
      workload[assignee] = { total: 0, done: 0, in_progress: 0, blocked: 0 };
    }
    workload[assignee].total++;
    if (task.task_status === 'done') workload[assignee].done++;
    if (task.task_status === 'in_progress') workload[assignee].in_progress++;
    if (task.task_status === 'blocked') workload[assignee].blocked++;
  }

  const data = Object.entries(workload).map(([name, counts]) => ({
    member_name: name,
    ...counts,
    completion_rate: counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  return makeView('workload_by_member', 'Workload by member', data,
    ['task', 'member'], ['task_assignee', 'task_status'], silver.mapping_confidence);
}

function buildStatusDistribution(silver: SilverLayer): AnalysisReadyView {
  const counts: Record<string, number> = {};
  for (const task of silver.tasks) {
    counts[task.task_status] = (counts[task.task_status] || 0) + 1;
  }

  const data = Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    percentage: silver.tasks.length > 0 ? Math.round((count / silver.tasks.length) * 100) : 0,
  }));

  return makeView('status_distribution', 'Status distribution', data,
    ['task'], ['task_status'], silver.mapping_confidence);
}

function buildCompletionTrajectory(silver: SilverLayer): AnalysisReadyView {
  // Group completed tasks by completion date
  const byDate: Record<string, number> = {};
  let cumulative = 0;

  const datedTasks = silver.tasks
    .filter(t => t.task_status === 'done' && t.completion_date)
    .sort((a, b) => (a.completion_date ?? '').localeCompare(b.completion_date ?? ''));

  for (const task of datedTasks) {
    const date = task.completion_date!;
    cumulative++;
    byDate[date] = cumulative;
  }

  const data = Object.entries(byDate).map(([date, cumCount]) => ({
    date,
    cumulative_completed: cumCount,
    total_tasks: silver.tasks.length,
    completion_pct: silver.tasks.length > 0 ? Math.round((cumCount / silver.tasks.length) * 100) : 0,
  }));

  const hasDateData = data.length > 0;
  return makeView('completion_trajectory', 'Completion trajectory', data,
    ['task'], ['task_status', 'completion_date'],
    hasDateData ? silver.mapping_confidence : 0.2,
    hasDateData ? [] : ['No completion date data available']);
}

function buildOverdueRisk(silver: SilverLayer): AnalysisReadyView {
  const now = new Date().toISOString().slice(0, 10);
  const overdueTasks = silver.tasks.filter(
    t => t.deadline && t.deadline < now && t.task_status !== 'done' && t.task_status !== 'cancelled'
  );

  const data = overdueTasks.map(t => ({
    task_name: t.task_name,
    assignee: t.task_assignee ?? 'Chưa giao',
    deadline: t.deadline,
    days_overdue: Math.floor((Date.now() - new Date(t.deadline!).getTime()) / (1000 * 60 * 60 * 24)),
    status: t.task_status,
    priority: t.task_priority,
  })).sort((a, b) => b.days_overdue - a.days_overdue);

  return makeView('overdue_risk', 'Overdue risk', data,
    ['task'], ['task_status', 'deadline'], silver.mapping_confidence);
}

function buildMilestoneHealth(silver: SilverLayer): AnalysisReadyView {
  const data = silver.milestones.map(m => ({
    milestone_name: m.name,
    date: m.date,
    status: m.status,
  }));

  return makeView('milestone_health', 'Milestone health', data,
    ['milestone'], ['milestone_name'],
    data.length > 0 ? silver.mapping_confidence : 0.1,
    data.length === 0 ? ['No milestone data available'] : []);
}

function buildEffortVariance(silver: SilverLayer): AnalysisReadyView {
  const data = silver.efforts
    .filter(e => e.planned_hours !== null || e.actual_hours !== null)
    .map(e => ({
      task_name: e.task_name,
      member: e.member_name,
      planned: e.planned_hours,
      actual: e.actual_hours,
      variance: e.variance,
      variance_pct: e.planned_hours && e.planned_hours > 0
        ? Math.round(((e.actual_hours ?? 0) - e.planned_hours) / e.planned_hours * 100)
        : null,
    }));

  return makeView('effort_variance', 'Effort variance', data,
    ['task'], ['planned_effort', 'actual_effort'],
    data.length > 0 ? silver.mapping_confidence : 0.1,
    data.length === 0 ? ['No effort data available'] : []);
}

function buildTeamParticipation(silver: SilverLayer): AnalysisReadyView {
  const participation: Record<string, { assigned: number; completed: number }> = {};

  for (const member of silver.members) {
    if (!participation[member.name]) {
      participation[member.name] = { assigned: 0, completed: 0 };
    }
  }

  for (const task of silver.tasks) {
    const assignee = task.task_assignee;
    if (assignee) {
      if (!participation[assignee]) {
        participation[assignee] = { assigned: 0, completed: 0 };
      }
      participation[assignee].assigned++;
      if (task.task_status === 'done') participation[assignee].completed++;
    }
  }

  const data = Object.entries(participation).map(([name, p]) => ({
    member_name: name,
    assigned: p.assigned,
    completed: p.completed,
    participation_rate: p.assigned > 0 ? Math.round((p.completed / p.assigned) * 100) : 0,
  }));

  return makeView('team_participation', 'Team participation', data,
    ['member', 'task'], ['task_assignee'], silver.mapping_confidence);
}

function buildContradictionSummary(contradictions: ContradictionReport): AnalysisReadyView {
  const data = contradictions.contradictions.map((c, i) => ({
    index: i,
    description: c,
    severity: contradictions.severity,
  }));

  return makeView('contradiction_summary', 'Contradiction summary', data,
    [], [], 1.0);
}

function buildDataQualityPanel(silver: SilverLayer): AnalysisReadyView {
  const mappedFields = silver.column_mappings.filter(m => m.canonical_field !== 'ignore');
  const highConfidence = mappedFields.filter(m => m.confidence >= 0.9);
  const medConfidence = mappedFields.filter(m => m.confidence >= 0.65 && m.confidence < 0.9);
  const lowConfidence = mappedFields.filter(m => m.confidence < 0.65);

  const data = [{
    total_mapped: mappedFields.length,
    high_confidence_count: highConfidence.length,
    medium_confidence_count: medConfidence.length,
    low_confidence_count: lowConfidence.length,
    task_count: silver.tasks.length,
    member_count: silver.members.length,
    milestone_count: silver.milestones.length,
    mapping_confidence: silver.mapping_confidence,
    entity_resolution_merges: silver.entity_resolution.merges.length,
    entity_resolution_conflicts: silver.entity_resolution.conflicts.length,
  }];

  return makeView('data_quality_panel', 'Data quality panel', data,
    [], [], 1.0);
}

// ═══════════════════════════════════════════════
// NEW VIEWS: Sprint Health & Blocker Overview
// ═══════════════════════════════════════════════

function buildSprintHealth(mtf: MasterTaskFact[], silver: SilverLayer): AnalysisReadyView {
  const sprintMap: Record<string, { total: number; done: number; blocked: number; overdue: number }> = {};
  const now = new Date().toISOString().slice(0, 10);

  for (const fact of mtf) {
    const sprint = fact.sprint_name ?? 'Không có sprint';
    if (!sprintMap[sprint]) sprintMap[sprint] = { total: 0, done: 0, blocked: 0, overdue: 0 };
    sprintMap[sprint].total++;
    if (fact.completion_flag) sprintMap[sprint].done++;
    if (fact.blocker_flag) sprintMap[sprint].blocked++;
    if (fact.deadline && fact.deadline < now && !fact.completion_flag) sprintMap[sprint].overdue++;
  }

  const data = Object.entries(sprintMap).map(([name, s]) => ({
    sprint_name: name,
    total_tasks: s.total,
    done: s.done,
    blocked: s.blocked,
    overdue: s.overdue,
    completion_pct: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0,
    health_score: s.total > 0
      ? Math.round(((s.done / s.total) * 0.6 + (1 - s.blocked / s.total) * 0.2 + (1 - s.overdue / s.total) * 0.2) * 100)
      : 0,
  }));

  return makeView('sprint_health', 'Sprint health analysis', data,
    ['task'], ['sprint_name', 'task_status'],
    data.length > 1 ? silver.mapping_confidence : 0.2,
    data.length <= 1 ? ['Không có dữ liệu sprint'] : [],
    'Nhóm task theo sprint, tính % hoàn thành và điểm sức khỏe',
    'Group tasks by sprint, compute completion % and health score',
    'health = 0.6*done_ratio + 0.2*(1-blocked_ratio) + 0.2*(1-overdue_ratio)',
  );
}

function buildBlockerOverview(mtf: MasterTaskFact[], silver: SilverLayer): AnalysisReadyView {
  const blockedFacts = mtf.filter(f => f.blocker_flag || f.is_blocked);

  const data = blockedFacts.map(f => ({
    task_name: f.task_name,
    assignee: f.assignee_name ?? 'Chưa giao',
    sprint: f.sprint_name ?? 'N/A',
    blocked_reason: f.blocked_reason ?? 'Không rõ lý do',
    status: f.status_normalized,
    priority: f.priority_normalized ?? 'N/A',
    delay_days: f.delay_days ?? 0,
  })).sort((a, b) => b.delay_days - a.delay_days);

  return makeView('blocker_overview', 'Blocker overview', data,
    ['task'], ['blocked_reason', 'task_status'],
    data.length > 0 ? silver.mapping_confidence : 0.2,
    data.length === 0 ? ['Không có blocker nào được phát hiện'] : [],
    'Danh sách tất cả task bị chặn và lý do',
    'List of all blocked tasks with reasons',
    'Filter master_task_fact WHERE blocker_flag = true',
  );
}

// ═══════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════

function makeView(
  key: string,
  intent: string,
  data: Record<string, unknown>[],
  entities: string[],
  fields: string[],
  confidence: number,
  warnings: string[] = [],
  explanationVi: string = '',
  explanationEn: string = '',
  formula: string = '',
): AnalysisReadyView {
  return {
    view_key: key,
    intent,
    data,
    row_count: data.length,
    confidence: Math.round(confidence * 100) / 100,
    source_entities: entities,
    source_fields: fields,
    transformation_formula: formula,
    freshness: new Date().toISOString(),
    contradiction_impact: 0,
    explanation_vi: explanationVi,
    explanation_en: explanationEn,
    warnings,
    generated_from: 'silver',
  };
}
