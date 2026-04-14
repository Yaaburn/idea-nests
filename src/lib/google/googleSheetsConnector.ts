// ═══════════════════════════════════════════════
// Real Google Sheets Connector
// Fetches live data from Google Sheets API v4.
// Returns RawSheetData compatible with ingestion pipeline.
// ═══════════════════════════════════════════════

import { ConnectorError } from './connectorErrors';
import { GOOGLE_API_KEY } from './env';
import { getStoredToken, isTokenValid } from './googleAuth';
import type { RawTab, RawSheetData } from '../ingestion/types';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// ─── URL Parsing ───

const SPREADSHEET_ID_REGEX =
  /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

export function parseSpreadsheetId(url: string): string | null {
  const match = url.match(SPREADSHEET_ID_REGEX);
  return match ? match[1] : null;
}

// ─── Retry Logic ───

const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1000, 2000];
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function fetchWithRetry(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      // Non-retryable HTTP errors
      if (!RETRYABLE_STATUS.has(response.status)) {
        return response; // caller handles the error status
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Wait before retry (except after last attempt)
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  throw new ConnectorError(
    'NETWORK_ERROR',
    undefined,
    true
  );
}

// ─── Auth Headers ───

function buildAuthHeaders(token?: string): HeadersInit {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function appendApiKey(url: string): string {
  if (!GOOGLE_API_KEY) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}key=${GOOGLE_API_KEY}`;
}

// ─── Access Test ───

export type AccessResult = 'public' | 'private' | 'denied' | 'not_found';

export async function testAccess(spreadsheetId: string): Promise<AccessResult> {
  const url = appendApiKey(
    `${BASE}/${spreadsheetId}?fields=spreadsheetId,properties.title`
  );

  try {
    const response = await fetch(url);
    if (response.ok) return 'public';
    if (response.status === 403) return 'private';
    if (response.status === 404) return 'not_found';
    return 'denied';
  } catch {
    return 'denied';
  }
}

// ─── Metadata ───

interface SheetProperties {
  sheetId: number;
  title: string;
  index: number;
  gridProperties?: {
    rowCount?: number;
    columnCount?: number;
  };
}

interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetProperties[];
}

async function fetchMetadata(
  spreadsheetId: string,
  token?: string
): Promise<SpreadsheetMetadata> {
  let url = `${BASE}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;
  if (!token) url = appendApiKey(url);

  const response = await fetchWithRetry(url, {
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectorError('PERMISSION_DENIED');
    }
    if (response.status === 404) {
      throw new ConnectorError('SHEET_NOT_FOUND');
    }
    throw new ConnectorError('NETWORK_ERROR');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title ?? 'Untitled',
    sheets: (data.sheets ?? []).map((s: { properties: SheetProperties }) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
      gridProperties: s.properties.gridProperties,
    })),
  };
}

// ─── Tab Values ───

async function fetchTabValues(
  spreadsheetId: string,
  tabName: string,
  token?: string
): Promise<string[][]> {
  const encodedTab = encodeURIComponent(tabName);
  let url = `${BASE}/${spreadsheetId}/values/${encodedTab}?valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  if (!token) url = appendApiKey(url);

  const response = await fetchWithRetry(url, {
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectorError('PERMISSION_DENIED');
    }
    return [];
  }

  const data = await response.json();
  return (data.values as string[][] | undefined) ?? [];
}

// ─── Batch Fetch All Tabs ───

async function fetchAllTabs(
  spreadsheetId: string,
  tabNames: string[],
  token?: string
): Promise<Map<string, string[][]>> {
  const result = new Map<string, string[][]>();

  if (tabNames.length === 0) return result;

  // Try batchGet first (up to 10 tabs)
  const batchNames = tabNames.slice(0, 10);
  const rangeParams = batchNames.map((t) => `ranges=${encodeURIComponent(t)}`).join('&');
  let url = `${BASE}/${spreadsheetId}/values:batchGet?${rangeParams}&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  if (!token) url = appendApiKey(url);

  try {
    const response = await fetchWithRetry(url, {
      headers: buildAuthHeaders(token),
    });

    if (response.ok) {
      const data = await response.json();
      const ranges = data.valueRanges as Array<{
        range: string;
        values?: string[][];
      }> | undefined;

      if (ranges) {
        for (let i = 0; i < ranges.length; i++) {
          const tabName = batchNames[i];
          result.set(tabName, ranges[i].values ?? []);
        }
        return result;
      }
    }
  } catch {
    // batchGet failed — fall back to sequential
  }

  // Sequential fallback
  for (const tabName of batchNames) {
    const values = await fetchTabValues(spreadsheetId, tabName, token);
    result.set(tabName, values);
  }

  return result;
}

// ─── Main Public Method ───

export async function fetchSheet(sheetUrl: string): Promise<RawSheetData> {
  // Step 1: Parse URL
  const spreadsheetId = parseSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    throw new ConnectorError('INVALID_URL');
  }

  // Step 2: Test access
  const access = await testAccess(spreadsheetId);

  let token: string | undefined;

  switch (access) {
    case 'not_found':
      throw new ConnectorError('SHEET_NOT_FOUND');
    case 'denied':
      throw new ConnectorError('PERMISSION_DENIED');
    case 'private':
      if (isTokenValid()) {
        token = getStoredToken()!.access_token;
      } else {
        throw new ConnectorError('AUTH_REQUIRED');
      }
      break;
    case 'public':
      // Use API key only — no token needed
      // But if we have a valid token, use it for better quota tracking
      if (isTokenValid()) {
        token = getStoredToken()!.access_token;
      }
      break;
  }

  // Step 3: Fetch metadata
  const metadata = await fetchMetadata(spreadsheetId, token);

  // Filter out tiny tabs
  const eligibleSheets = metadata.sheets.filter((s) => {
    const rows = s.gridProperties?.rowCount ?? 0;
    const cols = s.gridProperties?.columnCount ?? 0;
    return rows >= 3 && cols >= 2;
  });

  const tabNames = eligibleSheets.map((s) => s.title);

  if (tabNames.length === 0) {
    throw new ConnectorError('EMPTY_DATA');
  }

  // Step 4: Fetch all tab values
  const allValues = await fetchAllTabs(spreadsheetId, tabNames, token);

  // Step 5: Build RawSheetData
  const tabs: RawTab[] = [];

  for (const [tabName, values] of allValues) {
    if (values.length < 2) continue;

    const headers = values[0].map((h) => (h ?? '').trim());
    const rows = values.slice(1);

    // Skip tabs where headers are all empty
    if (headers.filter((h) => h.length > 0).length < 2) continue;

    const sheetProps = eligibleSheets.find((s) => s.title === tabName);

    tabs.push({
      tab_name: tabName,
      tab_index: sheetProps?.index ?? 0,
      headers,
      rows,
      row_count: rows.length,
      col_count: headers.length,
    });
  }

  if (tabs.length === 0) {
    throw new ConnectorError('EMPTY_DATA');
  }

  return {
    spreadsheet_id: spreadsheetId,
    title: metadata.title,
    tabs,
    access_mode: token ? 'oauth_token' : 'api_key',
  };
}
