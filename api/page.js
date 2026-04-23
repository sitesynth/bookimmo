const fs = require("fs/promises");
const path = require("path");

const SUPPORTED = new Set(["de", "en", "fr", "it", "nl"]);

function normalizeLang(raw) {
  const lang = String(raw || "de").toLowerCase();
  return SUPPORTED.has(lang) ? lang : "de";
}

function localToRemote(html) {
  return html
    .replaceAll('<script src="/_local/cdn.framerauth.com/packages/sdk/live/latest/framerauth.js"></script>', "")
    .replaceAll('src="/public/directus-bridge.js"', 'src="/api/directus-bridge"')
    .replaceAll("/_local/framerusercontent.com/", "https://framerusercontent.com/")
    .replaceAll("/_local/framer.com/", "https://framer.com/")
    .replaceAll("/_local/fonts.gstatic.com/", "https://fonts.gstatic.com/");
}

module.exports = async function handler(req, res) {
  const lang = normalizeLang(req.query.lang);
  const filePath = path.join(process.cwd(), lang, "index.html");

  try {
    const html = await fs.readFile(filePath, "utf8");
    const output = localToRemote(html);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.status(200).send(output);
  } catch (error) {
    return res.status(500).send("Failed to render page");
  }
};
