// src/services/snapshot.service.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchMatchdayFromFootballData } from './footballData.service.js';
import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

// === helpers de fs ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function snapshotPath(leagueCode, season) {
  const dir = path.resolve(process.cwd(), 'cache', leagueCode, String(season));
  ensureDir(dir);
  return path.join(dir, 'snapshot.json');
}

// === mapping ligue entrée -> code FD (PL, BL1, PD, SA, FL1) ===
function leagueCodeOf(input) {
  const comp = mapLeagueToFootballData(input);
  if (comp && comp.code) return comp.code;
  const upper = String(input || '').trim().toUpperCase();
  if (['PL', 'BL1', 'PD', 'SA', 'FL1'].includes(upper)) return upper;
  // fallback
  return 'PD';
}

// === catégorisation d'un status Football-Data normalisé (lowercase) ===
function bucketOfStatus(status) {
  const s = String(status || '').toLowerCase();
  const finished = ['finished', 'ft', 'after_extra_time', 'aet', 'penalties', 'p'];
  const live = ['in_play', 'live', '1st_half', '2nd_half', 'paused', 'ht', 'et', 'bt'];

  if (finished.includes(s)) return 'finished';
  if (live.includes(s)) return 'live';
  return 'upcoming';
}

function shapeMatch(dayISO, m) {
  return {
    matchID: String(m.matchID ?? m.id),
    date: dayISO,                 // "YYYY-MM-DD"
    time: m.time || null,         // "HH:MM"
    team1: m.team1,
    team2: m.team2,
    team1Logo: m.team1Logo || null,
    team2Logo: m.team2Logo || null,
    scoreA: (m.scoreA ?? null),
    scoreB: (m.scoreB ?? null),
    status: String(m.status || '').toLowerCase(),
  };
}

/**
 * Construit/Met à jour le snapshot pour une ligue + saison sur un ensemble de matchdays.
 * Écrit cache/<LEAGUE>/<SEASON>/snapshot.json
 */
export async function buildSnapshot({ league, season, matchdays = [] }) {
  const leagueCode = leagueCodeOf(league);
  const p = snapshotPath(leagueCode, season);

  // Charger l’existant si présent
  let snap = null;
  try {
    if (fs.existsSync(p)) {
      snap = JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* ignore */ }

  if (!snap) {
    snap = {
      league: leagueCode,     // code FD
      season: Number(season),
      byMatchday: {},         // md -> { finished: [...], live: [...], upcoming: [...] }
      updatedAt: null,
    };
  }

  // Pour chaque matchday demandé -> fetch FD + catégorise
  for (const md of matchdays) {
    // Récupère la journée normalisée (days/matches déjà mappés dans footballData.service.js)
    const data = await fetchMatchdayFromFootballData({
      league: leagueCode, season: Number(season), matchday: Number(md)
    });

    const buckets = { finished: [], live: [], upcoming: [] };

    for (const day of (data?.days || [])) {
      for (const m of (day?.matches || [])) {
        const shaped = shapeMatch(day.date, m);
        const bucket = bucketOfStatus(shaped.status);
        buckets[bucket].push(shaped);
      }
    }

    // ordonner les matchs dans chaque bucket pour stabilité (par date/time)
    const byTime = (a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`);
    buckets.finished.sort(byTime);
    buckets.live.sort(byTime);
    buckets.upcoming.sort(byTime);

    snap.byMatchday[String(md)] = buckets;
  }

  snap.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(snap, null, 2), 'utf-8');

  return snap;
}

/**
 * Lit le snapshot depuis le disque (ne fetch pas).
 */
export function readSnapshot({ league, season }) {
  const leagueCode = leagueCodeOf(league);
  const p = snapshotPath(leagueCode, season);

  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }

  // snapshot vide par défaut
  return {
    league: leagueCode,
    season: Number(season),
    byMatchday: {},
    updatedAt: null,
  };
}
