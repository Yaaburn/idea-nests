import { CanonicalPerson } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class TeamExtractor {
    extract(
        rows: any[][],
        context: {
            tenantId: string;
            projectId: string;
            sheetId: string;
        }
    ): CanonicalPerson[] {
        const headerRowIndex = this.findHeaderRow(rows);
        if (headerRowIndex === -1) return [];

        const headers = rows[headerRowIndex].map(h => String(h).toLowerCase());
        const people: CanonicalPerson[] = [];

        const colMap = {
            name: headers.findIndex(h => h.includes('name') || h.includes('tên') || h.includes('member')),
            email: headers.findIndex(h => h.includes('email') || h.includes('mail')),
            role: headers.findIndex(h => h.includes('role') || h.includes('chức vụ') || h.includes('vai trò') || h.includes('position')),
        };

        if (colMap.name === -1 && colMap.email === -1) return [];

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[colMap.name] && !row[colMap.email]) continue;

            const name = colMap.name !== -1 ? String(row[colMap.name]) : null;
            const email = colMap.email !== -1 ? String(row[colMap.email]) : null;
            const role = colMap.role !== -1 ? String(row[colMap.role]) : null;

            // Use email as canonical ID if available, otherwise name-based pseudo-email
            const canonicalEmail = email?.toLowerCase() ?? `pseudo-${name?.toLowerCase().replace(/\s+/g, '.')}@placeholder`;

            people.push({
                id: uuidv4(),
                tenantId: context.tenantId,
                projectId: context.projectId,
                name,
                email,
                role,
                canonicalEmail,
                contributionCount: 0,
                syncedAt: new Date(),
            } as CanonicalPerson);
        }

        return people;
    }

    private findHeaderRow(rows: any[][]): number {
        return rows.findIndex(row =>
            row.some(cell => String(cell).toLowerCase().includes('email') || String(cell).toLowerCase().includes('role'))
        );
    }
}
