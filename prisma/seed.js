// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SEASON = 2025;
const LEAGUE = 'PD';
const MATCHDAY = 1;

async function upsertResult({ league, season, matchday, matchId, team1Score, team2Score }) {
  // matchId DOIT être une string
  const matchIdStr = String(matchId);

  return prisma.result.upsert({
    where: {
      // correspond à @@unique([league, season, matchday, matchId], name: "result_league_season_md_mid")
      result_league_season_md_mid: { league, season, matchday, matchId: matchIdStr },
    },
    update: { team1Score, team2Score },
    create: { league, season, matchday, matchId: matchIdStr, team1Score, team2Score },
  });
}

// Essaie de récupérer 2 matchs depuis Football-Data (si FOOTBALLDATA_KEY présent)
async function buildEntriesFromFD({ league = LEAGUE, season = SEASON, matchday = MATCHDAY }) {
  const KEY = process.env.FOOTBALLDATA_KEY;
  if (!KEY) return null;

  const CODE_TO_ID = { PL: 2021, BL1: 2002, PD: 2014, SA: 2019, FL1: 2015 };
  const compId = CODE_TO_ID[league.toUpperCase()];
  if (!compId) return null;

  const api = axios.create({
    baseURL: 'https://api.football-data.org/v4',
    headers: { 'X-Auth-Token': KEY, Accept: 'application/json' },
    timeout: 15000,
  });

  const { data } = await api.get(`/competitions/${compId}/matches`, {
    params: { season, matchday },
  });

  const matches = (data.matches || []).slice(0, 2);
  if (!matches.length) return null;

  return matches.map((m) => {
    const finished = (m.status || '').toLowerCase() === 'finished';
    const ft = m?.score?.fullTime || {};
    return {
      league,
      season,
      matchday,
      matchId: String(m.id), // << forçons String
      team1Score: Number.isInteger(ft.home) && finished ? ft.home : 0,
      team2Score: Number.isInteger(ft.away) && finished ? ft.away : 0,
    };
  });
}

// Fallback sans clé FD : mets ici 2 IDs VUS dans GET /api/matches?... (en STRING)
function fallbackEntries() {
  return [
    { league: LEAGUE, season: SEASON, matchday: MATCHDAY, matchId: '5442144', team1Score: 2, team2Score: 1 },
    { league: LEAGUE, season: SEASON, matchday: MATCHDAY, matchId: '5442214', team1Score: 3, team2Score: 0 },
  ];
}

async function main() {
  let rows = null;
  try {
    rows = await buildEntriesFromFD({});
  } catch (e) {
    console.warn('FD indisponible → fallback utilisé:', e?.message || e);
  }
  if (!rows) rows = fallbackEntries();

  for (const r of rows) {
    await upsertResult(r);
  }
  console.log(`✅ Seed OK : ${rows.length} résultats semés pour ${LEAGUE} ${SEASON} MD${MATCHDAY}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
