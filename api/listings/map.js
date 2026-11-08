import { proxyToBridge } from '../_lib/bridge.js'
import { getMapPoints } from '../_lib/listings-cache.js'

function toFeature(row) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Number(row.lon), Number(row.lat)] },
    properties: {
      id: `${row.source}:${row.external_id}`,
      source: row.source,
      price: row.price === null ? null : Number(row.price),
      rooms: row.rooms === null ? null : Number(row.rooms),
      areaSqm: row.area_sqm === null ? null : Number(row.area_sqm),
      exclusive: Boolean(row.is_exclusive),
    },
  }
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { rows, truncated } = await getMapPoints(req.query || {})
    const features = rows.map(toFeature)

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({
      listings: { type: 'FeatureCollection', features: features.filter((item) => !item.properties.exclusive) },
      exclusives: { type: 'FeatureCollection', features: features.filter((item) => item.properties.exclusive) },
      truncated,
    })
  } catch (error) {
    return res.status(500).json({ error: 'listings_map_failed' })
  }
}
