import { requireUser } from './_lib/auth.js'
import { proxyToBridge } from './_lib/bridge.js'
import { newId, query } from './_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const result = await query(
      'SELECT property_id, created_at FROM public.favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id],
    )
    return res.status(200).json({ items: result.rows })
  }

  if (req.method === 'POST') {
    const propertyId = String(req.body?.propertyId || '')
    if (!propertyId) return res.status(400).json({ error: 'propertyId is required' })
    await query(
      `INSERT INTO public.favorites (id, user_id, property_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, property_id) DO NOTHING`,
      [newId(), user.id, propertyId],
    )
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const propertyId = String(req.query.propertyId || req.body?.propertyId || '')
    if (!propertyId) return res.status(400).json({ error: 'propertyId is required' })
    await query('DELETE FROM public.favorites WHERE user_id = $1 AND property_id = $2', [user.id, propertyId])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
