// ═══════════════════════════════════════════════
// Backend Connector Client — Frontend → Backend API
// All Google Sheets operations go through the backend.
// No API keys or tokens in the browser.
// ═══════════════════════════════════════════════

import type { RawSheetData } from '../ingestion/types';
import type { ConnectorStatus, BackendApiError } from './types';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3001';

// ─── Auth ───

export async function startGoogleAuth(projectId: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/auth/google/start?projectId=${encodeURIComponent(projectId)}`);
  if (!response.ok) {
    throw new Error('Không thể bắt đầu xác thực Google.');
  }
  const data = await response.json();
  return data.auth_url;
}

export async function getAuthStatus(projectId: string): Promise<ConnectorStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/status?projectId=${encodeURIComponent(projectId)}`);
    if (!response.ok) {
      return { connected: false, connector_mode: null, project_id: projectId };
    }
    const data = await response.json();
    return {
      connected: data.has_token,
      connector_mode: data.connector_mode,
      project_id: projectId,
      expires_at: data.expires_at,
    };
  } catch {
    return { connected: false, connector_mode: null, project_id: projectId, error: 'Backend không khả dụng.' };
  }
}

export async function revokeAuth(projectId: string): Promise<void> {
  await fetch(`${BACKEND_URL}/api/auth/google/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
}

// ─── Sheets ───

export async function fetchSheetData(projectId: string, sheetUrl: string): Promise<RawSheetData> {
  const response = await fetch(`${BACKEND_URL}/api/sheets/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, sheetUrl }),
  });

  if (!response.ok) {
    const error: BackendApiError = await response.json().catch(() => ({
      error: 'UNKNOWN',
      message: 'Lỗi không xác định.',
    }));

    const err = new Error(error.message);
    (err as any).code = error.error;
    (err as any).retryable = ['NETWORK_ERROR', 'QUOTA_EXCEEDED'].includes(error.error);
    throw err;
  }

  return response.json();
}

export async function fetchSheetMetadata(projectId: string, sheetUrl: string): Promise<{
  title: string;
  sheets: Array<{ title: string; rowCount: number; columnCount: number }>;
}> {
  const response = await fetch(
    `${BACKEND_URL}/api/sheets/metadata?projectId=${encodeURIComponent(projectId)}&sheetUrl=${encodeURIComponent(sheetUrl)}`
  );
  if (!response.ok) {
    throw new Error('Không thể lấy metadata.');
  }
  return response.json();
}

export async function getBotInfo(): Promise<{ email: string; configured: boolean }> {
  const response = await fetch(`${BACKEND_URL}/api/sheets/bot-info`);
  if (!response.ok) {
    return { email: '', configured: false };
  }
  return response.json();
}

// ─── CSV/XLSX Upload ───

export async function uploadFile(projectId: string, file: File): Promise<RawSheetData> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const response = await fetch(`${BACKEND_URL}/api/csv/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: BackendApiError = await response.json().catch(() => ({
      error: 'UNKNOWN',
      message: 'Không thể đọc file.',
    }));
    throw new Error(error.message);
  }

  return response.json();
}

// ─── Backend Health ───

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Google Config Preflight ───

export async function checkGoogleOAuthConfig(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/google/config-status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

