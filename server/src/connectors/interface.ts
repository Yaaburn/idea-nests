import { Provider, AuthType, ConnectionStatus } from '@prisma/client';

/**
 * IConnector - Standard interface for all data source connectors
 * Implements the Connector Layer from the architecture spec
 */
export interface IConnector {
    readonly provider: Provider;
    readonly displayName: string;
    readonly requiredScopes: string[];

    /**
     * Validate that we can access the resource
     * For share-to-bot: checks service account access
     * For OAuth: validates tokens
     */
    validateAccess(resourceId: string, authContext: AuthContext): Promise<ValidationResult>;

    /**
     * Fetch metadata about the resource (name, size, etc.)
     */
    getResourceMetadata(resourceId: string, authContext: AuthContext): Promise<ResourceMetadata>;

    /**
     * Perform initial full ingestion
     */
    ingest(params: IngestParams): Promise<IngestResult>;

    /**
     * Perform delta sync using saved cursor
     */
    deltaSync(params: DeltaSyncParams): Promise<DeltaSyncResult>;

    /**
     * Health check for the connection
     */
    healthCheck(resourceId: string, authContext: AuthContext): Promise<HealthStatus>;
}

export interface AuthContext {
    authType: AuthType;
    encryptedTokens?: string; // For OAuth connections
}

export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
    resourceName?: string;
}

export interface ResourceMetadata {
    name: string;
    itemCount?: number;
    lastModified?: Date;
    additionalInfo?: Record<string, unknown>;
}

export interface IngestParams {
    tenantId: string;
    projectId: string;
    connectionId: string;
    resourceId: string;
    authContext: AuthContext;
    onProgress?: (processed: number, total: number, phase: string) => void;
}

export interface IngestResult {
    success: boolean;
    recordsIngested: number;
    errors: IngestError[];
    cursor?: CursorState;
}

export interface IngestError {
    externalId: string;
    message: string;
    recoverable: boolean;
}

export interface DeltaSyncParams extends IngestParams {
    cursor: CursorState;
}

export interface DeltaSyncResult extends IngestResult {
    recordsUpdated: number;
    recordsDeleted: number;
}

/**
 * Provider-specific cursor states
 */
export type CursorState =
    | DriveCursor
    | CalendarCursor
    | SheetsCursor;

export interface DriveCursor {
    type: 'drive';
    startPageToken: string;
    lastChangeToken?: string;
}

export interface CalendarCursor {
    type: 'calendar';
    syncToken: string;
}

export interface SheetsCursor {
    type: 'sheets';
    driveChangeToken?: string;
    checksumVersion: string;
    tabChecksums: Record<string, string>; // tabName -> checksum
}

export interface HealthStatus {
    status: ConnectionStatus;
    message?: string;
    lastChecked: Date;
}
