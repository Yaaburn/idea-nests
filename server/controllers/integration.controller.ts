// ═══════════════════════════════════════════════
// Integration Controller — Bot TalentNet API Handlers
// Handles connect, settings, sync, and disconnect operations.
// ═══════════════════════════════════════════════

import type { Request, Response } from 'express';
import { Integration } from '../models/Integration';
import { SheetData } from '../models/SheetData';
import { extractSpreadsheetId } from '../utils/urlParser';
import { verifyAccess } from '../services/sheet.service';
import { getBotEmail } from '../services/googleAuth.service';
import { runSync, getSyncData } from '../services/sync.service';
import { logAuditEvent } from '../models/AuditLog';

/**
 * POST /api/integrations/bot/connect
 *
 * Connect a Google Sheet to a project via Bot.
 * Validates URL, verifies access, creates integration, and runs first sync.
 */
export async function connect(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, sheetUrl } = req.body;

    if (!projectId || !sheetUrl) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'projectId và sheetUrl là bắt buộc.',
      });
      return;
    }

    // Step 1: Extract spreadsheetId from URL
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      res.status(400).json({
        error: 'INVALID_URL',
        message: 'URL Google Sheet không hợp lệ. Cần có dạng: https://docs.google.com/spreadsheets/d/...',
      });
      return;
    }

    // Step 2: Check if integration already exists for this project
    const existing = await Integration.findOne({ projectId });
    if (existing) {
      res.status(409).json({
        error: 'ALREADY_CONNECTED',
        message: 'Project này đã có kết nối. Hãy ngắt kết nối trước khi tạo mới.',
        integrationId: existing._id,
      });
      return;
    }

    // Step 3: Verify bot has access to the sheet
    let sheetInfo: { title: string; sheetNames: string[] };
    try {
      sheetInfo = await verifyAccess(spreadsheetId);
    } catch (err: any) {
      const statusCode = err.code === 'PERMISSION_DENIED' ? 403 : 404;
      res.status(statusCode).json({
        error: err.code || 'VERIFY_FAILED',
        message: err.message,
      });
      return;
    }

    // Step 4: Create integration record
    const botEmail = getBotEmail();
    const integration = await Integration.create({
      projectId,
      type: 'google_sheet',
      sheetUrl,
      spreadsheetId,
      sheetTitle: sheetInfo.title,
      botEmail,
      syncMode: 'manual',
      syncInterval: 60,
      status: 'connected',
    });

    console.log(`[Controller] Integration created for project: ${projectId} → "${sheetInfo.title}"`);

    // Audit: Connection created
    await logAuditEvent('connect', projectId, {
      integrationId: String(integration._id),
      sheetTitle: sheetInfo.title,
      spreadsheetId,
    });

    // Step 5: Run first sync automatically
    const syncResult = await runSync(integration._id);

    res.status(200).json({
      success: true,
      message: 'Kết nối thành công!',
      integration: {
        id: integration._id,
        projectId: integration.projectId,
        sheetTitle: integration.sheetTitle,
        spreadsheetId: integration.spreadsheetId,
        botEmail: integration.botEmail,
        syncMode: integration.syncMode,
        syncInterval: integration.syncInterval,
        lastSyncedAt: integration.lastSyncedAt,
        status: integration.status,
      },
      sync: syncResult,
    });
  } catch (err) {
    console.error('[Controller] connect error:', err);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Lỗi hệ thống khi kết nối. Vui lòng thử lại.',
    });
  }
}

