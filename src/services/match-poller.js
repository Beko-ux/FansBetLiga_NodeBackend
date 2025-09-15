import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMatchday, getFinishedIndex } from './footballData.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Config via .env ----------
const POLL_INTERVAL = Number(process.env.MATCH_POLL_INTERVAL_MS || 12 * 60 * 1000); // 12 min
const POLL_LEAGUES = String(process.env.POLL_LEAGUES || 'PL,BL1,PD,SA,FL1')
  .split(',').map(s => s.trim()).filter(Boolean);
const DEFAULT_SEASON = Number(process.env.DEFAULT_SEASON || new Date().getFullYear());
// Fenêtre autour de la journée courante (ex: 3 => MD-1, MD, MD+1)
const POLL_WINDOW_MD = Math.max(1, Number(process.env.POLL_WINDOW_MD || 3));
// Throttle: min gap entre appels FD (plan gratuit = 10 rpm => ~6000 ms)
const FD_MIN_INTERVAL_MS = Math.max(1000, Number(process.env.FD_MIN_INTERVAL_MS || 7000));

// Nombre de journées par ligue
export const MAX_MD_BY_LEAGUE = { PL: 38, BL1: 34, PD: 38, SA: 38, FL1: 34 };

// Dossiers cache/snapshots
const SNAP_ROOT = path.resolve(process.cwd(), 'cache', 'snapshots');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function withJitter(baseMs) {
  const jitter = Math.floor(Math.random() * 250); // +/- 0-250ms
  return baseMs + jitter;
}

let lastFdCallAt = 0;
async function throttleFd() {
  const now = Date.now();
  const wait = Math.max(0, (lastFdCallAt + FD_MIN_INTERVAL_MS) - now);
  if (wait > 0) await sleep(wait);
  lastFdCallAt = Date.now();
}

function categorizeDays(days = []) {
  const out = { finished: [], live: [], upcoming: [] };
  for (const d of days) {
    for (const m of (d.matches || [])) {
      const s = String(m.status || '').toLowerCase();
      const entry = { date: d.date, ...m };
      if (s === 'finished') out.finished.push(entry);
      else if (['in_play', 'live', 'paused', '1st_half', '2nd_half', 'ht', 'et', 'bt'].includes(s)) out.live.push(entry);
      else out.upcoming.push(entry);
    }
  }
  return out;
}

export function snapshotFilePath({ season, leagueCode, matchday }) {
  const dir = path.join(SNAP_ROOT, String(season), leagueCode);
  ensureDir(dir);
  return path.join(dir, `md-${matchday}.json`);
}

