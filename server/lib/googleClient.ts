// ═══════════════════════════════════════════════
// Google API Client — Server-Side Only
// Handles OAuth token exchange and Sheets API calls.
// All secrets remain server-side. Never exposed to browser.
// ═══════════════════════════════════════════════

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const OAUTH_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

// ─── Environment ───

function getClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || '';
}

function getClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || '';
}

function getRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
}

function getServiceAccountEmail(): string {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
}

// ─── OAuth Helpers ───

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${OAUTH_REVOKE_URL}?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Sheets API ───

async function sheetsGet(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    index: number;
    rowCount: number;
    columnCount: number;
  }>;
}

export async function fetchSheetMetadata(
  spreadsheetId: string,
  token: string
): Promise<SheetMetadata> {
  const url = `${SHEETS_API}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;
  const response = await sheetsGet(url, token);

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      throw new Error('PERMISSION_DENIED');
    }
    if (response.status === 404) {
      throw new Error('SHEET_NOT_FOUND');
    }
    throw new Error(`SHEETS_API_ERROR:${response.status}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title ?? 'Untitled',
    sheets: (data.sheets ?? []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties.gridProperties?.rowCount ?? 0,
      columnCount: s.properties.gridProperties?.columnCount ?? 0,
    })),
  };
}

export async function fetchSheetValues(
  spreadsheetId: string,
  tabName: string,
  token: string
): Promise<string[][]> {
  const encoded = encodeURIComponent(tabName);
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encoded}?valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const response = await sheetsGet(url, token);

  if (!response.ok) return [];
  const data = await response.json();
  return data.values ?? [];
}

export async function fetchAllTabValues(
  spreadsheetId: string,
  tabNames: string[],
  token: string
): Promise<Map<string, string[][]>> {
  const result = new Map<string, string[][]>();
  if (tabNames.length === 0) return result;

  // Try batchGet first
  const batchNames = tabNames.slice(0, 10);
  const rangeParams = batchNames.map(t => `ranges=${encodeURIComponent(t)}`).join('&');
  const url = `${SHEETS_API}/${spreadsheetId}/values:batchGet?${rangeParams}&valueRenderOption=FORMATTED_VALUE`;

  try {
    const response = await sheetsGet(url, token);
    if (response.ok) {
      const data = await response.json();
      const ranges = data.valueRanges as Array<{ range: string; values?: string[][] }> | undefined;
      if (ranges) {
        for (let i = 0; i < ranges.length; i++) {
          result.set(batchNames[i], ranges[i].values ?? []);
        }
        return result;
      }
    }
  } catch {
    // Fall through to sequential
  }

  // Sequential fallback
  for (const tab of batchNames) {
    const values = await fetchSheetValues(spreadsheetId, tab, token);
    result.set(tab, values);
  }

  return result;
}

// ─── Service Account ───

export function getServiceAccountInfo(): {
  email: string;
  configured: boolean;
} {
  const email = getServiceAccountEmail();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  return {
    email,
    configured: email.length > 0 && email.includes('@') && privateKey.length > 0,
  };
}
