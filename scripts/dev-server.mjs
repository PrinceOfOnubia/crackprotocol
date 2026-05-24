import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT || 8000);

const apiRoutes = {
  "/api/auth/register": "./api/auth/register.js",
  "/api/auth/login": "./api/auth/login.js",
  "/api/auth/logout": "./api/auth/logout.js",
  "/api/me": "./api/me.js",
  "/api/neo": "./api/neo.js",
  "/api/leaderboard": "./api/leaderboard.js",
  "/api/stats": "./api/stats.js",
  "/api/health": "./api/health.js"
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

async function serveStatic(req, res, url) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    res.setHeader("Content-Type", types[path.extname(filePath)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (apiRoutes[url.pathname]) {
    req.query = Object.fromEntries(url.searchParams.entries());
    const mod = await import(pathToFileURL(path.join(root, apiRoutes[url.pathname])));
    return mod.default(req, res);
  }
  return serveStatic(req, res, url);
});

server.listen(port, () => {
  console.log(`Crack Protocol dev server running at http://localhost:${port}`);
});
