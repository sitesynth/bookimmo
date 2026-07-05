import lzString from 'lz-string'
import { getLocationSeeds } from './is24.js'

const { decompressFromBase64 } = lzString

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const IMMOWELT_SEARCH_BASE = 'https://www.immowelt.de/suche/mieten/wohnung'

function parseDecimal(value) {
  if (value === null || value === undefined || value === '') return null
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeExposeId(item = {}) {
  const url = String(item.url || '').trim()
  const match = url.match(/\/expose\/([^/?#]+)/i)
  if (match) return match[1].toLowerCase()
  if (item.metadata?.legacyId) return String(item.metadata.legacyId).toLowerCase()
  if (item.id) return String(item.id).toLowerCase()
  return ''
}

function buildSearchUrl(path) {
  return `${IMMOWELT_SEARCH_BASE}/${path}`
}

async function fetchSearchPageData(path) {
  const response = await fetch(buildSearchUrl(path), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      'Referer': 'https://www.immowelt.de/',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Immowelt search failed: ${response.status} ${body.slice(0, 180)}`)
  }

  const html = await response.text()
  const match = html.match(/classified-serp-init-data\\":\\"(.*?)\\"/)

  if (!match?.[1]) {
    throw new Error('Immowelt search payload not found')
  }

  const payload = decompressFromBase64(match[1])
  if (!payload) {
    throw new Error('Immowelt search payload could not be decompressed')
  }

  return JSON.parse(payload)
}

function buildKnownSearchTargets(geocodes = []) {
  const selected = new Set(geocodes.map(String))
  const seeds = getLocationSeeds()
  const scopedSeeds = selected.size
    ? seeds.filter((location) => selected.has(String(location.id)))
    : seeds

  return scopedSeeds
    .filter((location) => location.immoweltPath)
    .map((location) => ({
      location,
      path: location.immoweltPath,
    }))
}

function normalizeImmoweltListing(item = {}) {
  const exposeId = normalizeExposeId(item)
  const title = item.mainDescription?.headline || item.hardFacts?.title || 'Immowelt listing'
  const address = item.location?.address || {}
  const facts = Array.isArray(item.hardFacts?.facts) ? item.hardFacts.facts : []
  const prices = Array.isArray(item.hardFacts?.prices) ? item.hardFacts.prices : []
  const galleryImages = Array.isArray(item.gallery?.images) ? item.gallery.images : []
  const mainPrice = item.hardFacts?.price?.formatted || item.hardFacts?.price?.value || ''
  const warmPrice = prices.find((entry) => /warm/i.test(String(entry.label || '')))
  const roomFact = facts.find((fact) => fact.type === 'numberOfRooms')
  const areaFact = facts.find((fact) => fact.type === 'livingSpace')
  const floorFact = facts.find((fact) => fact.type === 'numberOfFloors')
  const availabilityFact = facts.find((fact) => fact.type === 'availability')
  const providerTitle = item.provider?.contactCard?.title || item.provider?.intermediaryCard?.title || ''
  const providerSubtitle = item.provider?.contactCard?.subtitle || item.provider?.intermediaryCard?.subtitle || ''

  return {
    source: 'immowelt',
    id: exposeId,
    externalId: exposeId,
    slug: `immowelt-${exposeId}`,
    title,
    address: [
      address.street,
      address.district,
      address.city,
      address.zipCode,
    ].filter(Boolean).join(', '),
    postcode: address.zipCode || '',
    district: address.district || '',
    lat: null,
    lon: null,
    price: parseDecimal(item.tracking?.price ?? item.rawData?.price ?? item.hardFacts?.price?.value),
    priceLabel: mainPrice || null,
    areaSqm: parseDecimal(item.rawData?.surface?.main ?? areaFact?.splitValue ?? areaFact?.value),
    areaLabel: areaFact?.value || null,
    rooms: parseDecimal(item.rawData?.nbroom ?? roomFact?.splitValue ?? roomFact?.value),
    roomsLabel: roomFact?.value || null,
    published: item.metadata?.updateDate ? `Updated ${item.metadata.updateDate.slice(0, 10)}` : '',
    imageUrl: galleryImages[0]?.url || '',
    url: item.url || (exposeId ? `https://www.immowelt.de/expose/${exposeId}` : ''),
    tags: item.hardFacts?.keyfacts || [],
    gallery: galleryImages.map((image) => ({
      caption: image.title || image.description || title,
      previewUrl: image.url || '',
      fullUrl: image.url || '',
    })),
    topAttributes: [
      { label: 'Price', value: mainPrice || 'Price on request' },
      { label: 'Rooms', value: roomFact?.value || '—' },
      { label: 'Area', value: areaFact?.value || '—' },
      { label: 'Availability', value: availabilityFact?.value || 'On request' },
    ],
    textSections: [
      {
        title: item.mainDescription?.headline || 'Description',
        text: item.mainDescription?.description || '',
      },
    ].filter((section) => section.text),
    attributeGroups: [
      {
        title: 'Listing facts',
        items: facts.map((fact) => ({
          label: fact.label || fact.type,
          text: fact.value || '',
        })),
      },
      {
        title: 'Provider',
        items: [
          { label: 'Contact', text: providerTitle || providerSubtitle || 'Provider available' },
          { label: 'Type', text: providerSubtitle || (item.provider?.isPrivateOwner ? 'Private owner' : 'Agency') },
          { label: 'Phone', text: item.provider?.phoneNumbers?.[0] || 'By request' },
          { label: 'Address', text: item.provider?.address || '' },
        ].filter((entry) => entry.text),
      },
    ],
    priceInfo: {
      title: 'Rent breakdown',
      items: prices.map((entry) => ({
        label: entry.label || 'Price',
        value: entry.value || '',
      })),
    },
    publicationState: item.status || '',
    agent: {
      company: item.provider?.intermediaryCard?.title || '',
      name: providerTitle || item.provider?.intermediaryCard?.title || '',
      logoUrl: item.provider?.intermediaryCard?.logoUrl || item.cardProvider?.logoUrl || '',
      portraitUrl: item.provider?.intermediaryCard?.logoUrl || item.cardProvider?.logoUrl || '',
      address: item.provider?.address || '',
      profileUrl: item.provider?.profileUrl && item.provider.profileUrl !== 'undefined' ? item.provider.profileUrl : '',
      websiteUrl: item.provider?.website || '',
      verifiedBy: item.provider?.badge?.title ? [item.provider.badge.title] : [],
    },
    contact: {
      mailAvailable: true,
      callAvailable: Boolean(item.provider?.phoneNumbers?.length),
      messengerLabel: '',
      phoneNumbers: item.provider?.phoneNumbers || [],
    },
    sourceUrl: item.url || '',
    objectInfo: warmPrice?.value ? `Warm rent: ${warmPrice.value}` : '',
  }
}

function findMatchingClassified(data, id) {
  const normalizedId = String(id || '').trim().toLowerCase()
  if (!normalizedId) return null

  const entries = Object.values(data?.pageProps?.classifiedsData || {})

  return entries.find((item) => {
    const candidates = [
      item.id,
      item.metadata?.id,
      item.metadata?.legacyId,
      normalizeExposeId(item),
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())

    return candidates.includes(normalizedId)
  }) || null
}

export async function fetchImmoweltListings({
  geocodes = [],
  page = 1,
  roomsMin,
  roomsMax,
  priceMin,
  priceMax,
  text,
}) {
  const targets = buildKnownSearchTargets(geocodes)
  if (!targets.length) {
    return {
      pageNumber: page,
      numberOfPages: 1,
      totalResults: 0,
      listings: [],
      mapListings: [],
      center: null,
    }
  }

  const pages = await Promise.all(targets.map(async (target) => ({
    target,
    data: await fetchSearchPageData(target.path),
  })))

  const normalizedText = String(text || '').trim().toLowerCase()

  const listings = pages.flatMap(({ data }) => Object.values(data?.pageProps?.classifiedsData || {}))
    .map(normalizeImmoweltListing)
    .filter((listing) => listing.id)
    .filter((listing) => {
      if (roomsMin && listing.rooms !== null && listing.rooms < Number(roomsMin)) return false
      if (roomsMax && listing.rooms !== null && listing.rooms > Number(roomsMax)) return false
      if (priceMin && listing.price !== null && listing.price < Number(priceMin)) return false
      if (priceMax && listing.price !== null && listing.price > Number(priceMax)) return false
      if (!normalizedText) return true

      const haystack = [
        listing.title,
        listing.address,
        listing.postcode,
        listing.district,
        listing.priceLabel,
        listing.roomsLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedText)
    })

  return {
    pageNumber: page,
    numberOfPages: 1,
    totalResults: listings.length,
    listings,
    mapListings: listings.filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lon)),
    center: null,
  }
}

export async function fetchImmoweltExpose(id) {
  const targets = buildKnownSearchTargets()

  for (const target of targets) {
    const data = await fetchSearchPageData(target.path)
    const matched = findMatchingClassified(data, id)
    if (matched) {
      return normalizeImmoweltListing(matched)
    }
  }

  throw new Error(`Immowelt listing ${id} was not found in known search indexes`)
}
