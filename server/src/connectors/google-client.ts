import { google, sheets_v4, drive_v3 } from 'googleapis';
import { config } from '../config/index.js';

/**
 * Creates a Google Sheets API client using service account credentials
 * Used for share-to-bot connections
 */
export function createSheetsClient(): sheets_v4.Sheets {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
}

/**
 * Creates a Google Drive API client using service account credentials
 * Used for share-to-bot connections
 */
export function createDriveClient(): drive_v3.Drive {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    return google.drive({ version: 'v3', auth });
}

/**
 * Creates a Google Calendar API client using OAuth tokens
 * Required because Calendar needs user consent for personal calendars
 */
export function createCalendarClientWithTokens(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
        config.GOOGLE_OAUTH_CLIENT_ID,
        config.GOOGLE_OAUTH_CLIENT_SECRET,
        config.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Creates OAuth2 client for token exchange/refresh
 */
export function createOAuth2Client() {
    return new google.auth.OAuth2(
        config.GOOGLE_OAUTH_CLIENT_ID,
        config.GOOGLE_OAUTH_CLIENT_SECRET,
        config.GOOGLE_OAUTH_REDIRECT_URI
    );
}

/**
 * Parse Google resource ID from URL
 */
export function parseGoogleUrl(url: string): { type: 'sheet' | 'drive' | 'folder' | 'calendar'; id: string } | null {
    // Google Sheets: https://docs.google.com/spreadsheets/d/{id}/edit
    const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch) {
        return { type: 'sheet', id: sheetMatch[1] };
    }

    // Google Drive folder: https://drive.google.com/drive/folders/{id}
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) {
        return { type: 'folder', id: folderMatch[1] };
    }

    // Google Drive file: https://drive.google.com/file/d/{id}/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        return { type: 'drive', id: fileMatch[1] };
    }

    return null;
}

/**
 * Get service account email for share-to-bot instructions
 */
export function getServiceAccountEmail(): string {
    return config.GOOGLE_SERVICE_ACCOUNT_EMAIL;
}
