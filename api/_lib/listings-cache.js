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

const CRAWL_BATCH_SIZE = 100

// Upsert a crawled page of provider listings. Marks them active and seen now.
export async function upsertCrawledListings(listings = [], { city, rankOffset = 0 } = {}) {
  const rows = listings.map(normalizeListingRow).filter(Boolean)
  let total = 0

  for (let start = 0; start < rows.length; start += CRAWL_BATCH_SIZE) {
    const chunk = rows.slice(start, start + CRAWL_BATCH_SIZE)
    const values = []
    const placeholders = chunk.map((row, index) => {
      const offset = index * 22
      values.push(
        row.source, row.externalId, row.slug, row.title, row.address, row.postcode, row.district,
        row.price, row.priceLabel, row.areaSqm, row.areaLabel, row.rooms, row.roomsLabel,
        row.imageUrl, row.sourceUrl, row.lat, row.lon, row.listingType, row.publishedLabel,
        row.rawPayload, city || null, rankOffset + start + index,
      )
      const p = (n) => `$${offset + n}`
      return `(${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}, ${p(8)}, ${p(9)}, ${p(10)}, ${p(11)}, ${p(12)}, ${p(13)}, ${p(14)}, ${p(15)}, ${p(16)}, ${p(17)}, ${p(18)}, ${p(19)}, ${p(20)}::jsonb, ${p(21)}, NOW(), TRUE, NOW() - (${p(22)}::int * interval '1 second'))`
    })

    await query(
      `INSERT INTO public.listings_cache (
        source, external_id, slug, title, address, postcode, district,
        price, price_label, area_sqm, area_label, rooms, rooms_label,
        image_url, source_url, lat, lon, listing_type, published_label, raw_payload,
        city, last_seen_at, is_active, first_seen_at
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (source, external_id) DO UPDATE SET
        slug = EXCLUDED.slug, title = EXCLUDED.title, address = EXCLUDED.address,
        postcode = EXCLUDED.postcode, district = EXCLUDED.district, price = EXCLUDED.price,
        price_label = EXCLUDED.price_label, area_sqm = EXCLUDED.area_sqm,
        area_label = EXCLUDED.area_label, rooms = EXCLUDED.rooms, rooms_label = EXCLUDED.rooms_label,
        image_url = EXCLUDED.image_url, source_url = EXCLUDED.source_url,
        lat = EXCLUDED.lat, lon = EXCLUDED.lon, listing_type = EXCLUDED.listing_type,
        published_label = EXCLUDED.published_label, raw_payload = EXCLUDED.raw_payload,
        city = COALESCE(EXCLUDED.city, public.listings_cache.city),
        imported_at = NOW(), last_seen_at = NOW(), is_active = TRUE`,
      values,
    )
    total += chunk.length
  }

  return total
}

// After a complete crawl of a city, hide listings of this source that were not seen.
export async function deactivateUnseenListings({ source, city, crawlStartedAt }) {
  const result = await query(
    `UPDATE public.listings_cache
     SET is_active = FALSE
     WHERE source = $1 AND city = $2 AND is_active AND NOT is_exclusive AND last_seen_at < $3`,
    [source, city, crawlStartedAt],
  )
  return result.rowCount || 0
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
       WHERE is_active
       ORDER BY first_seen_at DESC, imported_at DESC
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
     WHERE is_active AND ${whereParts.join(' AND ')}
     ORDER BY first_seen_at DESC, imported_at DESC
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

  const parsedExternalIds = normalizedIds
    .map((id) => {
      const match = id.match(/^[a-z0-9_-]+-([a-z0-9][a-z0-9-]{5,})$/i)
      return match?.[1] || null
    })
    .filter(Boolean)

  const externalIds = [...new Set([...normalizedIds, ...parsedExternalIds])]

  const result = await query(
    `SELECT DISTINCT ON (external_id)
            source, external_id, slug, title, address, postcode, district,
            price, price_label, area_sqm, area_label, rooms, rooms_label,
            image_url, source_url, lat, lon, listing_type, published_label,
            imported_at, raw_payload
     FROM public.listings_cache
     WHERE external_id = ANY($1::text[]) OR slug = ANY($2::text[])
     ORDER BY external_id, imported_at DESC`,
    [externalIds, normalizedIds],
  )

  const byExternalId = new Map(result.rows.map((row) => [String(row.external_id), row]))
  const bySlug = new Map(result.rows.map((row) => [String(row.slug), row]))

  return normalizedIds.map((id) => {
    const direct = bySlug.get(id) || byExternalId.get(id)
    if (direct) return { ...direct, lookup_id: id }

    const match = id.match(/^[a-z0-9_-]+-([a-z0-9][a-z0-9-]{5,})$/i)
    const externalId = match?.[1]
    const fallback = externalId ? byExternalId.get(externalId) : null
    return fallback ? { ...fallback, lookup_id: id } : null
  }).filter(Boolean)
}

function parseBbox(value) {
  const parts = String(value || '').split(',').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null
  const [west, south, east, north] = parts
  if (south >= north || west >= east) return null
  return { west, south, east, north }
}

