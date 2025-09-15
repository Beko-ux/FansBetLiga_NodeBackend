// // src/scripts/backfill-snapshots.js
// import 'dotenv/config.js';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { MAX_MD_BY_LEAGUE, buildSnapshotForMD, snapshotFilePath, safeGetMatchday } from '../services/match-poller.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Paramètres
// const SEASON = Number(process.env.BACKFILL_SEASON || process.env.DEFAULT_SEASON || new Date().getFullYear());
// const LEAGUES = String(process.env.BACKFILL_LEAGUES || process.env.POLL_LEAGUES || 'PL,BL1,PD,SA,FL1')
//   .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

// function existsSnapshot({ season, leagueCode, matchday }) {
//   const p = snapshotFilePath({ season, leagueCode, matchday });
//   return fs.existsSync(p);
// }

// async function backfillLeague(leagueCode) {
//   const maxMd = MAX_MD_BY_LEAGUE[leagueCode] ?? 38;
//   console.log(`\n[backfill] ${leagueCode} — season ${SEASON} — MD 1..${maxMd}`);

//   for (let md = 1; md <= maxMd; md += 1) {
//     const already = existsSnapshot({ season: SEASON, leagueCode, matchday: md });
//     if (already) {
//       console.log(`[backfill] skip ${leagueCode} MD${md} (exists)`);
//       continue;
//     }
//     try {
//       // buildSnapshotForMD inclut le throttle + retry via safeGetMatchday()
//       const file = await buildSnapshotForMD({ season: SEASON, leagueCode, matchday: md });
//       console.log(`[backfill] wrote ${leagueCode} MD${md} -> ${path.relative(process.cwd(), file)}`);
//     } catch (e) {
//       const msg = e?.message || String(e);
//       console.error(`[backfill] error on ${leagueCode} MD${md}: ${msg}`);
//       // Si 429, safeGetMatchday fait déjà un backoff; on relance la boucle sur md+1
//     }
//   }
// }

// (async () => {
//   console.log(`[backfill] start — season=${SEASON}, leagues=${LEAGUES.join(',')}`);
//   for (const lg of LEAGUES) {
//     await backfillLeague(lg);
//   }
//   console.log('[backfill] done');
// })();



// src/scripts/backfill-snapshots.js
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
const SEASON = Number(process.env.BACKFILL_SEASON || process.env.DEFAULT_SEASON || new Date().getFullYear());
const LEAGUES = String(process.env.BACKFILL_LEAGUES || process.env.POLL_LEAGUES || 'PL,BL1,PD,SA,FL1')
  .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

// Si true => on RÉÉCRIT les snapshots déjà présents. Si false => on saute ceux déjà présents.
const OVERWRITE = String(process.env.BACKFILL_OVERWRITE || 'false').toLowerCase() === 'true';

function existsSnapshot({ season, leagueCode, matchday }) {
  const p = snapshotFilePath({ season, leagueCode, matchday });
  return fs.existsSync(p);
}

async function backfillLeague(leagueCode) {
  const maxMd = MAX_MD_BY_LEAGUE[leagueCode] ?? 38;
  console.log(`\n[backfill] ${leagueCode} — season ${SEASON} — MD 1..${maxMd} ${OVERWRITE ? '(overwrite)' : ''}`);

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
      // safeGetMatchday (appelé à l’intérieur) fait déjà throttle + retry/backoff sur 429.
      // On enchaîne sur la MD suivante.
    }
  }
}

(async () => {
  try {
    console.log(`[backfill] start — season=${SEASON}, leagues=${LEAGUES.join(',')}`);
    for (const lg of LEAGUES) {
      await backfillLeague(lg);
    }
    console.log('[backfill] done');
    process.exit(0);
  } catch (e) {
    console.error('[backfill] fatal:', e?.message || e);
    process.exit(1);
  }
})();
