// ═══════════════════════════════════════════════
// Sync Service — Orchestrates Data Synchronization
// Coordinates between Google Sheets API and MongoDB.
// Handles status transitions and error reporting.
// ═══════════════════════════════════════════════

import mongoose from 'mongoose';
import { Integration } from '../models/Integration';
import { SheetData } from '../models/SheetData';
import { fetchRawData } from './sheet.service';

/**
 * Run a full sync cycle for a given integration.
 *
 * Flow:
 * 1. Set status → 'syncing'
 * 2. Fetch data from Google Sheets
 * 3. Upsert data into SheetData collection
 * 4. Update lastSyncedAt, status → 'connected'
 * 5. On error: status → 'error', save errorMessage
 *
 * @returns Summary of the sync operation
 */
export async function runSync(integrationId: string | mongoose.Types.ObjectId): Promise<{
  success: boolean;
  rowCount: number;
  message: string;
}> {
  // Step 1: Load integration and mark as syncing
  const integration = await Integration.findById(integrationId);
  if (!integration) {
    throw new Error(`Integration not found: ${integrationId}`);
  }

  console.log(`[Sync] Starting sync for project: ${integration.projectId} (${integration.sheetTitle})`);

  // Mark as syncing
  integration.status = 'syncing';
  integration.errorMessage = '';
  await integration.save();

  try {
    // Step 2: Fetch data from Google Sheets
    const { title, headers, data, rowCount } = await fetchRawData(integration.spreadsheetId);

    // Step 3: Upsert data into SheetData
    await SheetData.findOneAndUpdate(
      { integrationId: integration._id },
      {
        integrationId: integration._id,
        data,
        headers,
        rowCount,
        syncedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Step 4: Update integration status
    integration.sheetTitle = title;
    integration.lastSyncedAt = new Date();
    integration.status = 'connected';
    integration.errorMessage = '';
    await integration.save();

    console.log(`[Sync] ✓ Success: ${rowCount} rows synced for "${title}"`);

    return {
      success: true,
      rowCount,
      message: `Đồng bộ thành công: ${rowCount} hàng dữ liệu từ "${title}".`,
    };
  } catch (err) {
    // Step 5: Handle errors
    const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định khi đồng bộ.';

    integration.status = 'error';
    integration.errorMessage = errorMessage;
    await integration.save();

    console.error(`[Sync] ✗ Failed for project ${integration.projectId}:`, errorMessage);

    return {
      success: false,
      rowCount: 0,
      message: errorMessage,
    };
  }
}

/**
 * Get the current sync data for an integration.
 */
export async function getSyncData(integrationId: string | mongoose.Types.ObjectId): Promise<{
  data: Record<string, any>[];
  headers: string[];
  rowCount: number;
  syncedAt: Date | null;
} | null> {
  const sheetData = await SheetData.findOne({ integrationId });
  if (!sheetData) return null;

  return {
    data: sheetData.data,
    headers: sheetData.headers,
    rowCount: sheetData.rowCount,
    syncedAt: sheetData.syncedAt,
  };
}
