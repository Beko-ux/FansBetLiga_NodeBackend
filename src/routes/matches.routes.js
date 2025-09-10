// src/routes/matches.routes.js
import { Router } from 'express';
import { getMatchday, getFinishedIndex } from '../services/footballData.service.js';
import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

const r = Router();

// GET /api/matches?league=laliga&season=2025&matchday=12
r.get('/', async (req, res, next) => {
  try {
    const { league = 'laliga', season = 2025, matchday = 1 } = req.query;
    const data = await getMatchday({ league, season: Number(season), matchday: Number(matchday) });
    res.json(data);
  } catch (e) { next(e); }
});

// GET /api/matches/finished-index?league=laliga&season=2025
r.get('/finished-index', async (req, res, next) => {
  try {
    const { league = 'laliga', season = 2025 } = req.query;
    const idx = getFinishedIndex({ league, season: Number(season) });
    res.json(idx);
  } catch (e) { next(e); }
});

// GET /api/matches/current?league=laliga&season=2025
r.get('/current', async (req, res, next) => {
  try {
    const { league = 'laliga', season = 2025 } = req.query;
    const idx = getFinishedIndex({ league, season: Number(season) });
    res.json({ league: idx.league, season: idx.season, currentMatchday: idx.currentMatchday || 1 });
  } catch (e) { next(e); }
});

export default r;
