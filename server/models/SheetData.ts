// ═══════════════════════════════════════════════
// SheetData Model — Synced Sheet Data Storage
// Stores the actual data fetched from Google Sheets.
// Uses Schema.Types.Mixed for flexible column structures.
// ═══════════════════════════════════════════════

import mongoose, { Schema, type Document } from 'mongoose';

export interface ISheetData extends Document {
  integrationId: mongoose.Types.ObjectId;
  data: Record<string, any>[];     // Array of row objects
  headers: string[];               // Column headers
  rowCount: number;                // Number of data rows
  syncedAt: Date;                  // When this snapshot was created
}

const SheetDataSchema = new Schema<ISheetData>(
  {
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: [],
    },
    headers: {
      type: [String],
      default: [],
    },
    rowCount: {
      type: Number,
      default: 0,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One data snapshot per integration (upsert pattern)
SheetDataSchema.index({ integrationId: 1 }, { unique: true });

export const SheetData = mongoose.model<ISheetData>('SheetData', SheetDataSchema);