export function writeSnapshot({ season, leagueCode, matchday, data }) {
  const file = snapshotFilePath({ season, leagueCode, matchday });
  const payload = {
    season,
    league: leagueCode,
    matchday,
    generatedAt: new Date().toISOString(),
    ...categorizeDays(data?.days || []),
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf-8');
  return file;
}

function updateSnapshotIndex({ season, leagueCode, matchday }) {
  const dir = path.join(SNAP_ROOT, String(season));
  ensureDir(dir);
  const idxFile = path.join(dir, `index.json`);
  let idx = { season, updatedAt: null, leagues: {} };
  if (fs.existsSync(idxFile)) {
    try { idx = JSON.parse(fs.readFileSync(idxFile, 'utf-8')); } catch {}
  }
  if (!idx.leagues[leagueCode]) idx.leagues[leagueCode] = { matchdays: [] };
  if (!idx.leagues[leagueCode].matchdays.includes(matchday)) {
    idx.leagues[leagueCode].matchdays.push(matchday);
    idx.leagues[leagueCode].matchdays.sort((a, b) => a - b);
  }
  idx.updatedAt = new Date().toISOString();
  fs.writeFileSync(idxFile, JSON.stringify(idx, null, 2), 'utf-8');
}

/**
 * Appelle Football-Data avec throttle + retry/backoff si 429
 * IMPORTANT: on force le refresh (ignore le cache local).
 */
export async function safeGetMatchday(params) {
  let attempt = 0;
  let backoff = withJitter(FD_MIN_INTERVAL_MS);
  while (true) {
    try {
      await throttleFd();
      // 👉 forcer le refetch pour ne pas recycler une version "timed" ancienne
      return await getMatchday({ ...params, force: true });
    } catch (e) {
      const msg = String(e?.message || '');
      const is429 = msg.includes('Football-Data 429');
      if (!is429 || attempt >= 4) throw e; // retry seulement 429, max 5 tentatives
      attempt += 1;
      backoff = Math.min(backoff * 2, 60_000); // cap 60s
      console.warn(`[matchPoller] 429, retry in ${backoff}ms (attempt ${attempt})`);
      await sleep(backoff);
    }
  }
}

async function buildWindowMatchdays({ leagueCode, season }) {
  // lire la MD "courante" depuis l'index (calculée quand une MD est 100% finie)
  let current = 1;
  try {
    const idx = await getFinishedIndex({ league: leagueCode, season });
    current = Number(idx?.currentMatchday || 1);
  } catch {}
  const half = Math.floor(POLL_WINDOW_MD / 2);
  const maxMd = MAX_MD_BY_LEAGUE[leagueCode] ?? 38;

  const mds = new Set();
  for (let d = -half; d <= half; d += 1) {
    const md = current + d;
    if (md >= 1 && md <= maxMd) mds.add(md);
  }
  return Array.from(mds).sort((a, b) => a - b);
}

/** Utilitaire exporté : fabrique un snapshot pour une MD précise */
export async function buildSnapshotForMD({ season, leagueCode, matchday }) {
  const data = await safeGetMatchday({ league: leagueCode, season, matchday });
  const written = writeSnapshot({ season, leagueCode, matchday, data });
  updateSnapshotIndex({ season, leagueCode, matchday });
  return written;
}

export async function runOnce() {
  const season = Number(DEFAULT_SEASON || new Date().getFullYear());
  console.log(`[matchPoller] runOnce start — season=${season}, leagues=${POLL_LEAGUES.join(',')}`);

  for (const leagueCode of POLL_LEAGUES) {
    const mds = await buildWindowMatchdays({ leagueCode, season });
    for (const md of mds) {
      try {
        const written = await buildSnapshotForMD({ season, leagueCode, matchday: md });
        console.log(`[matchPoller] snapshot ${leagueCode} MD${md} -> ${path.relative(process.cwd(), written)}`);
        await sleep(withJitter(250));
      } catch (e) {
        console.error('[matchPoller] runOnce error for', leagueCode, 'MD', md, ':', e?.message || e);
      }
    }
  }

  console.log('[matchPoller] runOnce done');
}

let _timer = null;
export function start() {
  if (_timer) return;
  const autoBackfill = String(process.env.BACKFILL_AUTO || 'false').toLowerCase() === 'true';
  console.log(`[matchPoller] starting; interval=${POLL_INTERVAL}ms; minFdGap=${FD_MIN_INTERVAL_MS}ms; autoBackfill=${autoBackfill ? 'on' : 'off'}`);
  runOnce().catch(e => console.error('[matchPoller] first run error:', e?.message || e));
  _timer = setInterval(() => runOnce().catch(e => console.error('[matchPoller] run error:', e?.message || e)), POLL_INTERVAL);
}
export function stop() {
  if (_timer) clearInterval(_timer);
  _timer = null;
}

// Helpers pour les routes
export function readSnapshot({ season, league, matchday }) {
  const file = snapshotFilePath({ season, leagueCode: league, matchday });
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return null; }
}
export function readSnapshotIndex({ season }) {
  const file = path.join(SNAP_ROOT, String(season), 'index.json');
  if (!fs.existsSync(file)) return { season, updatedAt: null, leagues: {} };
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return { season, updatedAt: null, leagues: {} }; }
}
