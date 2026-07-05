import { getLocationSeeds, suggestLocations } from '../_lib/is24.js'

export default async function handler(req, res) {
  const query = String(req.query.q || '').trim()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({
    query,
    items: suggestLocations(query),
    seeds: getLocationSeeds(),
    note: 'Official ImmoScout GeoAutoCompletion requires authenticated API access. This endpoint currently exposes verified project geocodes and supports manual custom geocode entry.',
  })
}
