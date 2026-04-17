// ═══════════════════════════════════════════════
// Sheet Service — Google Sheets API Operations
// Phase 5: Full Workbook Ingestion (ALL tabs).
// Handles metadata verification and data fetching.
// ═══════════════════════════════════════════════

import { getSheetsClient } from './googleAuth.service';

/**
 * Verify that the bot has access to the spreadsheet.
 * Calls metadata endpoint to check permissions.
 *
 * @returns Object with spreadsheet title and sheet names
 * @throws Error with code 'PERMISSION_DENIED' or 'SHEET_NOT_FOUND'
 */
export async function verifyAccess(spreadsheetId: string): Promise<{
  title: string;
  sheetNames: string[];
}> {
  const sheets = getSheetsClient();

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title',
    });

    const title = response.data.properties?.title ?? 'Untitled';
    const sheetNames = (response.data.sheets ?? []).map(
      (s) => s.properties?.title ?? 'Sheet'
    );

    console.log(`[SheetService] Access verified: "${title}" (${sheetNames.length} tabs)`);
    return { title, sheetNames };
  } catch (err: any) {
    const status = err?.response?.status || err?.code;

    if (status === 403 || status === 401) {
      const error = new Error(
        'Bot chưa được cấp quyền truy cập. Hãy chia sẻ Google Sheet với email của Bot (quyền Viewer).'
      );
      (error as any).code = 'PERMISSION_DENIED';
      throw error;
    }

    if (status === 404) {
      const error = new Error('Không tìm thấy Google Sheet. Hãy kiểm tra lại URL.');
      (error as any).code = 'SHEET_NOT_FOUND';
      throw error;
    }

    console.error('[SheetService] verifyAccess error:', err.message);
    throw new Error('Lỗi khi kiểm tra quyền truy cập Google Sheet.');
  }
}

/**
 * Convert a 2D array (rows) into an array of objects.
 * Row 0 is used as headers (keys), remaining rows become objects.
 */
export function rowsToObjects(rows: string[][]): {
  headers: string[];
  data: Record<string, string>[];
} {
  if (!rows || rows.length < 2) {
    return { headers: [], data: [] };
  }

  const headers = rows[0].map((h) => (h ?? '').trim());
  const data: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip completely empty rows
    if (!row || row.every((cell) => !cell || cell.trim() === '')) continue;

    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (key) {
        obj[key] = (row[j] ?? '').trim();
      }
    }
    data.push(obj);
  }

  return { headers, data };
}

/**
 * DEPRECATED: Fetch data from first tab only.
 * Kept for backward compatibility bridge during migration.
 * Use fetchFullWorkbook() for new code.
 */
export async function fetchRawData(spreadsheetId: string): Promise<{
  title: string;
  headers: string[];
  data: Record<string, string>[];
  rowCount: number;
}> {
  const sheets = getSheetsClient();

  try {
    const metaResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title',
    });

    const spreadsheetTitle = metaResponse.data.properties?.title ?? 'Untitled';
    const firstTabName = metaResponse.data.sheets?.[0]?.properties?.title ?? 'Sheet1';

    const valuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: firstTabName,
      valueRenderOption: 'FORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const rawRows = valuesResponse.data.values ?? [];
    const { headers, data } = rowsToObjects(rawRows as string[][]);

    console.log(
      `[SheetService] [DEPRECATED] Fetched "${spreadsheetTitle}" → ${data.length} rows, ${headers.length} cols (first tab only)`
    );

    return {
      title: spreadsheetTitle,
      headers,
      data,
      rowCount: data.length,
    };
  } catch (err: any) {
    const status = err?.response?.status || err?.code;

    if (status === 403 || status === 401) {
      const error = new Error(
        'Bot không có quyền truy cập. Hãy kiểm tra quyền chia sẻ.'
      );
      (error as any).code = 'PERMISSION_DENIED';
      throw error;
    }

    console.error('[SheetService] fetchRawData error:', err.message);
    throw new Error('Lỗi khi lấy dữ liệu từ Google Sheets.');
  }
}

// ═══════════════════════════════════════════════
// FULL WORKBOOK INGESTION — Fetches ALL tabs
// Returns RawSheetData format compatible with
// the ingestion pipeline's snapshot generation.
// ═══════════════════════════════════════════════

export interface RawTabData {
  tab_name: string;
  tab_index: number;
  headers: string[];
  rows: string[][];
  row_count: number;
  col_count: number;
}

export interface FullWorkbookData {
  spreadsheet_id: string;
  title: string;
  tabs: RawTabData[];
  access_mode: 'service_account';
  total_tabs_found: number;
  tabs_skipped: string[];
}

