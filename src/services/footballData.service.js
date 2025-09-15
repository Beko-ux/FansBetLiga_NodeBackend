// // src/services/footballData.service.js
// import fetch from 'node-fetch';
// import { cachePath, indexPath, readJSONIfExists, writeJSON } from './cache.service.js';
// import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

// const BASE = 'https://api.football-data.org/v4';
// const API_KEY = process.env.FOOTBALLDATA_KEY;

// const headers = {
//   'X-Auth-Token': API_KEY,
//   'Accept': 'application/json'
// };

// // Normalisation du payload pour le front
// function normalizeMatchday(fdJson) {
//   const leagueCode = fdJson?.competition?.code;
//   const season = fdJson?.filters?.season;
//   const matchday = Number(fdJson?.filters?.matchday || fdJson?.matches?.[0]?.matchday || 1);

//   const daysMap = new Map();
//   for (const m of fdJson.matches || []) {
//     const isoDate = (m.utcDate || '').slice(0, 10); // YYYY-MM-DD
//     if (!daysMap.has(isoDate)) daysMap.set(isoDate, []);
//     daysMap.get(isoDate).push({
//       matchID: m.id,
//       time: new Date(m.utcDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
//       team1: m.homeTeam?.shortName || m.homeTeam?.name,
//       team2: m.awayTeam?.shortName || m.awayTeam?.name,
//       team1Id: m.homeTeam?.id,
//       team2Id: m.awayTeam?.id,
//       team1Logo: m.homeTeam?.crest || null,
//       team2Logo: m.awayTeam?.crest || null,
//       status: (m.status || '').toLowerCase(),
//       scoreA: m.score?.fullTime?.home ?? null,
//       scoreB: m.score?.fullTime?.away ?? null,
//       halfA: m.score?.halfTime?.home ?? null,
//       halfB: m.score?.halfTime?.away ?? null,
//     });
//   }

//   const days = Array.from(daysMap.entries())
//     .sort((a, b) => a[0].localeCompare(b[0]))
//     .map(([date, matches]) => ({ date, matches }));

//   return {
//     league: fdJson?.competition?.name,
//     leagueCode,
//     season,
//     matchday,
//     resultSet: {
//       count: fdJson?.resultSet?.count ?? (fdJson?.matches?.length || 0),
//       first: days[0]?.date || null,
//       last: days[days.length - 1]?.date || null,
//       played: (fdJson?.matches || []).filter(x => (x.status || '').toLowerCase() === 'finished').length
//     },
//     competition: {
//       id: fdJson?.competition?.id,
//       name: fdJson?.competition?.name,
//       code: leagueCode,
//       emblem: fdJson?.competition?.emblem,
//       areaFlag: fdJson?.area?.flag
//     },
//     days
//   };
// }

// function allFinished(days) {
//   const matches = days.flatMap(d => d.matches || []);
//   return matches.length > 0 && matches.every(m => (m.status || '').toLowerCase() === 'finished');
// }

// export async function fetchMatchdayFromFootballData({ league, season, matchday }) {
//   const comp = mapLeagueToFootballData(league);
//   if (!comp) {
//     const err = new Error(`Unsupported league "${league}". Use code (PL, BL1, PD, SA, FL1) or known names.`);
//     err.status = 400;
//     throw err;
//   }
//   // ⚠️ l’endpoint supporte /competitions/{CODE}/matches ... mais {id} marche aussi.
//   // On garde {id} car ton code existant l’utilise déjà.
//   const url = `${BASE}/competitions/${comp.id}/matches?season=${season}&matchday=${matchday}`;
//   const resp = await fetch(url, { headers });
//   if (!resp.ok) throw new Error(`Football-Data ${resp.status}`);
//   const json = await resp.json();
//   return normalizeMatchday(json);
// }

// /**
//  * Cache + index des journées finies
//  */
// export async function getMatchday({ league, season, matchday }) {
//   const comp = mapLeagueToFootballData(league);
//   if (!comp) {
//     const err = new Error(`Unsupported league "${league}".`);
//     err.status = 400;
//     throw err;
//   }

//   const p = cachePath(comp.code, season, matchday);
//   const cached = readJSONIfExists(p);
//   if (cached) return cached;

//   const data = await fetchMatchdayFromFootballData({ league, season, matchday });

//   writeJSON(p, data);

//   if (allFinished(data.days)) {
//     const idxPath = indexPath(comp.code, season);
//     const idx = readJSONIfExists(idxPath) || { finished: [], currentMatchday: null, updatedAt: null };
//     if (!idx.finished.includes(matchday)) idx.finished.push(matchday);
//     idx.finished.sort((a, b) => a - b);
//     idx.currentMatchday = Math.max(...idx.finished, 0) + 1;
//     idx.updatedAt = new Date().toISOString();
//     writeJSON(idxPath, idx);
//   }

