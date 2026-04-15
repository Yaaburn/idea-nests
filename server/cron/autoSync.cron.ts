// ═══════════════════════════════════════════════
// Auto Sync Cronjob — Scheduled Data Synchronization
// Runs every minute, checks for integrations that need auto-sync.
// Uses Promise.allSettled to isolate failures between projects.
// ═══════════════════════════════════════════════

import cron from 'node-cron';
import { Integration } from '../models/Integration';
import { runSync } from '../services/sync.service';

/**
 * Start the auto-sync cronjob.
 * Runs every 1 minute and checks for integrations where:
 * - syncMode is 'auto'
 * - status is NOT 'syncing' (prevent concurrent syncs)
 * - (now - lastSyncedAt) >= syncInterval
 */
export function startAutoSyncCron(): void {
  console.log('[Cron] Auto-sync cronjob initialized (runs every 1 minute)');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Query for integrations that need auto-sync
      // Uses MongoDB $expr to compare dates directly in the query
      const integrations = await Integration.find({
        syncMode: 'auto',
        status: { $ne: 'syncing' },
        $or: [
          // Never synced
          { lastSyncedAt: null },
          // Time elapsed >= syncInterval (in minutes)
          {
            $expr: {
              $gte: [
                { $subtract: [now, '$lastSyncedAt'] },
                { $multiply: ['$syncInterval', 60 * 1000] }, // convert minutes to ms
              ],
            },
          },
        ],
      });

      if (integrations.length === 0) return;

      console.log(`[Cron] Found ${integrations.length} integration(s) ready for auto-sync`);

      // Run syncs in parallel but isolated (one failure doesn't crash others)
      const results = await Promise.allSettled(
        integrations.map(async (integration) => {
          console.log(
            `[Cron] → Syncing project: ${integration.projectId} (${integration.sheetTitle})`
          );
          return runSync(integration._id);
        })
      );

      // Log results
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const project = integrations[i].projectId;

        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
            console.log(`[Cron]   ✓ ${project}: ${result.value.rowCount} rows`);
          } else {
            failCount++;
            console.log(`[Cron]   ✗ ${project}: ${result.value.message}`);
          }
        } else {
          failCount++;
          console.error(`[Cron]   ✗ ${project}: ${result.reason?.message || 'Unknown error'}`);
        }
      }

      if (successCount > 0 || failCount > 0) {
        console.log(`[Cron] Batch complete: ${successCount} success, ${failCount} failed`);
      }
    } catch (err) {
      console.error('[Cron] Auto-sync cycle error:', err instanceof Error ? err.message : err);
    }
  });
}
