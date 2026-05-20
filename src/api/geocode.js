// GovMap autocomplete client.
// Endpoint discovered via reverse-engineering: POST /api/search-service/autocomplete
// CORS verified: works cross-origin from arbitrary browsers.

const GOVMAP_AUTOCOMPLETE = 'https://www.govmap.gov.il/api/search-service/autocomplete';

// "גוש 30061 חלקה 4"  or  "גוש 30061ב חלקה 4"  -> { gush, helka }
const PARCEL_TEXT_RE = /גוש\s+([\dא-ת]+)\s+חלקה\s+(\d+)/;

export function extractGushHelkaFromText(text) {
  const m = (text || '').match(PARCEL_TEXT_RE);
  if (!m) return null;
  return { gush: m[1], helka: m[2] };
}

// Parse "POINT(x y)" — GovMap returns shape in EPSG:3857 (Web Mercator).
export function parsePoint(shape) {
  const m = (shape || '').match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

// Loose match for Jerusalem in result text.
const JERUSALEM_TOKENS = ['ירושלים', 'ירושלים,', 'jerusalem'];
export function isJerusalemAddress(text) {
  const low = (text || '').toLowerCase();
  return JERUSALEM_TOKENS.some((t) => low.includes(t.toLowerCase()));
}

/**
 * Query GovMap autocomplete. Returns normalized suggestions.
 * @param {string} searchText
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{id, type, text, point, gushHelka, raw}>>}
 */
export async function geocodeAutocomplete(searchText, signal) {
  const q = (searchText || '').trim();
  if (q.length < 2) return [];
  const res = await fetch(GOVMAP_AUTOCOMPLETE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchText: q, language: 'he' }),
    signal,
  });
  if (!res.ok) throw new Error(`GovMap autocomplete failed: ${res.status}`);
  const data = await res.json();
  const results = data?.results || [];
  return results.map((r) => ({
    id: r.id,
    type: r.type,
    text: r.text,
    originalText: r.originalText,
    score: r.score,
    point: parsePoint(r.shape),
    gushHelka: r.type === 'parcel' ? extractGushHelkaFromText(r.text) : null,
    raw: r,
  }));
}
