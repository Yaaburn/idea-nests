import { SignalType, TaskStatus } from '@prisma/client';
import { startOfWeek, endOfWeek, subWeeks, format, subDays } from 'date-fns';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * AnalysisService - Computes analysis signals from canonical data
 * V1.5 Upgrade: Added 9 signal types
 */
export class AnalysisService {
    async computeAllSignals(tenantId: string, projectId: string, signalTypes?: string[]): Promise<void> {
        const types = signalTypes ?? Object.values(SignalType);

        for (const type of types) {
            try {
                // @ts-ignore - dynamic dispatch
                const method = this.getMethodForType(type as SignalType);
                if (method) {
                    await method.call(this, tenantId, projectId);
                }
            } catch (error) {
                logger.error({ error, signalType: type, projectId }, 'Failed to compute signal');
            }
        }
    }

    private getMethodForType(type: SignalType): Function | null {
        switch (type) {
            case 'TASK_COUNTS_BY_STATUS': return this.computeTaskCountsByStatus;
            case 'TASK_VELOCITY_WEEKLY': return this.computeTaskVelocityWeekly;
            case 'PROJECT_PROGRESS': return this.computeProjectProgress;
            case 'MILESTONE_HEALTH': return this.computeMilestoneHealth;
            case 'ARTIFACT_ACTIVITY_WEEKLY': return this.computeArtifactActivityWeekly;
            case 'MEETING_LOAD_WEEKLY': return this.computeMeetingLoadWeekly;
            case 'THROUGHPUT_WEEKLY': return this.computeThroughputWeekly;
            case 'CONTRIBUTOR_LEADERBOARD': return this.computeContributorLeaderboard;
            case 'PROOF_INDEX': return this.computeProofIndex;

            case 'CFD_WEEKLY': return this.computeCfdWeekly;
            case 'KPI_SUMMARY': return this.computeKpiSummary;
            case 'EXECUTIVE_SUMMARY': return this.computeExecutiveSummary;
            default: return null;
        }
    }

