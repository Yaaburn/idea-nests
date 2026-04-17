// ═══════════════════════════════════════════════
// Sheets Routes — Metadata + Preview Fetch
// All Google Sheets API calls happen here, never in browser.
// Returns RawSheetData format for frontend ingestion pipeline.
// ═══════════════════════════════════════════════

import { Router, type Request, type Response } from 'express';
import {
  fetchSheetMetadata,
  fetchAllTabValues,
  getServiceAccountInfo,
} from '../lib/googleClient';
import { getProjectToken, hasValidToken } from '../lib/tokenStore';
import { Integration } from '../models/Integration';
import { getGoogleAuth } from '../services/googleAuth.service';

const router = Router();

const SPREADSHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

function parseSpreadsheetId(url: string): string | null {
  const match = url.match(SPREADSHEET_ID_REGEX);
  return match ? match[1] : null;
}

// Helper to get either OAuth token or Bot Service Account token
async function resolveProjectToken(projectId: string): Promise<{ access_token: string, mode: string } | null> {
  const credential = getProjectToken(projectId);
  if (credential) {
    return { access_token: credential.access_token, mode: credential.connector_mode || 'google_oauth' };
  }
  const botIntegration = await Integration.findOne({ projectId });
  if (botIntegration) {
    const auth = getGoogleAuth();
    const token = await auth.getAccessToken();
    if (token) {
      return { access_token: token, mode: 'service_account' };
    }
  }
  return null;
}

// POST /api/sheets/fetch
// Fetches sheet data server-side and returns RawSheetData
router.post('/fetch', async (req: Request, res: Response) => {
  const { projectId, sheetUrl } = req.body;

  if (!projectId || !sheetUrl) {
    return res.status(400).json({ error: 'projectId and sheetUrl are required' });
  }

  const spreadsheetId = parseSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    return res.status(400).json({ error: 'INVALID_URL', message: 'URL Google Sheet không hợp lệ.' });
  }

  // Get token for this project
  const credential = await resolveProjectToken(projectId);
  if (!credential) {
    return res.status(401).json({
      error: 'AUTH_REQUIRED',
      message: 'Chưa xác thực. Vui lòng kết nối Google trước.',
    });
  }

  try {
    // Fetch metadata
    const metadata = await fetchSheetMetadata(spreadsheetId, credential.access_token);

    // Filter eligible tabs
    const eligibleSheets = metadata.sheets.filter(
      s => s.rowCount >= 3 && s.columnCount >= 2
    );
    const tabNames = eligibleSheets.map(s => s.title);

    if (tabNames.length === 0) {
      return res.status(422).json({
        error: 'EMPTY_DATA',
        message: 'Google Sheet không có đủ dữ liệu để phân tích.',
      });
    }

    // Fetch all tab values
    const allValues = await fetchAllTabValues(spreadsheetId, tabNames, credential.access_token);

    // Build RawSheetData
    const tabs: Array<{
      tab_name: string;
      tab_index: number;
      headers: string[];
      rows: string[][];
      row_count: number;
      col_count: number;
    }> = [];

    for (const [tabName, values] of allValues) {
      if (values.length < 2) continue;
      const headers = values[0].map(h => (h ?? '').trim());
      const rows = values.slice(1);
      if (headers.filter(h => h.length > 0).length < 2) continue;

      const sheetProps = eligibleSheets.find(s => s.title === tabName);
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
      return res.status(422).json({
        error: 'EMPTY_DATA',
        message: 'Không tìm thấy tab với dữ liệu hợp lệ.',
      });
    }

    res.json({
      spreadsheet_id: spreadsheetId,
      title: metadata.title,
      tabs,
      access_mode: credential.mode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'PERMISSION_DENIED') {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: 'Không có quyền truy cập sheet này.',
      });
    }
    if (message === 'SHEET_NOT_FOUND') {
      return res.status(404).json({
        error: 'SHEET_NOT_FOUND',
        message: 'Không tìm thấy Google Sheet.',
      });
    }

    console.error('[Sheets] Fetch error:', message);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Lỗi khi lấy dữ liệu từ Google Sheets.',
    });
  }
});

// GET /api/sheets/metadata?projectId=xxx&sheetUrl=xxx
// Quick metadata check (title + tab list)
router.get('/metadata', async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  const sheetUrl = req.query.sheetUrl as string;

  if (!projectId || !sheetUrl) {
    return res.status(400).json({ error: 'projectId and sheetUrl are required' });
  }

  const spreadsheetId = parseSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    return res.status(400).json({ error: 'INVALID_URL' });
  }

  const credential = await resolveProjectToken(projectId);
  if (!credential) {
    return res.status(401).json({ error: 'AUTH_REQUIRED' });
  }

  try {
    const metadata = await fetchSheetMetadata(spreadsheetId, credential.access_token);
    res.json({
      title: metadata.title,
      sheets: metadata.sheets.map(s => ({
        title: s.title,
        rowCount: s.rowCount,
        columnCount: s.columnCount,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// GET /api/sheets/bot-info
// Returns service account / bot identity info
router.get('/bot-info', (_req: Request, res: Response) => {
  const info = getServiceAccountInfo();
  res.json(info);
});

// GET /api/sheets/connection-status?projectId=xxx
// Returns connection health for a project
router.get('/connection-status', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const hasToken = hasValidToken(projectId);
  res.json({
    connected: hasToken,
    projectId,
  });
});

export default router;
