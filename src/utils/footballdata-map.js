// src/utils/footballdata-map.js
const MAP = {
  laliga:  { code: 'PD',   id: 2014 },
  premier: { code: 'PL',   id: 2021 },
  seriea:  { code: 'SA',   id: 2019 },
  ligue1:  { code: 'FL1',  id: 2015 },
  bundes:  { code: 'BL1',  id: 2002 },
};

export function mapLeagueToFootballData(slug) {
  const key = String(slug || '').toLowerCase();
  return MAP[key] || MAP.laliga;
}