    // 0. KPI SUMMARY (New - Composite)
    private async computeKpiSummary(tenantId: string, projectId: string): Promise<void> {
        // Fetch base metrics
        const tasks = await prisma.canonicalTask.findMany({
            where: { tenantId, projectId },
            select: { id: true, status: true, dueDate: true, completedAt: true, startDate: true }
        });
        const milestones = await prisma.canonicalMilestone.findMany({
            where: { tenantId, projectId },
            include: { tasks: { select: { status: true } } }
        });
        const events = await prisma.canonicalEvent.count({ where: { tenantId, projectId } }); // Proof events

        // 1. Active Project Days
        const connections = await prisma.connection.findMany({ where: { tenantId, projectId }, select: { createdAt: true } });
        const start = connections.length > 0 ? connections[0].createdAt : new Date();
        const activeDays = Math.max(1, Math.floor((Date.now() - start.getTime()) / (1000 * 3600 * 24)));

        // 2. Milestone Progress (Average)
        const milesProgress = milestones.length > 0
            ? Math.round(milestones.reduce((sum, m) => {
                const total = m.tasks.length;
                const done = m.tasks.filter(t => t.status === 'DONE').length;
                return sum + (total > 0 ? (done / total) * 100 : 0);
            }, 0) / milestones.length)
            : 0;

        // 3. On-time Rate
        const doneTasks = tasks.filter(t => t.status === 'DONE');
        const onTime = doneTasks.filter(t => t.dueDate && t.completedAt && t.completedAt <= t.dueDate).length;
        const onTimeRate = doneTasks.length > 0 ? Math.round((onTime / doneTasks.length) * 100) : 100;

        // 4. Throughput (Avg Weekly)
        const weeks = await this.getWeeklyCounts(tenantId, projectId, 'canonicalTask', 'completedAt', { status: 'DONE' });
        const throughput = this.avg(weeks);

        // 5. Median Cycle Time (Days)
        const cycles = doneTasks
            .filter(t => t.startDate && t.completedAt)
            .map(t => (t.completedAt!.getTime() - t.startDate!.getTime()) / (1000 * 3600 * 24))
            .sort((a, b) => a - b);
        const medianCycle = cycles.length > 0
            ? Math.round(cycles[Math.floor(cycles.length / 2)])
            : 0;

        // 6. Blockers
        const blockers = tasks.filter(t => t.status === 'BLOCKED').length;

        // 7. Capacity (Mock: InProgress / Total)
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const capacity = tasks.length > 0 ? Math.round((inProgress / tasks.length) * 100) : 0;

        const kpiData = [
            {
                title: 'Active Project Days',
                value: activeDays,
                subtitle: 'days running',
                variant: 'neutral' as const,
                tooltip: 'Days since potential project start detected from connection date'
            },
            {
                title: 'Milestone Progress',
                value: milesProgress,
                subtitle: '% avg completion',
                variant: milesProgress >= 80 ? 'good' : 'neutral',
                tooltip: 'Average completion percentage of all milestones'
            },
            {
                title: 'On-time Rate',
                value: onTimeRate,
                subtitle: '% of tasks',
                variant: onTimeRate < 70 ? 'warning' : 'good',
                tooltip: 'Percentage of done tasks completed on or before due date'
            },
            {
                title: 'Verified Proof',
                value: events,
                subtitle: 'events linked',
                variant: 'neutral',
                tooltip: 'Total calendar events verified as proof of activity'
            },
            {
                title: 'Throughput',
                value: throughput.toFixed(1),
                subtitle: 'tasks / week',
                variant: 'neutral',
                tooltip: 'Average number of tasks completed per week'
            },
            {
                title: 'Median Cycle Time',
                value: medianCycle,
                subtitle: 'days',
                variant: 'neutral',
                tooltip: 'Median days from In Progress to Done'
            },
            {
                title: 'Capacity Util',
                value: capacity,
                subtitle: '% active load',
                variant: 'neutral',
                tooltip: 'Ratio of tasks currently In Progress vs Total'
            },
            {
                title: 'Blockers Open',
                value: blockers,
                subtitle: 'tasks blocked',
                variant: blockers > 0 ? 'warning' : 'good',
                tooltip: 'Current number of blocked tasks'
            },
        ];

        await this.saveSignal(
            tenantId, projectId, 'KPI_SUMMARY',
            kpiData,
            0.9,
            'Composite of 8 core KPIs from tasks/milestones/events',
            tasks.map(t => t.id),
            tasks.length === 0
        );
    }

    // 0.1 EXECUTIVE SUMMARY (New - Textual)
    private async computeExecutiveSummary(tenantId: string, projectId: string): Promise<void> {
        // Fetch core metrics
        const progressSignal = await prisma.analysisSignal.findUnique({ where: { tenantId_projectId_signalType: { tenantId, projectId, signalType: 'PROJECT_PROGRESS' } } });
        const kpisSignal = await prisma.analysisSignal.findUnique({ where: { tenantId_projectId_signalType: { tenantId, projectId, signalType: 'KPI_SUMMARY' } } });

        const progress = progressSignal?.value as any;
        const kpis = kpisSignal?.value as any[];

        const percent = progress?.percent ?? 0;
        let headline = 'Project status is unknown.';
        if (percent >= 80) headline = 'Project is nearing completion.';
        else if (percent >= 50) headline = 'Project is halfway through.';
        else if (percent > 0) headline = 'Project is in early stages.';

        // Mock simple AI status
        const bullets = [
            `Overall progress is at ${percent}%.`,
            `Tracked ${kpis ? kpis.length : 0} core KPIs in the dashboard.`
        ];

        const summaryData = {
            headline,
            bullets,
            drivers: ['Milestone Completion', 'Task Velocity'],
            missing_fields: [], // No LLM to detect missing context yet
            confidence: 0.9
        };

        await this.saveSignal(
            tenantId, projectId, 'EXECUTIVE_SUMMARY',
            summaryData,
            0.9,
            'Heuristic summary based on project progress',
            [],
            false
        );
    }

