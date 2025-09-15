// // src/routes/matches.routes.js
// import { Router } from 'express';
// import { getMatchday, getFinishedIndex } from '../services/footballData.service.js';

// const r = Router();

// // Exemples valides :
// //   /api/matches?league=PL&season=2025&matchday=1
// //   /api/matches?league=BL1&season=2025&matchday=1
// //   /api/matches?league=premier&season=2025&matchday=1
// //   /api/matches?league=bundes&season=2025&matchday=1
// r.get('/', async (req, res, next) => {
//   try {
//     const { league = 'laliga', season = 2025, matchday = 1 } = req.query;
//     const data = await getMatchday({ league, season: Number(season), matchday: Number(matchday) });
//     res.json(data);
//   } catch (e) { next(e); }
// });

// r.get('/finished-index', async (req, res, next) => {
//   try {
//     const { league = 'laliga', season = 2025 } = req.query;
//     const idx = getFinishedIndex({ league, season: Number(season) });
//     res.json(idx);
//   } catch (e) { next(e); }
// });

// r.get('/current', async (req, res, next) => {
//   try {
//     const { league = 'laliga', season = 2025 } = req.query;
//     const idx = getFinishedIndex({ league, season: Number(season) });
//     res.json({ league: idx.league, season: idx.season, currentMatchday: idx.currentMatchday || 1 });
//   } catch (e) { next(e); }
// });

// export default r;













// // src/routes/matches.routes.js
// import { Router } from 'express';
// import { getMatchday, getFinishedIndex } from '../services/footballData.service.js';
// import { readSnapshot, readSnapshotIndex } from '../services/match-poller.js';
// import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

// const r = Router();

// function toLeagueCode(input) {
//   const m = mapLeagueToFootballData(input);
//   if (m?.code) return m.code;          // ex: 'PL', 'BL1', 'PD', 'SA', 'FL1'
//   return String(input || 'PD').toUpperCase();
// }

// // ---- Meta ligues (labels + max journées) ----
// const LEAGUE_LABELS = {
//   PL: 'Premier League',
//   BL1: 'Bundesliga',
//   PD: 'La Liga',
//   SA: 'Serie A',
//   FL1: 'Ligue 1',
// };

// const LEAGUE_MAX_MD = {
//   PL: 38,
//   BL1: 34,
//   PD: 38,
//   SA: 38,
//   FL1: 34,
// };

// // Exemples valides :
// //   /api/matches?league=PL&season=2025&matchday=1
// //   /api/matches?league=BL1&season=2025&matchday=1
// //   /api/matches?league=premier&season=2025&matchday=1
// //   /api/matches?league=bundes&season=2025&matchday=1
// r.get('/', async (req, res, next) => {
//   try {
//     const { league = 'laliga', season = 2025, matchday = 1 } = req.query;
//     const data = await getMatchday({ league, season: Number(season), matchday: Number(matchday) });
//     res.json(data);
//   } catch (e) { next(e); }
// });

// r.get('/finished-index', async (req, res, next) => {
//   try {
//     const { league = 'laliga', season = 2025 } = req.query;
//     const idx = getFinishedIndex({ league, season: Number(season) });
//     res.json(idx);
//   } catch (e) { next(e); }
// });

// r.get('/current', async (req, res, next) => {
//   try {
//     const { league = 'laliga', season = 2025 } = req.query;
//     const idx = getFinishedIndex({ league, season: Number(season) });
//     res.json({ league: idx.league, season: idx.season, currentMatchday: idx.currentMatchday || 1 });
//   } catch (e) { next(e); }
// });

// /**
//  * Snapshot trié (finished/live/upcoming) pour une MD
//  * Lit un fichier local généré par le poller, sans appeler l'API externe.
//  * Exemple :
//  *   GET /api/matches/snapshot?league=PD&season=2025&matchday=2
//  */
// r.get('/snapshot', async (req, res, next) => {
//   try {
//     const season   = Number(req.query.season || process.env.DEFAULT_SEASON || new Date().getFullYear());
//     const league   = toLeagueCode(req.query.league || 'PD');
//     const matchday = Number(req.query.matchday || 1);

//     const data = readSnapshot({ season, league, matchday });
//     if (!data) return res.status(404).json({ message: 'Snapshot not found' });
//     res.json(data);
//   } catch (e) { next(e); }
// });

// /**
//  * Index des snapshots disponibles pour la saison
//  * Exemple :
//  *   GET /api/matches/snapshot/index?season=2025
//  */
// r.get('/snapshot/index', async (req, res, next) => {
//   try {
//     const season = Number(req.query.season || process.env.DEFAULT_SEASON || new Date().getFullYear());
//     res.json(readSnapshotIndex({ season }));
//   } catch (e) { next(e); }
// });

