import { fetchIs24Listings } from '../_lib/is24.js'

function normalizeArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean)
  return String(value).split(',').map((item) => item.trim()).filter(Boolean)
}

export default async function handler(req, res) {
  try {
    const result = await fetchIs24Listings({
      geocodes: normalizeArray(req.query.geocodes),
      page: Number(req.query.page || 1),
      roomsMin: req.query.roomsMin,
      roomsMax: req.query.roomsMax,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,
      text: req.query.text,
    })

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({
      center: result.center,
      totalResults: result.totalResults,
      mapListings: result.mapListings,
    })
  } catch (error) {
    res.status(502).json({ error: 'is24_map_failed', detail: String(error) })
  }
}
