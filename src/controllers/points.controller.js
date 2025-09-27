// // controllers/points.controller.js
// import { z } from 'zod';
// import { prisma } from '../prisma.js';
// import { zodToLaravelErrors } from '../utils/validation.js';

// const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);

// const IndexSchema = z.object({
//   league: LeagueEnum.optional(),
//   season: z.coerce.number().int().min(2000).optional(),
//   matchday: z.coerce.number().int().min(1).optional(),
// });

// const StoreSchema = z.object({
//   league: LeagueEnum,
//   season: z.coerce.number().int().min(2000),
//   matchday: z.coerce.number().int().min(1),
//   points: z.array(
//     z.object({
//       matchID: z.string().min(1),        // ex: "449009"
//       points: z.coerce.number().int(),
//     })
//   ),
// });

// export async function index(req, res) {
//   try {
//     const userId = req.user.id;
//     const parsed = IndexSchema.safeParse(req.query);
//     if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

//     const { league, season, matchday } = parsed.data;

//     const where = {
//       userId,
//       ...(league ? { league } : {}),
//       ...(season ? { season } : {}),
//       ...(matchday ? { matchday } : {}),
//     };

//     const rows = await prisma.point.findMany({ where });

//     const out = rows.map((r) => ({ matchID: r.matchId, points: r.points }));
//     return res.json({ points: out });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error fetching points', error: e.message });
//   }
// }

// export async function store(req, res) {
//   const parsed = StoreSchema.safeParse({
//     league: req.body.league,
//     season: req.body.season,
//     matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
//     points: req.body.points,
//   });
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

//   const userId = req.user.id;
//   const { league, season, matchday, points } = parsed.data;

//   try {
//     const ops = points.map(({ matchID, points }) =>
//       prisma.point.upsert({
//         where: {
//           user_league_season_matchday_matchId: { userId, league, season, matchday, matchId: matchID },
//         },
//         update: { points },
//         create: { userId, league, season, matchday, matchId: matchID, points },
//       })
//     );

//     await prisma.$transaction(ops);
//     return res.json({ message: 'Points saved successfully' });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error saving points', error: e.message });
//   }
// }











// controllers/points.controller.js
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);

const IndexSchema = z.object({
  league: LeagueEnum.optional(),
  season: z.coerce.number().int().min(2000).optional(),
  matchday: z.coerce.number().int().min(1).optional(),
});

const StoreSchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
  points: z.array(
    z.object({
      matchID: z.string().min(1), // ex: "544251"
      points: z.coerce.number().int(),
    })
  ),
});

export async function index(req, res) {
  try {
    const userId = req.user.id;
    const parsed = IndexSchema.safeParse(req.query);
    if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

    const { league, season, matchday } = parsed.data;
    const where = {
      userId,
      ...(league ? { league } : {}),
      ...(season ? { season } : {}),
      ...(matchday ? { matchday } : {}),
    };

    const rows = await prisma.point.findMany({ where });
    // expose 'matchId' (camelCase) ET 'matchID' (legacy)
    const out = rows.map((r) => ({
      matchId: String(r.matchId),
      matchID: String(r.matchId),
      league: r.league,
      season: r.season,
      matchday: r.matchday,
      points: r.points,
    }));
    return res.json({ points: out, meta: { count: out.length } });
  } catch (e) {
    return res.status(500).json({ message: 'Error fetching points', error: e.message });
  }
}

export async function store(req, res) {
  const parsed = StoreSchema.safeParse({
    league: req.body.league,
    season: req.body.season,
    matchday: typeof req.body.matchday === 'string' ? Number(req.body.matchday) : req.body.matchday,
    points: req.body.points,
  });
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const userId = req.user.id;
  const { league, season, matchday, points } = parsed.data;

  try {
    const ops = points.map(({ matchID, points }) =>
      prisma.point.upsert({
        where: {
          point_user_league_season_md_mid: { userId, league, season, matchday, matchId: matchID },
        },
        update: { points },
        create: { userId, league, season, matchday, matchId: matchID, points },
      })
    );

    await prisma.$transaction(ops);
    return res.json({ message: 'Points saved successfully' });
  } catch (e) {
    return res.status(500).json({ message: 'Error saving points', error: e.message });
  }
}
