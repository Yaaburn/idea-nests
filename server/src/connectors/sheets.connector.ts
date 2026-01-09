import { Provider, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import crypto from 'node:crypto';
import { addDays } from 'date-fns';
import { google } from 'googleapis';
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
    SheetsCursor,
    IngestError,
} from './interface.js';
import { createSheetsClient, createDriveClient } from './google-client.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

// Sheet Intelligence
import { SheetIndexer } from '../sheet-intelligence/indexer.js';
import { SheetSampler } from '../sheet-intelligence/sampler.js';
import { SheetClassifier } from '../sheet-intelligence/classifier.js';
import { TabRole, SheetTabProfile } from '../sheet-intelligence/types.js';

// Extractors
import { TaskExtractor } from '../extractors/task.extractor.js';
import { TimelineExtractor } from '../extractors/timeline.extractor.js';
import { TeamExtractor } from '../extractors/team.extractor.js';
import { DocsLinksExtractor } from '../extractors/docs-links.extractor.js';

/**
 * SheetsConnector V2 - Ingests and normalizes data using Multi-Tab Sheet Intelligence
 */
export class SheetsConnector implements IConnector {
    readonly provider = Provider.GOOGLE_SHEETS;
    readonly displayName = 'Google Sheets';
    readonly requiredScopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

    private getAuth() {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
    }

    async validateAccess(resourceId: string, _authContext: AuthContext): Promise<ValidationResult> {
        try {
            const sheets = createSheetsClient();
            const response = await sheets.spreadsheets.get({
                spreadsheetId: resourceId,
                fields: 'properties.title',
            });

            return {
                isValid: true,
                resourceName: response.data.properties?.title ?? 'Untitled Spreadsheet',
            };
        } catch (error: unknown) {
            const err = error as { code?: number; message?: string };
            if (err.code === 403) {
                return {
                    isValid: false,
                    errorMessage: 'Access denied. Please share the spreadsheet with our service account.',
                };
            }
            if (err.code === 404) {
                return {
                    isValid: false,
                    errorMessage: 'Spreadsheet not found. Please check the URL.',
                };
            }
            return {
                isValid: false,
                errorMessage: err.message ?? 'Unknown error validating access',
            };
        }
    }

    async getResourceMetadata(resourceId: string, _authContext: AuthContext): Promise<ResourceMetadata> {
        const sheets = createSheetsClient();
        const response = await sheets.spreadsheets.get({
            spreadsheetId: resourceId,
            fields: 'properties.title,sheets.properties',
        });

        const sheetCount = response.data.sheets?.length ?? 0;

        return {
            name: response.data.properties?.title ?? 'Untitled',
            itemCount: sheetCount,
            additionalInfo: {
                tabs: response.data.sheets?.map(s => s.properties?.title) ?? [],
            },
        };
    }

