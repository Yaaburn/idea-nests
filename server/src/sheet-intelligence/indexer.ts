import { google, sheets_v4 } from 'googleapis';
import { SheetStructure, SheetTabProfile, TabRole } from './types.js';
import { logger } from '../lib/logger.js';

export class SheetIndexer {
    private sheets: sheets_v4.Sheets;

    constructor(auth: any) {
        this.sheets = google.sheets({ version: 'v4', auth });
    }

    /**
     * Fetches spreadsheet metadata (without grid data) to build a structure outline.
     */
    async indexSpreadsheet(spreadsheetId: string): Promise<SheetStructure> {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
                // Use field mask to fetch only what we need, avoiding heavy grid data
                fields: 'properties(title),sheets(properties(sheetId,title,index,hidden,gridProperties,tabColor),data(rowData(values(note))))',
                includeGridData: false,
            });

            const data = response.data;
            if (!data.properties || !data.sheets) {
                throw new Error('Invalid spreadsheet response');
            }

            const tabs: SheetTabProfile[] = data.sheets.map(sheet => {
                const props = sheet.properties!;
                return {
                    tabId: props.sheetId!,
                    title: props.title!,
                    index: props.index!,
                    isHidden: props.hidden ?? false,
                    gridProperties: {
                        rowCount: props.gridProperties?.rowCount ?? 0,
                        columnCount: props.gridProperties?.columnCount ?? 0,
                    },
                    role: TabRole.UNKNOWN, // To be classified later
                    confidence: 0,
                    decision: 'needs_review',
                    scoreBreakdown: {
                        nameHintScore: 0,
                        headerScore: 0,
                        structureScore: 0,
                    },
                    assignedExtractor: null,
                };
            });

            return {
                spreadsheetId,
                title: data.properties.title ?? 'Untitled',
                tabs,
                timestamp: new Date(),
            };
        } catch (error) {
            logger.error({ error, spreadsheetId }, 'Failed to index spreadsheet');
            throw error;
        }
    }
}
