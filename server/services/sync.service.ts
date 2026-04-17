// ═══════════════════════════════════════════════
// Sync Service — Full Workbook Synchronization
// Phase 5: Snapshot-based, full workbook ingestion.
// Generates Bronze/Silver/Gold snapshot per sync.
// ═══════════════════════════════════════════════

import mongoose from 'mongoose';
import { Integration } from '../models/Integration';
import { SheetData } from '../models/SheetData';
import { Snapshot } from '../models/Snapshot';
import { logAuditEvent } from '../models/AuditLog';
import { fetchRawData, fetchFullWorkbook, type FullWorkbookData } from './sheet.service';

/**
 * Run a full sync cycle for a given integration.
 *
 * Phase 5 Flow:
 * 1. Set status → 'syncing'
 * 2. Fetch FULL WORKBOOK from Google Sheets (all tabs)
 * 3. Generate snapshot package (Bronze/Silver/Gold)
 * 4. Store snapshot in Snapshot collection
 * 5. Set active snapshot pointer
 * 6. Additionally store in SheetData for migration bridge
 * 7. Update lastSyncedAt, status → 'connected'
 * 8. Audit log the action
 * 9. On error: status → 'error', audit log the failure
 */
export async function runSync(integrationId: string | mongoose.Types.ObjectId): Promise<{
  success: boolean;
  rowCount: number;
  tabCount: number;
  snapshotId: string | null;
  message: string;
}> {
  const integration = await Integration.findById(integrationId);
  if (!integration) {
    throw new Error(`Integration not found: ${integrationId}`);
  }

  console.log(`[Sync] Starting full workbook sync for project: ${integration.projectId} ("${integration.sheetTitle}")`);

  await logAuditEvent('sync_start', integration.projectId, {
    integrationId: String(integration._id),
  });

  // Mark as syncing
  integration.status = 'syncing';
  integration.errorMessage = '';
  await integration.save();

  try {
    // Step 1: Fetch FULL WORKBOOK (all tabs)
    const workbook = await fetchFullWorkbook(integration.spreadsheetId);

    const totalRows = workbook.tabs.reduce((s, t) => s + t.row_count, 0);

    console.log(
      `[Sync] Workbook fetched: "${workbook.title}" — ` +
      `${workbook.tabs.length} tabs, ${totalRows} total rows, ` +
      `${workbook.tabs_skipped.length} skipped`
    );

    // Step 2: Get previous active snapshot for drift detection
    const previousSnapshot = await Snapshot.findOne({
      projectId: integration.projectId,
      isActive: true,
    });

    // Step 3: Build RawSheetData for pipeline input
    const rawData = {
      spreadsheet_id: integration.spreadsheetId,
      title: workbook.title,
      access_mode: 'service_account',
      tabs: workbook.tabs,
    };

    // Step 4: Run FULL 9-pass pipeline server-side
    // This replaces the old placeholder approach where Bronze was stored
    // and Silver/Gold were deferred to the frontend.
    const { runServerPipeline } = await import('./pipeline.service');

    let previousSnapshotPackage = null;
    if (previousSnapshot) {
      // Reconstruct minimal previous snapshot for drift detection
      previousSnapshotPackage = {
        manifest: previousSnapshot.manifest as any,
        provenance: previousSnapshot.provenance as any,
        bronze: previousSnapshot.bronze as any,
        silver: previousSnapshot.silver as any,
        gold: previousSnapshot.gold as any,
        retrieval_index: previousSnapshot.retrievalIndex as any,
        quality_report: previousSnapshot.qualityReport as any,
        structural_drift: previousSnapshot.structuralDrift as any,
        tab_lifecycle: (previousSnapshot as any).tabLifecycle ?? null,
        snapshot_meta: (previousSnapshot as any).snapshotMeta ?? null,
      };
    }

    const snapshotPackage = await runServerPipeline({
      projectId: integration.projectId,
      integrationId: String(integration._id),
      rawData,
      sourceMode: 'service_account_bot',
      previousSnapshot: previousSnapshotPackage,
    });

    const snapshotId = snapshotPackage.manifest.snapshot_id;

    console.log(
      `[Sync] Pipeline complete: ${snapshotPackage.snapshot_meta.total_master_rows} master rows, ` +
      `quality=${snapshotPackage.snapshot_meta.overall_quality}, ` +
      `confidence=${snapshotPackage.snapshot_meta.mapping_confidence}`
    );

    // Step 5: Deactivate previous snapshot
    if (previousSnapshot) {
      previousSnapshot.isActive = false;
      await previousSnapshot.save();
    }

    // Step 6: Store new snapshot with full computed layers
    await Snapshot.create({
      projectId: integration.projectId,
      integrationId: integration._id,
      snapshotId,
      version: snapshotPackage.manifest.version,
      sourceMode: 'service_account_bot',
      isActive: true,
      manifest: snapshotPackage.manifest,
      provenance: snapshotPackage.provenance,
      bronze: snapshotPackage.bronze,
      silver: snapshotPackage.silver,
      gold: snapshotPackage.gold,
      retrievalIndex: snapshotPackage.retrieval_index,
      qualityReport: snapshotPackage.quality_report,
      structuralDrift: snapshotPackage.structural_drift,
      tabLifecycle: snapshotPackage.tab_lifecycle,
      snapshotMeta: snapshotPackage.snapshot_meta,
      taskCount: snapshotPackage.silver.tasks.length,
      memberCount: snapshotPackage.silver.members.length,
      masterTaskCount: snapshotPackage.silver.master_task_fact.length,
      tabCount: snapshotPackage.bronze.total_tabs,
      mappingConfidence: snapshotPackage.silver.mapping_confidence,
      overallQuality: snapshotPackage.quality_report.overall_quality,
      fingerprintSha256: snapshotPackage.manifest.fingerprint_sha256,
    });

    // Step 7: MIGRATION BRIDGE — Also store in legacy SheetData
    // Uses first tab for backward compatibility
    const firstTab = workbook.tabs[0];
    if (firstTab) {
      const legacyHeaders = firstTab.headers;
      const legacyData = firstTab.rows.map(row => {
        const obj: Record<string, string> = {};
        for (let i = 0; i < legacyHeaders.length; i++) {
          obj[legacyHeaders[i]] = (row[i] ?? '').trim();
        }
        return obj;
      });

      await SheetData.findOneAndUpdate(
        { integrationId: integration._id },
        {
          integrationId: integration._id,
          data: legacyData,
          headers: legacyHeaders,
          rowCount: legacyData.length,
          syncedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // Step 8: Update integration status
    integration.sheetTitle = workbook.title;
    integration.lastSyncedAt = new Date();
    integration.status = 'connected';
    integration.errorMessage = '';
    (integration as any).lastSnapshotId = snapshotId;
    (integration as any).tabsIngested = workbook.tabs.length;
    await integration.save();

    console.log(`[Sync] ✓ Success: ${totalRows} rows across ${workbook.tabs.length} tabs, snapshot: ${snapshotId}`);

    await logAuditEvent('sync_success', integration.projectId, {
      integrationId: String(integration._id),
      snapshotId,
      tabCount: workbook.tabs.length,
      totalRows,
      result: 'success',
    });

    return {
      success: true,
      rowCount: totalRows,
      tabCount: workbook.tabs.length,
      snapshotId,
      message: `Đồng bộ thành công: ${totalRows} hàng từ ${workbook.tabs.length} tab của "${workbook.title}".`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định khi đồng bộ.';

    integration.status = 'error';
    integration.errorMessage = errorMessage;
    await integration.save();

    console.error(`[Sync] ✗ Failed for project ${integration.projectId}:`, errorMessage);

    await logAuditEvent('sync_error', integration.projectId, {
      integrationId: String(integration._id),
      result: 'error',
      errorMessage,
    });

    return {
      success: false,
      rowCount: 0,
      tabCount: 0,
      snapshotId: null,
      message: errorMessage,
    };
  }
}

/**
 * Get the current sync data for an integration.
 * Returns from Snapshot if available, falls back to legacy SheetData.
 */
export async function getSyncData(integrationId: string | mongoose.Types.ObjectId): Promise<{
  data: Record<string, any>[];
  headers: string[];
  rowCount: number;
  tabCount: number;
  snapshotId: string | null;
  syncedAt: Date | null;
} | null> {
  // Try snapshot first
  const integration = await Integration.findById(integrationId);
  if (integration) {
    const snapshot = await Snapshot.findOne({
      projectId: integration.projectId,
      isActive: true,
    });

    if (snapshot) {
      const bronze = snapshot.bronze as any;
      const firstTab = bronze?.tabs?.[0];
      return {
        data: firstTab ? firstTab.rows.map((row: string[]) => {
          const obj: Record<string, string> = {};
          for (let i = 0; i < (firstTab.headers?.length ?? 0); i++) {
            obj[firstTab.headers[i]] = (row[i] ?? '').trim();
          }
          return obj;
        }) : [],
        headers: firstTab?.headers ?? [],
        rowCount: bronze?.total_rows ?? 0,
        tabCount: bronze?.total_tabs ?? 0,
        snapshotId: snapshot.snapshotId,
        syncedAt: snapshot.createdAt,
      };
    }
  }

  // Fallback: legacy SheetData
  const sheetData = await SheetData.findOne({ integrationId });
  if (!sheetData) return null;

  return {
    data: sheetData.data,
    headers: sheetData.headers,
    rowCount: sheetData.rowCount,
    tabCount: 1,
    snapshotId: null,
    syncedAt: sheetData.syncedAt,
  };
}
