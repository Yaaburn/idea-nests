// ═══════════════════════════════════════════════
// Migration: SheetData → Snapshot
// Converts existing SheetData records into Snapshot format.
// Run once, then verify before removing legacy path.
//
// Usage: npx ts-node server/migrations/migrateSheetData.ts
// ═══════════════════════════════════════════════

import 'dotenv/config';
import mongoose from 'mongoose';
import { SheetData } from '../models/SheetData';
import { Snapshot } from '../models/Snapshot';
import { Integration } from '../models/Integration';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentnet';

async function migrate() {
  console.log('[Migration] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Migration] Connected.');

  const sheetDocs = await SheetData.find({});
  console.log(`[Migration] Found ${sheetDocs.length} SheetData records to migrate.`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of sheetDocs) {
    try {
      // Find the integration for this sheet data
      const integration = await Integration.findById(doc.integrationId);
      if (!integration) {
        console.warn(`[Migration] No integration found for SheetData ${doc._id}, skipping.`);
        skipped++;
        continue;
      }

      // Check if a snapshot already exists for this project
      const existingSnapshot = await Snapshot.findOne({
        projectId: integration.projectId,
        isActive: true,
      });

      if (existingSnapshot) {
        console.log(`[Migration] Snapshot already exists for project ${integration.projectId}, skipping.`);
        skipped++;
        continue;
      }

      const snapshotId = `migrated_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Build a minimal Bronze layer from legacy data
      const headers = doc.headers || [];
      const rows = (doc.data || []).map((obj: Record<string, any>) =>
        headers.map((h: string) => String(obj[h] ?? ''))
      );

      const bronze = {
        workbook_title: integration.sheetTitle || 'Migrated Sheet',
        tabs: [{
          tab_name: 'Sheet1 (migrated)',
          tab_index: 0,
          headers,
          rows,
          row_count: rows.length,
          col_count: headers.length,
          profile: {},
        }],
        total_tabs: 1,
        total_rows: rows.length,
        fetched_at: doc.syncedAt?.toISOString() ?? new Date().toISOString(),
      };

      const manifest = {
        snapshot_id: snapshotId,
        project_id: integration.projectId,
        integration_id: String(integration._id),
        created_at: doc.syncedAt?.toISOString() ?? new Date().toISOString(),
        version: 1,
        source_mode: 'service_account_bot',
        layers_present: ['bronze'],
        artifact_keys: ['manifest', 'provenance', 'bronze'],
        fingerprint_sha256: `migrated_${snapshotId}`,
      };

      const provenance = {
        snapshot_id: snapshotId,
        source_url: integration.sheetUrl,
        spreadsheet_id: integration.spreadsheetId,
        spreadsheet_title: integration.sheetTitle,
        access_mode: 'service_account',
        trust_level: 'service_account_verified',
        fetched_at: doc.syncedAt?.toISOString() ?? new Date().toISOString(),
        tabs_total: 1,
        tabs_ingested: ['Sheet1 (migrated)'],
        tabs_rejected: [],
        previous_snapshot_id: null,
      };

      await Snapshot.create({
        projectId: integration.projectId,
        integrationId: integration._id,
        snapshotId,
        version: 1,
        sourceMode: 'service_account_bot',
        isActive: true,
        manifest,
        provenance,
        bronze,
        silver: { tasks: [], members: [], milestones: [], risks: [], blockers: [], efforts: [], column_mappings: [], tab_evaluations: [], entity_resolution: { total_raw_names: 0, total_resolved_entities: 0, merges: [], conflicts: [], unresolved: [] }, linguistic_normalization: { headers_normalized: [], languages_detected: [], code_switched_columns: [], generated_at: new Date().toISOString() }, mapping_confidence: 0 },
        gold: { views: {}, generated_at: new Date().toISOString() },
        retrievalIndex: { snapshot_id: snapshotId, routes: [], generated_at: new Date().toISOString() },
        qualityReport: { snapshot_id: snapshotId, completeness_score: 0, contradiction_score: 0, ambiguity_score: 0, retrieval_confidence: 0, source_trust_level: 'service_account_verified', structural_stability_score: 1.0, freshness_score: 1.0, overall_quality: 0, anomalies: [], contradiction_report: { is_contradictory: false, severity: 'low', contradictions: [], downgrade_delta: 0, fallback_recommendation: null }, generated_at: new Date().toISOString() },
        structuralDrift: null,
        taskCount: 0,
        memberCount: 0,
        tabCount: 1,
        mappingConfidence: 0,
        overallQuality: 0,
        fingerprintSha256: manifest.fingerprint_sha256,
      });

      console.log(`[Migration] ✓ Migrated project ${integration.projectId}: ${rows.length} rows → ${snapshotId}`);
      migrated++;
    } catch (err) {
      console.error(`[Migration] ✗ Error migrating SheetData ${doc._id}:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  console.log(`\n[Migration] Complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
