import { prisma } from '../prisma.js';

export async function daily(req, res) {
  try {
    const day = req.query.matchday ? Number(req.query.matchday) : 1;

    const rows = await prisma.point.groupBy({
      by: ['userId'],
      where: { matchday: day },
      _sum: { points: true }
    });

    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    const rankings = rows
      .map((r) => ({
        userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
        points: r._sum.points || 0
      }))
      .sort((a, b) => b.points - a.points);

    return res.json({ rankings });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing daily ranking', error: e.message });
  }
}

export async function firstRound(req, res) {
  try {
    // Ton Laravel fixe le "premier tour" à <= 3
    const rows = await prisma.point.groupBy({
      by: ['userId'],
      where: { matchday: { lte: 3 } },
      _sum: { points: true }
    });

    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    const rankings = rows
      .map((r) => ({
        userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
        points: r._sum.points || 0
      }))
      .sort((a, b) => b.points - a.points);

    return res.json({ rankings });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing first round', error: e.message });
  }
}

export async function overall(req, res) {
  try {
    const rows = await prisma.point.groupBy({
      by: ['userId'],
      _sum: { points: true }
    });

    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

    const rankings = rows
      .map((r) => ({
        userName: users.find((u) => u.id === r.userId)?.name ?? 'User',
        points: r._sum.points || 0
      }))
      .sort((a, b) => b.points - a.points);

    return res.json({ rankings });
  } catch (e) {
    return res.status(500).json({ message: 'Error computing overall ranking', error: e.message });
  }
}
