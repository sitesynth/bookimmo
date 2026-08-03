import { proxyToBridge } from '../_lib/bridge.js'
import { query } from '../_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const result = await query(
      `SELECT code, name, priority
       FROM public.countries
       ORDER BY priority DESC, name ASC`,
    )

    return res.status(200).json({
      countries: result.rows.map((row) => ({
        code: row.code,
        name: row.name,
        priority: Number(row.priority || 0),
      })),
    })
  } catch (error) {
    console.error('reference_countries_failed', error)
    return res.status(500).json({ error: 'Could not load countries.' })
  }
}
