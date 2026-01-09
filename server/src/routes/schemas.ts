import { z } from 'zod';

// ============================================================================
// CONNECTION SCHEMAS
// ============================================================================

export const createSheetsConnectionSchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    spreadsheetUrl: z.string().url().refine(
        (url) => url.includes('docs.google.com/spreadsheets'),
        'Must be a Google Sheets URL'
    ),
});

export const createDriveConnectionSchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    driveUrl: z.string().url().refine(
        (url) => url.includes('drive.google.com'),
        'Must be a Google Drive URL'
    ),
});

export const createCalendarConnectionSchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    calendarId: z.string().default('primary'),
    code: z.string(), // OAuth authorization code
});

export const listConnectionsQuerySchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
});

// ============================================================================
// SYNC SCHEMAS
// ============================================================================

export const triggerSyncParamsSchema = z.object({
    connectionId: z.string().uuid(),
});

export const syncStatusQuerySchema = z.object({
    jobId: z.string().optional(),
    syncJobId: z.string().uuid().optional(),
}).refine(
    (data) => data.jobId || data.syncJobId,
    'Either jobId or syncJobId is required'
);

// ============================================================================
// CANONICAL DATA SCHEMAS
// ============================================================================

export const canonicalTasksQuerySchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'UNKNOWN']).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

export const canonicalArtifactsQuerySchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    category: z.enum(['DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'IMAGE', 'VIDEO', 'PDF', 'OTHER']).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

export const canonicalEventsQuerySchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    limit: z.coerce.number().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

// ============================================================================
// ANALYSIS SCHEMAS
// ============================================================================

export const analysisQuerySchema = z.object({
    tenantId: z.string().uuid(),
    projectId: z.string().uuid(),
    type: z.enum([
        'TASK_COUNTS_BY_STATUS',
        'TASK_VELOCITY_WEEKLY',
        'ARTIFACT_ACTIVITY_WEEKLY',
        'MEETING_LOAD_WEEKLY',
        'PROJECT_PROGRESS',
        'MILESTONE_HEALTH',
        'THROUGHPUT_WEEKLY',
        'CONTRIBUTOR_LEADERBOARD',
        'PROOF_INDEX',
        'CFD_WEEKLY',
    ]).optional(),
});

// ============================================================================
// COMMON RESPONSE TYPES
// ============================================================================

export interface ApiError {
    error: string;
    message: string;
    statusCode: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    cursor?: string;
    hasMore: boolean;
}
