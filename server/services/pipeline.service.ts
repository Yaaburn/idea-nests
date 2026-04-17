// ═══════════════════════════════════════════════
// Server Pipeline Service
// Runs the full 9-pass ingestion pipeline server-side.
// Imports shared pure-TS modules from src/lib/ingestion/.
// ═══════════════════════════════════════════════

import type { RawSheetData, RawTab } from '../../src/lib/ingestion/types';
import { analyze, selectBestTab } from '../../src/lib/ingestion/SmartSchemaDetector';
import { generateHypotheses } from '../../src/lib/ingestion/HypothesisEngine';
import { checkContradictions } from '../../src/lib/ingestion/ContradictionChecker';
import { resolveEntities, type RawIdentity } from '../../src/lib/ingestion/EntityResolver';
import { buildRetrievalIndex } from '../../src/lib/ingestion/RetrievalIndexBuilder';
import { computeQualityReport, computeStructuralDrift } from '../../src/lib/ingestion/QualityScorer';
import { detectAnomalies } from '../../src/lib/ingestion/AnomalyDetector';
import { buildGoldLayer } from '../../src/lib/ingestion/GoldViewBuilder';
import { detectTableBlocks, selectBestBlock } from '../../src/lib/ingestion/TableBlockDetector';
import { detectTabLifecycles } from '../../src/lib/ingestion/TabLifecycleDetector';
import { buildMasterTaskFact } from '../../src/lib/ingestion/MasterTaskFactBuilder';
import {
  normalizeString,
  nameFingerprint,
  detectLanguage,
  normalizeStatus,
  normalizePriority,
} from '../../src/lib/ingestion/LinguisticEngine';
import { createHash } from 'crypto';

import type {
  SnapshotPackage,
  SnapshotManifest,
  SnapshotProvenance,
  BronzeLayer,
  BronzeTab,
  SilverLayer,
  GoldLayer,
  EntityResolutionReport,
  LinguisticNormalizationReport,
  CanonicalRisk,
  CanonicalBlocker,
  CanonicalEffort,
  TabLifecycleReport,
} from '../../src/lib/ingestion/SnapshotTypes';
import type { CanonicalTask, CanonicalMember, CanonicalMilestone, CanonicalStatus, CanonicalPriority, ColumnMapping } from '../../src/lib/canonicalTypes';
import type { SnapshotMeta } from '../../src/lib/ingestion/MasterTaskFactTypes';
import type { SourceFingerprintData } from '../../src/lib/ingestion/types';

// ─── Main Entry ───

export interface ServerPipelineInput {
  projectId: string;
  integrationId: string;
  rawData: RawSheetData;
  sourceMode: SnapshotManifest['source_mode'];
  previousSnapshot: SnapshotPackage | null;
}

/**
 * Run the full 9-pass pipeline server-side.
 * Uses Node's crypto.createHash instead of browser crypto.subtle.
 */
