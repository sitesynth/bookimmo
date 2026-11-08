import { proxyToBridge } from '../_lib/bridge.js'
import { fetchIs24Listings, findLocationById, getLocationSeeds } from '../_lib/is24.js'
import { fetchImmoweltListings } from '../_lib/immowelt.js'
import { searchForUi, upsertListingsCache } from '../_lib/listings-cache.js'

const PAGE_SIZE = 50

const CITY_CENTERS = {
  Berlin: { lat: 52.52, lon: 13.405, zoom: 10.5 },
  Hamburg: { lat: 53.5511, lon: 9.9937, zoom: 10.5 },
  'München': { lat: 48.1374, lon: 11.5755, zoom: 10.5 },
  'Köln': { lat: 50.9375, lon: 6.9603, zoom: 10.5 },
  'Frankfurt am Main': { lat: 50.1109, lon: 8.6821, zoom: 10.5 },
}

// Cities we crawl into our own database: served from there instead of live provider calls.
function resolveCrawledCities(geocodes) {
  if (!geocodes.length) return []
  const seeds = getLocationSeeds().filter((seed) => seed.kind === 'city')
  const cities = geocodes.map((id) => seeds.find((seed) => String(seed.id) === String(id))?.city)
  return cities.every(Boolean) ? cities : []
}

function normalizeArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean)
  return String(value).split(',').map((item) => item.trim()).filter(Boolean)
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  try {
    const geocodes = normalizeArray(req.query.geocodes)

    const crawledCities = resolveCrawledCities(geocodes)
    if (crawledCities.length) {
      const page = Math.max(1, Number(req.query.page || 1))
      const data = await searchForUi(
        {
          cities: crawledCities,
          text: req.query.text,
          roomsMin: req.query.roomsMin,
          roomsMax: req.query.roomsMax,
          priceMin: req.query.priceMin,
          priceMax: req.query.priceMax,
        },
        { page, pageSize: PAGE_SIZE },
      )

      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(200).json({
        pageNumber: data.page,
        numberOfPages: Math.max(1, Math.ceil(data.total / PAGE_SIZE)),
        totalResults: data.total,
        listings: data.listings,
        mapListings: data.mapListings,
        center: CITY_CENTERS[crawledCities[0]] || null,
        sourceSummary: { database: data.listings.length },
        warnings: [],
        selectedLocations: geocodes.map((id) => findLocationById(id)),
      })
    }
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
