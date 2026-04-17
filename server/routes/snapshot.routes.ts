// ═══════════════════════════════════════════════
// Snapshot Routes — API for Snapshot Access
// Locked JSON response contracts per implementation plan.
// ═══════════════════════════════════════════════

import { Router, type Request, type Response } from 'express';
import { Snapshot } from '../models/Snapshot';

const router = Router();

// ─── Input Validation ───
const PROJECT_ID_PATTERN = /^[a-zA-Z0-9_\-]{1,64}$/;

function validateProjectId(req: Request, res: Response): string | null {
  const { projectId } = req.params;
  if (!projectId || !PROJECT_ID_PATTERN.test(projectId)) {
    res.status(400).json({ error: 'INVALID_PROJECT_ID', message: 'Project ID không hợp lệ.' });
    return null;
  }
  return projectId;
}

/**
 * GET /api/snapshots/:projectId/latest
 *
 * Returns the latest active snapshot for a project.
 * Response contract: SnapshotLatestResponse
 */
router.get('/:projectId/latest', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({
        found: false,
        snapshot_id: null,
        project_id: projectId,
        created_at: null,
        source_mode: null,
        trust_level: null,
        gold: null,
        silver_summary: null,
        quality_overview: null,
        warnings: [],
        is_mock: false,
      });
    }

    const silver = snapshot.silver as any;
    const quality = snapshot.qualityReport as any;
    const manifest = snapshot.manifest as any;
    const provenance = snapshot.provenance as any;

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      project_id: snapshot.projectId,
      created_at: snapshot.createdAt?.toISOString() ?? null,
      source_mode: manifest?.source_mode ?? null,
      trust_level: provenance?.trust_level ?? null,
      gold: snapshot.gold,
      silver_summary: {
        task_count: snapshot.taskCount,
        member_count: snapshot.memberCount,
        milestone_count: silver?.milestones?.length ?? 0,
        mapping_confidence: snapshot.mappingConfidence,
      },
      quality_overview: {
        overall_quality: snapshot.overallQuality,
        completeness_score: quality?.completeness_score ?? 0,
        contradiction_score: quality?.contradiction_score ?? 0,
        anomaly_count: quality?.anomalies?.length ?? 0,
      },
      warnings: [],
      is_mock: manifest?.source_mode === 'mock',
    });
  } catch (err) {
    console.error('[Snapshot] latest error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy snapshot.' });
  }
});

/**
 * GET /api/snapshots/:projectId/quality
 *
 * Returns the quality report and structural drift for a project.
 * Response contract: SnapshotQualityResponse
 */
router.get('/:projectId/quality', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({
        found: false,
        snapshot_id: null,
        quality_report: null,
        structural_drift: null,
      });
    }

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      quality_report: snapshot.qualityReport,
      structural_drift: snapshot.structuralDrift,
    });
  } catch (err) {
    console.error('[Snapshot] quality error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy báo cáo chất lượng.' });
  }
});

/**
 * GET /api/snapshots/:projectId/retrieval-index
 *
 * Returns the retrieval index for analysis routing.
 * Response contract: SnapshotRetrievalIndexResponse
 */
router.get('/:projectId/retrieval-index', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({
        found: false,
        snapshot_id: null,
        retrieval_index: null,
      });
    }

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      retrieval_index: snapshot.retrievalIndex,
    });
  } catch (err) {
    console.error('[Snapshot] retrieval-index error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy retrieval index.' });
  }
});

/**
 * GET /api/snapshots/:projectId/provenance
 *
 * Returns the provenance and manifest for a project.
 * Response contract: SnapshotProvenanceResponse
 */
router.get('/:projectId/provenance', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({
        found: false,
        snapshot_id: null,
        provenance: null,
        manifest: null,
      });
    }

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      provenance: snapshot.provenance,
      manifest: snapshot.manifest,
    });
  } catch (err) {
    console.error('[Snapshot] provenance error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy thông tin nguồn gốc.' });
  }
});

/**
 * GET /api/snapshots/:projectId/bronze
 *
 * Returns the raw Bronze layer (full workbook data).
 */
router.get('/:projectId/bronze', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({ found: false, bronze: null });
    }

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      bronze: snapshot.bronze,
    });
  } catch (err) {
    console.error('[Snapshot] bronze error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy dữ liệu Bronze.' });
  }
});

/**
 * GET /api/snapshots/:projectId/history
 *
 * Returns list of recent snapshots (summary only).
 */
