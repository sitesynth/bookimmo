import { proxyToBridge } from '../_lib/bridge.js'
import { searchListingCards } from '../_lib/listings-cache.js'

function normalizeCard(row) {
  return {
    source: row.source,
    id: row.external_id,
    externalId: row.external_id,
    slug: row.slug,
    title: row.title,
    address: row.address || '',
    postcode: row.postcode || '',
    district: row.district || '',
    city: row.city || '',
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
    firstSeenAt: row.first_seen_at,
    exclusive: Boolean(row.is_exclusive),
  }
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const page = Math.max(1, Number(req.query?.page) || 1)
    const pageSize = Math.max(1, Math.min(Number(req.query?.pageSize) || 24, 60))
    const { rows, total } = await searchListingCards(req.query || {}, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({
      items: rows.map(normalizeCard),
      total,
      page,
      pageSize,
    })
  } catch (error) {
    return res.status(500).json({ error: 'listings_search_failed' })
  }
}
