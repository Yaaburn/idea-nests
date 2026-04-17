// ═══════════════════════════════════════════════
// TalentNet Connector Gateway — Express Server
// Minimal backend for secure project-scoped integrations.
// Handles: OAuth, Sheets API, CSV upload, Bot verification.
// ═══════════════════════════════════════════════

import 'dotenv/config'; // Load .env before anything else
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import sheetsRoutes from './routes/sheets';
import csvRoutes from './routes/csv';
import integrationRoutes from './routes/integration.routes';
import snapshotRoutes from './routes/snapshot.routes';
import { startAutoSyncCron } from './cron/autoSync.cron';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentnet';

// ─── Middleware ───

// Security headers (hardened)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:8080')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting (in-memory, no external deps) ───
const rateLimitWindow = 60_000; // 1 minute
const rateLimitMax = 120;       // max requests per window per IP
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + rateLimitWindow });
    return next();
  }

  entry.count++;
  if (entry.count > rateLimitMax) {
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'RATE_LIMITED', message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
  }

  next();
});

// Periodic cleanup of rate limit store (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}, 300_000);

app.use(express.json({ limit: '10mb' }));
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
app.use('/api/integrations', integrationRoutes);
app.use('/api/snapshots', snapshotRoutes);

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

// ─── MongoDB + Start ───

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[MongoDB] Connected: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err instanceof Error ? err.message : err);
    console.warn('[MongoDB] Server will start without database. Bot features will be unavailable.');
  }

  // Start cronjob for auto-sync
  startAutoSyncCron();

  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║  TalentNet Connector Gateway             ║`);
    console.log(`  ║  Port: ${PORT}                              ║`);
    console.log(`  ║  Mode: ${process.env.NODE_ENV || 'development'}                    ║`);
    console.log(`  ║  MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected ✓' : 'Disconnected ✗'}              ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);
  });
}

start();

export default app;