//   return data;
// }

// export function getFinishedIndex({ league, season }) {
//   const comp = mapLeagueToFootballData(league);
//   if (!comp) {
//     return { league: null, season, finished: [], currentMatchday: 1, updatedAt: null };
//   }
//   const idx = readJSONIfExists(indexPath(comp.code, season)) || { finished: [], currentMatchday: 1, updatedAt: null };
//   return { league: comp.code, season, ...idx };
// }












// import fetch from 'node-fetch';
// import { cachePath, indexPath, readJSONIfExists, writeJSON } from './cache.service.js';
// import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

// const BASE = 'https://api.football-data.org/v4';
// const API_KEY = process.env.FOOTBALLDATA_KEY;

// const headers = {
//   'X-Auth-Token': API_KEY,
//   'Accept': 'application/json'
// };

// // Normalisation du payload pour le front
// function normalizeMatchday(fdJson) {
//   const leagueCode = fdJson?.competition?.code;
//   const season = fdJson?.filters?.season;
//   const matchday = Number(fdJson?.filters?.matchday || fdJson?.matches?.[0]?.matchday || 1);

//   const daysMap = new Map();
//   for (const m of fdJson.matches || []) {
//     const isoDate = (m.utcDate || '').slice(0, 10); // YYYY-MM-DD
//     if (!daysMap.has(isoDate)) daysMap.set(isoDate, []);
//     daysMap.get(isoDate).push({
//       matchID: m.id,
//       time: new Date(m.utcDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
//       team1: m.homeTeam?.shortName || m.homeTeam?.name,
//       team2: m.awayTeam?.shortName || m.awayTeam?.name,
//       team1Id: m.homeTeam?.id,
//       team2Id: m.awayTeam?.id,
//       team1Logo: m.homeTeam?.crest || null,
//       team2Logo: m.awayTeam?.crest || null,
//       status: (m.status || '').toLowerCase(),      // 'scheduled' | 'timed' | 'in_play' | 'paused' | 'finished' ...
//       scoreA: m.score?.fullTime?.home ?? null,
//       scoreB: m.score?.fullTime?.away ?? null,
//       halfA:  m.score?.halfTime?.home ?? null,
//       halfB:  m.score?.halfTime?.away ?? null,
//     });
//   }

//   const days = Array.from(daysMap.entries())
//     .sort((a, b) => a[0].localeCompare(b[0]))
//     .map(([date, matches]) => ({ date, matches }));

//   return {
//     league: fdJson?.competition?.name,
//     leagueCode,
//     season,
//     matchday,
//     resultSet: {
//       count: fdJson?.resultSet?.count ?? (fdJson?.matches?.length || 0),
//       first: days[0]?.date || null,
//       last: days[days.length - 1]?.date || null,
//       played: (fdJson?.matches || []).filter(x => (x.status || '').toLowerCase() === 'finished').length
//     },
//     competition: {
//       id: fdJson?.competition?.id,
//       name: fdJson?.competition?.name,
//       code: leagueCode,
//       emblem: fdJson?.competition?.emblem,
//       areaFlag: fdJson?.area?.flag
//     },
//     days
//   };
// }

// function allFinished(days) {
//   const matches = days.flatMap(d => d.matches || []);
//   return matches.length > 0 && matches.every(m => (m.status || '').toLowerCase() === 'finished');
// }

// export async function fetchMatchdayFromFootballData({ league, season, matchday }) {
//   const comp = mapLeagueToFootballData(league);
//   if (!comp) {
//     const err = new Error(`Unsupported league "${league}". Use code (PL, BL1, PD, SA, FL1) or known names.`);
//     err.status = 400;
//     throw err;
//   }
//   const url = `${BASE}/competitions/${comp.id}/matches?season=${season}&matchday=${matchday}`;
//   const resp = await fetch(url, { headers });
//   if (!resp.ok) throw new Error(`Football-Data ${resp.status}`);
//   const json = await resp.json();
//   return normalizeMatchday(json);
// }

// /**
//  * Cache + index des journées finies
//  * @param {{league:string, season:number, matchday:number, force?:boolean}} params
//  *   - force: si true, ignore le cache et refetch depuis Football-Data.
//  */
// export async function getMatchday({ league, season, matchday, force = false }) {
//   const comp = mapLeagueToFootballData(league);
//   if (!comp) {
//     const err = new Error(`Unsupported league "${league}".`);
//     err.status = 400;
//     throw err;
//   }

//   const p = cachePath(comp.code, season, matchday);

