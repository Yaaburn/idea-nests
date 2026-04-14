// ═══════════════════════════════════════════════
// Auth Routes — OAuth Start / Callback / Revoke
// Backend-mediated Google OAuth using authorization code flow.
// ═══════════════════════════════════════════════

import { Router, type Request, type Response } from 'express';
import { buildAuthUrl, exchangeCodeForTokens, revokeToken } from '../lib/googleClient';
import { storeProjectToken, revokeProjectToken, getTokenStatus } from '../lib/tokenStore';

const router = Router();

// GET /api/auth/google/start?projectId=xxx
// Returns the OAuth URL for the frontend to redirect to
router.get('/google/start', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  // Preflight: validate that Google OAuth is configured
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!clientId || clientId === 'your_google_client_id_here') {
    return res.status(503).json({
      error: 'OAUTH_NOT_CONFIGURED',
      message: 'Google OAuth chưa được cấu hình. Hãy thiết lập GOOGLE_CLIENT_ID trong file .env.',
    });
  }

  // State carries projectId for callback routing
  const state = Buffer.from(JSON.stringify({ projectId })).toString('base64url');
  const url = buildAuthUrl(state);

  res.json({ auth_url: url, state });
});

// GET /api/auth/google/callback?code=xxx&state=xxx
// Exchanges authorization code for tokens (server-side, no client exposure)
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  let projectId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    projectId = parsed.projectId;
  } catch {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    storeProjectToken(projectId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope,
      connector_mode: 'google_oauth',
      granted_at: Date.now(),
    });

    // Redirect back to the project workspace integration tab
    res.redirect(`/workspace/${projectId}/integration?auth=success`);
  } catch (err) {
    console.error('[Auth] Token exchange failed:', err instanceof Error ? err.message : err);
    res.redirect(`/workspace/${projectId}/integration?auth=error`);
  }
});

// POST /api/auth/google/revoke
// Revokes token and clears project credential
router.post('/google/revoke', async (req: Request, res: Response) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const status = getTokenStatus(projectId);
  if (status.has_token) {
    // Best-effort revoke with Google
    const token = require('../lib/tokenStore').getProjectToken(projectId);
    if (token) {
      await revokeToken(token.access_token);
    }
  }

  revokeProjectToken(projectId);
  res.json({ revoked: true });
});

// GET /api/auth/status?projectId=xxx
// Returns token status without exposing the token itself
router.get('/status', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const status = getTokenStatus(projectId);
  res.json(status);
});

// GET /api/auth/google/config-status
// Returns whether Google OAuth is configured (no secrets exposed)
router.get('/google/config-status', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const configured =
    clientId.length > 0 &&
    clientId !== 'your_google_client_id_here' &&
    clientSecret.length > 0 &&
    clientSecret !== 'your_google_client_secret_here';

  res.json({
    configured,
    // Only expose the presence of config, never the values
    has_client_id: clientId.length > 0 && clientId !== 'your_google_client_id_here',
    has_client_secret: clientSecret.length > 0 && clientSecret !== 'your_google_client_secret_here',
  });
});

export default router;
