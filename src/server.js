// src/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { start as startMatchPoller, stop as stopMatchPoller } from './services/match-poller.js';

dotenv.config();

const app = express();

/**
 * ----- CORS -----
 * - Whitelist via env: CORS_ORIGIN="https://fansbetliga.com,https://www.fansbetliga.com"
 * - Par défaut : domaines prod + localhost
 * - NE PAS définir allowedHeaders : cors reflète automatiquement les headers demandés
 */
const rawOrigins = process.env.CORS_ORIGIN || '';
const corsOrigins = rawOrigins
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  'https://fansbetliga.com',
  'https://www.fansbetliga.com',
  /^(https?:\/\/localhost(:\d+)?)$/ // autorise localhost:*
];

const whitelist = corsOrigins.length ? corsOrigins : defaultOrigins;

const corsOptions = {
  origin(origin, cb) {
    // Autoriser les clients sans header Origin (curl, cron, healthchecks…)
    if (!origin) return cb(null, true);
    const ok = whitelist.some(o => (o instanceof RegExp ? o.test(origin) : o === origin));
    return cb(null, ok);
  },
  methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
  maxAge: 86400,
};

// Vary pour que les caches tiennent compte de CORS
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  next();
});

// CORS global + préflights
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // répond 204 avec les bons headers

// ----- middlewares classiques -----
app.use(express.json());
app.use(morgan('dev'));

// ----- Version endpoint -----
app.get('/api/version', (_req, res) => {
  const buildId =
    process.env.BUILD_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.HEROKU_SLUG_COMMIT ||
    process.env.GIT_COMMIT ||
    'dev';
  res.setHeader('Cache-Control', 'no-store');
  res.json({ buildId });
});

// ----- API -----
app.use('/api', router);

// Healthchecks
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ message: 'Prediction App API is running' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Handler d’erreurs
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);

  if (process.env.MATCH_POLL_ENABLED !== '0') {
    try {
      startMatchPoller();
    } catch (e) {
      console.error('Failed to start match poller:', e?.message || e);
    }
  } else {
    console.log('Match poller disabled by env (MATCH_POLL_ENABLED=0)');
  }
});

// Arrêt propre
const shutdown = async () => {
  console.log('Shutting down...');
  try { stopMatchPoller(); } catch {}
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
