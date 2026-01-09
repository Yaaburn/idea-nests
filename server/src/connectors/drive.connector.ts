import { Provider, ArtifactCategory } from "@prisma/client";
import { addDays } from "date-fns";
import type {
  IConnector,
  AuthContext,
  ValidationResult,
  ResourceMetadata,
  IngestParams,
  IngestResult,
  DeltaSyncParams,
  DeltaSyncResult,
  HealthStatus,
  DriveCursor,
  IngestError,
} from "./interface.js";
import { createDriveClient } from "./google-client.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { config } from "../config/index.js";

/**
 * DriveConnector - Ingests file metadata from Google Drive folders
 * Uses share-to-bot authentication (service account)
 */
export class DriveConnector implements IConnector {
  readonly provider = Provider.GOOGLE_DRIVE;
  readonly displayName = "Google Drive";
  readonly requiredScopes = ["https://www.googleapis.com/auth/drive.readonly"];

  async validateAccess(
    resourceId: string,
    _authContext: AuthContext
  ): Promise<ValidationResult> {
    try {
      const drive = createDriveClient();
      const response = await drive.files.get({
        fileId: resourceId,
        fields: "id,name,mimeType",
      });

      return {
        isValid: true,
        resourceName: response.data.name ?? "Untitled",
      };
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 403) {
        return {
          isValid: false,
          errorMessage:
            "Access denied. Please share the folder/file with our service account.",
        };
      }
      if (err.code === 404) {
        return {
          isValid: false,
          errorMessage: "File or folder not found. Please check the URL.",
        };
      }
      return {
        isValid: false,
        errorMessage: err.message ?? "Unknown error validating access",
      };
    }
  }

  async getResourceMetadata(
    resourceId: string,
    _authContext: AuthContext
  ): Promise<ResourceMetadata> {
    const drive = createDriveClient();

    // Get folder/file info
    const fileInfo = await drive.files.get({
      fileId: resourceId,
      fields: "id,name,mimeType,modifiedTime",
    });

    // If folder, count files inside
    let itemCount = 0;
    if (fileInfo.data.mimeType === "application/vnd.google-apps.folder") {
      const list = await drive.files.list({
        q: `'${resourceId}' in parents and trashed = false`,
        fields: "files(id)",
        pageSize: 100,
      });
      itemCount = list.data.files?.length ?? 0;
    } else {
      itemCount = 1;
    }

    return {
      name: fileInfo.data.name ?? "Untitled",
      itemCount,
      lastModified: fileInfo.data.modifiedTime
        ? new Date(fileInfo.data.modifiedTime)
        : undefined,
      additionalInfo: {
        mimeType: fileInfo.data.mimeType,
        isFolder:
          fileInfo.data.mimeType === "application/vnd.google-apps.folder",
      },
    };
  }

  async ingest(params: IngestParams): Promise<IngestResult> {
    const { tenantId, projectId, connectionId, resourceId, onProgress } =
      params;
    const drive = createDriveClient();
    const errors: IngestError[] = [];
    let recordsIngested = 0;

    try {
      const retentionUntil = addDays(
        new Date(),
        config.RAW_RECORD_RETENTION_DAYS
      );

      // Get initial page token for future delta syncs
      const startPageTokenResponse = await drive.changes.getStartPageToken({});
      const startPageToken = startPageTokenResponse.data.startPageToken ?? "";

      // Check if this is a folder or single file
      const fileInfo = await drive.files.get({
        fileId: resourceId,
        fields: "mimeType",
      });

      const isFolder =
        fileInfo.data.mimeType === "application/vnd.google-apps.folder";
      const filesToProcess: string[] = [];

      if (isFolder) {
        // List all files in folder (paginated)
        let pageToken: string | undefined;
        do {
          const response = await drive.files.list({
            q: `'${resourceId}' in parents and trashed = false`,
            fields:
              "nextPageToken, files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,thumbnailLink,lastModifyingUser)",
            pageSize: 100,
            pageToken,
          });

          for (const file of response.data.files ?? []) {
            if (file.id) filesToProcess.push(file.id);
          }

          pageToken = response.data.nextPageToken ?? undefined;
        } while (pageToken);
      } else {
        filesToProcess.push(resourceId);
      }

      onProgress?.(10, 100, "fetching_files");

      // Process each file
      for (let i = 0; i < filesToProcess.length; i++) {
        const fileId = filesToProcess[i];

        try {
          const fileData = await drive.files.get({
            fileId,
            fields:
              "id,name,mimeType,size,modifiedTime,createdTime,webViewLink,thumbnailLink,lastModifyingUser,trashed",
          });

          const file = fileData.data;
          const externalId = file.id!;
          const lineageString = `drive:${resourceId}:file:${
            file.id
          }:${new Date().toISOString()}`;

          // Store raw record
          await prisma.rawRecord.upsert({
            where: { connectionId_externalId: { connectionId, externalId } },
            create: {
              tenantId,
              projectId,
              connectionId,
              externalId,
              data: file as any, 
              checksum: file.modifiedTime ?? "",
              lineageString,
              retentionUntil,
            },
            update: {
              data: file as any, 
              checksum: file.modifiedTime ?? "",
              lineageString,
              retentionUntil,
              fetchedAt: new Date(),
            },
          });

          // Create canonical artifact
          await prisma.canonicalArtifact.upsert({
            where: {
              connectionId_driveFileId: { connectionId, driveFileId: file.id! },
            },
            create: {
              tenantId,
              projectId,
              connectionId,
              driveFileId: file.id!,
              name: file.name ?? "Untitled",
              mimeType: file.mimeType ?? "application/octet-stream",
              typeCategory: this.categorizeFile(file.mimeType ?? ""),
              webViewLink: file.webViewLink ?? null,
              thumbnailLink: file.thumbnailLink ?? null,
              sizeBytes: BigInt(file.size ?? 0),
              createdTime: file.createdTime
                ? new Date(file.createdTime)
                : new Date(),
              modifiedTime: file.modifiedTime
                ? new Date(file.modifiedTime)
                : new Date(),
              modifiedBy: file.lastModifyingUser?.emailAddress ?? null,
              trashed: file.trashed ?? false,
            },
            update: {
              name: file.name ?? "Untitled",
              mimeType: file.mimeType ?? "application/octet-stream",
              typeCategory: this.categorizeFile(file.mimeType ?? ""),
              webViewLink: file.webViewLink ?? null,
              thumbnailLink: file.thumbnailLink ?? null,
              sizeBytes: BigInt(file.size ?? 0),
              modifiedTime: file.modifiedTime
                ? new Date(file.modifiedTime)
                : new Date(),
              modifiedBy: file.lastModifyingUser?.emailAddress ?? null,
              trashed: file.trashed ?? false,
              syncedAt: new Date(),
            },
          });

          recordsIngested++;
        } catch (err) {
          errors.push({
            externalId: fileId,
            message: err instanceof Error ? err.message : "Unknown error",
            recoverable: true,
          });
        }

        onProgress?.(
          10 + Math.floor((i / filesToProcess.length) * 90),
          100,
          "processing_files"
        );
      }

      const cursor: DriveCursor = {
        type: "drive",
        startPageToken,
      };

      onProgress?.(100, 100, "complete");

      return {
        success: errors.length === 0,
        recordsIngested,
        errors,
        cursor,
      };
    } catch (error) {
      logger.error({ error, resourceId }, "Drive ingestion failed");
      throw error;
    }
  }

  async deltaSync(params: DeltaSyncParams): Promise<DeltaSyncResult> {
    const {
      tenantId,
      projectId,
      connectionId,
      resourceId,
      cursor,
      onProgress,
    } = params;
    const driveCursor = cursor as DriveCursor;
    const drive = createDriveClient();
    const errors: IngestError[] = [];
    let recordsUpdated = 0;
    let recordsDeleted = 0;

    try {
      const retentionUntil = addDays(
        new Date(),
        config.RAW_RECORD_RETENTION_DAYS
      );

      // Get changes since last sync
      let pageToken: string | undefined = driveCursor.startPageToken;
      let newStartPageToken: string | undefined;

      do {

        const changesResponse: any = await drive.changes.list({
          pageToken,
          fields:
            "newStartPageToken, nextPageToken, changes(fileId,file,removed,time)",
        });

        newStartPageToken = changesResponse.data.newStartPageToken ?? undefined;

        for (const change of changesResponse.data.changes ?? []) {
          const fileId = change.fileId;
          if (!fileId) continue;

          try {
            if (change.removed || change.file?.trashed) {
              // File was deleted or trashed
              await prisma.canonicalArtifact.updateMany({
                where: { connectionId, driveFileId: fileId },
                data: { trashed: true, syncedAt: new Date() },
              });
              recordsDeleted++;
            } else if (change.file) {
              // File was added or modified
              const file = change.file;
              const externalId = file.id!;
              const lineageString = `drive:${resourceId}:file:${
                file.id
              }:${new Date().toISOString()}`;

              await prisma.rawRecord.upsert({
                where: {
                  connectionId_externalId: { connectionId, externalId },
                },
                create: {
                  tenantId,
                  projectId,
                  connectionId,
                  externalId,
                  data: file,
                  checksum: file.modifiedTime ?? "",
                  lineageString,
                  retentionUntil,
                },
                update: {
                  data: file,
                  checksum: file.modifiedTime ?? "",
                  lineageString,
                  retentionUntil,
                  fetchedAt: new Date(),
                },
              });

              await prisma.canonicalArtifact.upsert({
                where: {
                  connectionId_driveFileId: {
                    connectionId,
                    driveFileId: file.id!,
                  },
                },
                create: {
                  tenantId,
                  projectId,
                  connectionId,
                  driveFileId: file.id!,
                  name: file.name ?? "Untitled",
                  mimeType: file.mimeType ?? "application/octet-stream",
                  typeCategory: this.categorizeFile(file.mimeType ?? ""),
                  webViewLink: file.webViewLink ?? null,
                  thumbnailLink: file.thumbnailLink ?? null,
                  sizeBytes: BigInt(file.size ?? 0),
                  createdTime: file.createdTime
                    ? new Date(file.createdTime)
                    : new Date(),
                  modifiedTime: file.modifiedTime
                    ? new Date(file.modifiedTime)
                    : new Date(),
                  modifiedBy: file.lastModifyingUser?.emailAddress ?? null,
                  trashed: false,
                },
                update: {
                  name: file.name ?? "Untitled",
                  modifiedTime: file.modifiedTime
                    ? new Date(file.modifiedTime)
                    : new Date(),
                  modifiedBy: file.lastModifyingUser?.emailAddress ?? null,
                  trashed: false,
                  syncedAt: new Date(),
                },
              });

              recordsUpdated++;
            }
          } catch (err) {
            errors.push({
              externalId: fileId,
              message: err instanceof Error ? err.message : "Unknown error",
              recoverable: true,
            });
          }
        }

        pageToken = changesResponse.data.nextPageToken ?? undefined;
      } while (pageToken);

      const newCursor: DriveCursor = {
        type: "drive",
        startPageToken: newStartPageToken ?? driveCursor.startPageToken,
        lastChangeToken: newStartPageToken,
      };

      onProgress?.(100, 100, "complete");

      return {
        success: true,
        recordsIngested: 0,
        recordsUpdated,
        recordsDeleted,
        errors,
        cursor: newCursor,
      };
    } catch (error) {
      logger.error({ error, resourceId }, "Drive delta sync failed");
      throw error;
    }
  }

  async healthCheck(
    resourceId: string,
    _authContext: AuthContext
  ): Promise<HealthStatus> {
    const result = await this.validateAccess(resourceId, _authContext);
    return {
      status: result.isValid ? "ACTIVE" : "ERROR",
      message: result.errorMessage,
      lastChecked: new Date(),
    };
  }

  private categorizeFile(mimeType: string): ArtifactCategory {
    if (mimeType.includes("document") || mimeType.includes("text")) {
      return "DOCUMENT";
    }
    if (mimeType.includes("spreadsheet")) {
      return "SPREADSHEET";
    }
    if (mimeType.includes("presentation")) {
      return "PRESENTATION";
    }
    if (mimeType.includes("image")) {
      return "IMAGE";
    }
    if (mimeType.includes("video")) {
      return "VIDEO";
    }
    if (mimeType.includes("pdf")) {
      return "PDF";
    }
    return "OTHER";
  }
}
