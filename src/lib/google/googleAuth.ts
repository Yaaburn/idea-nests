// ═══════════════════════════════════════════════
// Google OAuth Token Management
// Token stored ONLY in sessionStorage (cleared on tab close).
// Never persisted to localStorage. Never logged.
// ═══════════════════════════════════════════════

import { ConnectorError } from './connectorErrors';

const SESSION_KEY = 'tn_google_token';
const OAUTH_TIMEOUT_MS = 120_000; // 2 minutes

export interface GoogleTokenState {
  access_token: string;
  expires_at: number; // ms timestamp
  scope: string;
}

export function getStoredToken(): GoogleTokenState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: GoogleTokenState = JSON.parse(raw);
    if (parsed.expires_at < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeToken(token: GoogleTokenState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(token));
}

export function clearToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isTokenValid(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  // 60s buffer before actual expiry
  return token.expires_at > Date.now() + 60_000;
}

export interface OAuthMessagePayload {
  type: 'GOOGLE_OAUTH_TOKEN';
  access_token: string;
  expires_at: number;
}

export function initiateOAuthFlow(clientId: string): Promise<GoogleTokenState> {
  return new Promise<GoogleTokenState>((resolve, reject) => {
    const redirectUri = window.location.origin + '/oauth/google/callback';
    const scope = 'https://www.googleapis.com/auth/spreadsheets.readonly';

    const oauthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        response_type: 'token',
        prompt: 'select_account',
      }).toString();

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      oauthUrl,
      'google_oauth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      reject(new ConnectorError('AUTH_REQUIRED', 'Không thể mở cửa sổ đăng nhập. Vui lòng cho phép popup.'));
      return;
    }

    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        window.removeEventListener('message', onMessage);
        popup.close();
        reject(new ConnectorError('AUTH_TIMEOUT'));
      }
    }, OAUTH_TIMEOUT_MS);

    // Poll for popup close (user manually closed it)
    const pollTimer = setInterval(() => {
      if (popup.closed && !settled) {
        settled = true;
        clearTimeout(timeout);
        clearInterval(pollTimer);
        window.removeEventListener('message', onMessage);
        reject(new ConnectorError('AUTH_TIMEOUT', 'Đăng nhập đã bị hủy bởi người dùng.'));
      }
    }, 500);

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as OAuthMessagePayload | undefined;
      if (!data || data.type !== 'GOOGLE_OAUTH_TOKEN') return;

      settled = true;
      clearTimeout(timeout);
      clearInterval(pollTimer);
      window.removeEventListener('message', onMessage);
      popup.close();

      const token: GoogleTokenState = {
        access_token: data.access_token,
        expires_at: data.expires_at,
        scope,
      };
      storeToken(token);
      resolve(token);
    }

    window.addEventListener('message', onMessage);
  });
}
