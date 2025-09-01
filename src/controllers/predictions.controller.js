import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const StoreSchema = z.object({
  matchday: z.number().int(),
  predictions: z.record(
    z.object({
      team1Score: z.string(),
      team2Score: z.string()
    })
  )
});

export async function index(req, res) {
  try {
    const userId = req.user.id;
    const matchday = req.query.matchday ? Number(req.query.matchday) : undefined;

    const where = { userId, ...(matchday ? { matchday } : {}) };
    const rows = await prisma.prediction.findMany({ where });

    const formatted = {};
    for (const p of rows) {
      formatted[p.matchId] = {
        team1Score: String(p.team1Score),
        team2Score: String(p.team2Score)
      };
    }

    return res.json({ predictions: formatted });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching predictions', error: e.message });
  }
}

export async function store(req, res) {
  const parsed = StoreSchema.safeParse({
    matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
    predictions: req.body.predictions
  });
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const userId = req.user.id;
  const { matchday, predictions } = parsed.data;

  const saved = {};
  const ops = [];

  for (const [matchId, data] of Object.entries(predictions)) {
    const home = parseInt(data.team1Score, 10);
    const away = parseInt(data.team2Score, 10);

    ops.push(
      prisma.prediction.upsert({
        where: { userId_matchday_matchId: { userId, matchday, matchId } },
        update: { team1Score: home, team2Score: away },
        create: { userId, matchday, matchId, team1Score: home, team2Score: away }
      }).then((p) => {
        saved[matchId] = {
          team1Score: String(p.team1Score),
          team2Score: String(p.team2Score)
        };
      })
    );
  }

  try {
    await Promise.all(ops);
    return res.json({ message: 'Predictions saved successfully', predictions: saved });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving predictions', error: e.message });
  }
}

export async function storeBatch(req, res) {
  // Même logique que store (parité Laravel)
  return store(req, res);
}
