// ═══════════════════════════════════════════════
// URL Parser — Extract spreadsheetId from Google Sheets URL
// Supports various Google Sheets URL formats.
// ═══════════════════════════════════════════════

const SPREADSHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

/**
 * Extract the spreadsheetId from a Google Sheets URL.
 * Supports formats like:
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
 *
 * @returns spreadsheetId string or null if URL is invalid
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(SPREADSHEET_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Validate whether a URL is a valid Google Sheets URL.
 */
export function isValidSheetUrl(url: string): boolean {
  return extractSpreadsheetId(url) !== null;
}
