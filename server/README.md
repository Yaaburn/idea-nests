# TalentNet Library Backend (V1)

Backend service for the TalentNet Library - ingests, normalizes, and analyzes data from Google Workspace integrations.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Setup

```bash
# Install dependencies
cd server
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Architecture

```
server/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config/            # Environment configuration
│   ├── lib/               # Shared utilities (prisma, redis, secrets, logger)
│   ├── connectors/        # Google API connectors (Sheets, Drive, Calendar)
│   ├── jobs/              # BullMQ job queues and workers
│   ├── services/          # Business logic (AnalysisService)
│   ├── routes/            # Fastify API routes
│   └── index.ts           # Server entry point
```

## API Endpoints

### Connections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/library/connections` | List all connections for a project |
| POST | `/library/connections/sheets` | Connect a Google Sheet (share-to-bot) |
| POST | `/library/connections/drive` | Connect a Drive folder/file (share-to-bot) |
| POST | `/library/connections/calendar` | Connect Calendar (OAuth) |
| GET | `/library/oauth/calendar/url` | Get OAuth URL for Calendar |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/library/sync/:connectionId` | Trigger manual sync |
| GET | `/library/sync-status` | Get sync job status |

### Canonical Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/library/canonical/tasks` | List canonical tasks |
| GET | `/library/canonical/artifacts` | List canonical artifacts |
| GET | `/library/canonical/events` | List canonical events |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/library/analysis` | Get analysis signals |

## Connecting Data Sources

### Google Sheets (Share-to-Bot)

1. Get service account email: `GET /library/service-account`
2. Share your spreadsheet with that email (Viewer access)
3. Connect: `POST /library/connections/sheets` with spreadsheet URL

### Google Drive (Share-to-Bot)

1. Get service account email: `GET /library/service-account`
2. Share folder/file with that email (Viewer access)
3. Connect: `POST /library/connections/drive` with Drive URL

### Google Calendar (OAuth)

1. Get OAuth URL: `GET /library/oauth/calendar/url`
2. User completes OAuth flow
3. Exchange code: `POST /library/connections/calendar` with auth code

## Frontend Integration

Replace mock data in UI components with these hooks:

```typescript
// src/hooks/library/useLibraryConnections.ts
export function useLibraryConnections(tenantId: string, projectId: string) {
  return useQuery({
    queryKey: ['library', 'connections', tenantId, projectId],
    queryFn: () => fetch(`/library/connections?tenantId=${tenantId}&projectId=${projectId}`)
      .then(r => r.json()),
  });
}

// src/hooks/library/useProjectAnalysis.ts
export function useProjectAnalysis(tenantId: string, projectId: string) {
  return useQuery({
    queryKey: ['library', 'analysis', tenantId, projectId],
    queryFn: () => fetch(`/library/analysis?tenantId=${tenantId}&projectId=${projectId}`)
      .then(r => r.json()),
  });
}
```

## Security

- **Tenant Isolation**: All queries filter by `tenant_id` + `project_id`
- **Token Storage**: OAuth tokens encrypted with AES-256-GCM
- **No Token Exposure**: Tokens never sent to frontend
- **Rate Limiting**: 100 requests/minute per IP

## Coming Soon (V2)

- GitHub connector
- Notion connector
- Trello connector
- Slack connector
- Real-time sync via webhooks
- Vector embeddings for semantic search
