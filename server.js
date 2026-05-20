import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 10000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

const JERGIS_TARGET = "https://jergisinfohub.jerusalem.muni.il/Services/api";
const BASE44_TARGET =
  process.env.BASE44_PROXY_TARGET ||
  "https://preview-sandbox--6a0d20f18fd94e616eb3512d.base44.app";

function stripProxyMarkers(proxyReq) {
  proxyReq.removeHeader("x-forwarded-for");
  proxyReq.removeHeader("x-forwarded-proto");
  proxyReq.removeHeader("x-forwarded-host");
  proxyReq.removeHeader("x-real-ip");
  proxyReq.removeHeader("via");
  proxyReq.removeHeader("forwarded");
  proxyReq.removeHeader("render-proxy-ttl");
}

// Akamai on jergisinfohub is picky — emulate a Chrome request from the GIS UI.
function jergisHeaders(proxyReq) {
  proxyReq.setHeader("User-Agent", BROWSER_UA);
  proxyReq.setHeader("Accept", "application/json, text/plain, */*");
  proxyReq.setHeader("Accept-Language", "he-IL,he;q=0.9,en;q=0.8");
  proxyReq.setHeader(
    "Referer",
    "https://jergisinfohub.jerusalem.muni.il/UI/GisMeidaT/index.html"
  );
  proxyReq.setHeader(
    "sec-ch-ua",
    '"Chromium";v="148", "Not)A;Brand";v="8", "Google Chrome";v="148"'
  );
  proxyReq.setHeader("sec-ch-ua-platform", '"Windows"');
  proxyReq.setHeader("sec-ch-ua-mobile", "?0");
  proxyReq.setHeader("sec-fetch-site", "same-origin");
  proxyReq.setHeader("sec-fetch-mode", "cors");
  proxyReq.setHeader("sec-fetch-dest", "empty");
  stripProxyMarkers(proxyReq);
}

// For base44, pass through whatever the client sent and only sanitize.
function base44Headers(proxyReq) {
  stripProxyMarkers(proxyReq);
}

app.use(
  "/jergis",
  createProxyMiddleware({
    target: JERGIS_TARGET,
    changeOrigin: true,
    secure: false,
    on: { proxyReq: jergisHeaders },
  })
);

app.use(
  "/api",
  createProxyMiddleware({
    target: BASE44_TARGET,
    changeOrigin: true,
    secure: false,
    on: { proxyReq: base44Headers },
  })
);

const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(port, () => {
  console.log(`urbanplan-search listening on :${port}`);
});
