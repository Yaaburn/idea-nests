
import { google } from 'googleapis';
import { prisma } from '../lib/prisma.js';
import { SheetIndexer } from '../sheet-intelligence/indexer.js';
import { SheetSampler } from '../sheet-intelligence/sampler.js';
import { SheetClassifier } from '../sheet-intelligence/classifier.js';
import { SheetsConnector } from '../connectors/sheets.connector.js';
import { AnalysisService } from '../services/analysis.service.js';
import { parseGoogleUrl } from '../connectors/google-client.js';
import { config } from '../config/index.js';
import { AuthType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';

// Types workaround if prisma client is not generated or available in dry run without install
type MockAuthType = 'SHARE_TO_BOT' | 'OAUTH';
const SHARE_TO_BOT: MockAuthType = 'SHARE_TO_BOT';

// Polyfill for BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

async function main() {
    // 1. Parse Args
    const args = process.argv.slice(2);
    const getArg = (name: string) => {
        const idx = args.findIndex(a => a === name);
        return idx !== -1 ? args[idx + 1] : null;
    };

    const sheetUrl = getArg('--sheetUrl');
    const tenantId = getArg('--tenantId') ?? 'test-tenant-' + crypto.randomUUID().slice(0, 8);
    const projectId = getArg('--projectId') ?? 'test-project-' + crypto.randomUUID().slice(0, 8);
    const dryRunArg = getArg('--dryRun');
    let dryRun = dryRunArg === 'true';

    if (!sheetUrl) {
        console.error('Usage: npm run library:backtest -- --sheetUrl <url> [--tenantId <id>] [--projectId <id>] [--dryRun true]');
        process.exit(1);
    }

    // Auto-detect dryRun if DB_URL is missing
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL not found. Forcing --dryRun=true.');
        dryRun = true;
    }

    const parsed = parseGoogleUrl(sheetUrl);
    if (!parsed || parsed.type !== 'sheet') {
        console.error('❌ Invalid Sheet URL');
        process.exit(1);
    }

    // Create reports dir
    const reportDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonReportPath = path.join(reportDir, `backtest-${timestamp}.json`);
    const mdReportPath = path.join(reportDir, `backtest-${timestamp}.md`);

    console.log(`\n=== 🧪 BACKTEST START ${dryRun ? '(DRY RUN)' : ''} ===`);
    console.log(`Sheet: ${parsed.id}`);
    console.log(`Tenant: ${tenantId}`);

    try {
        // --- 1. SHEET INTELLIGENCE ---
        console.log('\n[1/6] Running Sheet Intelligence...');

        let auth;
        try {
            // Check for dummy/invalid key first to avoid crypto crash
            if (!config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length < 50 || config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY === 'dummy') {
                throw new Error('Invalid/Dummy Private Key');
            }

            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
        } catch (e) {
            if (dryRun) {
                console.warn('⚠️  Google Creds missing. Cannot run Sheet Intelligence. Skipping to Mock Report.');
                // Create dummy structure for report check
                const dummyReport = generateDummyReport(parsed.id, tenantId, projectId);
                writeReports(jsonReportPath, mdReportPath, dummyReport, true);
                process.exit(0);
            }
            throw e;
        }

        const indexer = new SheetIndexer(auth);
        const sampler = new SheetSampler(auth);
        const classifier = new SheetClassifier();

        const structure = await indexer.indexSpreadsheet(parsed.id);
        const tabNames = structure.tabs.filter(t => !t.isHidden && t.gridProperties.rowCount > 0).map(t => t.title);
        const samples = await sampler.sampleTabs(parsed.id, tabNames);
        const classified = classifier.classifyTabs(structure, samples);

        const primaryTasks = classified.tabs.find(t => t.role === 'PRIMARY_TASKS');
        const primaryTimeline = classified.tabs.find(t => t.role === 'PRIMARY_TIMELINE');

        console.log('Classified Tabs:');
        console.table(classified.tabs.map(t => ({ role: t.role, title: t.title, conf: t.confidence.toFixed(2), decision: t.decision })));

        if (dryRun) {
            console.log('\n⚠️  DRY RUN: Skipping Ingestion, Analysis, and DB Verification.');
            const partialReport = {
                meta: { timestamp, sheetId: parsed.id, tenantId, projectId, mode: 'DRY_RUN' },
                classification: classified.tabs.map(t => ({ id: t.tabId, title: t.title, role: t.role, confidence: t.confidence })),
                status: 'PARTIAL_SUCCESS'
            };

            const mdReport = `
# Backtest Report (DRY RUN)
**Date**: ${timestamp}
**Sheet ID**: \`${parsed.id}\`
**Status**: BLOCKED (DB/Creds missing - Classification Only)

## 1. Sheet Classification
| Tab Name | Role | Confidence | Decision |
|----------|------|------------|----------|
${classified.tabs.map(t => `| ${t.title} | **${t.role}** | ${t.confidence.toFixed(2)} | ${t.decision} |`).join('\n')}

**Primary Selections**:
- Tasks: ${primaryTasks?.title ?? 'None'}
- Timeline: ${primaryTimeline?.title ?? 'None'}

## 2. Validation
- **Ingestion**: SKIPPED (Dry Run)
- **Analysis**: SKIPPED (Dry Run)
- **Idempotency**: EXPECTED
`;
            fs.writeFileSync(jsonReportPath, JSON.stringify(partialReport, null, 2));
            fs.writeFileSync(mdReportPath, mdReport.trim());
            console.log(`\n📄 Partial Reports saved to:\n  ${jsonReportPath}\n  ${mdReportPath}`);
            process.exit(0);
        }

        // --- 2. PIPELINE PASS 1 (Ingest) ---
        console.log('\n[2/6] Running Ingestion Pipeline (Pass 1)...');

        // Mock connection
        const connection = await prisma.connection.upsert({
            where: { tenantId_projectId_provider_resourceId: { tenantId, projectId, provider: 'GOOGLE_SHEETS', resourceId: parsed.id } },
            create: {
                tenantId, projectId, provider: 'GOOGLE_SHEETS', resourceId: parsed.id,
                createdBy: 'backtest', ownerUserId: 'backtest', authType: 'SHARE_TO_BOT', status: 'PENDING'
            },
            update: { status: 'PENDING' }
        });

        const connector = new SheetsConnector();

        const ingestResult1 = await connector.ingest({
            tenantId,
            projectId,
            connectionId: connection.id,
            resourceId: parsed.id,
            // @ts-ignore
            authContext: { authType: AuthType.SHARE_TO_BOT },
            onProgress: (p: number, t: number, s: string) => {
                process.stdout.write(`\rIngest: ${p}% ${s}`.padEnd(50));
                return true;
            }
        });
        console.log('\nIngest 1 complete.');

        if (!ingestResult1.success) {
            console.error('❌ Ingestion failed:', ingestResult1.errors);
            process.exit(1);
        }

        // --- 3. ANALYSIS ---
        console.log('\n[3/6] Running Analysis Service...');
        const analysisService = new AnalysisService();
        await analysisService.computeAllSignals(tenantId, projectId);

        // --- 4. VERIFY DATA ---
        console.log('\n[4/6] Verifying Data & Lineage...');
        const counts = {
            tasks: await prisma.canonicalTask.count({ where: { tenantId, projectId } }),
            milestones: await prisma.canonicalMilestone.count({ where: { tenantId, projectId } }),
            persons: await prisma.canonicalPerson.count({ where: { tenantId, projectId } }),
            links: await prisma.canonicalLink.count({ where: { tenantId, projectId } }),
        };

        // Lineage Check
        const lineageSamples = await prisma.canonicalTask.findMany({
            where: { tenantId, projectId },
            take: 3,
            select: { id: true, title: true, status: true, sourceTabName: true, sourceRowIndex: true, rawRecordId: true }
        });

        const lineagePass = lineageSamples.length === 0 || lineageSamples.every(t => t.rawRecordId && t.sourceRowIndex);

        // Signal Check
        const signals = await prisma.analysisSignal.findMany({
            where: { tenantId, projectId },
            orderBy: { signalType: 'asc' }
        });

        const kpiSignal = signals.find(s => s.signalType === 'KPI_SUMMARY');
        const cfdSignal = signals.find(s => s.signalType === 'CFD_WEEKLY');

        // --- 5. IDEMPOTENCY CHECK ---
        console.log('\n[5/6] Idempotency Check (Pass 2)...');

        const ingestResult2 = await connector.ingest({
            tenantId, projectId, connectionId: connection.id, resourceId: parsed.id,
            authContext: { authType: AuthType.SHARE_TO_BOT },
            onProgress: () => true
        });

        const countsPass2 = {
            tasks: await prisma.canonicalTask.count({ where: { tenantId, projectId } }),
            milestones: await prisma.canonicalMilestone.count({ where: { tenantId, projectId } }),
            persons: await prisma.canonicalPerson.count({ where: { tenantId, projectId } }),
            links: await prisma.canonicalLink.count({ where: { tenantId, projectId } }),
        };

        const idempotencyPass =
            counts.tasks === countsPass2.tasks &&
            counts.milestones === countsPass2.milestones &&
            counts.persons === countsPass2.persons;

        // --- 6. REPORT GENERATION ---
        console.log('\n[6/6] Generating Reports...');

        const jsonReport = {
            meta: { timestamp, sheetId: parsed.id, tenantId, projectId },
            classification: classified.tabs.map(t => ({ id: t.tabId, title: t.title, role: t.role, confidence: t.confidence })),
            ingest1: ingestResult1,
            ingest2: ingestResult2,
            counts: { pass1: counts, pass2: countsPass2 },
            idempotencyPass,
            lineagePass,
            signals: signals.map(s => ({ type: s.signalType, value: s.value, confidence: s.confidenceScore, isInsufficient: s.isInsufficient })),
            lineageSamples
        };

        fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));

        const mdReport = `
# Backtest Report
**Date**: ${timestamp}
**Sheet ID**: \`${parsed.id}\`
**Tenant**: \`${tenantId}\`

## 1. Sheet Classification
| Tab Name | Role | Confidence | Decision |
|----------|------|------------|----------|
${classified.tabs.map(t => `| ${t.title} | **${t.role}** | ${t.confidence.toFixed(2)} | ${t.decision} |`).join('\n')}

**Primary Selections**:
- Tasks: ${primaryTasks?.title ?? 'None'}
- Timeline: ${primaryTimeline?.title ?? 'None'}

## 2. Canonical Data Counts
| Entity | Pass 1 | Pass 2 | Match? |
|--------|--------|--------|--------|
| Tasks | ${counts.tasks} | ${countsPass2.tasks} | ${counts.tasks === countsPass2.tasks ? '✅' : '❌'} |
| Milestones | ${counts.milestones} | ${countsPass2.milestones} | ${counts.milestones === countsPass2.milestones ? '✅' : '❌'} |
| Persons | ${counts.persons} | ${countsPass2.persons} | ${counts.persons === countsPass2.persons ? '✅' : '❌'} |
| Links | ${counts.links} | ${countsPass2.links} | ${counts.links === countsPass2.links ? '✅' : '❌'} |

**Idempotency Result**: ${idempotencyPass ? 'PASS ✅' : 'FAIL ❌'}

## 3. Analysis Signals (Sample)
**KPI SUMMARY**:
\`\`\`json
${JSON.stringify(kpiSignal?.value, null, 2)}
\`\`\`

**CFD WEEKLY**:
\`\`\`json
${JSON.stringify(cfdSignal?.value, null, 2)}
\`\`\`

## 4. Lineage Verification
${lineageSamples.map(t => `
- **Title**: "${t.title}"
  - **Source**: ${t.sourceTabName} : Row ${t.sourceRowIndex}
  - **RawID**: \`${t.rawRecordId}\` ${t.rawRecordId ? '✅' : '❌'}
`).join('\n')}

