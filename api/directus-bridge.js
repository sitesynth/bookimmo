module.exports = async function handler(req, res) {
  const fs = require('fs');
  const path = require('path');

  // Read the directus-bridge.js from public
  const bridgePath = path.join(process.cwd(), 'public', 'directus-bridge.js');

  try {
    const content = fs.readFileSync(bridgePath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(content);
  } catch (error) {
    console.error('[directus-bridge] failed to read bridge:', error);
    return res.status(500).json({ error: 'Failed to serve directus bridge' });
  }
};
