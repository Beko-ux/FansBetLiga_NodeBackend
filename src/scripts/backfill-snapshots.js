import 'dotenv/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  MAX_MD_BY_LEAGUE,
  buildSnapshotForMD,
  snapshotFilePath,
} from '../services/match-poller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paramètres
const SEASON = Number(
  process.env.BACKFILL_SEASON || process.env.DEFAULT_SEASON || new Date().getFullYear()
);
const LEAGUES = String(
  process.env.BACKFILL_LEAGUES || process.env.POLL_LEAGUES || 'PL,BL1,PD,SA,FL1'
).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

// NEW: respect de BACKFILL_OVERWRITE
const OVERWRITE = String(process.env.BACKFILL_OVERWRITE || 'false').toLowerCase() === 'true';

function existsSnapshot({ season, leagueCode, matchday }) {
  const p = snapshotFilePath({ season, leagueCode, matchday });
  return fs.existsSync(p);
}

async function backfillLeague(leagueCode) {
  const maxMd = MAX_MD_BY_LEAGUE[leagueCode] ?? 38;
  console.log(`\n[backfill] ${leagueCode} — season ${SEASON} — MD 1..${maxMd}`);

  for (let md = 1; md <= maxMd; md += 1) {
    const already = existsSnapshot({ season: SEASON, leagueCode, matchday: md });

    if (already && !OVERWRITE) {
      console.log(`[backfill] skip ${leagueCode} MD${md} (exists)`);
      continue;
    }

    try {
      const file = await buildSnapshotForMD({ season: SEASON, leagueCode, matchday: md });
      console.log(`[backfill] wrote ${leagueCode} MD${md} -> ${path.relative(process.cwd(), file)}`);
    } catch (e) {
      const msg = e?.message || String(e);
      console.error(`[backfill] error on ${leagueCode} MD${md}: ${msg}`);
    }
  }
}

(async () => {
  console.log(`[backfill] start — season=${SEASON}, leagues=${LEAGUES.join(',')}, overwrite=${OVERWRITE}`);
  for (const lg of LEAGUES) {
    await backfillLeague(lg);
  }
  console.log('[backfill] done');
})();
