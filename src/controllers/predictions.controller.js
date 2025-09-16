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

//     ops.push(
//       prisma.prediction
//         .upsert({
//           where: {
//             user_league_season_matchday_matchId: { userId, league, season, matchday, matchId },
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

const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);

const QuerySchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
});

const ScoreString = z.string().regex(/^\d+$/, 'Score must be digits only');

const StoreSchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
  predictions: z.record(
    z.object({
      team1Score: ScoreString,
      team2Score: ScoreString,
    })
  ).refine(obj => Object.keys(obj).length > 0, { message: 'No predictions to save' }),
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
    const home = Number(data.team1Score);
    const away = Number(data.team2Score);

    ops.push(
      prisma.prediction
        .upsert({
          where: {
            user_league_season_matchday_matchId: { userId, league, season, matchday, matchId },
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
    return res.json({ message: 'Predictions saved successfully', predictions: saved });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving predictions', error: e.message });
  }
}

// Optionnel: batch -> même logique
export async function storeBatch(req, res) {
  return store(req, res);
}
