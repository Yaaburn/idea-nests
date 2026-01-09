import { CanonicalTask, TaskStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class TaskExtractor {
    extract(
        rows: any[][],
        context: {
            tenantId: string;
            projectId: string;
            connectionId: string;
            sheetId: string;
            tabName: string;
        }
    ): CanonicalTask[] {
        const headerRowIndex = this.findHeaderRow(rows);
        if (headerRowIndex === -1) return [];

        const headers = rows[headerRowIndex].map(h => String(h).toLowerCase());
        const tasks: CanonicalTask[] = [];

        // Map column indices
        const colMap = {
            title: headers.findIndex(h => h.includes('task') || h.includes('title') || h.includes('name') || h.includes('mục') || h.includes('công việc')),
            status: headers.findIndex(h => h.includes('status') || h.includes('trạng thái') || h.includes('tình trạng')),
            assignee: headers.findIndex(h => h.includes('assignee') || h.includes('owner') || h.includes('người làm') || h.includes('phụ trách')),
            dueDate: headers.findIndex(h => h.includes('due') || h.includes('deadline') || h.includes('hạn') || h.includes('ngày')),
            priority: headers.findIndex(h => h.includes('priority') || h.includes('ưu tiên')),
            tags: headers.findIndex(h => h.includes('tag') || h.includes('bg:') || h.includes('nhãn')),
            phase: headers.findIndex(h => h.includes('phase') || h.includes('giai đoạn') || h.includes('milestone')),
        };

        if (colMap.title === -1) return []; // Essential column missing

        // Iterate rows after header
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[colMap.title]) continue; // Skip empty titles

            const title = String(row[colMap.title]);
            const statusRaw = colMap.status !== -1 ? String(row[colMap.status] || '') : 'UNKNOWN';
            const assigneeRaw = colMap.assignee !== -1 ? String(row[colMap.assignee] || '') : null;
            const dueDateRaw = colMap.dueDate !== -1 ? row[colMap.dueDate] : null;
            const priority = colMap.priority !== -1 ? String(row[colMap.priority] || '') : null;
            const tagsRaw = colMap.tags !== -1 ? String(row[colMap.tags] || '') : '';
            const phase = colMap.phase !== -1 ? String(row[colMap.phase] || '') : null;

            const status = this.normalizeStatus(statusRaw);
            const dueDate = this.parseDate(dueDateRaw);
            const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

            // Determine rudimentary completeness
            const completedAt = status === 'DONE' ? (dueDate ?? new Date()) : null; // Fallback, imperfect

            tasks.push({
                id: uuidv4(),
                tenantId: context.tenantId,
                projectId: context.projectId,
                connectionId: context.connectionId,
                title,
                description: null,
                status,
                assigneeRaw,
                dueDate,
                startDate: null,
                completedAt,
                priority,
                tags,
                phase,
                milestoneId: null, // Linked later via linkage phase if needed
                sourceSheetId: context.sheetId,
                sourceTabName: context.tabName,
                sourceRowIndex: i + 1,
                rawRecordId: null, // Populated by caller
                mappingConfidence: 0.8,
                parseErrors: [],
                syncedAt: new Date(),
            } as CanonicalTask);
        }

        return tasks;
    }

    private findHeaderRow(rows: any[][]): number {
        return rows.findIndex(row =>
            row.some(cell => String(cell).toLowerCase().includes('status') || String(cell).toLowerCase().includes('trạng thái'))
        );
    }

    private normalizeStatus(raw: string): TaskStatus {
        const s = raw.toLowerCase().trim();
        if (['done', 'completed', 'xong', 'hoàn thành', 'finished'].includes(s)) return 'DONE';
        if (['in progress', 'doing', 'đang làm', 'open', 'active'].includes(s)) return 'IN_PROGRESS';
        if (['todo', 'to do', 'backlog', 'planned', 'cần làm', 'chưa làm'].includes(s)) return 'TODO';
        if (['blocked', 'bị chặn', 'stuck', 'hold'].includes(s)) return 'BLOCKED';
        return 'UNKNOWN';
    }

    private parseDate(val: any): Date | null {
        if (!val) return null;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
}
