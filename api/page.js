const fs = require("fs/promises");
const path = require("path");

const SUPPORTED = new Set(["de", "en", "fr", "it", "nl"]);

function normalizeLang(raw) {
  const lang = String(raw || "de").toLowerCase();
  return SUPPORTED.has(lang) ? lang : "de";
}

module.exports = async function handler(req, res) {
  const lang = normalizeLang(req.query.lang);
  const filePath = path.join(process.cwd(), lang, "index.html");

  try {
    const html = await fs.readFile(filePath, "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).send("Failed to render page");
  }
};
