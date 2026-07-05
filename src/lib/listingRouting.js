export function buildListingDetailSlug(listing = {}) {
  const source = String(listing.source || listing.externalSource || '').trim().toLowerCase()
  const id = String(listing.id || listing.externalId || '').trim()
  const slug = String(listing.slug || '').trim()

  if (source && id) {
    return `${source}-${id}`
  }

  return slug
}

export function buildListingDetailHref(lang, listing = {}) {
  const detailSlug = buildListingDetailSlug(listing)
  return detailSlug ? `/${lang}/Property-Details/${detailSlug}` : `/${lang}/search`
}

export function parseListingDetailSlug(rawSlug = '') {
  const slug = String(rawSlug || '').trim()
  const match = slug.match(/^([a-z0-9_-]+)-([a-z0-9][a-z0-9-]{5,})$/i)

  if (!match) {
    return {
      provider: null,
      externalId: null,
      slug,
      mode: 'directus',
    }
  }

  return {
    provider: match[1].toLowerCase(),
    externalId: match[2],
    slug,
    mode: 'external',
  }
}