function buildSearchWhere(filters = {}) {
  const where = ['is_active']
  const params = []
  const add = (sql, value) => {
    params.push(value)
    where.push(sql.replace('?', `$${params.length}`))
  }

  const bbox = parseBbox(filters.bbox)
  if (bbox) {
    add('lon >= ?', bbox.west)
    add('lon <= ?', bbox.east)
    add('lat >= ?', bbox.south)
    add('lat <= ?', bbox.north)
  } else if (filters.requireCoords) {
    where.push('lat IS NOT NULL AND lon IS NOT NULL')
  }

  const num = (value) => (value === undefined || value === null || value === '' ? null : Number(value))
  const priceMin = num(filters.priceMin)
  const priceMax = num(filters.priceMax)
  const roomsMin = num(filters.roomsMin)
  const roomsMax = num(filters.roomsMax)
  const areaMin = num(filters.areaMin)
  if (Number.isFinite(priceMin)) add('price >= ?', priceMin)
  if (Number.isFinite(priceMax)) add('price <= ?', priceMax)
  if (Number.isFinite(roomsMin)) add('rooms >= ?', roomsMin)
  if (Number.isFinite(roomsMax)) add('rooms <= ?', roomsMax)
  if (Number.isFinite(areaMin)) add('area_sqm >= ?', areaMin)
  if (filters.city) add('city = ?', String(filters.city))
  const cities = Array.isArray(filters.cities) ? filters.cities.filter(Boolean).map(String) : []
  if (cities.length) add('city = ANY(?::text[])', cities)

  const textTerms = String(filters.text || '').split(/[,\s]+/).map((term) => term.trim()).filter(Boolean).slice(0, 6)
  textTerms.forEach((term) => {
    params.push(`%${term}%`)
    const slot = `$${params.length}`
    where.push(`(COALESCE(title, '') ILIKE ${slot} OR COALESCE(address, '') ILIKE ${slot} OR COALESCE(district, '') ILIKE ${slot} OR COALESCE(postcode, '') ILIKE ${slot})`)
  })

  return { sql: where.join(' AND '), params }
}

// Light points for the map: regular listings (clustered client-side) and exclusives (own layer).
export async function getMapPoints(filters = {}, { limit = 8000 } = {}) {
  const cap = Math.max(1, Math.min(Number(limit) || 8000, 12000))
  const { sql, params } = buildSearchWhere({ ...filters, requireCoords: true })

  const result = await query(
    `SELECT source, external_id, price, rooms, area_sqm, lat, lon, is_exclusive
     FROM public.listings_cache
     WHERE ${sql}
     ORDER BY is_exclusive DESC, first_seen_at DESC
     LIMIT ${cap + 1}`,
    params,
  )

  const truncated = result.rows.length > cap
  const rows = truncated ? result.rows.slice(0, cap) : result.rows
  return { rows, truncated }
}

// Full cards for the list next to the map. Exclusives first, then newest.
export async function searchListingCards(filters = {}, { limit = 24, offset = 0 } = {}) {
  const pageSize = Math.max(1, Math.min(Number(limit) || 24, 60))
  const skip = Math.max(0, Number(offset) || 0)
  const { sql, params } = buildSearchWhere(filters)

  const [rows, count] = await Promise.all([
    query(
      `SELECT source, external_id, slug, title, address, postcode, district, city,
              price, price_label, area_sqm, area_label, rooms, rooms_label,
              image_url, source_url, lat, lon, listing_type, published_label,
              first_seen_at, is_exclusive
       FROM public.listings_cache
       WHERE ${sql}
       ORDER BY is_exclusive DESC, first_seen_at DESC, id DESC
       LIMIT ${pageSize} OFFSET ${skip}`,
      params,
    ),
    query(`SELECT COUNT(*)::int AS total FROM public.listings_cache WHERE ${sql}`, params),
  ])

  return { rows: rows.rows, total: count.rows[0]?.total || 0 }
}

// Data for the search page: one page of full listing cards plus every map point of the same filter.
export async function searchForUi(filters = {}, { page = 1, pageSize = 50, mapLimit = 8000 } = {}) {
  const size = Math.max(1, Math.min(Number(pageSize) || 50, 60))
  const current = Math.max(1, Number(page) || 1)
  const cap = Math.max(1, Math.min(Number(mapLimit) || 8000, 12000))
  const { sql, params } = buildSearchWhere(filters)

  const [cards, count, points] = await Promise.all([
    query(
      `SELECT raw_payload, is_exclusive
       FROM public.listings_cache
       WHERE ${sql}
       ORDER BY is_exclusive DESC, first_seen_at DESC, id DESC
       LIMIT ${size} OFFSET ${(current - 1) * size}`,
      params,
    ),
    query(`SELECT COUNT(*)::int AS total FROM public.listings_cache WHERE ${sql}`, params),
    query(
      `SELECT source, external_id, slug, title, address, price_label, image_url, source_url, lat, lon, is_exclusive
       FROM public.listings_cache
       WHERE ${sql} AND lat IS NOT NULL AND lon IS NOT NULL
       ORDER BY is_exclusive DESC, first_seen_at DESC
       LIMIT ${cap}`,
      params,
    ),
  ])

  return {
    listings: cards.rows.map((row) => ({ ...(row.raw_payload || {}), exclusive: Boolean(row.is_exclusive) })),
    total: count.rows[0]?.total || 0,
    mapListings: points.rows.map((row) => ({
      id: row.external_id,
      slug: row.slug,
      source: row.source,
      title: row.title,
      address: row.address || '',
      priceLabel: row.price_label || '',
      imageUrl: row.image_url || '',
      url: row.source_url || '',
      lat: Number(row.lat),
      lon: Number(row.lon),
      exclusive: Boolean(row.is_exclusive),
    })),
    page: current,
    pageSize: size,
  }
}
