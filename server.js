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

// Akamai is picky — emulate a real browser request from the Jerusalem GIS UI.
function applyBrowserHeaders(proxyReq) {
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
  // Drop headers that mark this as a proxied request
  proxyReq.removeHeader("x-forwarded-for");
  proxyReq.removeHeader("x-forwarded-proto");
  proxyReq.removeHeader("x-forwarded-host");
  proxyReq.removeHeader("x-real-ip");
  proxyReq.removeHeader("via");
  proxyReq.removeHeader("forwarded");
  proxyReq.removeHeader("render-proxy-ttl");
}

app.use(
  "/jergis",
  createProxyMiddleware({
    target: JERGIS_TARGET,
    changeOrigin: true,
    secure: false,
    on: {
      proxyReq: applyBrowserHeaders,
    },
  })
);

app.use(
  "/api",
  createProxyMiddleware({
    target: BASE44_TARGET,
    changeOrigin: true,
    secure: false,
    on: {
      proxyReq: applyBrowserHeaders,
    },
  })
);

const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(port, () => {
  console.log(`urbanplan-search listening on :${port}`);
});