**Lineage Result**: ${lineagePass ? 'PASS ✅' : 'FAIL ❌'}
`;
        fs.writeFileSync(mdReportPath, mdReport.trim());

        console.log(`\n📄 Reports saved to:\n  ${jsonReportPath}\n  ${mdReportPath}`);

        if (!idempotencyPass) {
            console.error('❌ FAIL: Idempotency check failed.');
            process.exit(1);
        }
        if (!lineagePass) {
            console.error('❌ FAIL: Lineage check failed.');
            process.exit(1);
        }

        console.log('✅ SUCCESS: Backtest passed all checks.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ FAIL: Backtest encountered an error:', error);
        process.exit(1);
    }
}

function generateDummyReport(sheetId: string, tenantId: string, projectId: string) {
    return {
        json: { status: 'SKIPPED_MISSING_CREDS', sheetId },
        md: `# Backtest Report DO NOT MERGE\nSKIPPED: Missing Google Credentials.`
    };
}
function writeReports(jsonPath: string, mdPath: string, report: any, isDummy: boolean) {
    if (isDummy) {
        fs.writeFileSync(jsonPath, JSON.stringify(report.json, null, 2));
        fs.writeFileSync(mdPath, report.md);
    }
    console.log(`\n📄 Partial Reports saved.`);
}


main();
