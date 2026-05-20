// Cloudflare Worker — CORS-enabled reverse proxy + aggregator for Jerusalem GIS.
// Two roles:
//   1. Bypass Akamai (Cloudflare IPs aren't on their data-center blocklist)
//      and emulate a real browser request.
//   2. Run the full 33-call planning lookup colocated in Cloudflare's edge so
//      the browser does one round-trip instead of 33. Cache aggregated
//      responses at the edge for repeat queries.

const TARGET = "https://jergisinfohub.jerusalem.muni.il/Services/api";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Id",
  "Access-Control-Max-Age": "86400",
};

function browserHeaders() {
  return {
    "User-Agent": BROWSER_UA,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    Referer: "https://jergisinfohub.jerusalem.muni.il/UI/GisMeidaT/index.html",
    "sec-ch-ua":
      '"Chromium";v="148", "Not)A;Brand";v="8", "Google Chrome";v="148"',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
  };
}

async function fetchUpstream(path, init = {}) {
  const upstream = await fetch(TARGET + path, {
    method: init.method || "GET",
    headers: browserHeaders(),
    body: init.body,
    // Let Cloudflare cache identical upstream calls between edge invocations.
    cf: { cacheTtl: 600, cacheEverything: true },
  });
  return upstream;
}

async function fetchUpstreamJson(path) {
  const r = await fetchUpstream(path);
  if (!r.ok) return null;
  const t = await r.text();
  if (!t) return null;
  try { return JSON.parse(t); } catch { return null; }
}

function jsonResponse(body, init = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    ...CORS_HEADERS,
    ...(init.headers || {}),
  });
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers,
  });
}

function buildLocationQuery(url) {
  // Only forward the location-defining params (gush/helka/x/y/...) to upstream.
  const sp = new URLSearchParams();
  const allowed = [
    "gush", "helka", "x", "y", "street", "house",
    "taba", "migrash", "schuna",
    "xMin", "yMin", "xMax", "yMax",
  ];
  for (const k of allowed) {
    const v = url.searchParams.get(k);
    if (v !== null && v !== "") sp.append(k, v);
  }
  return sp.toString();
}

async function aggregate(url) {
  const q = buildLocationQuery(url);
  if (!q) {
    return jsonResponse({ error: "missing location params" }, { status: 400 });
  }

  const [generalInfo, categoriesList] = await Promise.all([
    fetchUpstreamJson(`/GetGeneralInfo?${q}`),
    fetchUpstreamJson(`/MetaDataObjects?${q}`),
  ]);

  const ids = Array.isArray(categoriesList)
    ? categoriesList.map((c) => c.IdInformMain)
    : [];

  const categories = await Promise.all(
    ids.map(async (id) => {
      const [details, fields, subTopics] = await Promise.all([
        fetchUpstreamJson(`/MetaDataObjectsDetails/${id}?${q}`),
        fetchUpstreamJson(`/MetaDataFields/${id}`),
        fetchUpstreamJson(`/GetSubTopic/${id}`).catch(() => null),
      ]);
      return {
        id,
        name: details?.gisObjectName ?? null,
        label: details?.gisObjectAlias ?? null,
        showByDefault: details?.gisShowTableByDefault ?? true,
        records: details?.gisDataObject ?? [],
        fields: fields ?? [],
        subTopics: subTopics ?? [],
      };
    })
  );

  return jsonResponse({
    generalInfo,
    availableIds: ids,
    categories,
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Aggregated endpoint: one round-trip for the full planning lookup.
    if (url.pathname === "/all") {
      return aggregate(url);
    }

    // Default behaviour: transparent reverse-proxy to /Services/api/*.
    const upstream = await fetchUpstream(url.pathname + url.search, {
      method: request.method,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });

    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
    headers.set("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
    headers.delete("content-encoding");
    headers.delete("content-length");
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