export async function runServerPipeline(input: ServerPipelineInput): Promise<SnapshotPackage> {
  const { projectId, integrationId, rawData, sourceMode, previousSnapshot } = input;
  const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // ═══ PASS 1: BRONZE LAYER ═══
  const bronze: BronzeLayer = buildBronzeLayer(rawData);

  // ═══ PASS 2: TABLE-BLOCK DETECTION ═══
  const patchedTabs: RawTab[] = [];
  for (const tab of rawData.tabs) {
    const allRows = [tab.headers, ...tab.rows];
    const blocks = detectTableBlocks(allRows, tab.col_count);
    const bestBlock = selectBestBlock(blocks);

    if (bestBlock && bestBlock.header_row > 0) {
      const newHeaders = bestBlock.headers;
      const newRows = allRows.slice(bestBlock.header_row + 1, bestBlock.end_row + 1);
      patchedTabs.push({
        ...tab,
        headers: newHeaders,
        rows: newRows,
        row_count: newRows.length,
        col_count: newHeaders.length,
      });
    } else {
      patchedTabs.push(tab);
    }
  }

  // ═══ PASS 3–4: COLUMN TYPING + TAB SCORING ═══
  const tabAnalyses = analyze(patchedTabs);

  // ═══ PASS 5: HYPOTHESIS GENERATION ═══
  const hypotheses = generateHypotheses(tabAnalyses);

  // ═══ PASS 6: CONTRADICTION CHECK ═══
  const selection = selectBestTab(tabAnalyses);
  const contradictions = selection
    ? checkContradictions(selection.best)
    : { is_contradictory: false, severity: 'low' as const, contradictions: [], downgrade_delta: 0, fallback_recommendation: null };

  // ═══ PASS 7: ENTITY RESOLUTION ═══
  const allIdentities = collectServerIdentities(patchedTabs, tabAnalyses);
  const { members, report: entityReport } = resolveEntities(allIdentities);

  // ═══ PASS 8: MASTER_TASK_FACT ═══
  const previousBronzeTabs = previousSnapshot?.bronze.tabs ?? null;
  const tabLifecycleReport = detectTabLifecycles(bronze.tabs, previousBronzeTabs);
  const trustLevel = determineTrustLevel(rawData.access_mode, sourceMode);

  const { masterFacts, teamDim, milestoneDim } = buildMasterTaskFact(
    tabAnalyses, members, entityReport, tabLifecycleReport.results,
    { projectId, snapshotId, integrationId, workbookId: rawData.spreadsheet_id, workbookTitle: rawData.title, sourceMode, trustLevel },
  );

  // Backward-compatible CanonicalTask[]
  const tasks: CanonicalTask[] = masterFacts.map(f => ({
    task_name: f.task_name,
    task_status: f.status_normalized as CanonicalStatus,
    task_assignee: f.assignee_name ?? null,
    task_priority: (f.priority_normalized ?? 'medium') as CanonicalPriority,
    start_date: f.planned_start_date ?? null,
    deadline: f.deadline ?? null,
    completion_date: f.completed_at ?? null,
    progress_pct: f.progress_pct ?? null,
    description: f.task_description ?? null,
    notes: f.note_text ?? null,
    _source_tab: f.source_tab_name,
    _source_row: f.source_row_index,
  }));

  // Column mappings from all tabs
  const allColumnMappings: ColumnMapping[] = [];
  for (const analysis of tabAnalyses) {
    for (const m of analysis.mappings) {
      allColumnMappings.push({
        source_header: m.source_header,
        canonical_field: m.canonical_field,
        confidence: m.confidence,
        detection_method: m.detection_method,
        reasoning: m.reasoning,
      });
    }
  }

  const mappedColumns = allColumnMappings.filter(m => m.canonical_field !== 'ignore');
  let mappingConfidence = mappedColumns.length > 0
    ? mappedColumns.reduce((s, m) => s + m.confidence, 0) / mappedColumns.length
    : 0;
  mappingConfidence = Math.max(0, mappingConfidence - contradictions.downgrade_delta);

  const silver: SilverLayer = {
    tasks,
    members,
    milestones: milestoneDim.map(m => ({ name: m.name, date: m.date, status: m.status as 'upcoming' | 'completed' | 'overdue' })),
    risks: [],
    blockers: [],
    efforts: [],
    master_task_fact: masterFacts,
    team_dim: teamDim,
    milestone_dim: milestoneDim,
    column_mappings: allColumnMappings,
    tab_evaluations: [],
    entity_resolution: entityReport,
    linguistic_normalization: { headers_analyzed: 0, headers_resolved: 0, languages_detected: [], normalization_examples: [] },
    mapping_confidence: Math.round(mappingConfidence * 100) / 100,
  };

  // ═══ PASS 9: GOLD + QUALITY ═══
  const rawRows: Array<{ tab: string; row: number; values: string[] }> = [];
  for (const tab of patchedTabs) {
    for (let r = 0; r < tab.rows.length; r++) {
      rawRows.push({ tab: tab.tab_name, row: r, values: tab.rows[r] });
    }
  }
  const anomalies = detectAnomalies(tasks, members, rawRows);
  const gold = buildGoldLayer(silver, contradictions);
  const retrievalIndex = buildRetrievalIndex(snapshotId, gold, silver, bronze, contradictions);

  const drift = previousSnapshot
    ? computeStructuralDrift(previousSnapshot.bronze, bronze, previousSnapshot.manifest.snapshot_id, snapshotId)
    : null;

  const qualityReport = computeQualityReport(snapshotId, silver, bronze, contradictions, anomalies, trustLevel, drift);

  // Server-side SHA-256 (Node's crypto, not browser crypto.subtle)
  const fingerprint = computeServerFingerprint(rawData, patchedTabs);

  const manifest: SnapshotManifest = {
    snapshot_id: snapshotId,
    project_id: projectId,
    integration_id: integrationId,
    created_at: now,
    version: 2,
    source_mode: sourceMode,
    layers_present: ['bronze', 'silver', 'gold'],
    artifact_keys: ['manifest', 'provenance', 'bronze', 'silver', 'gold', 'retrieval_index', 'quality_report', 'tab_lifecycle'],
    fingerprint_sha256: fingerprint.fingerprint_sha256,
  };

  const provenance: SnapshotProvenance = {
    snapshot_id: snapshotId,
    source_url: rawData.spreadsheet_id,
    spreadsheet_id: rawData.spreadsheet_id,
    spreadsheet_title: rawData.title,
    access_mode: rawData.access_mode as SnapshotProvenance['access_mode'],
    trust_level: trustLevel,
    fetched_at: now,
    tabs_total: rawData.tabs.length,
    tabs_ingested: patchedTabs.map(t => t.tab_name),
    tabs_rejected: [],
    fingerprint,
    previous_snapshot_id: previousSnapshot?.manifest.snapshot_id ?? null,
  };

  const snapshotMeta: SnapshotMeta = {
    snapshot_id: snapshotId,
    project_id: projectId,
    integration_id: integrationId,
    created_at: now,
    source_mode: sourceMode,
    total_tabs: rawData.tabs.length,
    tabs_ingested: patchedTabs.length,
    total_raw_rows: bronze.total_rows,
    total_master_rows: masterFacts.length,
    overall_quality: qualityReport.overall_quality,
    mapping_confidence: Math.round(mappingConfidence * 100) / 100,
  };

  return {
    manifest, provenance, bronze, silver, gold,
    retrieval_index: retrievalIndex,
    quality_report: qualityReport,
    structural_drift: drift,
    tab_lifecycle: tabLifecycleReport,
    snapshot_meta: snapshotMeta,
  };
}

