const fs = require('fs/promises');
const path = require('path');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8'
};

function safeResolve(root, requestedPath) {
  const cleaned = String(requestedPath || '').replace(/^\/+/, '');
  const abs = path.resolve(root, cleaned);
  if (!abs.startsWith(root)) return null;
  return abs;
}

module.exports = async function handler(req, res) {
  const reqPath = req.query.path;
  if (!reqPath) return res.status(400).send('Missing path');

  const decoded = decodeURIComponent(String(reqPath));
  const root = process.cwd();

  // Allow only assets under _local/ and public/i18n/
  const allowed = decoded.startsWith('_local/') || decoded.startsWith('public/i18n/');
  if (!allowed) return res.status(403).send('Forbidden');

  const absPath = safeResolve(root, decoded);
  if (!absPath) return res.status(400).send('Bad path');

  try {
    const data = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const type = CONTENT_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(data);
  } catch (err) {
    return res.status(404).send('Not found');
  }
};
