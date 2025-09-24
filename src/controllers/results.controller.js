
// controllers/results.controller.js
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';
import { recomputePointsForMatchday } from '../services/points.service.js';

const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);

const QuerySchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
});

const StoreSchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
  results: z.array(z.object({
    matchId: z.string().min(1),
    team1Score: z.coerce.number().int().min(0),
    team2Score: z.coerce.number().int().min(0),
  })),
});

export async function index(req, res) {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season, matchday } = parsed.data;

  try {
    const rows = await prisma.result.findMany({
      where: { league, season, matchday },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ results: rows });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching results', error: e.message });
  }
}

export async function store(req, res) {
  const parsed = StoreSchema.safeParse({
    league: req.body.league,
    season: req.body.season,
    matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
    results: req.body.results,
  });
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const { league, season, matchday, results } = parsed.data;

  try {
    // upsert des résultats
    await prisma.$transaction(results.map(r =>
      prisma.result.upsert({
        where: { result_league_season_md_mid: { league, season, matchday, matchId: r.matchId } },
        update: { team1Score: r.team1Score, team2Score: r.team2Score },
        create: { league, season, matchday, matchId: r.matchId, team1Score: r.team1Score, team2Score: r.team2Score },
      })
    ));

    // recalcul des points pour TOUT le monde sur cette journée
    const { updated } = await recomputePointsForMatchday({ league, season, matchday });

    return res.json({ message: 'Results saved', recomputedPoints: updated });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving results', error: e.message });
  }
}
