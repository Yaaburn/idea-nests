import { Queue, Worker, Job } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { connectorRegistry } from "../connectors/registry.js";
import type { AuthContext, CursorState } from "../connectors/interface.js";

// ============================================================================
// QUEUE DEFINITIONS
// ============================================================================

export const syncQueue = new Queue("library-sync", {
  connection: redis as any, 
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60000, // 1 minute initial delay
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const analyzeQueue = new Queue("library-analyze", {
  connection: redis as any, 
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 30000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ============================================================================
// JOB TYPES
// ============================================================================

export interface SyncJobData {
  tenantId: string;
  projectId: string;
  connectionId: string;
  syncJobId: string;
  isInitial: boolean;
}

export interface AnalyzeJobData {
  tenantId: string;
  projectId: string;
  signalTypes?: string[];
}

// ============================================================================
// SYNC WORKER
// ============================================================================

export function createSyncWorker() {
  const worker = new Worker<SyncJobData>(
    "library-sync",
    async (job: Job<SyncJobData>) => {
      const { tenantId, projectId, connectionId, syncJobId, isInitial } =
        job.data;
      const idempotencyKey = `${tenantId}:${projectId}:${connectionId}:${job.id}`;

      logger.info(
        { jobId: job.id, connectionId, idempotencyKey },
        "Starting sync job"
      );

      try {
        // Update sync job status
        await prisma.syncJob.update({
          where: { id: syncJobId },
          data: { status: "RUNNING", startedAt: new Date(), phase: "fetching" },
        });

        // Get connection details
        const connection = await prisma.connection.findUnique({
          where: { id: connectionId, tenantId, projectId },
        });

        if (!connection) {
          throw new Error("Connection not found");
        }

        // Get connector
        const connector = connectorRegistry.getOrThrow(connection.provider);

        // Build auth context
        const authContext: AuthContext = {
          authType: connection.authType,
          encryptedTokens: connection.encryptedTokens ?? undefined,
        };

        // Progress callback
        const onProgress = async (
          processed: number,
          total: number,
          phase: string
        ) => {
          await prisma.syncJob.update({
            where: { id: syncJobId },
            data: { processed, total, phase },
          });
          await job.updateProgress({ processed, total, phase });
        };

        let result;
        if (isInitial || !connection.cursorJson) {
          // Initial full sync
          result = await connector.ingest({
            tenantId,
            projectId,
            connectionId,
            resourceId: connection.resourceId,
            authContext,
            onProgress,
          });
        } else {
          // Delta sync
          result = await connector.deltaSync({
            tenantId,
            projectId,
            connectionId,
            resourceId: connection.resourceId,
            authContext,
            cursor: connection.cursorJson as unknown as CursorState, 
            onProgress,
          });
        }

        // Update connection with new cursor and stats
        await prisma.connection.update({
          where: { id: connectionId },
          data: {
            status: result.success ? "ACTIVE" : "ERROR",
            lastSyncedAt: new Date(),
            itemsSynced: { increment: result.recordsIngested },
            cursorJson: (result.cursor as any) ?? undefined, 
            errorMessage:
              result.errors.length > 0
                ? `${result.errors.length} errors during sync`
                : null,
          },
        });

        // Update sync job as completed
        await prisma.syncJob.update({
          where: { id: syncJobId },
          data: {
            status: "COMPLETED",
            finishedAt: new Date(),
            processed: result.recordsIngested,
          },
        });

        // Trigger analysis
        await analyzeQueue.add("analyze", {
          tenantId,
          projectId,
        });

        logger.info(
          {
            jobId: job.id,
            connectionId,
            recordsIngested: result.recordsIngested,
          },
          "Sync job completed"
        );

        return result;
      } catch (error) {
        logger.error({ error, jobId: job.id, connectionId }, "Sync job failed");

        // Update sync job as failed
        await prisma.syncJob.update({
          where: { id: syncJobId },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });

        // Update connection status
        await prisma.connection.update({
          where: { id: connectionId },
          data: {
            status: "ERROR",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    },
    {
      connection: redis as any, 
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: err }, "Sync worker job failed");
  });

  return worker;
}

// ============================================================================
// ANALYZE WORKER
// ============================================================================

export function createAnalyzeWorker() {
  const worker = new Worker<AnalyzeJobData>(
    "library-analyze",
    async (job: Job<AnalyzeJobData>) => {
      const { tenantId, projectId, signalTypes } = job.data;

      logger.info({ jobId: job.id, projectId }, "Starting analysis job");

      try {
        // Import analysis service dynamically to avoid circular deps
        const { AnalysisService } = await import(
          "../services/analysis.service.js"
        );
        const analysisService = new AnalysisService();

        await analysisService.computeAllSignals(
          tenantId,
          projectId,
          signalTypes
        );

        logger.info({ jobId: job.id, projectId }, "Analysis job completed");
      } catch (error) {
        logger.error(
          { error, jobId: job.id, projectId },
          "Analysis job failed"
        );
        throw error;
      }
    },
    {
      connection: redis as any, 
      concurrency: 3,
    }
  );

  return worker;
}

// ============================================================================
// HELPER: Enqueue sync job
// ============================================================================

export async function enqueueSyncJob(
  tenantId: string,
  projectId: string,
  connectionId: string,
  isInitial: boolean = false
): Promise<{ jobId: string; syncJobId: string }> {
  // Create sync job record
  const syncJob = await prisma.syncJob.create({
    data: {
      tenantId,
      projectId,
      connectionId,
      jobId: "", // Will update after queue
      status: "QUEUED",
    },
  });

  // Add to queue
  const job = await syncQueue.add(
    "sync",
    {
      tenantId,
      projectId,
      connectionId,
      syncJobId: syncJob.id,
      isInitial,
    },
    {
      jobId: `sync:${tenantId}:${projectId}:${connectionId}:${Date.now()}`,
      priority: isInitial ? 1 : 2,
    }
  );

  // Update job ID
  await prisma.syncJob.update({
    where: { id: syncJob.id },
    data: { jobId: job.id ?? syncJob.id },
  });

  return {
    jobId: job.id ?? syncJob.id,
    syncJobId: syncJob.id,
  };
}
