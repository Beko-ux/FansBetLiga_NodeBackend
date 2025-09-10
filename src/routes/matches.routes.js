// src/routes/matches.routes.js
import { Router } from 'express';
import { getMatchday, getFinishedIndex } from '../services/footballData.service.js';

const r = Router();

// Exemples valides :
//   /api/matches?league=PL&season=2025&matchday=1
//   /api/matches?league=BL1&season=2025&matchday=1
//   /api/matches?league=premier&season=2025&matchday=1
//   /api/matches?league=bundes&season=2025&matchday=1
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

export default r;
