import { query } from '../_lib/db.js'
import { COUNTRY_SEED } from '../_lib/reference-data.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const result = await query(
      `SELECT code, name, priority
       FROM public.countries
       ORDER BY priority DESC, name ASC`,
    )

    const countries = result.rows.length
      ? result.rows.map((row) => ({
          code: row.code,
          name: row.name,
          priority: Number(row.priority || 0),
        }))
      : COUNTRY_SEED.map((row) => ({
          code: row.code,
          name: row.name,
          priority: Number(row.priority || 0),
        }))

    return res.status(200).json({ countries })
  } catch (error) {
    console.error('reference_countries_failed', error)
    return res.status(200).json({
      countries: COUNTRY_SEED.map((row) => ({
        code: row.code,
        name: row.name,
        priority: Number(row.priority || 0),
      })),
      fallback: true,
    })
  }
}
