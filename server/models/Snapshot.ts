// ═══════════════════════════════════════════════
// Snapshot Model — Versioned Immutable Data Package
// Stores Bronze/Silver/Gold layers per sync.
// Replaces flat SheetData model.
// ═══════════════════════════════════════════════

import mongoose, { Schema, type Document } from 'mongoose';

export interface ISnapshot extends Document {
  projectId: string;
  integrationId: mongoose.Types.ObjectId;
  snapshotId: string;
  version: number;
  sourceMode: 'oauth_user' | 'service_account_bot' | 'csv_snapshot' | 'xlsx_snapshot' | 'mock';
  isActive: boolean; // true = latest snapshot for this project

  // Core layers (stored as Mixed for flexible schema)
  manifest: Record<string, any>;
  provenance: Record<string, any>;
  bronze: Record<string, any>;
  silver: Record<string, any>;
  gold: Record<string, any>;
  retrievalIndex: Record<string, any>;
  qualityReport: Record<string, any>;
  structuralDrift: Record<string, any> | null;
  tabLifecycle: Record<string, any> | null;
  snapshotMeta: Record<string, any> | null;

  // Summary fields for quick queries (avoid deserializing full layers)
  taskCount: number;
  memberCount: number;
  masterTaskCount: number;
  tabCount: number;
  mappingConfidence: number;
  overallQuality: number;
  fingerprintSha256: string;

  createdAt: Date;
  updatedAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
      required: true,
    },
    snapshotId: {
      type: String,
      required: true,
      unique: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    sourceMode: {
      type: String,
      enum: ['oauth_user', 'service_account_bot', 'csv_snapshot', 'xlsx_snapshot', 'mock'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Layers
    manifest: { type: Schema.Types.Mixed, required: true },
    provenance: { type: Schema.Types.Mixed, required: true },
    bronze: { type: Schema.Types.Mixed, required: true },
    silver: { type: Schema.Types.Mixed, required: true },
    gold: { type: Schema.Types.Mixed, required: true },
    retrievalIndex: { type: Schema.Types.Mixed, required: true },
    qualityReport: { type: Schema.Types.Mixed, required: true },
    structuralDrift: { type: Schema.Types.Mixed, default: null },
    tabLifecycle: { type: Schema.Types.Mixed, default: null },
    snapshotMeta: { type: Schema.Types.Mixed, default: null },

    // Summary
    taskCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    masterTaskCount: { type: Number, default: 0 },
    tabCount: { type: Number, default: 0 },
    mappingConfidence: { type: Number, default: 0 },
    overallQuality: { type: Number, default: 0 },
    fingerprintSha256: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick "latest snapshot for project" queries
SnapshotSchema.index({ projectId: 1, isActive: 1 });
SnapshotSchema.index({ projectId: 1, createdAt: -1 });

export const Snapshot = mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
