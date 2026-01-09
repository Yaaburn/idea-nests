import { Provider, EventStatus } from '@prisma/client';
import { addDays, subDays } from 'date-fns';
import type {
    IConnector,
    AuthContext,
    ValidationResult,
    ResourceMetadata,
    IngestParams,
    IngestResult,
    DeltaSyncParams,
    DeltaSyncResult,
    HealthStatus,
    CalendarCursor,
    IngestError,
} from './interface.js';
import { createCalendarClientWithTokens, createOAuth2Client } from './google-client.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { secretsProvider } from '../lib/secrets.js';

/**
 * CalendarConnector - Ingests events from Google Calendar
 * Uses OAuth authentication (requires user consent)
 * 
 * Key features:
 * - Fetches events within configurable time window
 * - Extracts Google Meet link from conferenceData
 * - Uses syncToken for incremental delta sync
 * - Handles cancelled events
 */
export class CalendarConnector implements IConnector {
    readonly provider = Provider.GOOGLE_CALENDAR;
    readonly displayName = 'Google Calendar';
    readonly requiredScopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
    ];

    async validateAccess(resourceId: string, authContext: AuthContext): Promise<ValidationResult> {
        try {
            if (!authContext.encryptedTokens) {
                return {
                    isValid: false,
                    errorMessage: 'OAuth tokens required for Calendar access',
                };
            }

            const tokens = secretsProvider.decryptTokens(authContext.encryptedTokens);

            // Check if token needs refresh
            const accessToken = await this.getValidAccessToken(tokens, authContext);

            const calendar = createCalendarClientWithTokens(accessToken);
            const response = await calendar.calendars.get({
                calendarId: resourceId,
            });

            return {
                isValid: true,
                resourceName: response.data.summary ?? 'Calendar',
            };
        } catch (error: unknown) {
            const err = error as { code?: number; message?: string };
            if (err.code === 403 || err.code === 401) {
                return {
                    isValid: false,
                    errorMessage: 'Calendar access denied. Please re-authorize.',
                };
            }
            if (err.code === 404) {
                return {
                    isValid: false,
                    errorMessage: 'Calendar not found. Please check the calendar ID.',
                };
            }
            return {
                isValid: false,
                errorMessage: err.message ?? 'Unknown error validating access',
            };
        }
    }

    async getResourceMetadata(resourceId: string, authContext: AuthContext): Promise<ResourceMetadata> {
        if (!authContext.encryptedTokens) {
            throw new Error('OAuth tokens required');
        }

        const tokens = secretsProvider.decryptTokens(authContext.encryptedTokens);
        const accessToken = await this.getValidAccessToken(tokens, authContext);
        const calendar = createCalendarClientWithTokens(accessToken);

        const calendarInfo = await calendar.calendars.get({
            calendarId: resourceId,
        });

        // Count upcoming events
        const now = new Date();
        const events = await calendar.events.list({
            calendarId: resourceId,
            timeMin: now.toISOString(),
            timeMax: addDays(now, 30).toISOString(),
            maxResults: 100,
            singleEvents: true,
        });

        return {
            name: calendarInfo.data.summary ?? 'Calendar',
            itemCount: events.data.items?.length ?? 0,
            additionalInfo: {
                timeZone: calendarInfo.data.timeZone,
                primary: resourceId === 'primary',
            },
        };
    }

    async ingest(params: IngestParams): Promise<IngestResult> {
        const { tenantId, projectId, connectionId, resourceId, authContext, onProgress } = params;
        const errors: IngestError[] = [];
        let recordsIngested = 0;

        if (!authContext.encryptedTokens) {
            throw new Error('OAuth tokens required');
        }

        try {
            const tokens = secretsProvider.decryptTokens(authContext.encryptedTokens);
            const accessToken = await this.getValidAccessToken(tokens, authContext);
            const calendar = createCalendarClientWithTokens(accessToken);
            const retentionUntil = addDays(new Date(), config.RAW_RECORD_RETENTION_DAYS);

            // Fetch events from last 30 days to next 60 days
            const now = new Date();
            const timeMin = subDays(now, 30);
            const timeMax = addDays(now, 60);

            let pageToken: string | undefined;
            let syncToken: string | undefined;
            const allEvents: Array<{ id: string; data: unknown }> = [];

            do {
                const response = await calendar.events.list({
                    calendarId: resourceId,
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: 250,
                    pageToken,
                });

                for (const event of response.data.items ?? []) {
                    if (event.id) {
                        allEvents.push({ id: event.id, data: event });
                    }
                }

                pageToken = response.data.nextPageToken ?? undefined;
                syncToken = response.data.nextSyncToken ?? undefined;
            } while (pageToken);

            onProgress?.(20, 100, 'fetching_events');

            // Process each event
            for (let i = 0; i < allEvents.length; i++) {
                const { id: eventId, data: eventData } = allEvents[i];
                const event = eventData as calendar_v3.Schema$Event;

                try {
                    const externalId = eventId;
                    const lineageString = `calendar:${resourceId}:event:${eventId}:${new Date().toISOString()}`;

                    // Store raw record
                    await prisma.rawRecord.upsert({
                        where: { connectionId_externalId: { connectionId, externalId } },
                        create: {
                            tenantId,
                            projectId,
                            connectionId,
                            externalId,
                            data: event as object,
                            checksum: event.updated ?? '',
                            lineageString,
                            retentionUntil,
                        },
                        update: {
                            data: event as object,
                            checksum: event.updated ?? '',
                            lineageString,
                            retentionUntil,
                            fetchedAt: new Date(),
                        },
                    });

                    // Extract Meet link
                    let meetLink: string | null = null;
                    let conferenceId: string | null = null;
                    const hasMeetLink = Boolean(event.hangoutLink || event.conferenceData);

                    if (event.hangoutLink) {
                        meetLink = event.hangoutLink;
                    } else if (event.conferenceData?.entryPoints) {
                        const videoEntry = event.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
                        meetLink = videoEntry?.uri ?? null;
                        conferenceId = event.conferenceData.conferenceId ?? null;
                    }

                    // Parse start/end times
                    const startTime = event.start?.dateTime
                        ? new Date(event.start.dateTime)
                        : event.start?.date
                            ? new Date(event.start.date)
                            : new Date();

                    const endTime = event.end?.dateTime
                        ? new Date(event.end.dateTime)
                        : event.end?.date
                            ? new Date(event.end.date)
                            : startTime;

                    const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);

                    // Create canonical event
                    await prisma.canonicalEvent.upsert({
                        where: { connectionId_eventId: { connectionId, eventId } },
                        create: {
                            tenantId,
                            projectId,
                            connectionId,
                            eventId,
                            summary: event.summary ?? 'Untitled Event',
                            description: event.description ?? null,
                            startTime,
                            endTime,
                            isAllDay,
                            attendeesCount: event.attendees?.length ?? 0,
                            attendeesRaw: event.attendees ? (event.attendees as object) : null,
                            hasMeetLink,
                            meetLink,
                            conferenceId,
                            status: this.mapEventStatus(event.status),
                            recurrence: event.recurrence?.join(';') ?? null,
                        },
                        update: {
                            summary: event.summary ?? 'Untitled Event',
                            description: event.description ?? null,
                            startTime,
                            endTime,
                            isAllDay,
                            attendeesCount: event.attendees?.length ?? 0,
                            attendeesRaw: event.attendees ? (event.attendees as object) : null,
                            hasMeetLink,
                            meetLink,
                            conferenceId,
                            status: this.mapEventStatus(event.status),
                            recurrence: event.recurrence?.join(';') ?? null,
                            syncedAt: new Date(),
                        },
                    });

                    recordsIngested++;
                } catch (err) {
                    errors.push({
                        externalId: eventId,
                        message: err instanceof Error ? err.message : 'Unknown error',
                        recoverable: true,
                    });
                }

                onProgress?.(20 + Math.floor((i / allEvents.length) * 80), 100, 'processing_events');
            }

            const cursor: CalendarCursor = {
                type: 'calendar',
                syncToken: syncToken ?? '',
            };

            onProgress?.(100, 100, 'complete');

            return {
                success: errors.length === 0,
                recordsIngested,
                errors,
                cursor,
            };
        } catch (error) {
            logger.error({ error, resourceId }, 'Calendar ingestion failed');
            throw error;
        }
    }

    async deltaSync(params: DeltaSyncParams): Promise<DeltaSyncResult> {
        const { tenantId, projectId, connectionId, resourceId, cursor, authContext, onProgress } = params;
        const calendarCursor = cursor as CalendarCursor;
        const errors: IngestError[] = [];
        let recordsUpdated = 0;
        let recordsDeleted = 0;

        if (!authContext.encryptedTokens) {
            throw new Error('OAuth tokens required');
        }

        try {
            const tokens = secretsProvider.decryptTokens(authContext.encryptedTokens);
            const accessToken = await this.getValidAccessToken(tokens, authContext);
            const calendar = createCalendarClientWithTokens(accessToken);
            const retentionUntil = addDays(new Date(), config.RAW_RECORD_RETENTION_DAYS);

            // Use syncToken for incremental sync
            let pageToken: string | undefined;
            let newSyncToken: string | undefined;

            try {
                do {
                    const response = await calendar.events.list({
                        calendarId: resourceId,
                        syncToken: calendarCursor.syncToken,
                        pageToken,
                    });

                    for (const event of response.data.items ?? []) {
                        const eventId = event.id;
                        if (!eventId) continue;

                        try {
                            if (event.status === 'cancelled') {
                                // Event was cancelled
                                await prisma.canonicalEvent.updateMany({
                                    where: { connectionId, eventId },
                                    data: { status: 'CANCELLED', syncedAt: new Date() },
                                });
                                recordsDeleted++;
                            } else {
                                // Event was added or modified
                                const externalId = eventId;
                                const lineageString = `calendar:${resourceId}:event:${eventId}:${new Date().toISOString()}`;

                                await prisma.rawRecord.upsert({
                                    where: { connectionId_externalId: { connectionId, externalId } },
                                    create: {
                                        tenantId,
                                        projectId,
                                        connectionId,
                                        externalId,
                                        data: event as object,
                                        checksum: event.updated ?? '',
                                        lineageString,
                                        retentionUntil,
                                    },
                                    update: {
                                        data: event as object,
                                        checksum: event.updated ?? '',
                                        lineageString,
                                        retentionUntil,
                                        fetchedAt: new Date(),
                                    },
                                });

                                // Extract Meet info
                                let meetLink: string | null = null;
                                let conferenceId: string | null = null;
                                const hasMeetLink = Boolean(event.hangoutLink || event.conferenceData);

                                if (event.hangoutLink) {
                                    meetLink = event.hangoutLink;
                                } else if (event.conferenceData?.entryPoints) {
                                    const videoEntry = event.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
                                    meetLink = videoEntry?.uri ?? null;
                                    conferenceId = event.conferenceData.conferenceId ?? null;
                                }

                                const startTime = event.start?.dateTime
                                    ? new Date(event.start.dateTime)
                                    : event.start?.date
                                        ? new Date(event.start.date)
                                        : new Date();

                                const endTime = event.end?.dateTime
                                    ? new Date(event.end.dateTime)
                                    : event.end?.date
                                        ? new Date(event.end.date)
                                        : startTime;

                                await prisma.canonicalEvent.upsert({
                                    where: { connectionId_eventId: { connectionId, eventId } },
                                    create: {
                                        tenantId,
                                        projectId,
                                        connectionId,
                                        eventId,
                                        summary: event.summary ?? 'Untitled Event',
                                        description: event.description ?? null,
                                        startTime,
                                        endTime,
                                        isAllDay: Boolean(event.start?.date && !event.start?.dateTime),
                                        attendeesCount: event.attendees?.length ?? 0,
                                        attendeesRaw: event.attendees ? (event.attendees as object) : null,
                                        hasMeetLink,
                                        meetLink,
                                        conferenceId,
                                        status: this.mapEventStatus(event.status),
                                        recurrence: event.recurrence?.join(';') ?? null,
                                    },
                                    update: {
                                        summary: event.summary ?? 'Untitled Event',
                                        description: event.description ?? null,
                                        startTime,
                                        endTime,
                                        attendeesCount: event.attendees?.length ?? 0,
                                        hasMeetLink,
                                        meetLink,
                                        conferenceId,
                                        status: this.mapEventStatus(event.status),
                                        syncedAt: new Date(),
                                    },
                                });

                                recordsUpdated++;
                            }
                        } catch (err) {
                            errors.push({
                                externalId: eventId,
                                message: err instanceof Error ? err.message : 'Unknown error',
                                recoverable: true,
                            });
                        }
                    }

                    pageToken = response.data.nextPageToken ?? undefined;
                    newSyncToken = response.data.nextSyncToken ?? undefined;
                } while (pageToken);
            } catch (error: unknown) {
                const err = error as { code?: number };
                // If syncToken is invalid, do a full sync
                if (err.code === 410) {
                    logger.info({ connectionId }, 'SyncToken expired, performing full sync');
                    return this.ingest(params) as unknown as DeltaSyncResult;
                }
                throw error;
            }

            const newCursor: CalendarCursor = {
                type: 'calendar',
                syncToken: newSyncToken ?? calendarCursor.syncToken,
            };

            onProgress?.(100, 100, 'complete');

            return {
                success: true,
                recordsIngested: 0,
                recordsUpdated,
                recordsDeleted,
                errors,
                cursor: newCursor,
            };
        } catch (error) {
            logger.error({ error, resourceId }, 'Calendar delta sync failed');
            throw error;
        }
    }

    async healthCheck(resourceId: string, authContext: AuthContext): Promise<HealthStatus> {
        const result = await this.validateAccess(resourceId, authContext);
        return {
            status: result.isValid ? 'ACTIVE' : 'ERROR',
            message: result.errorMessage,
            lastChecked: new Date(),
        };
    }

    private mapEventStatus(status: string | undefined | null): EventStatus {
        switch (status) {
            case 'confirmed':
                return 'CONFIRMED';
            case 'tentative':
                return 'TENTATIVE';
            case 'cancelled':
                return 'CANCELLED';
            default:
                return 'CONFIRMED';
        }
    }

    private async getValidAccessToken(
        tokens: { accessToken: string; refreshToken: string; expiresAt: number },
        _authContext: AuthContext
    ): Promise<string> {
        // Check if token is still valid (with 5 min buffer)
        const now = Date.now();
        const expiresAt = tokens.expiresAt * 1000;

        if (now < expiresAt - 5 * 60 * 1000) {
            return tokens.accessToken;
        }

        // Need to refresh
        const oauth2Client = createOAuth2Client();
        oauth2Client.setCredentials({
            refresh_token: tokens.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        // Note: In production, we'd update the stored tokens here
        // For now, just return the new access token
        return credentials.access_token ?? tokens.accessToken;
    }
}

// Type for Google Calendar event
interface calendar_v3 {
    Schema$Event: {
        id?: string;
        summary?: string;
        description?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
        hangoutLink?: string;
        conferenceData?: {
            conferenceId?: string;
            entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
        };
        status?: string;
        recurrence?: string[];
        updated?: string;
    };
}
