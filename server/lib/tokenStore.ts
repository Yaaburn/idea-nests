// ═══════════════════════════════════════════════
// Token Store — Per-Project Credential Management
// Stores tokens in-memory only. Never persisted to disk.
// In production, replace with encrypted KV store.
// ═══════════════════════════════════════════════

interface StoredCredential {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // ms timestamp
  scope: string;
  connector_mode: 'google_oauth' | 'service_account';
  granted_at: number;
}

// In-memory store keyed by projectId
const store = new Map<string, StoredCredential>();

export function storeProjectToken(
  projectId: string,
  credential: StoredCredential
): void {
  store.set(projectId, credential);
}

export function getProjectToken(projectId: string): StoredCredential | null {
  const cred = store.get(projectId);
  if (!cred) return null;

  // Check expiry with 60s buffer
  if (cred.expires_at < Date.now() + 60_000) {
    store.delete(projectId);
    return null;
  }

  return cred;
}

export function revokeProjectToken(projectId: string): boolean {
  return store.delete(projectId);
}

export function hasValidToken(projectId: string): boolean {
  return getProjectToken(projectId) !== null;
}

export function getTokenStatus(projectId: string): {
  has_token: boolean;
  connector_mode: string | null;
  expires_at: number | null;
  scope: string | null;
} {
  const cred = getProjectToken(projectId);
  if (!cred) {
    return { has_token: false, connector_mode: null, expires_at: null, scope: null };
  }
  return {
    has_token: true,
    connector_mode: cred.connector_mode,
    expires_at: cred.expires_at,
    scope: cred.scope,
  };
}
