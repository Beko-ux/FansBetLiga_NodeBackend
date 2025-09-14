// controllers/rankings.controller.js
import { prisma } from '../prisma.js';
import { z } from 'zod';
import { zodToLaravelErrors } from '../utils/validation.js';

const LeagueEnum = z.enum(['PL', 'BL1', 'PD', 'SA', 'FL1']);
const BaseQuery = z.object({
  league: LeagueEnum.optional(),
  season: z.coerce.number().int().min(2000).optional(),
});
const DailyQuery = BaseQuery.extend({
  matchday: z.coerce.number().int().min(1),
});

function whereFrom(q) {
  const { league, season } = q;
  return {
    ...(league ? { league } : {}),
    ...(season ? { season } : {}),
  };
}

export async function daily(req, res) {
  const parsed = DailyQuery.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season, matchday } = parsed.data;

  try {
    const rows = await prisma.point.groupBy({
      by: ['userId'],
      where: { ...whereFrom({ league, season }), matchday },
      _sum: { points: true },
    });

    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    const rankings = rows
      .map((r) => ({
        userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
        points: r._sum.points || 0,
      }))
      .sort((a, b) => b.points - a.points);

    return res.json({ rankings });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing daily ranking', error: e.message });
  }
}

export async function firstRound(req, res) {
  const parsed = BaseQuery.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season } = parsed.data;

  try {
    const rows = await prisma.point.groupBy({
      by: ['userId'],
      where: { ...whereFrom({ league, season }), matchday: { lte: 19 } }, // ex: "premier tour"
      _sum: { points: true },
    });

    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    const rankings = rows
      .map((r) => ({
        userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
        points: r._sum.points || 0,
      }))
      .sort((a, b) => b.points - a.points);

    return res.json({ rankings });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing first round', error: e.message });
  }
}

export async function overall(req, res) {
  const parsed = BaseQuery.safeParse(req.query);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));
  const { league, season } = parsed.data;

  try {
    const rows = await prisma.point.groupBy({
      by: ['userId'],
      where: { ...whereFrom({ league, season }) },
      _sum: { points: true },
    });

    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    const rankings = rows
      .map((r) => ({
        userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
        points: r._sum.points || 0,
      }))
      .sort((a, b) => b.points - a.points);

    return res.json({ rankings });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing overall ranking', error: e.message });
  }
}
