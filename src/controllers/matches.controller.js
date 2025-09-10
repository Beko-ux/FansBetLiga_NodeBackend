// controllers/matches.controller.js
import { LEAGUES, buildRound, getFixturesByRound } from '../services/apifootball.js';

function generateMatchID(matchday, team1, team2) {
  const clean = (s) => (s || '')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  return `MD${matchday}_${clean(team1)}_${clean(team2)}`;
}

function formatDayHeader(dateIso) {
  const d = new Date(dateIso);
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(d);
  const dayNum = d.getDate();
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(d);
  return `${day}, ${dayNum} ${month}`;
}

function formatTime(dateIso) {
  const d = new Date(dateIso);
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

function mapStatus(short) {
  if (short === 'NS') return 'upcoming';
  if (short === 'FT') return 'finished';
  if (['1H','HT','2H','ET','BT','P','LIVE'].includes(short)) return 'live';
  return 'scheduled';
}

export async function getMatches(req, res) {
  try {
    const { league, season, matchday } = req.query;

    if (!league || !season || !matchday) {
      return res.status(422).json({ message: 'Paramètres requis: league, season, matchday' });
    }

    const l = LEAGUES[league];
    if (!l) {
      return res.status(422).json({ message: 'league invalide. Utilise: laliga, premier-league, serie-a, ligue-1, bundesliga' });
    }

    const md = parseInt(matchday, 10);
    if (Number.isNaN(md) || md < 1) {
      return res.status(422).json({ message: 'matchday invalide' });
    }

    const round = buildRound(md);

    const fixtures = await getFixturesByRound({
      leagueId: l.id,
      season,
      round,
    });

    const grouped = new Map();
    for (const fx of fixtures) {
      const dateIso = fx.fixture?.date;
      const dayHeader = formatDayHeader(dateIso);
      const time = formatTime(dateIso);

      const team1 = fx.teams?.home?.name || 'Home';
      const team2 = fx.teams?.away?.name || 'Away';

      const statusShort = fx.fixture?.status?.short;
      const status = mapStatus(statusShort);

      const team1Score = fx.goals?.home ?? null;
      const team2Score = fx.goals?.away ?? null;

      const match = {
        time,
        team1,
        team2,
        status,
        team1Score,
        team2Score,
        matchID: generateMatchID(md, team1, team2),
      };

      if (!grouped.has(dayHeader)) grouped.set(dayHeader, []);
      grouped.get(dayHeader).push(match);
    }

    const days = Array.from(grouped.entries()).map(([date, matches]) => ({
      date,
      matches: matches.sort((a, b) => a.time.localeCompare(b.time)),
    }));

    return res.json({
      league: l.label,
      season: Number(season),
      matchday: md,
      days,
      rawCount: fixtures.length,
    });
  } catch (err) {
    console.error('getMatches error:', err?.response?.data || err);
    const status = err?.response?.status || 500;
    return res.status(status).json({ message: 'Failed to fetch matches' });
  }
}
