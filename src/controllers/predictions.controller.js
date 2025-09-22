// // controllers/predictions.controller.js
// import { z } from 'zod';
// import { prisma } from '../prisma.js';
// import { zodToLaravelErrors } from '../utils/validation.js';

// const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);

// const QuerySchema = z.object({
//   league: LeagueEnum,
//   season: z.coerce.number().int().min(2000),
//   matchday: z.coerce.number().int().min(1),
// });

// const StoreSchema = z.object({
//   league: LeagueEnum,
//   season: z.coerce.number().int().min(2000),
//   matchday: z.coerce.number().int().min(1),
//   predictions: z.record(
//     z.object({
//       team1Score: z.string().min(1),
//       team2Score: z.string().min(1),
//     })
//   ),
// });

// export async function index(req, res) {
//   try {
//     const userId = req.user.id;
//     const parsed = QuerySchema.safeParse(req.query);
//     if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
//     const { league, season, matchday } = parsed.data;

//     const rows = await prisma.prediction.findMany({
//       where: { userId, league, season, matchday },
//     });

//     const formatted = {};
//     for (const p of rows) {
//       formatted[p.matchId] = {
//         team1Score: String(p.team1Score),
//         team2Score: String(p.team2Score),
//       };
//     }

//     return res.json({ predictions: formatted });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error fetching predictions', error: e.message });
//   }
// }

// export async function store(req, res) {
//   const parsed = StoreSchema.safeParse({
//     league: req.body.league,
//     season: req.body.season,
//     matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
//     predictions: req.body.predictions,
//   });
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

//   const userId = req.user.id;
//   const { league, season, matchday, predictions } = parsed.data;

//   const saved = {};
//   const ops = [];

//   for (const [matchId, data] of Object.entries(predictions)) {
//     const home = parseInt(data.team1Score, 10);
//     const away = parseInt(data.team2Score, 10);

//     // ⚠️ UTILISER la même clé que dans ton schema.prisma:
//     // @@unique([userId, league, season, matchday, matchId], name: "pred_user_league_season_md_mid")
//     ops.push(
//       prisma.prediction
//         .upsert({
//           where: {
//             pred_user_league_season_md_mid: { userId, league, season, matchday, matchId },
//           },
//           update: { team1Score: home, team2Score: away },
//           create: { userId, league, season, matchday, matchId, team1Score: home, team2Score: away },
//         })
//         .then((p) => {
//           saved[matchId] = {
//             team1Score: String(p.team1Score),
//             team2Score: String(p.team2Score),
//           };
//         })
//     );
//   }

//   try {
//     await Promise.all(ops);
//     return res.json({ message: 'Predictions saved successfully', predictions: saved });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error saving predictions', error: e.message });
//   }
// }

// // Optionnel: batch = même logique
// export async function storeBatch(req, res) {
//   return store(req, res);
// }








// controllers/predictions.controller.js
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

// On accepte string ou number et on COERCE → entier >= 0
const ScoreSchema = z.coerce.number().int().min(0);

const StoreSchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
  predictions: z.record(
    z.object({
      team1Score: ScoreSchema,
      team2Score: ScoreSchema,
    })
  ),
});

export async function index(req, res) {
  try {
    const userId = req.user.id;
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
    const { league, season, matchday } = parsed.data;

    const rows = await prisma.prediction.findMany({
      where: { userId, league, season, matchday },
    });

    const formatted = {};
    for (const p of rows) {
      formatted[p.matchId] = {
        team1Score: String(p.team1Score),
        team2Score: String(p.team2Score),
      };
    }

    return res.json({ predictions: formatted });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching predictions', error: e.message });
  }
}

export async function store(req, res) {
  // On coerce / valide tout le payload
  const parsed = StoreSchema.safeParse({
    league: req.body.league,
    season: req.body.season,
    matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
    predictions: req.body.predictions,
  });
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const userId = req.user.id;
  const { league, season, matchday, predictions } = parsed.data;

  const saved = {};
  const ops = [];

  for (const [matchId, data] of Object.entries(predictions)) {
    const home = data.team1Score; // déjà coerce en int >= 0
    const away = data.team2Score;

    // @@unique([userId, league, season, matchday, matchId], name: "pred_user_league_season_md_mid")
    ops.push(
      prisma.prediction
        .upsert({
          where: {
            pred_user_league_season_md_mid: { userId, league, season, matchday, matchId },
          },
          update: { team1Score: home, team2Score: away },
          create: { userId, league, season, matchday, matchId, team1Score: home, team2Score: away },
        })
        .then((p) => {
          saved[matchId] = {
            team1Score: String(p.team1Score),
            team2Score: String(p.team2Score),
          };
        })
    );
  }

  try {
    await Promise.all(ops);

    // ➜ recalcul backend automatique (idempotent)
    let recomputedPoints = 0;
    try {
      const resu = await recomputePointsForMatchday({ league, season, matchday });
      recomputedPoints = resu?.updated ?? 0;
    } catch (err) {
      // On ne bloque pas l’enregistrement des prédictions si le recalcul échoue
      console.error('recomputePointsForMatchday failed:', err?.message || err);
    }

    return res.json({
      message: 'Predictions saved successfully',
      predictions: saved,
      recomputedPoints, // nb de lignes Point upsertées
    });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving predictions', error: e.message });
  }
}

// Alias batch
export async function storeBatch(req, res) {
  return store(req, res);
}