/**
 * PUT /api/integrations/bot/settings/:id
 *
 * Update sync settings (syncMode, syncInterval) for an integration.
 */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { syncMode, syncInterval } = req.body;

    const integration = await Integration.findById(id);
    if (!integration) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Không tìm thấy cấu hình tích hợp.',
      });
      return;
    }

    // Validate syncMode
    if (syncMode && !['manual', 'auto'].includes(syncMode)) {
      res.status(400).json({
        error: 'INVALID_SYNC_MODE',
        message: 'syncMode phải là "manual" hoặc "auto".',
      });
      return;
    }

    // Validate syncInterval
    if (syncInterval !== undefined) {
      const validIntervals = [15, 30, 60, 120, 360, 720, 1440];
      if (!validIntervals.includes(Number(syncInterval))) {
        res.status(400).json({
          error: 'INVALID_INTERVAL',
          message: `syncInterval phải là một trong: ${validIntervals.join(', ')} (phút).`,
        });
        return;
      }
    }

    // Update fields
    if (syncMode) integration.syncMode = syncMode;
    if (syncInterval !== undefined) integration.syncInterval = Number(syncInterval);
    await integration.save();

    console.log(
      `[Controller] Settings updated: project ${integration.projectId} → ` +
      `mode=${integration.syncMode}, interval=${integration.syncInterval}min`
    );

    res.status(200).json({
      success: true,
      message: 'Đã lưu cài đặt đồng bộ.',
      integration: {
        id: integration._id,
        syncMode: integration.syncMode,
        syncInterval: integration.syncInterval,
      },
    });
  } catch (err) {
    console.error('[Controller] updateSettings error:', err);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Lỗi khi cập nhật cài đặt.',
    });
  }
}

/**
 * POST /api/integrations/bot/sync/:id
 *
 * Manually trigger a sync for an integration.
 */
export async function manualSync(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const integration = await Integration.findById(id);
    if (!integration) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Không tìm thấy cấu hình tích hợp.',
      });
      return;
    }

    // Prevent concurrent syncs
    if (integration.status === 'syncing') {
      res.status(409).json({
        error: 'SYNC_IN_PROGRESS',
        message: 'Đang trong quá trình đồng bộ. Vui lòng chờ.',
      });
      return;
    }

    const result = await runSync(integration._id);

    // Reload to get updated fields
    const updated = await Integration.findById(id);

    res.status(200).json({
      success: result.success,
      message: result.message,
      rowCount: result.rowCount,
      lastSyncedAt: updated?.lastSyncedAt,
      status: updated?.status,
    });
  } catch (err) {
    console.error('[Controller] manualSync error:', err);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Lỗi khi đồng bộ dữ liệu.',
    });
  }
}

/**
 * DELETE /api/integrations/bot/:id
 *
 * Disconnect: remove integration config and all associated data.
 */
export async function disconnect(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const integration = await Integration.findById(id);
    if (!integration) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Không tìm thấy cấu hình tích hợp.',
      });
      return;
    }

    const projectId = integration.projectId;

    // Delete associated sheet data
    await SheetData.deleteMany({ integrationId: integration._id });

    // Delete the integration config
    await Integration.findByIdAndDelete(id);

    console.log(`[Controller] Disconnected project: ${projectId}`);

    res.status(200).json({
      success: true,
      message: 'Đã ngắt kết nối và xóa toàn bộ dữ liệu liên quan.',
    });
  } catch (err) {
    console.error('[Controller] disconnect error:', err);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Lỗi khi ngắt kết nối.',
    });
  }
}

/**
 * GET /api/integrations/bot/status/:projectId
 *
 * Get integration status for a project (used by frontend dashboard).
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const integration = await Integration.findOne({ projectId });
    if (!integration) {
      res.status(200).json({
        connected: false,
        projectId,
      });
      return;
    }

    // Optionally include sync data summary
    const syncData = await getSyncData(integration._id);

    res.status(200).json({
      connected: true,
      integration: {
        id: integration._id,
        projectId: integration.projectId,
        sheetTitle: integration.sheetTitle,
        sheetUrl: integration.sheetUrl,
        spreadsheetId: integration.spreadsheetId,
        botEmail: integration.botEmail,
        syncMode: integration.syncMode,
        syncInterval: integration.syncInterval,
        lastSyncedAt: integration.lastSyncedAt,
        status: integration.status,
        errorMessage: integration.errorMessage,
      },
      dataSnapshot: syncData
        ? {
            rowCount: syncData.rowCount,
            headers: syncData.headers,
            syncedAt: syncData.syncedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('[Controller] getStatus error:', err);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Lỗi khi lấy trạng thái.',
    });
  }
}
