import { SheetTabProfile, TabRole, SheetStructure } from './types.js';
import { logger } from '../lib/logger.js';

export class SheetClassifier {

    /**
     * Classifies all tabs in a spreadsheet structure based on sample data.
     */
    classifyTabs(structure: SheetStructure, samples: Record<string, any[][]>): SheetStructure {
        const classifiedTabs = structure.tabs.map(tab => {
            // Skip hidden or very small tabs (lookup tables usually)
            if (tab.isHidden) {
                return { ...tab, role: TabRole.ARCHIVE, confidence: 1.0, decision: 'auto' as const };
            }

            const sampleRows = samples[tab.title] ?? [];
            return this.classifySingleTab(tab, sampleRows);
        });

        return {
            ...structure,
            tabs: classifiedTabs,
        };
    }

    private classifySingleTab(tab: SheetTabProfile, rows: any[][]): SheetTabProfile {
        if (rows.length === 0) {
            return { ...tab, role: TabRole.UNKNOWN, confidence: 0, decision: 'needs_review' };
        }

        // 1. Name Hint Score
        const nameRole = this.checkNameHints(tab.title);
        const nameHintScore = nameRole ? 0.8 : 0;

        // 2. Header Score & Structure Score
        // Find header row (row with most strings)
        const headerRowIndex = this.findHeaderRow(rows);
        const headers = rows[headerRowIndex]?.map(c => String(c).toLowerCase()) ?? [];

        const { role: headerRole, score: headerScore } = this.checkHeaderSemantics(headers);
        const { role: structureRole, score: structureScore } = this.checkStructure(rows, headerRowIndex);

        // 3. Combine Scores
        // Weighted average: Header (50%) > Name (30%) > Structure (20%)
        const scores = new Map<TabRole, number>();

        if (nameRole) scores.set(nameRole, (scores.get(nameRole) || 0) + 0.3);
        if (headerRole) scores.set(headerRole, (scores.get(headerRole) || 0) + 0.5);
        if (structureRole) scores.set(structureRole, (scores.get(structureRole) || 0) + 0.2);

        // Normalize confidence
        let bestRole = TabRole.UNKNOWN;
        let maxScore = 0;

        for (const [r, s] of scores.entries()) {
            if (s > maxScore) {
                maxScore = s;
                bestRole = r;
            }
        }

        // Heuristic: If name says "Docs" but headers say "Start Date/End Date", trust Headers.
        if (headerScore > 0.8) bestRole = headerRole!;

        // Decision threshold
        const decision = maxScore >= 0.7 ? 'auto' : 'needs_review';

        return {
            ...tab,
            role: bestRole,
            confidence: Math.min(maxScore, 1.0),
            decision,
            scoreBreakdown: {
                nameHintScore: nameRole ? 1 : 0,
                headerScore,
                structureScore,
            },
            assignedExtractor: this.getExtractorForRole(bestRole),
        };
    }

    private checkNameHints(title: string): TabRole | null {
        const lower = title.toLowerCase();

        // Exact/Strong matches
        if (lower.includes('task') || lower.includes('backlog') || lower.includes('sprint') || lower.includes('todo')) return TabRole.PRIMARY_TASKS;
        if (lower.includes('timeline') || lower.includes('roadmap') || lower.includes('milestone')) return TabRole.PRIMARY_TIMELINE;
        if (lower.includes('gantt')) return TabRole.PRIMARY_GANTT;
        if (lower.includes('team') || lower.includes('member') || lower.includes('staff')) return TabRole.PRIMARY_TEAM;
        if (lower.includes('doc') || lower.includes('link') || lower.includes('reference') || lower.includes('chung') || lower.includes('general')) return TabRole.DOCS_LINKS;
        if (lower.includes('kpi') || lower.includes('metric') || lower.includes('report')) return TabRole.KPI_METRICS;
        if (lower.includes('lookup') || lower.includes('data') || lower.includes('config')) return TabRole.LOOKUP;
        if (lower.includes('archive') || lower.includes('old') || lower.includes('backup')) return TabRole.ARCHIVE;

        return null;
    }

    private checkHeaderSemantics(headers: string[]): { role: TabRole | null; score: number } {
        const has = (terms: string[]) => terms.some(t => headers.some(h => h.includes(t)));

        // Task detection
        const isTask = has(['status', 'trạng thái']) && (has(['assignee', 'người làm', 'owner']) || has(['due', 'hạn', 'deadline']));
        if (isTask) return { role: TabRole.PRIMARY_TASKS, score: 0.9 };

        // Timeline detection
        const isTimeline = has(['start', 'bắt đầu']) && has(['end', 'kết thúc', 'finish']) && has(['phase', 'giai đoạn', 'milestone']);
        if (isTimeline) return { role: TabRole.PRIMARY_TIMELINE, score: 0.9 };

        // Team detection
        const isTeam = has(['email', 'mail']) && has(['role', 'vai trò', 'chức vụ']) && has(['name', 'tên']);
        if (isTeam) return { role: TabRole.PRIMARY_TEAM, score: 0.95 };

        // Docs/Links detection
        const isDocs = has(['link', 'url', 'liên kết']) && has(['type', 'loại']);
        if (isDocs) return { role: TabRole.DOCS_LINKS, score: 0.8 };

        return { role: null, score: 0 };
    }

    private checkStructure(rows: any[][], headerRowIndex: number): { role: TabRole | null; score: number } {
        // Check for Gantt pattern: Date headers across columns
        // Heuristic: If > 50% of headers look like dates/weeks/months
        // This is complex, simplified for now
        return { role: null, score: 0 };
    }

    private findHeaderRow(rows: any[][]): number {
        // Determine header row by finding the first row with max string density
        // For now, assume row 0 or 1
        if (rows.length > 1 && rows[1].every(c => typeof c === 'string')) return 1;
        return 0;
    }

    private getExtractorForRole(role: TabRole): string | null {
        switch (role) {
            case TabRole.PRIMARY_TASKS: return 'TaskExtractor';
            case TabRole.PRIMARY_TIMELINE: return 'TimelineExtractor';
            case TabRole.PRIMARY_TEAM: return 'TeamExtractor';
            case TabRole.PRIMARY_GANTT: return 'GanttExtractor';
            case TabRole.DOCS_LINKS: return 'DocsLinksExtractor';
            default: return null;
        }
    }
}
