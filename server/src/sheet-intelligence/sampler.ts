import { google, sheets_v4 } from 'googleapis';
import { logger } from '../lib/logger.js';

export class SheetSampler {
    private sheets: sheets_v4.Sheets;

    constructor(auth: any) {
        this.sheets = google.sheets({ version: 'v4', auth });
    }

    /**
     * Fetches sample data from multiple tabs efficiently using batchGet.
     * Samples: Header row (1:1) and First 50 rows (A1:Z50) to detect structure.
     */
    async sampleTabs(spreadsheetId: string, tabNames: string[]): Promise<Record<string, any[][]>> {
        if (tabNames.length === 0) return {};

        try {
            // Build ranges: fetch A1:Z50 for each tab
            // Limiting to column Z and 50 rows is usually enough for classification
            const ranges = tabNames.map(name => `'${name}'!A1:Z50`);

            const response = await this.sheets.spreadsheets.values.batchGet({
                spreadsheetId,
                ranges,
                majorDimension: 'ROWS',
                valueRenderOption: 'UNFORMATTED_VALUE',
            });

            const results: Record<string, any[][]> = {};

            response.data.valueRanges?.forEach((range, index) => {
                const tabName = tabNames[index];
                results[tabName] = range.values ?? [];
            });

            return results;
        } catch (error) {
            logger.error({ error, spreadsheetId }, 'Failed to sample tabs');
            throw error;
        }
    }
}
