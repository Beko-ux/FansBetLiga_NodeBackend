// src/services/points.service.js
import { prisma } from '../prisma.js';

/**
 * Normalise en nombre ou null
 */
const toNum = (v) => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Résultat tri-état:
 *  - 'A' : équipe A gagne
 *  - 'B' : équipe B gagne
 *  - 'D' : nul
 */
const outcome = (a, b) => (a === b ? 'D' : (a > b ? 'A' : 'B'));

/**
 * Règles:
 *  - 3 pts : score exact
 *  - 2 pts : bonne tendance + bon écart (hors nul)
 *  - 1 pt  : bonne tendance seulement (ou nul correct non exact)
 *  - 0 pt  : résultat faux
 */
export function calculateMatchPoints(predA, predB, scoreA, scoreB) {
  const pA = toNum(predA);
  const pB = toNum(predB);
  const sA = toNum(scoreA);
  const sB = toNum(scoreB);

  if ([pA, pB, sA, sB].some(v => v === null)) return 0;

  // 3 pts : exact
  if (pA === sA && pB === sB) return 3;

  const real = outcome(sA, sB);
  const pred = outcome(pA, pB);

  // Cas nul
  if (real === 'D') return pred === 'D' ? 1 : 0;

  // Si prédiction = nul mais résultat = victoire -> 0
  if (pred === 'D') return 0;

  // Même vainqueur (A ou B)
  if (real === pred) {
    const realDiff = Math.abs(sA - sB);
    const predDiff = Math.abs(pA - pB);
    return predDiff === realDiff ? 2 : 1;
  }

  return 0;
}

/**
 * Recalcule toutes les lignes de `Point` pour (league, season, matchday)
 * à partir des Predictions et Results existants. Idempotent via upsert.
 */
export async function recomputePointsForMatchday({ league, season, matchday }) {
  // 1) Résultats de la journée
  const results = await prisma.result.findMany({
    where: { league, season, matchday },
    select: { matchId: true, team1Score: true, team2Score: true },
  });
  if (results.length === 0) return { updated: 0 };

  const resultMap = new Map(results.map(r => [String(r.matchId), r]));

  // 2) Toutes les prédictions des users pour cette journée
  const preds = await prisma.prediction.findMany({
    where: { league, season, matchday },
    select: { userId: true, matchId: true, team1Score: true, team2Score: true },
  });
  if (preds.length === 0) return { updated: 0 };

  // 3) Calcul & upserts
  const ops = [];
  for (const p of preds) {
    const res = resultMap.get(String(p.matchId));
    if (!res) continue; // pas de résultat -> pas de points
    const pts = calculateMatchPoints(p.team1Score, p.team2Score, res.team1Score, res.team2Score);

    ops.push(
      prisma.point.upsert({
        where: {
          point_user_league_season_md_mid: {
            userId: p.userId,
            league,
            season,
            matchday,
            matchId: String(p.matchId),
          },
        },
        update: { points: pts },
        create: {
          userId: p.userId,
          league,
          season,
          matchday,
          matchId: String(p.matchId),
          points: pts,
        },
      })
    );
  }

  if (ops.length === 0) return { updated: 0 };
  await prisma.$transaction(ops);
  return { updated: ops.length };
}
