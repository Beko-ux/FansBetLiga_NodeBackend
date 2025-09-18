// // src/server.js
// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import dotenv from 'dotenv';
// import router from './routes/index.js';
// import { start as startMatchPoller, stop as stopMatchPoller } from './services/match-poller.js';

// dotenv.config();

// const app = express();

// // ----- CORS -----
// const corsOrigins =
//   (process.env.CORS_ORIGIN || '')
//     .split(',')
//     .map(s => s.trim())
//     .filter(Boolean);

// // Par défaut : domaines prod + localhost (dev)
// const defaultOrigins = [
//   'https://fansbetliga.com',
//   'https://www.fansbetliga.com',
//   /^(http|https):\/\/localhost(:\d+)?$/ // autorise localhost:*, utile Expo/web
// ];

// const corsOptions = {
//   origin: corsOrigins.length ? corsOrigins : defaultOrigins,
//   methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization','Accept','X-Requested-With'],
//   maxAge: 86400,
// };

// // Pose Vary pour que le cache tienne compte de l'Origin
// app.use((req, res, next) => {
//   res.setHeader('Vary', 'Origin');
//   next();
// });

// app.use(cors(corsOptions));

// // Preflight explicite (Authorization, etc.)
// app.options('*', cors(corsOptions), (req, res) => res.sendStatus(204));

// // ----- middlewares classiques -----
// app.use(express.json());
// app.use(morgan('dev'));

// // ----- Version endpoint (cache-bust / forcer logout front) -----
// app.get('/api/version', (_req, res) => {
//   const buildId =
//     process.env.BUILD_ID ||
//     process.env.VERCEL_GIT_COMMIT_SHA ||
//     process.env.HEROKU_SLUG_COMMIT ||
//     process.env.GIT_COMMIT ||
//     'dev';
//   res.setHeader('Cache-Control', 'no-store');
//   res.json({ buildId });
// });

// // ----- API -----
// app.use('/api', router);

// // Healthchecks
// app.get('/health', (_req, res) => res.json({ ok: true }));
// app.get('/', (_req, res) => res.json({ message: 'Prediction App API is running' }));

// // 404
// app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// // Handler d’erreurs
// app.use((err, _req, res, _next) => {
//   console.error(err);
//   // L'entête CORS est déjà posé par le middleware cors sur la requête
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

// ----- CORS -----
const corsOptions = {
  origin: corsOrigins.length ? corsOrigins : defaultOrigins,
  methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
  // allowedHeaders:  <-- SUPPRIMER cette ligne pour laisser cors refléter
  maxAge: 86400, // (debug: tu peux mettre 60 le temps des tests)
};

// Vary pour caches/CDN
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  next();
});

// Ne pas commenter ces deux lignes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 204 sur les préflights


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
    try { startMatchPoller(); } catch (e) {
      console.error('Failed to start match poller:', e?.message || e);
    }
  } else {
    console.log('Match poller disabled by env (MATCH_POLL_ENABLED=0)');
  }
});

const shutdown = async () => {
  console.log('Shutting down...');
  try { stopMatchPoller(); } catch {}
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