// /**
//  * NEW — Nombre de journées max par ligue.
//  *
//  * - Sans paramètre  -> renvoie la map complète { PL: 38, BL1: 34, ... }
//  * - Avec ?league=PD -> renvoie { league: 'PD', label: 'La Liga', maxMatchdays: 38 }
//  *
//  * Exemples:
//  *   GET /api/matches/max-matchdays
//  *   GET /api/matches/max-matchdays?league=FL1
//  *   GET /api/matches/max-matchdays?league=bundesliga
//  */
// r.get('/max-matchdays', (req, res) => {
//   const q = req.query.league;
//   if (!q) {
//     return res.json({ maxMatchdays: LEAGUE_MAX_MD });
//   }
//   const code = toLeagueCode(q);
//   const max = LEAGUE_MAX_MD[code];
//   if (!max) return res.status(400).json({ message: 'Unknown league' });
//   return res.json({ league: code, label: LEAGUE_LABELS[code] || code, maxMatchdays: max });
// });

// /**
//  * NEW — Liste des ligues supportées avec label + max journées (pratique pour le front).
//  *   GET /api/matches/leagues
//  */
// r.get('/leagues', (_req, res) => {
//   const out = Object.keys(LEAGUE_MAX_MD).map(code => ({
//     code,
//     label: LEAGUE_LABELS[code] || code,
//     maxMatchdays: LEAGUE_MAX_MD[code],
//   }));
//   res.json({ leagues: out });
// });

// export default r;









// src/routes/matches.routes.js
import { Router } from 'express';
import { getMatchday, getFinishedIndex } from '../services/footballData.service.js';
import { readSnapshot, readSnapshotIndex } from '../services/match-poller.js';
import { mapLeagueToFootballData } from '../utils/footballdata-map.js';
import fs from 'fs';
import path from 'path';
import { MAX_MD_BY_LEAGUE } from '../services/match-poller.js';

const r = Router();

function toLeagueCode(input) {
  const m = mapLeagueToFootballData(input);
  if (m?.code) return m.code;          // ex: 'PL', 'BL1', 'PD', 'SA', 'FL1'
  return String(input || 'PD').toUpperCase();
}

// --- routes "live" (gardées pour compat) ---
r.get('/', async (req, res, next) => {
  try {
    const { league = 'laliga', season = 2025, matchday = 1 } = req.query;
    const data = await getMatchday({ league, season: Number(season), matchday: Number(matchday) });
    res.json(data);
  } catch (e) { next(e); }
});

r.get('/finished-index', async (req, res, next) => {
  try {
    const { league = 'laliga', season = 2025 } = req.query;
    const idx = getFinishedIndex({ league, season: Number(season) });
    res.json(idx);
  } catch (e) { next(e); }
});

r.get('/current', async (req, res, next) => {
  try {
    const { league = 'laliga', season = 2025 } = req.query;
    const idx = getFinishedIndex({ league, season: Number(season) });
    res.json({ league: idx.league, season: idx.season, currentMatchday: idx.currentMatchday || 1 });
  } catch (e) { next(e); }
});

// --- snapshots par matchday (JSON locaux, aucune requête externe) ---
r.get('/snapshot', async (req, res, next) => {
  try {
    const season   = Number(req.query.season || process.env.DEFAULT_SEASON || new Date().getFullYear());
    const league   = toLeagueCode(req.query.league || 'PD');
    const matchday = Number(req.query.matchday || 1);

    const data = readSnapshot({ season, league, matchday });
    if (!data) return res.status(404).json({ message: 'Snapshot not found' });
    res.json(data);
  } catch (e) { next(e); }
});

// index de tout ce qui existe déjà sur disque
r.get('/snapshot/index', async (req, res, next) => {
  try {
    const season = Number(req.query.season || process.env.DEFAULT_SEASON || new Date().getFullYear());
    res.json(readSnapshotIndex({ season }));
  } catch (e) { next(e); }
});

// --- NEW: bundle par ligue (agrège toutes les MD dispo en un seul JSON) ---
r.get('/snapshot/bundle', async (req, res, next) => {
  try {
    const season = Number(req.query.season || process.env.DEFAULT_SEASON || new Date().getFullYear());
    const league = toLeagueCode(req.query.league || 'PD');

    const idx = readSnapshotIndex({ season });
    const available = idx?.leagues?.[league]?.matchdays || [];

    const byMatchday = {};
    for (const md of available) {
      const data = readSnapshot({ season, league, matchday: md });
      if (data) {
        byMatchday[String(md)] = {
          finished: data.finished || [],
          live: data.live || [],
          upcoming: data.upcoming || [],
          generatedAt: data.generatedAt,
        };
      }
    }

    const maxMd = MAX_MD_BY_LEAGUE[league] ?? 38;
    res.json({
      league,
      season,
      maxMatchday: maxMd,
      availableMatchdays: available,
      byMatchday,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) { next(e); }
});

export default r;
