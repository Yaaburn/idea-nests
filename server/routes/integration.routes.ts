// ═══════════════════════════════════════════════
// Integration Routes — Bot TalentNet API Endpoints
// Maps HTTP methods to controller handlers.
// ═══════════════════════════════════════════════

import { Router } from 'express';
import {
  connect,
  updateSettings,
  manualSync,
  disconnect,
  getStatus,
} from '../controllers/integration.controller';

const router = Router();

// POST /api/integrations/bot/connect
// Connect a Google Sheet to a project
router.post('/bot/connect', connect);

// PUT /api/integrations/bot/settings/:id
// Update sync mode and interval
router.put('/bot/settings/:id', updateSettings);

// POST /api/integrations/bot/sync/:id
// Manually trigger data sync
router.post('/bot/sync/:id', manualSync);

// DELETE /api/integrations/bot/:id
// Disconnect and clean up all data
router.delete('/bot/:id', disconnect);

// GET /api/integrations/bot/status/:projectId
// Get integration status for a project
router.get('/bot/status/:projectId', getStatus);

export default router;
