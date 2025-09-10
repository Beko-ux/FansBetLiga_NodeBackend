// src/utils/footballdata-map.js
const MAP = {
  // slugs
  laliga:  { code: 'PD',  id: 2014 },
  premier: { code: 'PL',  id: 2021 },
  seriea:  { code: 'SA',  id: 2019 },
  ligue1:  { code: 'FL1', id: 2015 },
  bundes:  { code: 'BL1', id: 2002 },

  // codes
  pd: { code: 'PD', id: 2014 },
  pl: { code: 'PL', id: 2021 },
  sa: { code: 'SA', id: 2019 },
  fl1:{ code: 'FL1',id: 2015 },
  bl1:{ code: 'BL1',id: 2002 },

  // alias “collés”
  premierleague: { code: 'PL', id: 2021 },
  laligaespanola:{ code: 'PD', id: 2014 },
  bundesliga:    { code: 'BL1',id: 2002 },
  serieaitalia:  { code: 'SA', id: 2019 },
  ligue1france:  { code: 'FL1',id: 2015 },
};

export function mapLeagueToFootballData(input) {
  const raw   = String(input || '').trim();
  const upper = raw.toUpperCase();
  const key   = raw.toLowerCase();
  const norm  = key.replace(/[\s_-]+/g, ''); // "premier league" -> "premierleague"

  // codes (PL, BL1...) tolérés tels quels
  if (MAP[upper.toLowerCase()]) return MAP[upper.toLowerCase()];

  // clé directe
  if (MAP[key]) return MAP[key];

  // clé normalisée (gère espaces/traits d’union)
  if (MAP[norm]) return MAP[norm];

  return null; // inconnu -> la route renverra 400
}
