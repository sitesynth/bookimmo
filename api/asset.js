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

async function readIfExists(absPath) {
  try {
    const data = await fs.readFile(absPath);
    return { data, absPath };
  } catch {
    return null;
  }
}

function withForwardSlashes(p) {
  return String(p || '').replace(/\\/g, '/');
}

function rebuildVariantPath(rawPath, query) {
  let rebuilt = String(rawPath || '');
  if (!rebuilt.includes('__q_')) return rebuilt;

  const extra = [];
  if (query && typeof query.width === 'string' && query.width) extra.push(`width=${query.width}`);
  if (query && typeof query.height === 'string' && query.height) extra.push(`height=${query.height}`);
  if (query && typeof query['scale-down-to'] === 'string' && query['scale-down-to']) {
    extra.push(`scale-down-to=${query['scale-down-to']}`);
  }

  if (extra.length && !/[?&](width|height|scale-down-to)=/.test(rebuilt)) {
    rebuilt += `&${extra.join('&')}`;
  }

  return rebuilt;
}

function buildCandidates(requestedPath) {
  const candidates = [requestedPath];

  if (requestedPath.includes('&')) {
    candidates.push(requestedPath.replace(/&/g, '%26'));
  }

  if (requestedPath.includes('__q_')) {
    const base = requestedPath.split('__q_')[0];
    candidates.push(base);
  }

  return Array.from(new Set(candidates.map(withForwardSlashes)));
}

module.exports = async function handler(req, res) {
  const reqPath = req.query.path;
  if (!reqPath) return res.status(400).send('Missing path');

  const decoded = decodeURIComponent(String(reqPath));
  const rebuilt = rebuildVariantPath(decoded, req.query);
  const root = process.cwd();

  const allowed = rebuilt.startsWith('_local/') || rebuilt.startsWith('public/i18n/');
  if (!allowed) return res.status(403).send('Forbidden');

  const candidates = buildCandidates(rebuilt).filter((p) => p.startsWith('_local/') || p.startsWith('public/i18n/'));

  for (const relPath of candidates) {
    const absPath = safeResolve(root, relPath);
    if (!absPath) continue;

    const hit = await readIfExists(absPath);
    if (!hit) continue;

    const ext = path.extname(hit.absPath).toLowerCase();
    const type = CONTENT_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(hit.data);
  }

  return res.status(404).send('Not found');
};
