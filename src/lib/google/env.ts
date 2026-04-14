// ═══════════════════════════════════════════════
// Google API Environment Variables
// ═══════════════════════════════════════════════

export const GOOGLE_API_KEY = (import.meta.env.VITE_GOOGLE_API_KEY as string) || '';
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';

export function hasGoogleCredentials(): boolean {
  return (
    GOOGLE_API_KEY.length > 0 &&
    GOOGLE_API_KEY !== 'your_google_api_key_here' &&
    GOOGLE_CLIENT_ID.length > 0 &&
    GOOGLE_CLIENT_ID !== 'your_google_oauth_client_id_here'
  );
}

export function hasApiKeyOnly(): boolean {
  return (
    GOOGLE_API_KEY.length > 0 &&
    GOOGLE_API_KEY !== 'your_google_api_key_here'
  );
}

// Module-level warning
if (!hasApiKeyOnly()) {
  console.warn(
    '[TalentNet] VITE_GOOGLE_API_KEY not set. Real Google Sheets data will not load. ' +
    'The app will use mock data as fallback.'
  );
}
