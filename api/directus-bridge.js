const fs = require("fs/promises");
const path = require("path");

module.exports = async function handler(req, res) {
  try {
    const bridgePath = path.join(process.cwd(), "public", "directus-bridge.js");
    const content = await fs.readFile(bridgePath, "utf8");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.status(200).send(content);
  } catch (error) {
    return res.status(500).json({ error: "Failed to serve directus bridge" });
  }
};
