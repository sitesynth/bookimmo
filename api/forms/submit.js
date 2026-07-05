const ALLOWED_COLLECTIONS = new Set([
  'leads',
  'newsletter_leads',
])

function normalizePayload(body = {}) {
  const payload = {}

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null || value === '') continue
    payload[key] = value
  }

  return payload
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const collection = String(req.body?.tableName || '')
  if (!ALLOWED_COLLECTIONS.has(collection)) {
    return res.status(400).json({ error: 'Unsupported form target' })
  }

  const payload = normalizePayload(req.body?.data || {})
  if (!Object.keys(payload).length) {
    return res.status(400).json({ error: 'Form payload is empty' })
  }

  const directusUrl = process.env.VITE_DIRECTUS_URL || 'https://cms.book.immo'
  const directusToken = process.env.VITE_DIRECTUS_TOKEN || 'b837708aafa22fc40d6e86123329aa268f1065c4b582a1a75080b92e2406d3d0'

  try {
    const response = await fetch(`${directusUrl}/items/${collection}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(directusToken ? { Authorization: `Bearer ${directusToken}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : {}

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.errors?.[0]?.message || data?.error || 'Directus write failed',
      })
    }

    return res.status(200).json({ ok: true, item: data?.data || null })
  } catch (error) {
    return res.status(502).json({ error: error?.message || 'Upstream error' })
  }
}
