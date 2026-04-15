// ═══════════════════════════════════════════════
// Sheet Service — Google Sheets API Operations
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
 *
 * Example:
 *   [["Name", "Age"], ["Alice", "30"], ["Bob", "25"]]
 *   → [{ Name: "Alice", Age: "30" }, { Name: "Bob", Age: "25" }]
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
 * Fetch all raw data from the first sheet of a spreadsheet.
 * Returns parsed objects (row 0 = headers).
 */
export async function fetchRawData(spreadsheetId: string): Promise<{
  title: string;
  headers: string[];
  data: Record<string, string>[];
  rowCount: number;
}> {
  const sheets = getSheetsClient();

  try {
    // Step 1: Get sheet metadata to find the first tab name
    const metaResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title',
    });

    const spreadsheetTitle = metaResponse.data.properties?.title ?? 'Untitled';
    const firstTabName = metaResponse.data.sheets?.[0]?.properties?.title ?? 'Sheet1';

    // Step 2: Fetch all values from the first tab
    const valuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: firstTabName,
      valueRenderOption: 'FORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const rawRows = valuesResponse.data.values ?? [];
    const { headers, data } = rowsToObjects(rawRows as string[][]);

    console.log(
      `[SheetService] Fetched "${spreadsheetTitle}" → ${data.length} rows, ${headers.length} cols`
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
