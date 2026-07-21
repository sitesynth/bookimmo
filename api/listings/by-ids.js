import { proxyToBridge } from '../_lib/bridge.js'
import { getCachedListingsByIds } from '../_lib/listings-cache.js'

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

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ids = String(req.query.ids || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!ids.length) {
    return res.status(200).json({ items: [] })
  }

  try {
    const rows = await getCachedListingsByIds(ids)
    return res.status(200).json({
      items: normalizeRows(rows),
      source: 'database-cache',
    })
  } catch (error) {
    return res.status(502).json({ error: 'listing_lookup_failed', detail: String(error) })
  }
}
