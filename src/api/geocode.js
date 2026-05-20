// GovMap autocomplete client.
// Endpoint discovered via reverse-engineering: POST /api/search-service/autocomplete
// CORS verified: works cross-origin from arbitrary browsers.

import proj4 from 'proj4';

const GOVMAP_AUTOCOMPLETE = 'https://www.govmap.gov.il/api/search-service/autocomplete';

// EPSG:2039 — Israeli Transverse Mercator (the system Jerusalem GIS uses).
proj4.defs(
  'EPSG:2039',
  '+proj=tmerc +lat_0=31.7343936111111 +lon_0=35.2045169444444 +k=1.00006700000 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=-48,55,52,0,0,0,0 +units=m +no_defs'
);

// Convert a Web Mercator (EPSG:3857) point — what GovMap returns — to ITM (EPSG:2039),
// which Jerusalem's GIS accepts via x/y query parameters.
export function webMercatorToItm({ x, y }) {
  const [itmX, itmY] = proj4('EPSG:3857', 'EPSG:2039', [x, y]);
  return { x: Math.round(itmX), y: Math.round(itmY) };
}

// "גוש 30061 חלקה 4"  or  "גוש 30061ב חלקה 4"  -> { gush, helka }
const PARCEL_TEXT_RE = /גוש\s+([\dא-ת]+)\s+חלקה\s+(\d+)/;

export function extractGushHelkaFromText(text) {
  const m = (text || '').match(PARCEL_TEXT_RE);
  if (!m) return null;
  return { gush: m[1], helka: m[2] };
}

// GovMap returns address text with city codes/abbreviations
// instead of full Hebrew city names. Normalize them back.
const CITY_ABBREVIATIONS = {
  'JRS': 'ירושלים',
  'YERUSALEM': 'ירושלים',
  'JERUSALEM': 'ירושלים',
  'הבירה': 'ירושלים',
  'TLV': 'תל אביב',
  'TELAVIV': 'תל אביב',
  'TEL_AVIV': 'תל אביב',
  'ASDOD': 'אשדוד',
  'ASHKELON': 'אשקלון',
  'BENEBERAQ': 'בני ברק',
  'NETANIYA': 'נתניה',
  'NETANYA': 'נתניה',
  'HAIFA': 'חיפה',
  'RAMATGAN': 'רמת גן',
  'PETACHTIKVA': 'פתח תקווה',
  'MAZKERETBATYA': 'מזכרת בתיה',
  'ביתרעילית': 'ביתר עילית',
};

export function normalizeText(text) {
  if (!text) return text;
  let out = text;
  for (const [abbr, full] of Object.entries(CITY_ABBREVIATIONS)) {
    // word-boundary replace (handle both English and Hebrew tokens)
    const re = new RegExp(`(^|\\s)${abbr}(\\s|$)`, 'gi');
    out = out.replace(re, `$1${full}$2`);
  }
  return out.trim().replace(/\s+/g, ' ');
}

export function isJerusalemText(text) {
  if (!text) return false;
  return /(?:^|\s)(?:ירושלים|JRS|YERUSALEM|JERUSALEM|הבירה)(?:\s|$|,)/i.test(text);
}

// Parse "POINT(x y)" — GovMap returns shape in EPSG:3857 (Web Mercator).
export function parsePoint(shape) {
  const m = (shape || '').match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

// Result type priority (lower = higher in UI list).
const TYPE_RANK = { parcel: 0, address: 1, street: 2, settlement: 3, neighborhood: 4, poi: 5, institutes: 6, junction: 7 };

/**
 * Query GovMap autocomplete. Returns normalized suggestions.
 * Results are reordered: Jerusalem first, then by type (parcel > address > street).
 * Text is normalized to expand abbreviations (JRS -> ירושלים etc.).
 *
 * @param {string} searchText
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{id, type, text, displayText, isJerusalem, point, gushHelka, raw}>>}
 */
/**
 * Resolve free-form text to query params Jerusalem GIS understands.
 * Tries, in order:
 *   1. Regex "גוש X חלקה Y" -> { gush, helka }
 *   2. GovMap autocomplete: first parcel result -> { gush, helka }
 *   3. GovMap autocomplete: first address/point result -> { x, y } in ITM (EPSG:2039)
 * Returns null if nothing matches at all.
 */
export async function resolveTextToGushHelka(text) {
  const direct = extractGushHelkaFromText(text);
  if (direct) return direct;

  const results = await geocodeAutocomplete(text).catch(() => []);
  const firstParcel = results.find((r) => r.gushHelka);
  if (firstParcel) return firstParcel.gushHelka;

  const firstWithPoint = results.find((r) => r.point);
  if (firstWithPoint) {
    const itm = webMercatorToItm(firstWithPoint.point);
    return { x: itm.x, y: itm.y, _label: firstWithPoint.displayText || firstWithPoint.text };
  }

  return null;
}

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

  const normalized = results.map((r) => {
    const isJer = isJerusalemText(r.text) || isJerusalemText(r.originalText);
    return {
      id: r.id,
      type: r.type,
      text: r.text,
      displayText: normalizeText(r.originalText || r.text),
      originalText: r.originalText,
      isJerusalem: isJer,
      score: r.score,
      point: parsePoint(r.shape),
      gushHelka: r.type === 'parcel' ? extractGushHelkaFromText(r.text) : null,
      raw: r,
    };
  });

  // Sort: Jerusalem first, then by type rank, then by score.
  normalized.sort((a, b) => {
    if (a.isJerusalem !== b.isJerusalem) return a.isJerusalem ? -1 : 1;
    const ra = TYPE_RANK[a.type] ?? 99;
    const rb = TYPE_RANK[b.type] ?? 99;
    if (ra !== rb) return ra - rb;
    return (b.score || 0) - (a.score || 0);
  });

  return normalized;
}
