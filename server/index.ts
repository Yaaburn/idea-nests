// ═══════════════════════════════════════════════
// TalentNet Connector Gateway — Express Server
// Minimal backend for secure project-scoped integrations.
// Handles: OAuth, Sheets API, CSV upload, Bot verification.
// ═══════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import sheetsRoutes from './routes/sheets';
import csvRoutes from './routes/csv';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logging (non-sensitive) ───

app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  // Never log tokens, secrets, or request bodies
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───

app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/csv', csvRoutes);

// ─── Health Check ───

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'talentnet-connector-gateway',
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handler ───

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Lỗi hệ thống. Vui lòng thử lại.',
  });
});

// ─── Start ───

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  TalentNet Connector Gateway             ║`);
  console.log(`  ║  Port: ${PORT}                              ║`);
  console.log(`  ║  Mode: ${process.env.NODE_ENV || 'development'}                    ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});

export default app;
