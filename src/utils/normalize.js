// src/utils/normalize.js
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });

export function mapApiFootballStatus(short) {
  // https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures
  if (['NS', 'TBD', 'PST'].includes(short)) return 'scheduled';
  if (['1H', '2H', 'LIVE', 'ET', 'BT', 'P', 'INT'].includes(short)) return 'in_play';
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  return 'scheduled';
}

export function mapLiveScoreStatus(st) {
  // LiveScore API status codes – simplifié
  if (['NS'].includes(st)) return 'scheduled';
  if (['1H', '2H', 'LIVE', 'ET'].includes(st)) return 'in_play';
  if (['FT'].includes(st)) return 'finished';
  return 'scheduled';
}

export function generateMatchID(matchday, team1, team2) {
  const clean = (n) => (n || '').replace(/[^a-zA-Z]/g, '').substring(0,3).toUpperCase();
  return `MD${matchday}_${clean(team1)}_${clean(team2)}`;
}

export function groupByDay(fixtures, { matchday }) {
  // fixtures déjà normalisés : { date, time, team1, team2, status, team1Score, team2Score, matchID }
  const map = new Map();
  fixtures.forEach(f => {
    const d = new Date(f.date);
    const label = `${weekdayFmt.format(d)}, ${dayMonthFmt.format(d)}`;
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(f);
  });

  // ordonner par date
  const days = Array.from(map.entries()).sort((a,b) => {
    // reconstruire date depuis la première entrée de chaque groupe
    const da = fixtures.find(x => {
      const d = new Date(x.date);
      const l = `${weekdayFmt.format(d)}, ${dayMonthFmt.format(d)}`;
      return l === a[0];
    })?.date;
    const db = fixtures.find(x => {
      const d = new Date(x.date);
      const l = `${weekdayFmt.format(d)}, ${dayMonthFmt.format(d)}`;
      return l === b[0];
    })?.date;
    return new Date(da) - new Date(db);
  }).map(([label, arr]) => ({
    date: label,
    matches: arr.map(m => ({
      time: m.time,
      team1: m.team1,
      team2: m.team2,
      status: m.status,
      team1Score: m.team1Score ?? null,
      team2Score: m.team2Score ?? null,
      matchID: m.matchID ?? generateMatchID(matchday, m.team1, m.team2),
    }))
  }));

  return days;
}
