// src/services/footballData.service.js
import fetch from 'node-fetch';
import { cachePath, indexPath, readJSONIfExists, writeJSON } from './cache.service.js';
import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

const BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALLDATA_KEY;

const headers = {
  'X-Auth-Token': API_KEY,
  'Accept': 'application/json'
};

// renvoie { days, resultSet, competition, league, leagueCode, season, matchday }
function normalizeMatchday(fdJson) {
  const leagueCode = fdJson?.competition?.code;
  const season = fdJson?.filters?.season;
  const matchday = Number(fdJson?.filters?.matchday || fdJson?.matches?.[0]?.matchday || 1);

  const daysMap = new Map();
  for (const m of fdJson.matches || []) {
    const isoDate = (m.utcDate || '').slice(0, 10); // YYYY-MM-DD
    if (!daysMap.has(isoDate)) daysMap.set(isoDate, []);
    daysMap.get(isoDate).push({
      matchID: m.id,
      time: new Date(m.utcDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      team1: m.homeTeam?.shortName || m.homeTeam?.name,
      team2: m.awayTeam?.shortName || m.awayTeam?.name,
      team1Id: m.homeTeam?.id,
      team2Id: m.awayTeam?.id,
      team1Logo: m.homeTeam?.crest || null,
      team2Logo: m.awayTeam?.crest || null,
      status: (m.status || '').toLowerCase(), // SCHEDULED, FINISHED…
      scoreA: m.score?.fullTime?.home ?? null,
      scoreB: m.score?.fullTime?.away ?? null,
      halfA: m.score?.halfTime?.home ?? null,
      halfB: m.score?.halfTime?.away ?? null,
    });
  }
  const days = Array.from(daysMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, matches]) => ({ date, matches }));

  return {
    league: fdJson?.competition?.name,
    leagueCode,
    season,
    matchday,
    resultSet: {
      count: fdJson?.resultSet?.count ?? (fdJson?.matches?.length || 0),
      first: days[0]?.date || null,
      last: days[days.length - 1]?.date || null,
      played: (fdJson?.matches || []).filter(x => x.status === 'FINISHED').length
    },
    competition: {
      id: fdJson?.competition?.id,
      name: fdJson?.competition?.name,
      code: leagueCode,
      emblem: fdJson?.competition?.emblem,
      areaFlag: fdJson?.area?.flag
    },
    days
  };
}

function allFinished(days) {
  const matches = days.flatMap(d => d.matches || []);
  return matches.length > 0 && matches.every(m => m.status === 'finished' || m.status === 'FINISHED');
}

export async function fetchMatchdayFromFootballData({ league, season, matchday }) {
  const comp = mapLeagueToFootballData(league); // ex { code:'PD', id:2014 }
  const url = `${BASE}/competitions/${comp.id}/matches?season=${season}&matchday=${matchday}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Football-Data ${resp.status}`);
  const json = await resp.json();
  return normalizeMatchday(json);
}

/**
 * Renvoie un matchday depuis le cache si disponible.
 * Sinon fetch Football-Data, met à jour le cache.
 * Si la journée est finie => snapshot disque + met à jour l'index.
 */
export async function getMatchday({ league, season, matchday }) {
  const comp = mapLeagueToFootballData(league);
  const p = cachePath(comp.code, season, matchday);
  const cached = readJSONIfExists(p);
  if (cached) return cached;

  // sinon, fetch
  const data = await fetchMatchdayFromFootballData({ league, season, matchday });

  // Ecrit le cache « live » (même si pas fini)
  writeJSON(p, data);

  // Si terminé : on met à jour l’index finished
  if (allFinished(data.days)) {
    const idxPath = indexPath(comp.code, season);
    const idx = readJSONIfExists(idxPath) || { finished: [], currentMatchday: null, updatedAt: null };
    if (!idx.finished.includes(matchday)) idx.finished.push(matchday);
    idx.finished.sort((a, b) => a - b);
    // currentMatchday = (max fini) + 1 (simplifié)
    idx.currentMatchday = Math.max(...idx.finished, 0) + 1;
    idx.updatedAt = new Date().toISOString();
    writeJSON(idxPath, idx);
  }

  return data;
}

export function getFinishedIndex({ league, season }) {
  const comp = mapLeagueToFootballData(league);
  const idx = readJSONIfExists(indexPath(comp.code, season)) || { finished: [], currentMatchday: 1, updatedAt: null };
  return { league: comp.code, season, ...idx };
}
