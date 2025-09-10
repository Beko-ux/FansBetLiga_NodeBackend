import axios from 'axios';

export const LEAGUES = {
  laliga:        { id: 2014, code: 'PD',  name: 'La Liga' },
  premierleague: { id: 2021, code: 'PL',  name: 'Premier League' },
  seriea:        { id: 2019, code: 'SA',  name: 'Serie A' },
  ligue1:        { id: 2015, code: 'FL1', name: 'Ligue 1' },
  bundesliga:    { id: 2002, code: 'BL1', name: 'Bundesliga' },
};

const BASE = 'https://api.football-data.org/v4';

function http() {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) throw new Error('FOOTBALLDATA_KEY manquant dans .env');
  return axios.create({
    baseURL: BASE,
    headers: { 'X-Auth-Token': key, 'Accept': 'application/json' },
    timeout: 15000,
  });
}

export function mapMatchesFD(fd) {
  const byDay = new Map();

  for (const m of fd.matches || []) {
    const dateISO = m.utcDate?.slice(0, 10) || 'N/A';
    const time    = m.utcDate?.slice(11, 16) || '--:--';

    const match = {
      matchID: m.id,
      time,
      team1: m.homeTeam?.shortName || m.homeTeam?.name,
      team1Logo: m.homeTeam?.crest || null,
      team2: m.awayTeam?.shortName || m.awayTeam?.name,
      team2Logo: m.awayTeam?.crest || null,
      status: (m.status || 'SCHEDULED').toLowerCase(),
      scoreA: m.score?.fullTime?.home ?? null,
      scoreB: m.score?.fullTime?.away ?? null,
      halfA : m.score?.halfTime?.home ?? null,
      halfB : m.score?.halfTime?.away ?? null,
    };

    if (!byDay.has(dateISO)) byDay.set(dateISO, { date: dateISO, matches: [] });
    byDay.get(dateISO).matches.push(match);
  }

  const days = Array.from(byDay.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      matches: d.matches.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    }));

  return {
    resultSet: fd.resultSet || null,
    competition: {
      id: fd.competition?.id,
      name: fd.competition?.name,
      code: fd.competition?.code,
      emblem: fd.competition?.emblem || null,
      areaFlag: fd.matches?.[0]?.area?.flag || null,
    },
    days,
    rawCount: fd.matches?.length || 0,
  };
}

export async function fetchMatchesFD({ leagueKey, season, matchday }) {
  const meta = LEAGUES[leagueKey?.toLowerCase()];
  if (!meta) {
    const keys = Object.keys(LEAGUES).join(', ');
    throw new Error(`league invalide. Utilise: ${keys}`);
  }

  const api = http();
  const params = {};
  if (season)   params.season = season;
  if (matchday) params.matchday = matchday;

  const { data } = await api.get(`/competitions/${meta.id}/matches`, { params });
  const mapped = mapMatchesFD(data);

  return {
    league: meta.name,
    leagueCode: meta.code,
    season: season ? Number(season) : null,
    matchday: matchday ? Number(matchday) : null,
    ...mapped,
  };
}
