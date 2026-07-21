import { query } from './db.js'

const MAX_UPSERT_ITEMS = 48

function normalizeString(value) {
  const text = String(value ?? '').trim()
  return text || null
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeListingRow(listing = {}) {
  const source = normalizeString(listing.source)
  const externalId = normalizeString(listing.id || listing.externalId)
  if (!source || !externalId) return null

  return {
    source,
    externalId,
    slug: normalizeString(listing.slug) || `${source}-${externalId}`,
    title: normalizeString(listing.title) || 'Untitled listing',
    address: normalizeString(listing.address),
    postcode: normalizeString(listing.postcode),
    district: normalizeString(listing.district),
    price: normalizeNumber(listing.price),
    priceLabel: normalizeString(listing.priceLabel),
    areaSqm: normalizeNumber(listing.areaSqm),
    areaLabel: normalizeString(listing.areaLabel),
    rooms: normalizeNumber(listing.rooms),
    roomsLabel: normalizeString(listing.roomsLabel),
    imageUrl: normalizeString(listing.imageUrl),
    sourceUrl: normalizeString(listing.url),
    lat: normalizeNumber(listing.lat),
    lon: normalizeNumber(listing.lon),
    listingType: normalizeString(listing.listingType),
    publishedLabel: normalizeString(listing.published),
    rawPayload: JSON.stringify(listing),
  }
}

export async function upsertListingsCache(listings = []) {
  const rows = listings
    .map(normalizeListingRow)
    .filter(Boolean)
    .slice(0, MAX_UPSERT_ITEMS)

  if (!rows.length) return 0

  const values = []
  const placeholders = rows.map((row, index) => {
    const offset = index * 20
    values.push(
      row.source,
      row.externalId,
      row.slug,
      row.title,
      row.address,
      row.postcode,
      row.district,
      row.price,
      row.priceLabel,
      row.areaSqm,
      row.areaLabel,
      row.rooms,
      row.roomsLabel,
      row.imageUrl,
      row.sourceUrl,
      row.lat,
      row.lon,
      row.listingType,
      row.publishedLabel,
      row.rawPayload,
    )
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19}, $${offset + 20}::jsonb)`
  })

  await query(
    `INSERT INTO public.listings_cache (
      source, external_id, slug, title, address, postcode, district,
      price, price_label, area_sqm, area_label, rooms, rooms_label,
      image_url, source_url, lat, lon, listing_type, published_label, raw_payload
    )
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (source, external_id) DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      address = EXCLUDED.address,
      postcode = EXCLUDED.postcode,
      district = EXCLUDED.district,
      price = EXCLUDED.price,
      price_label = EXCLUDED.price_label,
      area_sqm = EXCLUDED.area_sqm,
      area_label = EXCLUDED.area_label,
      rooms = EXCLUDED.rooms,
      rooms_label = EXCLUDED.rooms_label,
      image_url = EXCLUDED.image_url,
      source_url = EXCLUDED.source_url,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      listing_type = EXCLUDED.listing_type,
      published_label = EXCLUDED.published_label,
      raw_payload = EXCLUDED.raw_payload,
      imported_at = NOW()`,
    values,
  )

  return rows.length
}

export async function getLatestCachedListings({ limit = 6, text = '' } = {}) {
  const normalizedLimit = Math.max(1, Math.min(Number(limit) || 6, 24))
  const terms = String(text || '')
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)

  if (!terms.length) {
    const result = await query(
      `SELECT source, external_id, slug, title, address, postcode, district,
              price, price_label, area_sqm, area_label, rooms, rooms_label,
              image_url, source_url, lat, lon, listing_type, published_label,
              imported_at, raw_payload
       FROM public.listings_cache
       ORDER BY imported_at DESC
       LIMIT $1`,
      [normalizedLimit],
    )
    return result.rows
  }

  const whereParts = []
  const params = []
  terms.forEach((term, index) => {
    params.push(`%${term}%`)
    const slot = `$${params.length}`
    whereParts.push(`(
      COALESCE(title, '') ILIKE ${slot}
      OR COALESCE(address, '') ILIKE ${slot}
      OR COALESCE(district, '') ILIKE ${slot}
      OR COALESCE(postcode, '') ILIKE ${slot}
    )`)
    if (index === terms.length - 1) {
      params.push(normalizedLimit)
    }
  })

  const result = await query(
    `SELECT source, external_id, slug, title, address, postcode, district,
            price, price_label, area_sqm, area_label, rooms, rooms_label,
            image_url, source_url, lat, lon, listing_type, published_label,
            imported_at, raw_payload
     FROM public.listings_cache
     WHERE ${whereParts.join(' AND ')}
     ORDER BY imported_at DESC
     LIMIT $${params.length}`,
    params,
  )

  return result.rows
}

export async function getCachedListingsByIds(ids = []) {
  const normalizedIds = ids
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 100)

  if (!normalizedIds.length) return []

  const result = await query(
    `SELECT DISTINCT ON (external_id)
            source, external_id, slug, title, address, postcode, district,
            price, price_label, area_sqm, area_label, rooms, rooms_label,
            image_url, source_url, lat, lon, listing_type, published_label,
            imported_at, raw_payload
     FROM public.listings_cache
     WHERE external_id = ANY($1::text[])
     ORDER BY external_id, imported_at DESC`,
    [normalizedIds],
  )

  const ordered = new Map(result.rows.map((row) => [String(row.external_id), row]))
  return normalizedIds.map((id) => ordered.get(id)).filter(Boolean)
}