// ─── Helpers ───

function buildBronzeLayer(rawData: RawSheetData): BronzeLayer {
  return {
    tabs: rawData.tabs.map(t => ({
      tab_name: t.tab_name,
      tab_index: t.tab_index,
      headers: t.headers,
      rows: t.rows,
      row_count: t.row_count,
      col_count: t.col_count,
    })),
    total_tabs: rawData.tabs.length,
    total_rows: rawData.tabs.reduce((s, t) => s + t.row_count, 0),
    fetched_at: new Date().toISOString(),
    raw_metadata: {
      spreadsheet_id: rawData.spreadsheet_id,
      title: rawData.title,
      access_mode: rawData.access_mode,
    },
  };
}

function computeServerFingerprint(rawData: RawSheetData, tabs: RawTab[]): SourceFingerprintData {
  const parts: string[] = [rawData.spreadsheet_id, rawData.title, ...tabs.map(t => t.tab_name)];
  for (const tab of tabs) {
    parts.push(`HEADERS:${tab.headers.join('|')}`);
    for (const row of tab.rows.slice(0, 10)) {
      parts.push(`ROW:${row.slice(0, 5).map(v => (v ?? '').trim()).join('|')}`);
    }
  }
  const hash = createHash('sha256').update(parts.join('\n')).digest('hex');
  return {
    fingerprint_sha256: hash,
    source_kind: 'google_sheets',
    spreadsheet_id: rawData.spreadsheet_id,
    inspected_tabs: rawData.tabs.map(t => t.tab_name),
    selected_tabs: tabs.map(t => t.tab_name),
    row_signature_count: tabs.reduce((s, t) => s + Math.min(t.rows.length, 10), 0),
  };
}

function collectServerIdentities(tabs: RawTab[], analyses: any[]): RawIdentity[] {
  const identities: RawIdentity[] = [];
  for (const analysis of analyses) {
    const tab = analysis.tab;
    const nameIdx = tab.headers.findIndex((h: string) => {
      const nh = normalizeString(h);
      return nh.includes('assign') || nh.includes('owner') || nh.includes('member') ||
             nh.includes('nguoi') || nh.includes('phu trach') || nh.includes('name') || nh.includes('ten');
    });
    const emailIdx = tab.headers.findIndex((h: string) => normalizeString(h).includes('email'));
    const roleIdx = tab.headers.findIndex((h: string) => {
      const nh = normalizeString(h);
      return nh.includes('role') || nh.includes('vai tro') || nh.includes('chuc vu');
    });

    if (nameIdx < 0) continue;
    for (const row of tab.rows) {
      const name = (row[nameIdx] ?? '').trim();
      if (!name) continue;
      identities.push({
        raw_name: name,
        normalized_key: nameFingerprint(name),
        email: emailIdx >= 0 ? (row[emailIdx] ?? '').trim() || null : null,
        role: roleIdx >= 0 ? (row[roleIdx] ?? '').trim() || null : null,
        source_tab: tab.tab_name,
      });
    }
  }
  return identities;
}

function determineTrustLevel(accessMode: string, sourceMode: string): string {
  if (sourceMode === 'mock') return 'low';
  if (accessMode === 'oauth_user') return 'high';
  if (accessMode === 'service_account') return 'high';
  if (accessMode === 'csv_upload' || accessMode === 'xlsx_upload') return 'medium';
  return 'medium';
}
