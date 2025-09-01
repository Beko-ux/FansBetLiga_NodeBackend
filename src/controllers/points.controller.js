import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const StoreSchema = z.object({
  matchday: z.number().int(),
  points: z.array(
    z.object({
      matchID: z.string(),
      points: z.number().int()
    })
  )
});

export async function store(req, res) {
  const body = {
    matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
    points: req.body.points
  };
  const parsed = StoreSchema.safeParse(body);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const userId = req.user.id;
  const { matchday, points } = parsed.data;

  try {
    const ops = points.map(({ matchID, points }) =>
      prisma.point.upsert({
        where: { userId_matchday_matchId: { userId, matchday, matchId: matchID } },
        update: { points },
        create: { userId, matchday, matchId: matchID, points }
      })
    );
    await prisma.$transaction(ops);
    return res.json({ message: 'Points saved successfully' });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving points', error: e.message });
  }
}

export async function index(req, res) {
  try {
    const userId = req.user.id;
    const matchday = req.query.matchday ? Number(req.query.matchday) : undefined;

    const where = { userId, ...(matchday ? { matchday } : {}) };
    const rows = await prisma.point.findMany({ where });

    const out = rows.map((r) => ({ matchID: r.matchId, points: r.points }));
    return res.json({ points: out });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching points', error: e.message });
  }
}
