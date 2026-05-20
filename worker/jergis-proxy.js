// Cloudflare Worker — CORS-enabled reverse proxy to Jerusalem GIS API.
// Bypasses Akamai by sending requests from Cloudflare IPs with full browser-emulation headers.
// Deployed to: https://urbanplan-jergis.shalomkf.workers.dev

const TARGET = "https://jergisinfohub.jerusalem.muni.il/Services/api";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Id",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = TARGET + url.pathname + url.search;

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
        Referer:
          "https://jergisinfohub.jerusalem.muni.il/UI/GisMeidaT/index.html",
        "sec-ch-ua":
          '"Chromium";v="148", "Not)A;Brand";v="8", "Google Chrome";v="148"',
        "sec-ch-ua-platform": '"Windows"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });

    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
    headers.delete("content-encoding");
    headers.delete("content-length");

    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