//   // 1) lire cache sauf si force=true
//   if (!force) {
//     const cached = readJSONIfExists(p);
//     if (cached) return cached;
//   }

//   // 2) fetch frais
//   const data = await fetchMatchdayFromFootballData({ league, season, matchday });

//   // 3) (ré)écrire le cache avec les données fraîches
//   writeJSON(p, data);

//   // 4) MAJ index si la journée est finie
//   if (allFinished(data.days)) {
//     const idxPath = indexPath(comp.code, season);
//     const idx = readJSONIfExists(idxPath) || { finished: [], currentMatchday: null, updatedAt: null };
//     if (!idx.finished.includes(matchday)) idx.finished.push(matchday);
//     idx.finished.sort((a, b) => a - b);
//     idx.currentMatchday = Math.max(...idx.finished, 0) + 1;
//     idx.updatedAt = new Date().toISOString();
//     writeJSON(idxPath, idx);
//   }

//   return data;
// }

// export function getFinishedIndex({ league, season }) {
//   const comp = mapLeagueToFootballData(league);
//   if (!comp) {
//     return { league: null, season, finished: [], currentMatchday: 1, updatedAt: null };
//   }
//   const idx = readJSONIfExists(indexPath(comp.code, season)) || { finished: [], currentMatchday: 1, updatedAt: null };
//   return { league: comp.code, season, ...idx };
// }










import fetch from 'node-fetch';
import { cachePath, indexPath, readJSONIfExists, writeJSON } from './cache.service.js';
import { mapLeagueToFootballData } from '../utils/footballdata-map.js';

const BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALLDATA_KEY;

const headers = {
  'X-Auth-Token': API_KEY,
  'Accept': 'application/json'
};

// Normalisation du payload pour le front
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
      status: (m.status || '').toLowerCase(),      // scheduled|timed|in_play|paused|finished…
      scoreA: m.score?.fullTime?.home ?? null,
      scoreB: m.score?.fullTime?.away ?? null,
      halfA:  m.score?.halfTime?.home ?? null,
      halfB:  m.score?.halfTime?.away ?? null,
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
      played: (fdJson?.matches || []).filter(x => (x.status || '').toLowerCase() === 'finished').length
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
  return matches.length > 0 && matches.every(m => (m.status || '').toLowerCase() === 'finished');
}

export async function fetchMatchdayFromFootballData({ league, season, matchday }) {
  const comp = mapLeagueToFootballData(league);
  if (!comp) {
    const err = new Error(`Unsupported league "${league}". Use code (PL, BL1, PD, SA, FL1) or known names.`);
    err.status = 400;
    throw err;
  }
  // L’API supporte l’ID ou le CODE; on conserve l’ID ici.
  const url = `${BASE}/competitions/${comp.id}/matches?season=${season}&matchday=${matchday}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Football-Data ${resp.status}`);
  const json = await resp.json();
  return normalizeMatchday(json);
}

/**
 * Cache + index des journées finies
 * @param {{league:string, season:number, matchday:number, force?:boolean}} params
 *   - force: si true, ignore le cache et refetch depuis Football-Data.
 */
export async function getMatchday({ league, season, matchday, force = false }) {
  const comp = mapLeagueToFootballData(league);
  if (!comp) {
    const err = new Error(`Unsupported league "${league}".`);
    err.status = 400;
    throw err;
  }

  const p = cachePath(comp.code, season, matchday);

  // 1) lire cache sauf si force=true
  if (!force) {
    const cached = readJSONIfExists(p);
    if (cached) return cached;
  }

  // 2) fetch frais
  const data = await fetchMatchdayFromFootballData({ league, season, matchday });

  // 3) (ré)écriture du cache
  writeJSON(p, data);

  // 4) MAJ index si la journée est finie
  if (allFinished(data.days)) {
    const idxPath = indexPath(comp.code, season);
    const idx = readJSONIfExists(idxPath) || { finished: [], currentMatchday: null, updatedAt: null };
    if (!idx.finished.includes(matchday)) idx.finished.push(matchday);
    idx.finished.sort((a, b) => a - b);
    idx.currentMatchday = Math.max(...idx.finished, 0) + 1;
    idx.updatedAt = new Date().toISOString();
    writeJSON(idxPath, idx);
  }

  return data;
}

export function getFinishedIndex({ league, season }) {
  const comp = mapLeagueToFootballData(league);
  if (!comp) {
    return { league: null, season, finished: [], currentMatchday: 1, updatedAt: null };
  }
  const idx = readJSONIfExists(indexPath(comp.code, season)) || { finished: [], currentMatchday: 1, updatedAt: null };
  return { league: comp.code, season, ...idx };
}
