import { CanonicalMilestone } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class TimelineExtractor {
    extract(
        rows: any[][],
        context: {
            tenantId: string;
            projectId: string;
            connectionId: string;
            sheetId: string;
            tabName: string;
        }
    ): CanonicalMilestone[] {
        const headerRowIndex = this.findHeaderRow(rows);
        if (headerRowIndex === -1) return [];

        const headers = rows[headerRowIndex].map(h => String(h).toLowerCase());
        const milestones: CanonicalMilestone[] = [];

        const colMap = {
            title: headers.findIndex(h => h.includes('milestone') || h.includes('phase') || h.includes('giai đoạn') || h.includes('mục tiêu')),
            startDate: headers.findIndex(h => h.includes('start') || h.includes('bắt đầu')),
            dueDate: headers.findIndex(h => h.includes('end') || h.includes('finish') || h.includes('kết thúc') || h.includes('due')),
            status: headers.findIndex(h => h.includes('status') || h.includes('trạng thái')),
        };

        if (colMap.title === -1) return [];

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[colMap.title]) continue;

            const title = String(row[colMap.title]);
            const status = colMap.status !== -1 ? String(row[colMap.status] || '') : 'PLANNED';
            const startDate = colMap.startDate !== -1 ? this.parseDate(row[colMap.startDate]) : null;
            const dueDate = colMap.dueDate !== -1 ? this.parseDate(row[colMap.dueDate]) : null;

            // Rudimentary completion logic
            const completedAt = status.toLowerCase().includes('done') || status.toLowerCase().includes('hoàn thành') ? (dueDate ?? new Date()) : null;

            milestones.push({
                id: uuidv4(),
                tenantId: context.tenantId,
                projectId: context.projectId,
                connectionId: context.connectionId,
                title,
                status,
                startDate,
                dueDate,
                completedAt,
                taskCount: 0, // Calculated later via relation
                taskCompleted: 0,
                sourceSheetId: context.sheetId,
                sourceTabName: context.tabName,
                sourceRowIndex: i + 1,
                rawRecordId: null,
                syncedAt: new Date(),
            } as CanonicalMilestone);
        }

        return milestones;
    }

    private findHeaderRow(rows: any[][]): number {
        return rows.findIndex(row =>
            row.some(cell => String(cell).toLowerCase().includes('start') || String(cell).toLowerCase().includes('bắt đầu'))
        );
    }

    private parseDate(val: any): Date | null {
        if (!val) return null;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
}
