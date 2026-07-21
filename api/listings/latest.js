import { fetchIs24Listings, getLocationSeeds } from '../_lib/is24.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { fetchImmoweltListings } from '../_lib/immowelt.js'
import { getLatestCachedListings, upsertListingsCache } from '../_lib/listings-cache.js'

function normalizeRows(rows = []) {
  return rows.map((row) => ({
    source: row.source,
    id: row.external_id,
    externalId: row.external_id,
    slug: row.slug,
    title: row.title,
    address: row.address || '',
    postcode: row.postcode || '',
    district: row.district || '',
    price: row.price === null ? null : Number(row.price),
    priceLabel: row.price_label || null,
    areaSqm: row.area_sqm === null ? null : Number(row.area_sqm),
    areaLabel: row.area_label || null,
    rooms: row.rooms === null ? null : Number(row.rooms),
    roomsLabel: row.rooms_label || null,
    imageUrl: row.image_url || '',
    url: row.source_url || '',
    lat: row.lat === null ? null : Number(row.lat),
    lon: row.lon === null ? null : Number(row.lon),
    listingType: row.listing_type || '',
    published: row.published_label || '',
    importedAt: row.imported_at,
  }))
}

async function warmCache(limit) {
  const geocodes = getLocationSeeds().map((item) => item.id).slice(0, 6)
  const [is24, immowelt] = await Promise.allSettled([
    fetchIs24Listings({ geocodes, page: 1 }),
    fetchImmoweltListings({ geocodes, page: 1 }),
  ])

  const listings = [
    ...(is24.status === 'fulfilled' ? is24.value.listings : []),
    ...(immowelt.status === 'fulfilled' ? immowelt.value.listings : []),
  ].slice(0, Math.max(limit * 2, 12))

  if (listings.length) {
    await upsertListingsCache(listings)
  }
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const limit = Math.max(1, Math.min(Number(req.query.limit) || 6, 24))
  const text = String(req.query.text || '').trim()

  try {
    let rows = await getLatestCachedListings({ limit, text })
    if (!rows.length && text) {
      rows = await getLatestCachedListings({ limit })
    }

    if (!rows.length) {
      try {
        await warmCache(limit)
        rows = await getLatestCachedListings({ limit, text })
        if (!rows.length && text) {
          rows = await getLatestCachedListings({ limit })
        }
      } catch {
        // cache warm is best effort
      }
    }

    return res.status(200).json({
      items: normalizeRows(rows),
      source: 'database-cache',
    })
  } catch (error) {
    return res.status(502).json({ error: 'latest_listings_failed', detail: String(error) })
  }
}
