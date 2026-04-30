const DEFAULT_DIRECTUS_BASE = "https://cms.book.immo";

function getDirectusBase() {
  const raw = process.env.DIRECTUS_BASE_URL || DEFAULT_DIRECTUS_BASE;
  return raw.replace(/\/$/, "");
}

function buildUpstreamUrl(path, query) {
  if (!path || !path.startsWith("/")) {
    return null;
  }
  const base = getDirectusBase();
  const upstream = new URL(base + path);
  if (query && typeof query === "string" && query.length > 0) {
    upstream.search = query;
  }
  return upstream.toString();
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const path = req.query.path;
  const query = req.query.query || "";
  const upstreamUrl = buildUpstreamUrl(path, query);

  if (!upstreamUrl) {
    return res.status(400).json({ error: "Invalid path. Use /items/... path." });
  }

  const token = process.env.DIRECTUS_API_TOKEN;
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (req.method === "POST") headers["Content-Type"] = "application/json";

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.method === "POST" ? JSON.stringify(req.body || {}) : undefined
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(text);
  } catch (error) {
    return res.status(502).json({ error: "Directus proxy failed", detail: String(error) });
  }
};
