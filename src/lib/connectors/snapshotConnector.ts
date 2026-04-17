// ═══════════════════════════════════════════════
// Snapshot Connector — Frontend API Client
// Fetches snapshot data from backend endpoints.
// All analysis reads go through this connector.
// ═══════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Fetch the latest Gold layer + summary for a project.
 */
export async function fetchLatestSnapshot(projectId: string): Promise<SnapshotLatestData> {
  const response = await fetch(`${API_BASE}/api/snapshots/${projectId}/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch snapshot: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch the quality report for a project.
 */
export async function fetchQualityReport(projectId: string): Promise<SnapshotQualityData> {
  const response = await fetch(`${API_BASE}/api/snapshots/${projectId}/quality`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quality report: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch the retrieval index for a project.
 */
export async function fetchRetrievalIndex(projectId: string): Promise<SnapshotRetrievalIndexData> {
  const response = await fetch(`${API_BASE}/api/snapshots/${projectId}/retrieval-index`);
  if (!response.ok) {
    throw new Error(`Failed to fetch retrieval index: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch provenance and manifest for a project.
 */
export async function fetchProvenance(projectId: string): Promise<SnapshotProvenanceData> {
  const response = await fetch(`${API_BASE}/api/snapshots/${projectId}/provenance`);
  if (!response.ok) {
    throw new Error(`Failed to fetch provenance: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Bronze layer (raw workbook data) for a project.
 */
export async function fetchBronzeLayer(projectId: string): Promise<{
  found: boolean;
  snapshot_id: string | null;
  bronze: any;
}> {
  const response = await fetch(`${API_BASE}/api/snapshots/${projectId}/bronze`);
  if (!response.ok) {
    throw new Error(`Failed to fetch bronze layer: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch snapshot history for a project.
 */
export async function fetchSnapshotHistory(projectId: string, limit = 10): Promise<{
  project_id: string;
  snapshots: Array<{
    snapshot_id: string;
    source_mode: string;
    is_active: boolean;
    task_count: number;
    member_count: number;
    tab_count: number;
    mapping_confidence: number;
    overall_quality: number;
    created_at: string;
  }>;
}> {
  const response = await fetch(`${API_BASE}/api/snapshots/${projectId}/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch snapshot history: ${response.status}`);
  }
  return response.json();
}

// ═══════════════════════════════════════════════
// RESPONSE TYPES (matching server contracts)
// ═══════════════════════════════════════════════

export interface SnapshotLatestData {
  found: boolean;
  snapshot_id: string | null;
  project_id: string;
  created_at: string | null;
  source_mode: string | null;
  trust_level: string | null;
  gold: {
    views: Record<string, {
      view_key: string;
      intent: string;
      data: Record<string, any>[];
      row_count: number;
      confidence: number;
      source_entities: string[];
      source_fields: string[];
      warnings: string[];
      generated_from: string;
    }>;
    generated_at: string;
  } | null;
  silver_summary: {
    task_count: number;
    member_count: number;
    milestone_count: number;
    mapping_confidence: number;
  } | null;
  quality_overview: {
    overall_quality: number;
    completeness_score: number;
    contradiction_score: number;
    anomaly_count: number;
  } | null;
  warnings: Array<{
    code: string;
    message_vi: string;
    detail: string;
    severity: string;
  }>;
  is_mock: boolean;
}

export interface SnapshotQualityData {
  found: boolean;
  snapshot_id: string | null;
  quality_report: any;
  structural_drift: any;
}

export interface SnapshotRetrievalIndexData {
  found: boolean;
  snapshot_id: string | null;
  retrieval_index: {
    snapshot_id: string;
    routes: Array<{
      intent_key: string;
      preferred_gold_view: string | null;
      required_silver_entities: string[];
      required_silver_fields: string[];
      fallback_bronze_tabs: string[];
      confidence: number;
      explanation: string;
      contradictions_affecting: string[];
      available: boolean;
    }>;
    generated_at: string;
  } | null;
}

export interface SnapshotProvenanceData {
  found: boolean;
  snapshot_id: string | null;
  provenance: any;
  manifest: any;
}
