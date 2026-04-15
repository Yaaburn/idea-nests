// ═══════════════════════════════════════════════
// Integration Model — Bot TalentNet Configuration
// Stores per-project Google Sheet connection config.
// ═══════════════════════════════════════════════

import mongoose, { Schema, type Document } from 'mongoose';

export interface IIntegration extends Document {
  projectId: string;
  type: string;
  sheetUrl: string;
  spreadsheetId: string;
  sheetTitle: string;
  botEmail: string;
  syncMode: 'manual' | 'auto';
  syncInterval: number;
  lastSyncedAt: Date | null;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  errorMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    projectId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'google_sheet',
    },
    sheetUrl: {
      type: String,
      required: true,
    },
    spreadsheetId: {
      type: String,
      required: true,
    },
    sheetTitle: {
      type: String,
      default: 'Google Sheet',
    },
    botEmail: {
      type: String,
      required: true,
    },
    syncMode: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual',
    },
    syncInterval: {
      type: Number,
      default: 60, // minutes
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['connected', 'syncing', 'error', 'disconnected'],
      default: 'connected',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // auto createdAt, updatedAt
  }
);

// Ensure one integration per project
IntegrationSchema.index({ projectId: 1 }, { unique: true });

export const Integration = mongoose.model<IIntegration>('Integration', IntegrationSchema);
