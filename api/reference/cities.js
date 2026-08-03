import { query } from '../_lib/db.js'
import { CITY_SEED } from '../_lib/reference-data.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const countryCode = String(req.query?.countryCode || req.query?.country || 'DE').trim().toUpperCase()
  const search = String(req.query?.q || '').trim()
  const limit = Math.min(Math.max(Number(req.query?.limit || 60), 1), 200)

  try {
    const params = [countryCode, limit]
    let sql = `
      SELECT id, country_code, name, region, slug, population
      FROM public.cities
      WHERE country_code = $1
        AND is_active = TRUE
    `

    if (search) {
      params.splice(1, 0, `%${search}%`)
      sql += `
        AND (
          name ILIKE $2
          OR region ILIKE $2
          OR slug ILIKE $2
        )
      `
      sql += `
        ORDER BY
          CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END ASC,
          population DESC NULLS LAST,
          name ASC
        LIMIT $3
      `
    } else {
      sql += `
        ORDER BY population DESC NULLS LAST, name ASC
        LIMIT $2
      `
    }

    const result = await query(sql, params)

    const cities = result.rows.length
      ? result.rows.map((row) => ({
          id: row.id,
          countryCode: row.country_code,
          name: row.name,
          region: row.region || '',
          slug: row.slug,
          population: row.population || null,
        }))
      : CITY_SEED
          .filter((row) => row.countryCode === countryCode)
          .filter((row) => {
            if (!search) return true
            const needle = search.toLowerCase()
            return [
              row.name,
              row.region,
              row.slug,
            ].some((value) => String(value || '').toLowerCase().includes(needle))
          })
          .sort((left, right) => {
            const populationDelta = Number(right.population || 0) - Number(left.population || 0)
            if (populationDelta !== 0) return populationDelta
            return left.name.localeCompare(right.name)
          })
          .slice(0, limit)

    return res.status(200).json({ cities })
  } catch (error) {
    console.error('reference_cities_failed', error)
    const fallbackCities = CITY_SEED
      .filter((row) => row.countryCode === countryCode)
      .filter((row) => {
        if (!search) return true
        const needle = search.toLowerCase()
        return [
          row.name,
          row.region,
          row.slug,
        ].some((value) => String(value || '').toLowerCase().includes(needle))
      })
      .sort((left, right) => {
        const populationDelta = Number(right.population || 0) - Number(left.population || 0)
        if (populationDelta !== 0) return populationDelta
        return left.name.localeCompare(right.name)
      })
      .slice(0, limit)

    return res.status(200).json({
      cities: fallbackCities,
      fallback: true,
    })
  }
}
