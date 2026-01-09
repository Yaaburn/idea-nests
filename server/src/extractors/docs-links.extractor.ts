import { CanonicalLink } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class DocsLinksExtractor {
    extract(
        rows: any[][],
        context: {
            tenantId: string;
            projectId: string;
            connectionId: string;
            sheetId: string;
            tabName: string;
        }
    ): CanonicalLink[] {
        const headerRowIndex = this.findHeaderRow(rows);
        if (headerRowIndex === -1) return [];

        const headers = rows[headerRowIndex].map(h => String(h).toLowerCase());
        const links: CanonicalLink[] = [];

        const colMap = {
            title: headers.findIndex(h => h.includes('title') || h.includes('tên') || h.includes('doc') || h.includes('document') || h.includes('tài liệu')),
            url: headers.findIndex(h => h.includes('url') || h.includes('link') || h.includes('liên kết')),
            type: headers.findIndex(h => h.includes('type') || h.includes('loại')),
        };

        if (colMap.url === -1) return [];

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            const rawUrl = colMap.url !== -1 ? row[colMap.url] : null;

            if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.startsWith('http')) continue;

            const title = colMap.title !== -1 ? String(row[colMap.title]) : 'Untitled Link';
            const typeHint = colMap.type !== -1 ? String(row[colMap.type]) : this.inferTypeFromUrl(rawUrl);

            links.push({
                id: uuidv4(),
                tenantId: context.tenantId,
                projectId: context.projectId,
                connectionId: context.connectionId,
                title,
                url: rawUrl,
                typeHint,
                sourceTabName: context.tabName,
                sourceRowIndex: i + 1,
                rawRecordId: null,
                syncedAt: new Date(),
            } as CanonicalLink);
        }

        return links;
    }

    private findHeaderRow(rows: any[][]): number {
        return rows.findIndex(row =>
            row.some(cell => String(cell).toLowerCase().includes('link') || String(cell).toLowerCase().includes('url'))
        );
    }

    private inferTypeFromUrl(url: string): string {
        if (url.includes('docs.google.com/document')) return 'gdoc';
        if (url.includes('docs.google.com/spreadsheet')) return 'gsheet';
        if (url.includes('docs.google.com/presentation')) return 'gslide';
        if (url.includes('figma.com')) return 'figma';
        if (url.includes('github.com')) return 'github';
        if (url.includes('drive.google.com')) return 'drive';
        return 'other';
    }
}
