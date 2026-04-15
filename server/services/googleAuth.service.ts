// ═══════════════════════════════════════════════
// Google Auth Service — Service Account Authentication
// Uses googleapis to authenticate with Google via Service Account.
// All credentials loaded from environment variables.
// ═══════════════════════════════════════════════

import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

/**
 * Parse the GOOGLE_PRIVATE_KEY from env.
 * The key stored in .env often has literal \n instead of real newlines.
 */
function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  // Replace literal \n with actual newline characters
  return raw.replace(/\\n/g, '\n');
}

function getServiceAccountEmail(): string {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
}

/**
 * Create a GoogleAuth instance using Service Account credentials.
 * This is a shared singleton used across the application.
 */
let _authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null;

export function getGoogleAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  if (_authClient) return _authClient;

  const email = getServiceAccountEmail();
  const key = getPrivateKey();

  if (!email || !key) {
    throw new Error(
      'Missing Google Service Account credentials. ' +
      'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env'
    );
  }

  _authClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: SCOPES,
  });

  console.log('[GoogleAuth] Service Account initialized:', email);
  return _authClient;
}

/**
 * Get an authorized Google Sheets API client.
 */
export function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Get the Service Account email (for display / sharing instructions).
 */
export function getBotEmail(): string {
  return getServiceAccountEmail();
}

/**
 * Check if Service Account is properly configured.
 */
export function isServiceAccountConfigured(): boolean {
  const email = getServiceAccountEmail();
  const key = getPrivateKey();
  return (
    email.length > 0 &&
    email.includes('@') &&
    key.length > 0 &&
    key.includes('PRIVATE KEY')
  );
}
