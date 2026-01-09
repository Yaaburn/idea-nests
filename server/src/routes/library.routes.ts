import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Provider, AuthType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { connectorRegistry } from '../connectors/registry.js';
import { parseGoogleUrl, getServiceAccountEmail, createOAuth2Client } from '../connectors/google-client.js';
import { secretsProvider } from '../lib/secrets.js';
import { enqueueSyncJob } from '../jobs/queues.js';
import {
    createSheetsConnectionSchema,
    createDriveConnectionSchema,
    createCalendarConnectionSchema,
    listConnectionsQuerySchema,
    triggerSyncParamsSchema,
    syncStatusQuerySchema,
    canonicalTasksQuerySchema,
    canonicalArtifactsQuerySchema,
    canonicalEventsQuerySchema,
    analysisQuerySchema,
} from './schemas.js';

export async function libraryRoutes(fastify: FastifyInstance) {
    // =========================================================================
    // CONNECTION ROUTES
    // =========================================================================

    /**
     * GET /library/connections - List all connections for a project
     */
    fastify.get('/library/connections', async (request: FastifyRequest, reply: FastifyReply) => {
        const query = listConnectionsQuerySchema.parse(request.query);

        const connections = await prisma.connection.findMany({
            where: {
                tenantId: query.tenantId,
                projectId: query.projectId,
            },
            select: {
                id: true,
                provider: true,
                resourceId: true,
                resourceName: true,
                authType: true,
                status: true,
                lastSyncedAt: true,
                itemsSynced: true,
                errorMessage: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Add coming_soon providers
        const comingSoon = connectorRegistry.getComingSoon().map(provider => ({
            id: null,
            provider,
            status: 'coming_soon',
            resourceName: null,
        }));

        return {
            connections,
            comingSoon,
        };
    });

    /**
     * POST /library/connections/sheets - Connect a Google Sheet (share-to-bot)
     */
    fastify.post('/library/connections/sheets', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = createSheetsConnectionSchema.parse(request.body);

        // Parse spreadsheet ID from URL
        const parsed = parseGoogleUrl(body.spreadsheetUrl);
        if (!parsed || parsed.type !== 'sheet') {
            return reply.status(400).send({
                error: 'invalid_url',
                message: 'Invalid Google Sheets URL. Please paste a valid spreadsheet link.',
            });
        }

        const spreadsheetId = parsed.id;
        const connector = connectorRegistry.getOrThrow(Provider.GOOGLE_SHEETS);

        // Validate access
        const validation = await connector.validateAccess(spreadsheetId, { authType: AuthType.SHARE_TO_BOT });

        if (!validation.isValid) {
            const serviceAccountEmail = getServiceAccountEmail();
            return reply.status(403).send({
                error: 'access_denied',
                message: validation.errorMessage,
                hint: `Please share the spreadsheet with: ${serviceAccountEmail}`,
                serviceAccountEmail,
            });
        }

        // Check if connection already exists
        const existing = await prisma.connection.findFirst({
            where: {
                tenantId: body.tenantId,
                projectId: body.projectId,
                provider: Provider.GOOGLE_SHEETS,
                resourceId: spreadsheetId,
            },
        });

        if (existing) {
            return reply.status(409).send({
                error: 'already_exists',
                message: 'This spreadsheet is already connected to the project.',
                connectionId: existing.id,
            });
        }

        // Create connection
        const connection = await prisma.connection.create({
            data: {
                tenantId: body.tenantId,
                projectId: body.projectId,
                createdBy: 'system', // TODO: Get from auth
                ownerUserId: 'system',
                provider: Provider.GOOGLE_SHEETS,
                resourceId: spreadsheetId,
                resourceName: validation.resourceName,
                authType: AuthType.SHARE_TO_BOT,
                status: 'PENDING',
            },
        });

        // Trigger initial sync
        const { jobId, syncJobId } = await enqueueSyncJob(
            body.tenantId,
            body.projectId,
            connection.id,
            true // isInitial
        );

        logger.info({ connectionId: connection.id, spreadsheetId }, 'Sheets connection created');

        return reply.status(201).send({
            connectionId: connection.id,
            resourceName: validation.resourceName,
            status: 'pending',
            syncJobId,
            message: 'Connection created. Initial sync started.',
        });
    });

    /**
     * POST /library/connections/drive - Connect a Google Drive folder/file (share-to-bot)
     */
    fastify.post('/library/connections/drive', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = createDriveConnectionSchema.parse(request.body);

        const parsed = parseGoogleUrl(body.driveUrl);
        if (!parsed || (parsed.type !== 'folder' && parsed.type !== 'drive')) {
            return reply.status(400).send({
                error: 'invalid_url',
                message: 'Invalid Google Drive URL. Please paste a folder or file link.',
            });
        }

        const resourceId = parsed.id;
        const connector = connectorRegistry.getOrThrow(Provider.GOOGLE_DRIVE);

        const validation = await connector.validateAccess(resourceId, { authType: AuthType.SHARE_TO_BOT });

        if (!validation.isValid) {
            const serviceAccountEmail = getServiceAccountEmail();
            return reply.status(403).send({
                error: 'access_denied',
                message: validation.errorMessage,
                hint: `Please share the folder/file with: ${serviceAccountEmail}`,
                serviceAccountEmail,
            });
        }

        const existing = await prisma.connection.findFirst({
            where: {
                tenantId: body.tenantId,
                projectId: body.projectId,
                provider: Provider.GOOGLE_DRIVE,
                resourceId,
            },
        });

        if (existing) {
            return reply.status(409).send({
                error: 'already_exists',
                message: 'This folder/file is already connected.',
                connectionId: existing.id,
            });
        }

        const connection = await prisma.connection.create({
            data: {
                tenantId: body.tenantId,
                projectId: body.projectId,
                createdBy: 'system',
                ownerUserId: 'system',
                provider: Provider.GOOGLE_DRIVE,
                resourceId,
                resourceName: validation.resourceName,
                authType: AuthType.SHARE_TO_BOT,
                status: 'PENDING',
            },
        });

        const { syncJobId } = await enqueueSyncJob(body.tenantId, body.projectId, connection.id, true);

        logger.info({ connectionId: connection.id, resourceId }, 'Drive connection created');

        return reply.status(201).send({
            connectionId: connection.id,
            resourceName: validation.resourceName,
            status: 'pending',
            syncJobId,
        });
    });

    /**
     * POST /library/connections/calendar - Connect Google Calendar (OAuth)
     */
    fastify.post('/library/connections/calendar', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = createCalendarConnectionSchema.parse(request.body);

        try {
            // Exchange code for tokens
            const oauth2Client = createOAuth2Client();
            const { tokens } = await oauth2Client.getToken(body.code);

            if (!tokens.access_token || !tokens.refresh_token) {
                return reply.status(400).send({
                    error: 'invalid_code',
                    message: 'Failed to exchange authorization code for tokens.',
                });
            }

            // Encrypt tokens
            const encryptedTokens = secretsProvider.encryptTokens({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: Math.floor((tokens.expiry_date ?? Date.now() + 3600000) / 1000),
                scope: tokens.scope ?? '',
            });

            // Validate calendar access
            const connector = connectorRegistry.getOrThrow(Provider.GOOGLE_CALENDAR);
            const validation = await connector.validateAccess(body.calendarId, {
                authType: AuthType.OAUTH,
                encryptedTokens,
            });

            if (!validation.isValid) {
                return reply.status(403).send({
                    error: 'access_denied',
                    message: validation.errorMessage,
                });
            }

            const existing = await prisma.connection.findFirst({
                where: {
                    tenantId: body.tenantId,
                    projectId: body.projectId,
                    provider: Provider.GOOGLE_CALENDAR,
                    resourceId: body.calendarId,
                },
            });

            if (existing) {
                // Update tokens
                await prisma.connection.update({
                    where: { id: existing.id },
                    data: { encryptedTokens, status: 'PENDING' },
                });

                const { syncJobId } = await enqueueSyncJob(body.tenantId, body.projectId, existing.id, true);

                return { connectionId: existing.id, syncJobId, message: 'Tokens updated. Re-syncing.' };
            }

            const connection = await prisma.connection.create({
                data: {
                    tenantId: body.tenantId,
                    projectId: body.projectId,
                    createdBy: 'system',
                    ownerUserId: 'system',
                    provider: Provider.GOOGLE_CALENDAR,
                    resourceId: body.calendarId,
                    resourceName: validation.resourceName,
                    authType: AuthType.OAUTH,
                    encryptedTokens,
                    status: 'PENDING',
                },
            });

            const { syncJobId } = await enqueueSyncJob(body.tenantId, body.projectId, connection.id, true);

            logger.info({ connectionId: connection.id, calendarId: body.calendarId }, 'Calendar connection created');

            return reply.status(201).send({
                connectionId: connection.id,
                resourceName: validation.resourceName,
                status: 'pending',
                syncJobId,
            });
        } catch (error) {
            logger.error({ error }, 'Calendar OAuth failed');
            return reply.status(400).send({
                error: 'oauth_failed',
                message: 'Failed to authenticate with Google Calendar.',
            });
        }
    });

    /**
     * GET /library/oauth/calendar/url - Get OAuth URL for Calendar
     */
    fastify.get('/library/oauth/calendar/url', async () => {
        const oauth2Client = createOAuth2Client();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.events.readonly',
            ],
            prompt: 'consent',
        });

        return { authUrl: url };
    });

    // =========================================================================
    // SYNC ROUTES
    // =========================================================================

    /**
     * POST /library/sync/:connectionId - Trigger manual sync
     */
    fastify.post('/library/sync/:connectionId', async (request: FastifyRequest, reply: FastifyReply) => {
        const params = triggerSyncParamsSchema.parse(request.params);

        const connection = await prisma.connection.findUnique({
            where: { id: params.connectionId },
        });

        if (!connection) {
            return reply.status(404).send({
                error: 'not_found',
                message: 'Connection not found.',
            });
        }

        if (connection.status === 'SYNCING') {
            return reply.status(409).send({
                error: 'already_syncing',
                message: 'A sync is already in progress.',
            });
        }

        // Check if there's a recent pending job
        const recentJob = await prisma.syncJob.findFirst({
            where: {
                connectionId: params.connectionId,
                status: { in: ['QUEUED', 'RUNNING'] },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (recentJob) {
            return { syncJobId: recentJob.id, jobId: recentJob.jobId, message: 'Sync already queued.' };
        }

        const { jobId, syncJobId } = await enqueueSyncJob(
            connection.tenantId,
            connection.projectId,
            connection.id,
            !connection.cursorJson // isInitial if no cursor
        );

        await prisma.connection.update({
            where: { id: params.connectionId },
            data: { status: 'SYNCING' },
        });

        return { syncJobId, jobId, message: 'Sync started.' };
    });

    /**
     * GET /library/sync-status - Get sync job status
     */
    fastify.get('/library/sync-status', async (request: FastifyRequest, reply: FastifyReply) => {
        const query = syncStatusQuerySchema.parse(request.query);

        const syncJob = query.syncJobId
            ? await prisma.syncJob.findUnique({ where: { id: query.syncJobId } })
            : await prisma.syncJob.findFirst({ where: { jobId: query.jobId! } });

        if (!syncJob) {
            return reply.status(404).send({
                error: 'not_found',
                message: 'Sync job not found.',
            });
        }

        return {
            id: syncJob.id,
            jobId: syncJob.jobId,
            status: syncJob.status,
            phase: syncJob.phase,
            processed: syncJob.processed,
            total: syncJob.total,
            progress: syncJob.total > 0 ? Math.round((syncJob.processed / syncJob.total) * 100) : 0,
            startedAt: syncJob.startedAt,
            finishedAt: syncJob.finishedAt,
            error: syncJob.error,
        };
    });

    // =========================================================================
    // CANONICAL DATA ROUTES
    // =========================================================================

    /**
     * GET /library/canonical/tasks - List canonical tasks
     */
    fastify.get('/library/canonical/tasks', async (request: FastifyRequest) => {
        const query = canonicalTasksQuerySchema.parse(request.query);

        const where = {
            tenantId: query.tenantId,
            projectId: query.projectId,
            ...(query.status && { status: query.status }),
            ...(query.cursor && { id: { gt: query.cursor } }),
        };

        const [tasks, total] = await Promise.all([
            prisma.canonicalTask.findMany({
                where,
                take: query.limit + 1,
                orderBy: { id: 'asc' },
            }),
            prisma.canonicalTask.count({ where: { tenantId: query.tenantId, projectId: query.projectId } }),
        ]);

        const hasMore = tasks.length > query.limit;
        const data = hasMore ? tasks.slice(0, -1) : tasks;

        return {
            data,
            total,
            cursor: hasMore ? data[data.length - 1]?.id : undefined,
            hasMore,
        };
    });

    /**
     * GET /library/canonical/artifacts - List canonical artifacts
     */
    fastify.get('/library/canonical/artifacts', async (request: FastifyRequest) => {
        const query = canonicalArtifactsQuerySchema.parse(request.query);

        const where = {
            tenantId: query.tenantId,
            projectId: query.projectId,
            trashed: false,
            ...(query.category && { typeCategory: query.category }),
            ...(query.cursor && { id: { gt: query.cursor } }),
        };

        const [artifacts, total] = await Promise.all([
            prisma.canonicalArtifact.findMany({
                where,
                take: query.limit + 1,
                orderBy: { modifiedTime: 'desc' },
            }),
            prisma.canonicalArtifact.count({ where: { tenantId: query.tenantId, projectId: query.projectId, trashed: false } }),
        ]);

        const hasMore = artifacts.length > query.limit;
        const data = hasMore ? artifacts.slice(0, -1) : artifacts;

        // Convert BigInt to string for JSON serialization
        const serializedData = data.map(a => ({
            ...a,
            sizeBytes: a.sizeBytes.toString(),
        }));

        return {
            data: serializedData,
            total,
            cursor: hasMore ? data[data.length - 1]?.id : undefined,
            hasMore,
        };
    });

    /**
     * GET /library/canonical/events - List canonical events
     */
    fastify.get('/library/canonical/events', async (request: FastifyRequest) => {
        const query = canonicalEventsQuerySchema.parse(request.query);

        const where = {
            tenantId: query.tenantId,
            projectId: query.projectId,
            status: { not: 'CANCELLED' as const },
            ...(query.cursor && { id: { gt: query.cursor } }),
        };

        const [events, total] = await Promise.all([
            prisma.canonicalEvent.findMany({
                where,
                take: query.limit + 1,
                orderBy: { startTime: 'desc' },
            }),
            prisma.canonicalEvent.count({ where: { tenantId: query.tenantId, projectId: query.projectId } }),
        ]);

        const hasMore = events.length > query.limit;
        const data = hasMore ? events.slice(0, -1) : events;

        return {
            data,
            total,
            cursor: hasMore ? data[data.length - 1]?.id : undefined,
            hasMore,
        };
    });

    // =========================================================================
    // ANALYSIS ROUTES
    // =========================================================================

    /**
     * GET /library/analysis - Get analysis signals
     */
    fastify.get('/library/analysis', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);

        const where = {
            tenantId: query.tenantId,
            projectId: query.projectId,
            ...(query.type && { signalType: query.type }),
        };

        const signals = await prisma.analysisSignal.findMany({
            where,
            orderBy: { computedAt: 'desc' },
        });

        // Transform for API response
        const data = signals.map(signal => ({
            type: signal.signalType,
            value: signal.value,
            confidence: signal.confidenceScore,
            methodology: signal.methodology,
            isInsufficient: signal.isInsufficient,
            computedAt: signal.computedAt,
        }));

        if (query.type) {
            return data[0] ?? {
                type: query.type,
                value: null,
                confidence: 0,
                methodology: 'Not computed yet',
                isInsufficient: true,
            };
        }

        return { signals: data };
    });

    // =========================================================================
    // ANALYSIS ROUTES (Specific Endpoints)
    // =========================================================================

    const getSignal = async (tenantId: string, projectId: string, type: string) => {
        const signal = await prisma.analysisSignal.findUnique({
            where: {
                tenantId_projectId_signalType: {
                    tenantId,
                    projectId,
                    signalType: type as any,
                },
            },
        });

        if (!signal) {
            return {
                type,
                value: null,
                confidence: 0,
                methodology: 'Not computed',
                isInsufficient: true,
                computedAt: new Date(),
            };
        }

        return {
            type: signal.signalType,
            value: signal.value,
            confidence: signal.confidenceScore,
            methodology: signal.methodology,
            isInsufficient: signal.isInsufficient,
            computedAt: signal.computedAt,
        };
    };

    fastify.get('/library/signals/kpis', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'KPI_SUMMARY');
    });

    fastify.get('/library/signals/health', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'MILESTONE_HEALTH');
    });

    fastify.get('/library/signals/status-breakdown', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'TASK_COUNTS_BY_STATUS');
    });

    fastify.get('/library/signals/summary', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        // Ensure Summary is computed if missing (on-demand helper since it's cheap/composite)
        // Or just return getSignal normally. 
        // For V1.5 patch, we trust AnalysisService computed it.
        return getSignal(query.tenantId, query.projectId, 'EXECUTIVE_SUMMARY');
    });

    fastify.get('/library/signals/progress', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'PROJECT_PROGRESS');
    });

    fastify.get('/library/signals/cfd', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'CFD_WEEKLY');
    });

    fastify.get('/library/signals/throughput', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'THROUGHPUT_WEEKLY');
    });

    fastify.get('/library/signals/contributions', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'ARTIFACT_ACTIVITY_WEEKLY');
    });

    fastify.get('/library/signals/contributors', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'CONTRIBUTOR_LEADERBOARD');
    });

    fastify.get('/library/signals/proof-index', async (request: FastifyRequest) => {
        const query = analysisQuerySchema.parse(request.query);
        return getSignal(query.tenantId, query.projectId, 'PROOF_INDEX');
    });

    fastify.get('/library/signals/network', async (request, reply) => {
        return { isInsufficient: true, reason: 'Network analysis not implemented in V1.5' };
    });

    fastify.get('/library/signals/activity-heatmap', async (request, reply) => {
        return { isInsufficient: true, reason: 'Heatmap requires daily granularity not present in V1.5' };
    });

    // =========================================================================
    // CANONICAL ROUTES (New)
    // =========================================================================

    fastify.get('/library/canonical/milestones', async (request: FastifyRequest) => {
        const query = canonicalTasksQuerySchema.parse(request.query); // Reuse similar schema
        const milestones = await prisma.canonicalMilestone.findMany({
            where: { tenantId: query.tenantId, projectId: query.projectId },
            orderBy: { startDate: 'asc' }
        });
        return { data: milestones, total: milestones.length };
    });

    /**
     * GET /library/service-account - Get service account email for share instructions
     */
    fastify.get('/library/service-account', async () => {
        return {
            email: getServiceAccountEmail(),
            instructions: 'Share your Google Sheet or Drive folder with this email address to connect.',
        };
    });
}
