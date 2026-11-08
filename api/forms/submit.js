import { proxyToBridge } from '../_lib/bridge.js'
import { newId, query } from '../_lib/db.js'

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
  if (await proxyToBridge(req, res)) return
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

  try {
    const id = newId()
    await query(
      `INSERT INTO public.form_submissions (id, collection, payload) VALUES ($1, $2, $3::jsonb)`,
      [id, collection, JSON.stringify(payload)],
    )
    return res.status(200).json({ ok: true, id })
  } catch (error) {
    return res.status(500).json({ error: 'Could not save form' })
  }
}
