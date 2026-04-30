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

function toSlash(p) {
  return String(p || '').replace(/\\/g, '/');
}

function decodeSafe(v) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function encodeVariantTail(tail) {
  // Keep Framer-style filename encoding in __q_ suffix.
  return tail.replace(/=/g, '%3D').replace(/&/g, '%26').replace(/\?/g, '%3F');
}

function expandPathCandidates(rawPath, query) {
  const out = new Set();

  const baseCandidates = new Set([String(rawPath || ''), decodeSafe(String(rawPath || ''))]);

  for (const basePath of baseCandidates) {
    if (!basePath) continue;

    // If query parser split width/height out of path, restore tail parameters.
    let restored = basePath;
    const extra = [];
    if (typeof query['scale-down-to'] === 'string' && query['scale-down-to']) extra.push(`scale-down-to=${query['scale-down-to']}`);
    if (typeof query.width === 'string' && query.width) extra.push(`width=${query.width}`);
    if (typeof query.height === 'string' && query.height) extra.push(`height=${query.height}`);

    if (extra.length && restored.includes('__q_') && !/[?&](scale-down-to|width|height)=/.test(restored)) {
      restored = `${restored}&${extra.join('&')}`;
    }

    out.add(restored);
    out.add(restored.replace(/&/g, '%26'));

    if (!restored.includes('__q_')) continue;

    const [head, tailRaw] = restored.split('__q_');
    const tailDecoded = decodeSafe(tailRaw);

    // Framer encoded form + decoded form.
    out.add(`${head}__q_${tailDecoded}`);
    out.add(`${head}__q_${encodeVariantTail(tailDecoded)}`);

    // Fallback to original source asset without Framer transform suffix.
    out.add(head);
  }

  return [...out].map(toSlash);
}

module.exports = async function handler(req, res) {
  const reqPath = req.query.path;
  if (!reqPath) return res.status(400).send('Missing path');

  const root = process.cwd();
  const requested = expandPathCandidates(reqPath, req.query)
    .filter((p) => p.startsWith('_local/') || p.startsWith('public/i18n/'));

  if (!requested.length) return res.status(403).send('Forbidden');

  for (const relPath of requested) {
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
