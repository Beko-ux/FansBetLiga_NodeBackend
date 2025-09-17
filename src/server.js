// // src/server.js
// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import dotenv from 'dotenv';
// import router from './routes/index.js';
// import { start as startMatchPoller, stop as stopMatchPoller } from './services/match-poller.js';

// dotenv.config();

// const app = express();

// // CORS explicite (gère aussi les pré-requêtes OPTIONS)
// const corsOrigins =
//   (process.env.CORS_ORIGIN || '')
//     .split(',')
//     .map(s => s.trim())
//     .filter(Boolean);

// app.use(cors({
//   origin: corsOrigins.length
//     ? corsOrigins
//     : ['https://fansbetliga.com', 'https://www.fansbetliga.com', /^(http|https):\/\/localhost(:\d+)?$/],
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   maxAge: 86400,
// }));

// app.options('*', cors()); // important pour les préflight

// app.use(express.json());
// app.use(morgan('dev'));

// // Routes API
// app.use('/api', router);

// // Healthchecks
// app.get('/health', (_req, res) => res.json({ ok: true }));
// app.get('/', (_req, res) => {
//   res.json({ message: 'Prediction App API is running' });
// });

// // 404
// app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// // Handler d’erreurs
// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
// });

// const port = process.env.PORT || 3000;
// const server = app.listen(port, () => {
//   console.log(`API listening on http://localhost:${port}`);

//   if (process.env.MATCH_POLL_ENABLED !== '0') {
//     try {
//       startMatchPoller();
//     } catch (e) {
//       console.error('Failed to start match poller:', e?.message || e);
//     }
//   } else {
//     console.log('Match poller disabled by env (MATCH_POLL_ENABLED=0)');
//   }
// });

// // Arrêt propre
// const shutdown = async () => {
//   console.log('Shutting down...');
//   try { stopMatchPoller(); } catch {}
//   server.close(() => process.exit(0));
// };
// process.on('SIGINT', shutdown);
// process.on('SIGTERM', shutdown);

// export default app;













// src/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { start as startMatchPoller, stop as stopMatchPoller } from './services/match-poller.js';

dotenv.config();

const app = express();

// CORS explicite (gère aussi les pré-requêtes OPTIONS)
const corsOrigins =
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

// Options CORS partagées (use + preflight)
const corsOptions = {
  origin: corsOrigins.length
    ? corsOrigins
    : ['https://fansbetliga.com', 'https://www.fansbetliga.com', /^(http|https):\/\/localhost(:\d+)?$/],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // mêmes règles pour les préflights

app.use(express.json());
app.use(morgan('dev'));

// ---- Version endpoint (utilisé par le front pour cache-bust/force logout) ----
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

// Routes API
app.use('/api', router);

// Healthchecks
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => {
  res.json({ message: 'Prediction App API is running' });
});

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
