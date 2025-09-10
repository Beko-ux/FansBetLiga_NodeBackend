// src/services/cache.service.js
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'cache'); // crée ./cache à la racine

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function cachePath(leagueCode, season, matchday) {
  const dir = path.join(ROOT, leagueCode, String(season));
  ensureDir(dir);
  return path.join(dir, `md-${matchday}.json`);
}

export function indexPath(leagueCode, season) {
  const dir = path.join(ROOT, leagueCode, String(season));
  ensureDir(dir);
  return path.join(dir, `index.json`); // { finished: [1,2,3], currentMatchday: 7, updatedAt: ... }
}

export function readJSONIfExists(p) {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}
