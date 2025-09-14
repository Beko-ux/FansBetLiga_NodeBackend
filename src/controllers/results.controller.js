import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const QuerySchema = z.object({
  league: z.string().min(2),                // ex: "PD"
  season: z.coerce.number().int(),          // ex: 2025
  matchday: z.coerce.number().int().optional(),
});

const StoreSchema = z.object({
  league: z.string().min(2),
  season: z.coerce.number().int(),
  matchday: z.coerce.number().int(),
  match_id: z.string(),                     // matchId côté front/back
  team1_score: z.coerce.number().int(),
  team2_score: z.coerce.number().int(),
});

export async function index(req, res) {
  try {
    const parsed = QuerySchema.safeParse({
      league: req.query.league,
      season: req.query.season,
      matchday: req.query.matchday,
    });
    if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

    const { league, season, matchday } = parsed.data;
    const where = { league, season, ...(matchday ? { matchday } : {}) };

    const rows = await prisma.result.findMany({
      where,
      orderBy: [{ matchday: 'asc' }, { matchId: 'asc' }],
    });

    const results = rows.map(r => ({
      matchID: r.matchId,
      team1Score: String(r.team1Score),
      team2Score: String(r.team2Score),
    }));

    return res.json({ results });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching results', error: e.message });
  }
}

export async function store(req, res) {
  const parsed = StoreSchema.safeParse({
    league: req.body.league,
    season: req.body.season,
    matchday: req.body.matchday,
    match_id: req.body.match_id,
    team1_score: req.body.team1_score,
    team2_score: req.body.team2_score,
  });
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const { league, season, matchday, match_id, team1_score, team2_score } = parsed.data;

  try {
    const result = await prisma.result.upsert({
      where: { result_league_season_md_mid: { league, season, matchday, matchId: match_id } },
      update: { team1Score: team1_score, team2Score: team2_score },
      create: {
        league, season, matchday,
        matchId: match_id,
        team1Score: team1_score,
        team2Score: team2_score,
      },
    });

    return res.json({ message: 'Result saved successfully', result });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving result', error: e.message });
  }
}
