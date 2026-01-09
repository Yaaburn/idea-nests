-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE_SHEETS', 'GOOGLE_DRIVE', 'GOOGLE_CALENDAR');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('SHARE_TO_BOT', 'OAUTH');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SYNCING', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ArtifactCategory" AS ENUM ('DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'IMAGE', 'VIDEO', 'PDF', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('TASK_COUNTS_BY_STATUS', 'TASK_VELOCITY_WEEKLY', 'MILESTONE_HEALTH', 'ARTIFACT_ACTIVITY_WEEKLY', 'MEETING_LOAD_WEEKLY', 'PROJECT_PROGRESS', 'THROUGHPUT_WEEKLY', 'CONTRIBUTOR_LEADERBOARD', 'PROOF_INDEX', 'CFD_WEEKLY', 'KPI_SUMMARY', 'EXECUTIVE_SUMMARY');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "resource_name" TEXT,
    "auth_type" "AuthType" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "last_synced_at" TIMESTAMP(3),
    "items_synced" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "cursor_json" JSONB,
    "tab_profiles" JSONB,
    "encrypted_tokens" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "lineage_string" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retention_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'UNKNOWN',
    "assignee_raw" TEXT,
    "due_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "priority" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phase" TEXT,
    "milestone_id" TEXT,
    "source_sheet_id" TEXT NOT NULL,
    "source_tab_name" TEXT NOT NULL,
    "source_row_index" INTEGER NOT NULL,
    "raw_record_id" TEXT,
    "mapping_confidence" DOUBLE PRECISION,
    "parse_errors" JSONB DEFAULT '[]',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_artifacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "drive_file_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "type_category" "ArtifactCategory" NOT NULL,
    "web_view_link" TEXT,
    "thumbnail_link" TEXT,
    "size_bytes" BIGINT NOT NULL,
    "created_time" TIMESTAMP(3) NOT NULL,
    "modified_time" TIMESTAMP(3) NOT NULL,
    "modified_by" TEXT,
    "trashed" BOOLEAN NOT NULL DEFAULT false,
    "raw_record_id" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "attendees_count" INTEGER NOT NULL DEFAULT 0,
    "attendees_raw" JSONB,
    "has_meet_link" BOOLEAN NOT NULL DEFAULT false,
    "meet_link" TEXT,
    "conference_id" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "recurrence" TEXT,
    "raw_record_id" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "task_count" INTEGER NOT NULL DEFAULT 0,
    "task_completed" INTEGER NOT NULL DEFAULT 0,
    "source_sheet_id" TEXT,
    "source_tab_name" TEXT,
    "source_row_index" INTEGER,
    "raw_record_id" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_persons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "role" TEXT,
    "canonical_email" TEXT NOT NULL,
    "contribution_count" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "type_hint" TEXT,
    "source_tab_name" TEXT,
    "source_row_index" INTEGER,
    "raw_record_id" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_signals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "signal_type" "SignalType" NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" JSONB NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "methodology" TEXT NOT NULL,
    "derived_from_ids" TEXT[],
    "is_insufficient" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "analysis_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'QUEUED',
    "phase" TEXT,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connections_tenant_id_project_id_idx" ON "connections"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "connections_tenant_id_project_id_provider_idx" ON "connections"("tenant_id", "project_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "connections_tenant_id_project_id_provider_resource_id_key" ON "connections"("tenant_id", "project_id", "provider", "resource_id");

-- CreateIndex
CREATE INDEX "raw_records_tenant_id_project_id_idx" ON "raw_records"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "raw_records_connection_id_idx" ON "raw_records"("connection_id");

-- CreateIndex
CREATE INDEX "raw_records_retention_until_idx" ON "raw_records"("retention_until");

-- CreateIndex
CREATE UNIQUE INDEX "raw_records_connection_id_external_id_key" ON "raw_records"("connection_id", "external_id");

-- CreateIndex
CREATE INDEX "canonical_tasks_tenant_id_project_id_idx" ON "canonical_tasks"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "canonical_tasks_tenant_id_project_id_status_idx" ON "canonical_tasks"("tenant_id", "project_id", "status");

-- CreateIndex
CREATE INDEX "canonical_tasks_connection_id_idx" ON "canonical_tasks"("connection_id");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_tasks_connection_id_source_sheet_id_source_tab_na_key" ON "canonical_tasks"("connection_id", "source_sheet_id", "source_tab_name", "source_row_index");

-- CreateIndex
CREATE INDEX "canonical_artifacts_tenant_id_project_id_idx" ON "canonical_artifacts"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "canonical_artifacts_tenant_id_project_id_type_category_idx" ON "canonical_artifacts"("tenant_id", "project_id", "type_category");

-- CreateIndex
CREATE INDEX "canonical_artifacts_connection_id_idx" ON "canonical_artifacts"("connection_id");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_artifacts_connection_id_drive_file_id_key" ON "canonical_artifacts"("connection_id", "drive_file_id");

-- CreateIndex
CREATE INDEX "canonical_events_tenant_id_project_id_idx" ON "canonical_events"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "canonical_events_tenant_id_project_id_start_time_idx" ON "canonical_events"("tenant_id", "project_id", "start_time");

-- CreateIndex
CREATE INDEX "canonical_events_connection_id_idx" ON "canonical_events"("connection_id");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_events_connection_id_event_id_key" ON "canonical_events"("connection_id", "event_id");

-- CreateIndex
CREATE INDEX "canonical_milestones_tenant_id_project_id_idx" ON "canonical_milestones"("tenant_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_persons_tenant_id_project_id_canonical_email_key" ON "canonical_persons"("tenant_id", "project_id", "canonical_email");

-- CreateIndex
CREATE INDEX "canonical_links_tenant_id_project_id_idx" ON "canonical_links"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "analysis_signals_tenant_id_project_id_idx" ON "analysis_signals"("tenant_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_signals_tenant_id_project_id_signal_type_key" ON "analysis_signals"("tenant_id", "project_id", "signal_type");

-- CreateIndex
CREATE UNIQUE INDEX "sync_jobs_job_id_key" ON "sync_jobs"("job_id");

-- CreateIndex
CREATE INDEX "sync_jobs_tenant_id_project_id_idx" ON "sync_jobs"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "sync_jobs_connection_id_idx" ON "sync_jobs"("connection_id");

-- CreateIndex
CREATE INDEX "sync_jobs_job_id_idx" ON "sync_jobs"("job_id");

-- AddForeignKey
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_tasks" ADD CONSTRAINT "canonical_tasks_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_tasks" ADD CONSTRAINT "canonical_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "canonical_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_artifacts" ADD CONSTRAINT "canonical_artifacts_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_events" ADD CONSTRAINT "canonical_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_milestones" ADD CONSTRAINT "canonical_milestones_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_links" ADD CONSTRAINT "canonical_links_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
