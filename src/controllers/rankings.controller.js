// // controllers/rankings.controller.js
// import { prisma } from '../prisma.js';
// import { z } from 'zod';
// import { zodToLaravelErrors } from '../utils/validation.js';

// const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);
// const BaseQuery = z.object({
//   league: LeagueEnum.optional(),
//   season: z.coerce.number().int().min(2000).optional(),
// });
// const DailyQuery = BaseQuery.extend({
//   matchday: z.coerce.number().int().min(1),
// });

// function whereFrom(q) {
//   const { league, season } = q;
//   return {
//     ...(league ? { league } : {}),
//     ...(season ? { season } : {}),
//   };
// }

// export async function daily(req, res) {
//   const parsed = DailyQuery.safeParse(req.query);
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
//   const { league, season, matchday } = parsed.data;

//   try {
//     const rows = await prisma.point.groupBy({
//       by: ['userId'],
//       where: { ...whereFrom({ league, season }), matchday },
//       _sum: { points: true },
//     });

//     const userIds = rows.map((r) => r.userId);
//     const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

//     const rankings = rows
//       .map((r) => ({
//         userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
//         points: r._sum.points || 0,
//       }))
//       .sort((a, b) => b.points - a.points);

//     return res.json({ rankings });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error computing daily ranking', error: e.message });
//   }
// }

// export async function firstRound(req, res) {
//   const parsed = BaseQuery.safeParse(req.query);
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
//   const { league, season } = parsed.data;

//   try {
//     const rows = await prisma.point.groupBy({
//       by: ['userId'],
//       where: { ...whereFrom({ league, season }), matchday: { lte: 19 } }, // ex: "premier tour"
//       _sum: { points: true },
//     });

//     const userIds = rows.map((r) => r.userId);
//     const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

//     const rankings = rows
//       .map((r) => ({
//         userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
//         points: r._sum.points || 0,
//       }))
//       .sort((a, b) => b.points - a.points);

//     return res.json({ rankings });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error computing first round', error: e.message });
//   }
// }

// export async function overall(req, res) {
//   const parsed = BaseQuery.safeParse(req.query);
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
//   const { league, season } = parsed.data;

//   try {
//     const rows = await prisma.point.groupBy({
//       by: ['userId'],
//       where: { ...whereFrom({ league, season }) },
//       _sum: { points: true },
//     });

//     const userIds = rows.map((r) => r.userId);
//     const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

//     const rankings = rows
//       .map((r) => ({
//         userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
//         points: r._sum.points || 0,
//       }))
//       .sort((a, b) => b.points - a.points);

//     return res.json({ rankings });
//   } catch (e) {
//     return res.status(500).json({ message: 'Error computing overall ranking', error: e.message });
//   }
// }




// src/controllers/rankings.controller.js
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);
const MAX_MD_BY_LEAGUE = { PL: 38, BL1: 34, PD: 38, SA: 38, FL1: 34 };

const DailySchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
  matchday: z.coerce.number().int().min(1),
});

const ScopeSchema = z.object({
  league: LeagueEnum,
  season: z.coerce.number().int().min(2000),
});

function byDescPointsThenName(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  return (a.userName || '').localeCompare(b.userName || '');
}

async function attachUserNames(rows) {
  const ids = [...new Set(rows.map(r => r.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  const map = new Map(users.map(u => [u.id, u]));
  return rows.map(r => {
    const u = map.get(r.userId);
    return {
      userId: r.userId,
      userName: u?.name || u?.email || `User#${r.userId}`,
      points: r.points,
    };
  });
}

export async function daily(req, res) {
  const parsed = DailySchema.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season, matchday } = parsed.data;

  try {
    const pts = await prisma.point.findMany({
      where: { league, season, matchday },
      select: { userId: true, points: true },
    });

    // somme par userId
    const agg = new Map();
    for (const row of pts) {
      agg.set(row.userId, (agg.get(row.userId) || 0) + (Number(row.points) || 0));
    }

    const grouped = [...agg.entries()].map(([userId, points]) => ({ userId, points }));
    const withNames = await attachUserNames(grouped);
    withNames.sort(byDescPointsThenName);

    return res.json({ rankings: withNames });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing daily rankings', error: e.message });
  }
}

export async function firstRound(req, res) {
  const parsed = ScopeSchema.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season } = parsed.data;

  const total = MAX_MD_BY_LEAGUE[league] ?? 38;
  const endMd = Math.ceil(total / 2);

  try {
    const pts = await prisma.point.findMany({
      where: { league, season, matchday: { lte: endMd } },
      select: { userId: true, points: true },
    });

    const agg = new Map();
    for (const row of pts) {
      agg.set(row.userId, (agg.get(row.userId) || 0) + (Number(row.points) || 0));
    }

    const grouped = [...agg.entries()].map(([userId, points]) => ({ userId, points }));
    const withNames = await attachUserNames(grouped);
    withNames.sort(byDescPointsThenName);

    return res.json({ rankings: withNames });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing first-round rankings', error: e.message });
  }
}

export async function overall(req, res) {
  const parsed = ScopeSchema.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season } = parsed.data;

  try {
    const pts = await prisma.point.findMany({
      where: { league, season },
      select: { userId: true, points: true },
    });

    const agg = new Map();
    for (const row of pts) {
      agg.set(row.userId, (agg.get(row.userId) || 0) + (Number(row.points) || 0));
    }

    const grouped = [...agg.entries()].map(([userId, points]) => ({ userId, points }));
    const withNames = await attachUserNames(grouped);
    withNames.sort(byDescPointsThenName);

    return res.json({ rankings: withNames });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing overall rankings', error: e.message });
  }
}

