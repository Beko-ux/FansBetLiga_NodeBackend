// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import dotenv from 'dotenv';
// import router from './routes/index.js';
// // Si tu as un client Prisma exporté, décommente :
// // import prisma from './prisma.js';

// dotenv.config();

// const app = express();

// // CORS: autorise uniquement l'origine définie (fallback: *)
// app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// // Body parser (JSON)
// app.use(express.json());

// // Logs
// app.use(morgan('dev'));

// // Routes API
// app.use('/api', router);

// // Healthchecks
// app.get('/health', (_req, res) => res.json({ ok: true }));
// app.get('/', (_req, res) => {
//   res.json({ message: 'Prediction App API is running' });
// });

// // 404
// app.use((req, res, _next) => {
//   res.status(404).json({ error: 'Not Found' });
// });

// // Handler d’erreurs
// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
// });

// const port = process.env.PORT || 3000;
// const server = app.listen(port, () => {
//   console.log(`API listening on http://localhost:${port}`);
// });

// // Arrêt propre
// const shutdown = async () => {
//   console.log('Shutting down...');
//   server.close(async () => {
//     try {
//       // Si tu utilises Prisma:
//       // if (prisma?.$disconnect) await prisma.$disconnect();
//     } finally {
//       process.exit(0);
//     }
//   });
// };
// process.on('SIGINT', shutdown);
// process.on('SIGTERM', shutdown);

// // (facultatif pour tests)
// export default app;



// src/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

// Autorise l’origine de ton front (fallback: *)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.use(express.json());
app.use(morgan('dev'));

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
});

// Arrêt propre
const shutdown = async () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