    private async computeTaskCountsByStatus(tenantId: string, projectId: string): Promise<void> {
        const counts = await prisma.canonicalTask.groupBy({
            by: ['status'],
            where: { tenantId, projectId },
            _count: { id: true },
        });

        const total = counts.reduce((sum, c) => sum + c._count.id, 0);
        const derivedFromIds = await this.getSampleIds('canonicalTask', { tenantId, projectId });

        const value = {
            todo: counts.find(c => c.status === 'TODO')?._count.id ?? 0,
            in_progress: counts.find(c => c.status === 'IN_PROGRESS')?._count.id ?? 0,
            done: counts.find(c => c.status === 'DONE')?._count.id ?? 0,
            blocked: counts.find(c => c.status === 'BLOCKED')?._count.id ?? 0,
            unknown: counts.find(c => c.status === 'UNKNOWN')?._count.id ?? 0,
            total,
        };

        await this.saveSignal(tenantId, projectId, 'TASK_COUNTS_BY_STATUS', value, total > 0 ? 1 : 0, 'Exact count', derivedFromIds, total === 0);
    }

    // 2. VELOCITY (Existing)
    private async computeTaskVelocityWeekly(tenantId: string, projectId: string): Promise<void> {
        const weeks = await this.getWeeklyCounts(tenantId, projectId, 'canonicalTask', 'completedAt', { status: 'DONE' });
        const hasData = weeks.some(w => w.count > 0);

        await this.saveSignal(
            tenantId, projectId, 'TASK_VELOCITY_WEEKLY',
            { weeks, average: this.avg(weeks), trend: this.calculateTrend(weeks.map(w => w.count)) },
            hasData ? 0.8 : 0,
            'Completed tasks per week',
            [], hasData === false
        );
    }

    // 3. MILESTONE HEALTH (New)
    private async computeMilestoneHealth(tenantId: string, projectId: string): Promise<void> {
        const milestones = await prisma.canonicalMilestone.findMany({
            where: { tenantId, projectId },
            include: { tasks: { select: { status: true } } }
        });

        const total = milestones.length;
        const healthData = milestones.map(m => {
            const mTotal = m.tasks.length;
            const mDone = m.tasks.filter(t => t.status === 'DONE').length;
            const progress = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;
            return { id: m.id, title: m.title, progress, total: mTotal, done: mDone, status: m.status };
        });

        await this.saveSignal(
            tenantId, projectId, 'MILESTONE_HEALTH',
            healthData,
            total > 0 ? 0.9 : 0,
            'Progress per milestone based on linked tasks',
            milestones.map(m => m.id),
            total === 0
        );
    }

    // 4. ARTIFACTS (Existing)
    private async computeArtifactActivityWeekly(tenantId: string, projectId: string): Promise<void> {
        const weeks = await this.getWeeklyCounts(tenantId, projectId, 'canonicalArtifact', 'modifiedTime', { trashed: false });
        const hasData = weeks.some(w => w.count > 0);

        await this.saveSignal(
            tenantId, projectId, 'ARTIFACT_ACTIVITY_WEEKLY',
            { weeks, trend: this.calculateTrend(weeks.map(w => w.count)) },
            hasData ? 0.9 : 0,
            'Drive modifications per week',
            [], hasData === false
        );
    }

    // 5. MEETINGS (Existing)
    private async computeMeetingLoadWeekly(tenantId: string, projectId: string): Promise<void> {
        // Custom logic for meetings to count withMeet
        const now = new Date();
        const weeks: any[] = [];
        for (let i = 0; i < 8; i++) {
            const start = startOfWeek(subWeeks(now, i));
            const end = endOfWeek(subWeeks(now, i));
            const events = await prisma.canonicalEvent.findMany({
                where: { tenantId, projectId, status: 'CONFIRMED', startTime: { gte: start, lte: end } },
                select: { hasMeetLink: true }
            });
            weeks.unshift({ week: format(start, 'yyyy-Www'), count: events.length, withMeet: events.filter(e => e.hasMeetLink).length });
        }

        await this.saveSignal(
            tenantId, projectId, 'MEETING_LOAD_WEEKLY',
            { weeks, trend: this.calculateTrend(weeks.map(w => w.count)) },
            weeks.some(w => w.count > 0) ? 0.9 : 0,
            'Meetings per week',
            [], weeks.every(w => w.count === 0)
        );
    }