router.get('/:projectId/history', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const snapshots = await Snapshot.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('snapshotId sourceMode isActive taskCount memberCount tabCount mappingConfidence overallQuality createdAt');

    res.json({
      project_id: projectId,
      snapshots: snapshots.map(s => ({
        snapshot_id: s.snapshotId,
        source_mode: s.sourceMode,
        is_active: s.isActive,
        task_count: s.taskCount,
        member_count: s.memberCount,
        tab_count: s.tabCount,
        mapping_confidence: s.mappingConfidence,
        overall_quality: s.overallQuality,
        created_at: s.createdAt?.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[Snapshot] history error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy lịch sử snapshot.' });
  }
});

/**
 * GET /api/snapshots/:projectId/silver
 *
 * Returns the full Silver layer including MASTER_TASK_FACT.
 * For diagnostic/development use.
 */
router.get('/:projectId/silver', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({ found: false, silver: null });
    }

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      silver: snapshot.silver,
    });
  } catch (err) {
    console.error('[Snapshot] silver error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi khi lấy dữ liệu Silver.' });
  }
});

/**
 * GET /api/snapshots/:projectId/diagnostic
 *
 * Full diagnostic dump: Bronze summary + Silver (MASTER_TASK_FACT + mappings) + Gold views.
 * Designed for pipeline testing and algorithm development.
 */
router.get('/:projectId/diagnostic', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const snapshot = await Snapshot.findOne({
      projectId,
      isActive: true,
    });

    if (!snapshot) {
      return res.json({ found: false, message: 'No active snapshot found.' });
    }

    const bronze = snapshot.bronze as any;
    const silver = snapshot.silver as any;
    const gold = snapshot.gold as any;
    const quality = snapshot.qualityReport as any;
    const manifest = snapshot.manifest as any;

    // Bronze summary (no raw rows — too large)
    const bronzeSummary = {
      total_tabs: bronze?.total_tabs ?? 0,
      total_rows: bronze?.total_rows ?? 0,
      tabs: (bronze?.tabs ?? []).map((t: any) => ({
        tab_name: t.tab_name,
        row_count: t.row_count,
        col_count: t.col_count,
        headers: t.headers,
        sample_rows: (t.rows ?? []).slice(0, 3),
      })),
    };

    // Silver canonical data
    const silverData = {
      task_count: silver?.tasks?.length ?? 0,
      member_count: silver?.members?.length ?? 0,
      master_task_fact_count: silver?.master_task_fact?.length ?? 0,
      mapping_confidence: silver?.mapping_confidence ?? 0,
      column_mappings: silver?.column_mappings ?? [],
      tab_evaluations: silver?.tab_evaluations ?? [],
      entity_resolution: silver?.entity_resolution ?? null,
      // MASTER_TASK_FACT — the canonical dataset
      master_task_fact: silver?.master_task_fact ?? [],
      // Team & milestone dimensions
      team_dim: silver?.team_dim ?? [],
      milestone_dim: silver?.milestone_dim ?? [],
      // Backward-compatible tasks
      tasks_sample: (silver?.tasks ?? []).slice(0, 5),
      members: silver?.members ?? [],
    };

    // Gold views summary
    const goldSummary = {
      generated_at: gold?.generated_at ?? null,
      view_keys: Object.keys(gold?.views ?? {}),
      views: Object.fromEntries(
        Object.entries(gold?.views ?? {}).map(([key, view]: [string, any]) => [
          key,
          {
            intent: view.intent,
            row_count: view.row_count,
            confidence: view.confidence,
            explanation_vi: view.explanation_vi ?? '',
            explanation_en: view.explanation_en ?? '',
            transformation_formula: view.transformation_formula ?? '',
            warnings: view.warnings ?? [],
            data_sample: (view.data ?? []).slice(0, 3),
          },
        ])
      ),
    };

    res.json({
      found: true,
      snapshot_id: snapshot.snapshotId,
      created_at: snapshot.createdAt?.toISOString(),
      source_mode: manifest?.source_mode ?? null,
      version: manifest?.version ?? 1,

      // Three-layer architecture
      bronze: bronzeSummary,
      silver: silverData,
      gold: goldSummary,

      // Quality metrics
      quality: {
        overall_quality: quality?.overall_quality ?? 0,
        completeness_score: quality?.completeness_score ?? 0,
        contradiction_score: quality?.contradiction_score ?? 0,
        anomaly_count: quality?.anomalies?.length ?? 0,
      },

      // Summary counts
      summary: {
        task_count: snapshot.taskCount,
        member_count: snapshot.memberCount,
        master_task_count: (snapshot as any).masterTaskCount ?? 0,
        tab_count: snapshot.tabCount,
        mapping_confidence: snapshot.mappingConfidence,
        overall_quality: snapshot.overallQuality,
      },
    });
  } catch (err) {
    console.error('[Snapshot] diagnostic error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi diagnostic.' });
  }
});

export default router;
