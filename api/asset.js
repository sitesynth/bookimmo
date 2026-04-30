const fs = require("fs/promises");
const path = require("path");

const MIME = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".mjs", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
  [".woff", "font/woff"],
  [".ttf", "font/ttf"]
]);

function normalize(rawPath) {
  const p = String(rawPath || "").replace(/^\/+/, "");
  const abs = path.resolve(process.cwd(), p);
  const root = path.resolve(process.cwd());
  if (!abs.startsWith(root)) return null;
  return abs;
}

module.exports = async function handler(req, res) {
  const raw = req.query.path;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const abs = normalize(requested);

  if (!requested || !abs) {
    return res.status(400).send("Invalid asset path");
  }

  try {
    const data = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    res.setHeader("Content-Type", MIME.get(ext) || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(data);
  } catch {
    return res.status(404).send("Asset not found");
  }
};
