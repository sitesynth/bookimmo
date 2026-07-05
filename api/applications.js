import { requireUser } from './_lib/auth.js'
import { newId, query } from './_lib/db.js'

export default async function handler(req, res) {
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const result = await query(
      `SELECT id, property_id, status, cover_message, source_channel, created_at, updated_at
       FROM public.applications
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [user.id],
    )
    return res.status(200).json({ items: result.rows })
  }

  if (req.method === 'POST') {
    const { propertyId, status = 'draft', coverMessage = null, sourceChannel = 'client_cabinet_search' } = req.body || {}
    if (!propertyId) return res.status(400).json({ error: 'propertyId is required' })

    const id = newId()
    await query(
      `INSERT INTO public.applications (id, user_id, property_id, status, cover_message, source_channel, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (user_id, property_id) DO UPDATE SET
         status = EXCLUDED.status,
         cover_message = EXCLUDED.cover_message,
         source_channel = EXCLUDED.source_channel,
         updated_at = NOW()`,
      [id, user.id, String(propertyId), status, coverMessage, sourceChannel],
    )
    const result = await query(
      `SELECT id, property_id, status, cover_message, source_channel, created_at, updated_at
       FROM public.applications
       WHERE user_id = $1 AND property_id = $2
       LIMIT 1`,
      [user.id, String(propertyId)],
    )
    return res.status(200).json({ item: result.rows[0] })
  }

  if (req.method === 'PUT') {
    const { id, status, coverMessage } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id is required' })

    await query(
      `UPDATE public.applications
       SET status = COALESCE($3, status),
           cover_message = COALESCE($4, cover_message),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [String(id), user.id, status ?? null, coverMessage ?? null],
    )
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
