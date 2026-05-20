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

app.use(
  "/jergis",
  createProxyMiddleware({
    target: JERGIS_TARGET,
    changeOrigin: true,
    secure: false,
    on: {
      proxyReq(proxyReq) {
        proxyReq.setHeader("User-Agent", BROWSER_UA);
      },
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
      proxyReq(proxyReq) {
        proxyReq.setHeader("User-Agent", BROWSER_UA);
      },
    },
  })
);

const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(port, () => {
  console.log(`urbanplan-search listening on :${port}`);
});