/**
 * Fetch ALL tabs from a Google Spreadsheet.
 * Filters only tabs with >= 2 rows and >= 2 columns.
 * Returns full workbook data for snapshot generation.
 */
export async function fetchFullWorkbook(spreadsheetId: string): Promise<FullWorkbookData> {
  const sheets = getSheetsClient();

  // Step 1: Get full metadata (all tabs)
  const metaResponse = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'properties.title,sheets.properties',
  });

  const spreadsheetTitle = metaResponse.data.properties?.title ?? 'Untitled';
  const allSheets = metaResponse.data.sheets ?? [];

  console.log(`[SheetService] Workbook "${spreadsheetTitle}": ${allSheets.length} tabs found`);

  // Step 2: Filter eligible tabs
  const eligibleTabs: Array<{ title: string; index: number }> = [];
  const skippedTabs: string[] = [];

  for (const sheet of allSheets) {
    const title = sheet.properties?.title ?? 'Sheet';
    const index = sheet.properties?.index ?? 0;
    const rowCount = sheet.properties?.gridProperties?.rowCount ?? 0;
    const colCount = sheet.properties?.gridProperties?.columnCount ?? 0;

    if (rowCount >= 2 && colCount >= 2) {
      eligibleTabs.push({ title, index });
    } else {
      skippedTabs.push(title);
      console.log(`[SheetService] Skipping tab "${title}": ${rowCount} rows, ${colCount} cols (too small)`);
    }
  }

  if (eligibleTabs.length === 0) {
    const error = new Error('Không có tab nào có đủ dữ liệu để phân tích.');
    (error as any).code = 'EMPTY_DATA';
    throw error;
  }

  // Step 3: Batch fetch all eligible tab values
  const tabNames = eligibleTabs.map(t => t.title);
  const batchRanges = tabNames.map(t => `'${t.replace(/'/g, "''")}'`);

  let allValues: Map<string, string[][]>;

  try {
    // Try batch get (up to 10 tabs per batch)
    allValues = await batchFetchTabValues(sheets, spreadsheetId, tabNames);
  } catch {
    // Fallback: sequential fetch
    console.warn('[SheetService] Batch fetch failed, falling back to sequential');
    allValues = await sequentialFetchTabValues(sheets, spreadsheetId, tabNames);
  }

  // Step 4: Build RawTabData for each tab
  const tabs: RawTabData[] = [];

  for (const { title, index } of eligibleTabs) {
    const values = allValues.get(title) ?? [];
    if (values.length < 2) {
      skippedTabs.push(title);
      continue;
    }

    const headers = values[0].map(h => (h ?? '').trim());
    const rows = values.slice(1);

    // Skip tabs with mostly empty headers
    if (headers.filter(h => h.length > 0).length < 2) {
      skippedTabs.push(title);
      continue;
    }

    tabs.push({
      tab_name: title,
      tab_index: index,
      headers,
      rows,
      row_count: rows.length,
      col_count: headers.length,
    });
  }

  if (tabs.length === 0) {
    const error = new Error('Không tìm thấy tab với dữ liệu hợp lệ.');
    (error as any).code = 'EMPTY_DATA';
    throw error;
  }

  console.log(
    `[SheetService] Full workbook fetched: ${tabs.length} tabs, ` +
    `${tabs.reduce((s, t) => s + t.row_count, 0)} total rows, ` +
    `${skippedTabs.length} skipped`
  );

  return {
    spreadsheet_id: spreadsheetId,
    title: spreadsheetTitle,
    tabs,
    access_mode: 'service_account',
    total_tabs_found: allSheets.length,
    tabs_skipped: skippedTabs,
  };
}

// ─── Batch helpers ───

async function batchFetchTabValues(
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
  tabNames: string[]
): Promise<Map<string, string[][]>> {
  const result = new Map<string, string[][]>();
  const BATCH_SIZE = 10;

  for (let i = 0; i < tabNames.length; i += BATCH_SIZE) {
    const batch = tabNames.slice(i, i + BATCH_SIZE);

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: batch,
      valueRenderOption: 'FORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const ranges = response.data.valueRanges ?? [];
    for (let j = 0; j < ranges.length; j++) {
      result.set(batch[j], (ranges[j].values as string[][] | undefined) ?? []);
    }
  }

  return result;
}

async function sequentialFetchTabValues(
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
  tabNames: string[]
): Promise<Map<string, string[][]>> {
  const result = new Map<string, string[][]>();

  for (const tabName of tabNames) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: tabName,
        valueRenderOption: 'FORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });
      result.set(tabName, (response.data.values as string[][] | undefined) ?? []);
    } catch (err) {
      console.warn(`[SheetService] Failed to fetch tab "${tabName}":`, err instanceof Error ? err.message : err);
      result.set(tabName, []);
    }
  }

  return result;
}