    // 6. PROGRESS (Existing)
    private async computeProjectProgress(tenantId: string, projectId: string): Promise<void> {
        const counts = await prisma.canonicalTask.groupBy({
            by: ['status'],
            where: { tenantId, projectId },
            _count: { id: true },
        });

        const total = counts.reduce((sum, c) => sum + c._count.id, 0);
        const done = counts.find(c => c.status === 'DONE')?._count.id ?? 0;
        const inProgress = counts.find(c => c.status === 'IN_PROGRESS')?._count.id ?? 0;
        const percent = total > 0 ? Math.round(((done + 0.5 * inProgress) / total) * 100) : null;

        await this.saveSignal(
            tenantId, projectId, 'PROJECT_PROGRESS',
            { percent, done, inProgress, total },
            total > 0 ? 0.85 : 0,
            'Weighted task completion',
            [], total === 0
        );
    }

    // 7. THROUGHPUT (New)
    private async computeThroughputWeekly(tenantId: string, projectId: string): Promise<void> {
        // Alias for Velocity but formatted differently if needed.
        // For now, reuse same logic logic but store separately as requested.
        const weeks = await this.getWeeklyCounts(tenantId, projectId, 'canonicalTask', 'completedAt', { status: 'DONE' });
        await this.saveSignal(
            tenantId, projectId, 'THROUGHPUT_WEEKLY',
            weeks,
            weeks.some(w => w.count > 0) ? 0.8 : 0,
            'Tasks completed per week',
            [], weeks.every(w => w.count === 0)
        );
    }

    // 8. CONTRIBUTOR LEADERBOARD (New)
    private async computeContributorLeaderboard(tenantId: string, projectId: string): Promise<void> {
        // Aggregate tasks by assigneeRaw (since we might not have standardized persons everywhere yet)
        // Better: join with CanonicalPerson if available.
        // For V1, use canonicalPerson if exists, else assigneeRaw.

        // 1. Get stats from Tasks
        const taskStats = await prisma.canonicalTask.groupBy({
            by: ['assigneeRaw', 'status'],
            where: { tenantId, projectId, assigneeRaw: { not: null } },
            _count: { id: true }
        });

        // Map to persons
        const leaderboard: Record<string, any> = {};

        for (const stat of taskStats) {
            const name = stat.assigneeRaw!;
            if (!leaderboard[name]) leaderboard[name] = { name, completed: 0, total: 0 };
            leaderboard[name].total += stat._count.id;
            if (stat.status === 'DONE') leaderboard[name].completed += stat._count.id;
        }

        const sorted = Object.values(leaderboard).sort((a: any, b: any) => b.completed - a.completed).slice(0, 10);

        await this.saveSignal(
            tenantId, projectId, 'CONTRIBUTOR_LEADERBOARD',
            sorted,
            sorted.length > 0 ? 0.7 : 0,
            'Top assignees by completed tasks',
            [], sorted.length === 0
        );
    }

    // 9. PROOF INDEX (New)
    private async computeProofIndex(tenantId: string, projectId: string): Promise<void> {
        const milestones = await prisma.canonicalMilestone.count({ where: { tenantId, projectId } });
        const evidenceTypes = await prisma.canonicalArtifact.groupBy({
            by: ['typeCategory'],
            where: { tenantId, projectId, trashed: false },
        });

        const events = await prisma.canonicalEvent.count({ where: { tenantId, projectId } });
        const lastProof = await prisma.canonicalArtifact.findFirst({
            where: { tenantId, projectId },
            orderBy: { modifiedTime: 'desc' },
            select: { modifiedTime: true }
        });

        const recencyDays = lastProof ? Math.floor((Date.now() - lastProof.modifiedTime.getTime()) / (1000 * 3600 * 24)) : 999;

        const index = {
            coverage: milestones > 0 ? 100 : 0, // Mock logic for now
            recency: recencyDays,
            depth: evidenceTypes.length,
            continuity: events > 0 ? 5 : 0 // Mock logic
        };

        await this.saveSignal(
            tenantId, projectId, 'PROOF_INDEX',
            index,
            0.6,
            'Composite score of milestones and artifacts',
            [],
            milestones === 0 && events === 0
        );
    }

