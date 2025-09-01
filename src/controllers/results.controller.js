import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const StoreSchema = z.object({
  matchday: z.number().int(),
  match_id: z.string(),
  team1_score: z.number().int(),
  team2_score: z.number().int()
});

export async function index(req, res) {
  try {
    const matchday = req.query.matchday ? Number(req.query.matchday) : undefined;
    const where = matchday ? { matchday } : {};
    const rows = await prisma.result.findMany({ where, orderBy: [{ matchday: 'asc' }] });

    const results = rows.map((r) => ({
      matchID: r.matchId,
      team1Score: String(r.team1Score),
      team2Score: String(r.team2Score)
    }));
    return res.json({ results });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching results', error: e.message });
  }
}

export async function store(req, res) {
  const body = {
    matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
    match_id: req.body.match_id,
    team1_score: typeof req.body.team1_score === 'string' ? Number(req.body.team1_score) : req.body.team1_score,
    team2_score: typeof req.body.team2_score === 'string' ? Number(req.body.team2_score) : req.body.team2_score
  };

  const parsed = StoreSchema.safeParse(body);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const { matchday, match_id, team1_score, team2_score } = parsed.data;

  try {
    const result = await prisma.result.upsert({
      where: { matchday_matchId: { matchday, matchId: match_id } },
      update: { team1Score: team1_score, team2Score: team2_score },
      create: { matchday, matchId: match_id, team1Score: team1_score, team2Score: team2_score }
    });

    return res.json({ message: 'Result saved successfully', result });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving result', error: e.message });
  }
}
