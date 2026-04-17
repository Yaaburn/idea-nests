// ═══════════════════════════════════════════════
// Audit Log Model — Action Traceability
// Logs all integration actions for compliance.
// TTL index for bounded retention (90 days).
// ═══════════════════════════════════════════════

import mongoose, { Schema, type Document } from 'mongoose';

export type AuditAction =
  | 'connect'
  | 'disconnect'
  | 'sync_start'
  | 'sync_success'
  | 'sync_error'
  | 'settings_update'
  | 'csv_upload'
  | 'snapshot_created'
  | 'snapshot_activated'
  | 'migration';

export interface IAuditLog extends Document {
  action: AuditAction;
  projectId: string;
  integrationId: string | null;
  snapshotId: string | null;
  details: Record<string, any>;
  result: 'success' | 'error' | 'warning';
  errorMessage: string | null;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    integrationId: {
      type: String,
      default: null,
    },
    snapshotId: {
      type: String,
      default: null,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: String,
      enum: ['success', 'error', 'warning'],
      default: 'success',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We manage our own timestamp
  }
);

// 90-day TTL for bounded retention
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Quick project audit trail query
AuditLogSchema.index({ projectId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

/**
 * Convenience: log an audit event.
 */
export async function logAuditEvent(
  action: AuditAction,
  projectId: string,
  details: {
    integrationId?: string;
    snapshotId?: string;
    result?: 'success' | 'error' | 'warning';
    errorMessage?: string;
    [key: string]: any;
  } = {}
): Promise<void> {
  try {
    await AuditLog.create({
      action,
      projectId,
      integrationId: details.integrationId ?? null,
      snapshotId: details.snapshotId ?? null,
      details,
      result: details.result ?? 'success',
      errorMessage: details.errorMessage ?? null,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit logging must never crash the main flow
    console.error('[AuditLog] Failed to log:', err instanceof Error ? err.message : err);
  }
}