    async ingest(params: IngestParams): Promise<IngestResult> {
        const { tenantId, projectId, connectionId, resourceId, onProgress } = params;
        const errors: IngestError[] = [];
        let recordsIngested = 0;

        try {
            const auth = this.getAuth();
            const indexer = new SheetIndexer(auth);
            const sampler = new SheetSampler(auth);
            const classifier = new SheetClassifier();

            // 1. Index Structure
            onProgress?.(0, 100, 'indexing_structure');
            const structure = await indexer.indexSpreadsheet(resourceId);

            // 2. Sample Tabs
            onProgress?.(10, 100, 'sampling_tabs');
            const tabNames = structure.tabs
                .filter(t => !t.isHidden && t.gridProperties.rowCount > 0)
                .map(t => t.title);
            const samples = await sampler.sampleTabs(resourceId, tabNames);

            // 3. Classify Tabs
            onProgress?.(20, 100, 'classifying_tabs');
            const classifiedStructure = classifier.classifyTabs(structure, samples);

            // Save classification to connection
            const tabProfilesMap = classifiedStructure.tabs.reduce((acc, tab) => {
                acc[tab.tabId] = tab;
                return acc;
            }, {} as Record<string, SheetTabProfile>);

            await prisma.connection.update({
                where: { id: connectionId },
                data: { tabProfiles: tabProfilesMap as any },
            });

            // 4. Process Tabs
            const sheetsClient = createSheetsClient(); // Need raw client for full fetches
            const retentionUntil = addDays(new Date(), config.RAW_RECORD_RETENTION_DAYS);
            const tabChecksums: Record<string, string> = {};

            const tabsToProcess = classifiedStructure.tabs.filter(t =>
                t.decision === 'auto' &&
                t.role !== TabRole.ARCHIVE &&
                t.role !== TabRole.LOOKUP &&
                t.role !== TabRole.UNKNOWN
            );

            for (let i = 0; i < tabsToProcess.length; i++) {
                const tab = tabsToProcess[i];
                const progressBase = 30 + Math.floor((i / tabsToProcess.length) * 60);
                onProgress?.(progressBase, 100, `processing_tab:${tab.title}`);

                // Fetch full data (capped)
                const maxRows = Math.min(tab.gridProperties.rowCount, 1000); // safety cap
                const range = `'${tab.title}'!A1:ZZ${maxRows}`;

                const response = await sheetsClient.spreadsheets.values.get({
                    spreadsheetId: resourceId,
                    range,
                });

                const rows = response.data.values ?? [];
                if (rows.length < 2) continue;

                // Checksum
                const checksum = crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
                tabChecksums[tab.title] = checksum;

                // 4a. Save RawRecords & Build Map
                const rawRecordMap = new Map<number, string>(); // rowIndex -> id
                const headerRow = rows[0]; // Assuming row 1 is header for simplicity (Extractors handle finding real header, but for raw storage we dump all)

                // We'll trust extractor to tell us where data starts, but for lineage we dump everything
                for (let r = 0; r < rows.length; r++) {
                    const rowData = rows[r];
                    const rowIndex = r + 1; // 1-based
                    const externalId = `${tab.title}:row:${rowIndex}`;

                    const rowChecksum = crypto.createHash('sha256').update(JSON.stringify(rowData)).digest('hex');
                    const lineageString = `sheets:${resourceId}:${tab.title}:row:${rowIndex}:${new Date().toISOString()}`;

                    const rawRecord = await prisma.rawRecord.upsert({
                        where: { connectionId_externalId: { connectionId, externalId } },
                        create: {
                            tenantId, projectId, connectionId, externalId,
                            data: { values: rowData, headers: headerRow },
                            checksum: rowChecksum,
                            lineageString,
                            retentionUntil,
                        },
                        update: {
                            data: { values: rowData, headers: headerRow },
                            checksum: rowChecksum,
                            lineageString,
                            retentionUntil,
                            fetchedAt: new Date(),
                        },
                    });

                    rawRecordMap.set(rowIndex, rawRecord.id);
                }

                // 4b. Run Extractor
                try {
                    if (tab.role === TabRole.PRIMARY_TASKS) {
                        const extractor = new TaskExtractor();
                        const tasks = extractor.extract(rows, { tenantId, projectId, connectionId, sheetId: resourceId, tabName: tab.title });

                        for (const task of tasks) {
                            task.rawRecordId = rawRecordMap.get(task.sourceRowIndex) ?? null;
                            await prisma.canonicalTask.upsert({
                                where: {
                                    connectionId_sourceSheetId_sourceTabName_sourceRowIndex: {
                                        connectionId, sourceSheetId: resourceId, sourceTabName: tab.title, sourceRowIndex: task.sourceRowIndex
                                    }
                                },
                                create: { ...task, parseErrors: task.parseErrors ?? [] },
                                update: { ...task, parseErrors: task.parseErrors ?? [], syncedAt: new Date() }
                            });
                            recordsIngested++;
                        }
                    } else if (tab.role === TabRole.PRIMARY_TIMELINE) {
                        const extractor = new TimelineExtractor();
                        const milestones = extractor.extract(rows, { tenantId, projectId, connectionId, sheetId: resourceId, tabName: tab.title });

                        // Delete existing milestones for this connection to avoid stale ones? Or upsert? Upsert is safer for ID stability if we had external IDs, 
                        // but here we generate UUIDs. Ideally we'd use row index as key for stability.
                        // Wait, Prisma schema doesn't have a unique constraint on sourceRowIndex for Milestones!
                        // I should verify schema. 
                        // CanonicalMilestone has @@index([tenantId, projectId]). No unique on lineage?
                        // Schema needs update if we want upsert by lineage. Or we just delete all for this connection and re-insert?
                        // Deleting all is risky for existing relationships.
                        // I'll add unique constraint logic manually or just findFirst + update.

                        for (const ms of milestones) {
                            ms.rawRecordId = rawRecordMap.get(ms.sourceRowIndex!) ?? null;

                            // Try to find existing by lineage
                            const existing = await prisma.canonicalMilestone.findFirst({
                                where: {
                                    connectionId,
                                    sourceSheetId: resourceId,
                                    sourceTabName: tab.title,
                                    sourceRowIndex: ms.sourceRowIndex
                                }
                            });

                            if (existing) {
                                await prisma.canonicalMilestone.update({
                                    where: { id: existing.id },
                                    data: { ...ms, id: existing.id, syncedAt: new Date() }
                                });
                            } else {
                                await prisma.canonicalMilestone.create({ data: ms });
                            }
                            recordsIngested++;
                        }
                    } else if (tab.role === TabRole.PRIMARY_TEAM) {
                        const extractor = new TeamExtractor();
                        const people = extractor.extract(rows, { tenantId, projectId, sheetId: resourceId });

                        for (const person of people) {
                            // De-dupe by canonicalEmail + projectId
                            await prisma.canonicalPerson.upsert({
                                where: {
                                    tenantId_projectId_canonicalEmail: {
                                        tenantId, projectId, canonicalEmail: person.canonicalEmail
                                    }
                                },
                                create: person,
                                update: { ...person, syncedAt: new Date() }
                            });
                            recordsIngested++;
                        }
                    } else if (tab.role === TabRole.DOCS_LINKS) {
                        const extractor = new DocsLinksExtractor();
                        const links = extractor.extract(rows, { tenantId, projectId, connectionId, sheetId: resourceId, tabName: tab.title });

                        // Links have no unique constraint on lineage in schema I defined?
                        // Let's check schema... Metadata says "canonical_links" has relation to connection.
                        // I didn't add lineage unique constraint.
                        // I'll do findFirst + update again.
                        for (const link of links) {
                            link.rawRecordId = rawRecordMap.get(link.sourceRowIndex!) ?? null;

                            const existing = await prisma.canonicalLink.findFirst({
                                where: {
                                    connectionId,
                                    sourceTabName: tab.title,
                                    sourceRowIndex: link.sourceRowIndex
                                }
                            });

                            if (existing) {
                                await prisma.canonicalLink.update({
                                    where: { id: existing.id },
                                    data: { ...link, id: existing.id, syncedAt: new Date() }
                                });
                            } else {
                                await prisma.canonicalLink.create({ data: link });
                            }
                            recordsIngested++;
                        }
                    }
                } catch (err) {
                    errors.push({
                        externalId: tab.title,
                        message: `Extraction failed: ${err instanceof Error ? err.message : String(err)}`,
                        recoverable: true
                    });
                }
            }

            // Build cursor state
            const cursor: SheetsCursor = {
                type: 'sheets',
                checksumVersion: crypto
                    .createHash('sha256')
                    .update(JSON.stringify(tabChecksums))
                    .digest('hex'),
                tabChecksums,
            };

            onProgress?.(100, 100, 'complete');

            return {
                success: errors.length === 0,
                recordsIngested,
                errors,
                cursor,
            };

        } catch (error) {
            logger.error({ error, resourceId }, 'Sheets V2 ingestion failed');
            throw error;
        }
    }

    async deltaSync(params: DeltaSyncParams): Promise<DeltaSyncResult> {
        // V1.5 Delta Sync: Currently simplifed to full re-ingest because of Multi-Tab complexity
        // To do proper delta, we need to index, compare checksums per tab, and only process changed tabs.
        // For now, re-using ingest logic but wrapped.

        // Optimize: check global checksum first?
        // Reuse ingest logic for now.
        const ingestResult = await this.ingest(params as unknown as IngestParams);

        return {
            success: ingestResult.success,
            recordsIngested: 0,
            recordsUpdated: ingestResult.recordsIngested, // Treat all as updates/upserts
            recordsDeleted: 0,
            errors: ingestResult.errors,
            cursor: ingestResult.cursor,
        };
    }

    async healthCheck(resourceId: string, _authContext: AuthContext): Promise<HealthStatus> {
        const result = await this.validateAccess(resourceId, _authContext);
        return {
            status: result.isValid ? 'ACTIVE' : 'ERROR',
            message: result.errorMessage,
            lastChecked: new Date(),
        };
    }
}
