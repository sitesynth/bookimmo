import { fetchIs24Listings, findLocationById } from '../_lib/is24.js'
import { fetchImmoweltListings } from '../_lib/immowelt.js'
import { upsertListingsCache } from '../_lib/listings-cache.js'

function normalizeArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean)
  return String(value).split(',').map((item) => item.trim()).filter(Boolean)
}

export default async function handler(req, res) {
  try {
    const geocodes = normalizeArray(req.query.geocodes)
    const params = {
      geocodes,
      page: Number(req.query.page || 1),
      roomsMin: req.query.roomsMin,
      roomsMax: req.query.roomsMax,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,
      text: req.query.text,
    }
    const [is24Result, immoweltResult] = await Promise.allSettled([
      fetchIs24Listings(params),
      fetchImmoweltListings(params),
    ])

    const primary = is24Result.status === 'fulfilled'
      ? is24Result.value
      : {
          pageNumber: params.page,
          numberOfPages: 1,
          totalResults: 0,
          listings: [],
          mapListings: [],
          center: null,
        }

    const secondary = immoweltResult.status === 'fulfilled'
      ? immoweltResult.value
      : {
          totalResults: 0,
          listings: [],
          mapListings: [],
        }

    const result = {
      ...primary,
      listings: [...primary.listings, ...secondary.listings],
      mapListings: [...primary.mapListings, ...(secondary.mapListings || [])],
      totalResults: Number(primary.totalResults || 0) + Number(secondary.totalResults || 0),
      sourceSummary: {
        is24: is24Result.status === 'fulfilled' ? primary.listings.length : 0,
        immowelt: immoweltResult.status === 'fulfilled' ? secondary.listings.length : 0,
      },
      warnings: [
        is24Result.status === 'rejected' ? `is24: ${String(is24Result.reason)}` : '',
        immoweltResult.status === 'rejected' ? `immowelt: ${String(immoweltResult.reason)}` : '',
      ].filter(Boolean),
    }

    try {
      await upsertListingsCache(result.listings)
    } catch (cacheError) {
      result.warnings.push(`listings_cache: ${String(cacheError)}`)
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({
      ...result,
      selectedLocations: geocodes.map((id) => findLocationById(id) || { id, label: `Custom geocode ${id}`, kind: 'custom' }),
    })
  } catch (error) {
    res.status(502).json({ error: 'is24_search_failed', detail: String(error) })
  }
}