    // 10. CFD WEEKLY (Append-Only)
    private async computeCfdWeekly(tenantId: string, projectId: string): Promise<void> {
        // Load existing signal
        const existing = await prisma.analysisSignal.findUnique({
            where: { tenantId_projectId_signalType: { tenantId, projectId, signalType: 'CFD_WEEKLY' } }
        });

        let history: any[] = (existing?.value as any)?.history ?? [];

        // Compute current state
        const counts = await prisma.canonicalTask.groupBy({
            by: ['status'],
            where: { tenantId, projectId },
            _count: { id: true },
        });

        const snapshot = {
            date: format(new Date(), 'yyyy-MM-dd'),
            backlog: counts.find(c => c.status === 'TODO')?._count.id ?? 0,
            inProgress: counts.find(c => c.status === 'IN_PROGRESS')?._count.id ?? 0,
            done: counts.find(c => c.status === 'DONE')?._count.id ?? 0,
            review: 0 // No separate review status in core enum yet
        };

        // Append if new day
        if (history.length === 0 || history[history.length - 1].date !== snapshot.date) {
            history.push(snapshot);
            // Keep last 30 snapshots
            if (history.length > 30) history.shift();
        } else {
            // Update today
            history[history.length - 1] = snapshot;
        }

        await this.saveSignal(
            tenantId, projectId, 'CFD_WEEKLY',
            { history, approximation: 'snapshot_timeline' },
            0.8,
            'Cumulative Flow Diagram history (append-only)',
            [], false
        );
    }

    // --- Helpers ---

    private async getWeeklyCounts(tenant: string, project: string, model: 'canonicalTask' | 'canonicalArtifact', dateField: string, whereClause: any): Promise<{ week: string, count: number }[]> {
        const now = new Date();
        const weeks: any[] = [];
        for (let i = 0; i < 8; i++) {
            const start = startOfWeek(subWeeks(now, i));
            const end = endOfWeek(subWeeks(now, i));
            // @ts-ignore
            const count = await prisma[model].count({
                where: {
                    tenantId: tenant,
                    projectId: project,
                    ...whereClause,
                    [dateField]: { gte: start, lte: end }
                }
            });
            weeks.unshift({ week: format(start, 'yyyy-Www'), count });
        }
        return weeks;
    }

    private async saveSignal(tenantId: string, projectId: string, type: SignalType, value: any, confidence: number, methodology: string, derivedFromIds: string[], isInsufficient: boolean) {
        await prisma.analysisSignal.upsert({
            where: { tenantId_projectId_signalType: { tenantId, projectId, signalType: type } },
            create: {
                tenantId, projectId, signalType: type, value, confidenceScore: confidence, methodology, derivedFromIds, isInsufficient
            },
            update: {
                value, confidenceScore: confidence, methodology, derivedFromIds, isInsufficient, computedAt: new Date()
            }
        });
    }

    private async getSampleIds(model: string, where: any): Promise<string[]> {
        // @ts-ignore
        const items = await prisma[model].findMany({ where, select: { id: true }, take: 100 });
        return items.map((i: any) => i.id);
    }

    private avg(items: { count: number }[]) {
        if (items.length === 0) return 0;
        return items.reduce((a, b) => a + b.count, 0) / items.length;
    }

    private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
        if (values.length < 2) return 'stable';
        const recent = values.slice(-2).reduce((a, b) => a + b, 0) / 2;
        const old = values.slice(0, -2).reduce((a, b) => a + b, 0) / Math.max(values.length - 2, 1);
        const diff = recent - old;
        return diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable';
    }
}
