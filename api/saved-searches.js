import { requireUser } from './_lib/auth.js'
import { proxyToBridge } from './_lib/bridge.js'
import { newId, query } from './_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const result = await query(
      `SELECT id, name, filters, notifications_enabled, created_at, updated_at
       FROM public.saved_searches
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 8`,
      [user.id],
    )
    return res.status(200).json({ items: result.rows })
  }

  if (req.method === 'POST') {
    const { id, name, filters = {}, notificationsEnabled = false } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name is required' })

    const searchId = id || newId()
    await query(
      `INSERT INTO public.saved_searches (id, user_id, name, filters, notifications_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         filters = EXCLUDED.filters,
         notifications_enabled = EXCLUDED.notifications_enabled,
         updated_at = NOW()`,
      [searchId, user.id, name, JSON.stringify(filters), Boolean(notificationsEnabled)],
    )
    const result = await query(
      `SELECT id, name, filters, notifications_enabled, created_at, updated_at
       FROM public.saved_searches WHERE id = $1 LIMIT 1`,
      [searchId],
    )
    return res.status(200).json({ item: result.rows[0] })
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || req.body?.id || '')
    if (!id) return res.status(400).json({ error: 'id is required' })
    await query('DELETE FROM public.saved_searches WHERE id = $1 AND user_id = $2', [id, user.id])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
