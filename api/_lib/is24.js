const MOBILE_API_BASE = 'https://api.mobile.immobilienscout24.de'
const USER_AGENT = 'ImmoScout_27.12_26.2_._'

const LOCATION_SEEDS = [
  { id: '0200000005056', label: 'Hamburg · Rothenbaum', city: 'Hamburg', district: 'Rothenbaum', kind: 'district' },
  { id: '0200000006057', label: 'Hamburg · Harvestehude', city: 'Hamburg', district: 'Harvestehude', kind: 'district' },
  {
    id: '0200000006058',
    label: 'Hamburg · Winterhude',
    city: 'Hamburg',
    district: 'Winterhude',
    kind: 'district',
    immoweltPath: 'hamburg-20095/winterhude-22297/nbh2de91294272',
  },
  { id: '0200000006059', label: 'Hamburg · Eppendorf', city: 'Hamburg', district: 'Eppendorf', kind: 'district' },
  { id: '0200000005048', label: 'Hamburg · Uhlenhorst', city: 'Hamburg', district: 'Uhlenhorst', kind: 'district' },
  { id: '1276003001046', label: 'Berlin · Mitte', city: 'Berlin', district: 'Mitte', kind: 'district' },
]

function parseCurrency(value = '') {
  if (!value) return null
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRooms(value = '') {
  if (!value) return null
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseAreaSqm(value = '') {
  if (!value) return null
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function cleanDistrict(addressLine = '') {
  if (!addressLine) return ''
  const parts = String(addressLine).split(',').map((part) => part.trim()).filter(Boolean)
  const tail = parts[parts.length - 1] || ''
  return tail.split('(')[0].trim()
}

function normalizePicture(item = {}) {
  return item.titlePicture?.full
    || item.titlePicture?.preview
    || item.pictures?.[0]?.urlScaleAndCrop?.replace('%WIDTH%x%HEIGHT%', '900x680')
    || ''
}

export function getLocationSeeds() {
  return LOCATION_SEEDS
}

export function findLocationById(id) {
  return LOCATION_SEEDS.find((location) => String(location.id) === String(id)) || null
}

export function suggestLocations(query = '') {
  const normalizedQuery = String(query).trim().toLowerCase()

  if (!normalizedQuery) {
    return LOCATION_SEEDS.slice(0, 6)
  }

  const exactCode = LOCATION_SEEDS.find((location) => String(location.id) === normalizedQuery)
  const matches = LOCATION_SEEDS.filter((location) => {
    const haystack = [
      location.id,
      location.label,
      location.city,
      location.district,
      location.kind,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })

  if (exactCode && !matches.some((location) => location.id === exactCode.id)) {
    matches.unshift(exactCode)
  }

  if (/^\d{6,}$/.test(normalizedQuery) && !matches.length) {
    matches.push({
      id: normalizedQuery,
      label: `Custom geocode ${normalizedQuery}`,
      city: 'Custom',
      district: '',
      kind: 'custom',
    })
  }

  return matches.slice(0, 10)
}

export async function fetchIs24Listings({
  geocodes = [],
  page = 1,
  roomsMin,
  roomsMax,
  priceMin,
  priceMax,
  text,
}) {
  const normalizedGeocodes = Array.isArray(geocodes) && geocodes.length
    ? geocodes.map(String)
    : []

  if (!normalizedGeocodes.length) {
    return {
      pageNumber: page,
      numberOfPages: 1,
      totalResults: 0,
      listings: [],
      mapListings: [],
      center: { lat: 51.1657, lon: 10.4515, zoom: 5.6 },
    }
  }

  const params = new URLSearchParams({
    searchType: 'region',
    realestatetype: 'apartmentrent',
    pricetype: 'calculatedtotalrent',
    geocodes: normalizedGeocodes.join(','),
    pagenumber: String(page),
  })

  if (roomsMin || roomsMax) {
    const min = roomsMin || '1.0'
    const max = roomsMax || '10.0'
    params.set('numberofrooms', `${min}-${max}`)
  }

  const response = await fetch(`${MOBILE_API_BASE}/search/list?${params.toString()}`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'de-DE,de;q=0.9',
      'Referer': 'https://www.immobilienscout24.de/',
      'Origin': 'https://www.immobilienscout24.de',
    },
    body: JSON.stringify({
      supportedResultListTypes: [],
      userData: {},
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ImmoScout search failed: ${response.status} ${body.slice(0, 180)}`)
  }

  const payload = await response.json()
  const normalizedText = String(text || '').trim().toLowerCase()

  const listings = (payload.resultListItems || [])
    .filter((result) => result?.type === 'EXPOSE_RESULT' && result?.item?.id)
    .map((result) => {
      const item = result.item || {}
      const address = item.address || {}
      const attributes = Array.isArray(item.attributes) ? item.attributes : []
      const priceLabel = attributes[0]?.value || ''
      const areaLabel = attributes[1]?.value || ''
      const roomsLabel = attributes[2]?.value || ''
      const priceValue = parseCurrency(priceLabel)
      const areaSqm = parseAreaSqm(areaLabel)
      const roomsValue = parseRooms(roomsLabel)
      const lat = typeof address.lat === 'number' ? address.lat : null
      const lon = typeof address.lon === 'number' ? address.lon : null

      return {
        id: String(item.id),
        slug: `is24-${item.id}`,
        title: item.title || 'Untitled listing',
        address: address.line || '',
        postcode: address.postcode || '',
        district: cleanDistrict(address.line || ''),
        lat,
        lon,
        price: priceValue,
        priceLabel: priceLabel || null,
        areaSqm,
        areaLabel: areaLabel || null,
        rooms: roomsValue,
        roomsLabel: roomsLabel || null,
        listingType: item.listingType || '',
        published: item.published || '',
        isPrivate: Boolean(item.isPrivate),
        isProject: Boolean(item.isProject),
        isNewObject: Boolean(item.isNewObject),
        imageUrl: normalizePicture(item),
        realtorLogoUrl: item.realtor?.logoUrlScale?.replace('%WIDTH%x%HEIGHT%', '240x120') || '',
        url: `https://www.immobilienscout24.de/expose/${item.id}`,
        source: 'is24',
        tags: Array.isArray(item.tags) ? item.tags : [],
      }
    })
    .filter((listing) => {
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

  const mapListings = listings.filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lon))
  const fallbackCenter = mapListings[0]
    ? { lat: mapListings[0].lat, lon: mapListings[0].lon, zoom: 12 }
    : { lat: 53.5511, lon: 9.9937, zoom: 11 }

  return {
    pageNumber: payload.pageNumber || page,
    numberOfPages: payload.numberOfPages || 1,
    totalResults: payload.totalResults || listings.length,
    listings,
    mapListings,
    center: fallbackCenter,
  }
}

function findSection(sections = [], type, title = null) {
  return sections.find((section) => section?.type === type && (title ? section?.title === title : true)) || null
}

export async function fetchIs24Expose(id) {
  const response = await fetch(`${MOBILE_API_BASE}/expose/${encodeURIComponent(String(id))}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Accept-Language': 'de-DE,de;q=0.9',
      'Referer': 'https://www.immobilienscout24.de/',
      'Origin': 'https://www.immobilienscout24.de',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ImmoScout expose failed: ${response.status} ${body.slice(0, 180)}`)
  }

  const payload = await response.json()
  const sections = Array.isArray(payload.sections) ? payload.sections : []
  const mediaSection = findSection(sections, 'MEDIA')
  const titleSection = findSection(sections, 'TITLE')
  const mapSection = findSection(sections, 'MAP')
  const topAttributes = findSection(sections, 'TOP_ATTRIBUTES')
  const objectInfo = findSection(sections, 'OBJECT_INFO')
  const textSections = sections.filter((section) => section?.type === 'TEXT_AREA')
  const attributeGroups = sections
    .filter((section) => section?.type === 'ATTRIBUTE_LIST')
    .map((section) => ({
      title: section.title || 'Details',
      items: (section.attributes || []).map((item) => ({
        type: item.type || 'TEXT',
        label: item.label || '',
        text: item.text || item.reference?.label || '',
        url: item.url || item.reference?.url || '',
      })),
    }))
  const priceInfo = findSection(sections, 'PRICE_INFO')
  const agentInfo = findSection(sections, 'AGENTS_INFO')
  const contact = findSection(sections, 'CONTACT')
  const location = mapSection?.location || {}

  return {
    source: 'is24',
    id: String(payload.header?.id || id),
    slug: `is24-${payload.header?.id || id}`,
    title: titleSection?.title || payload.header?.title || 'Listing',
    sourceUrl: `https://www.immobilienscout24.de/expose/${payload.header?.id || id}`,
    shareMessage: payload.header?.shareMessage || '',
    realEstateType: payload.header?.realEstateType || '',
    publicationState: payload.header?.publicationState || '',
    addressLine1: mapSection?.addressLine1 || '',
    addressLine2: mapSection?.addressLine2 || '',
    address: [mapSection?.addressLine1, mapSection?.addressLine2].filter(Boolean).join(', '),
    lat: Number.isFinite(location.lat) ? location.lat : null,
    lon: Number.isFinite(location.lng) ? location.lng : null,
    gallery: (mediaSection?.media || [])
      .filter((item) => item?.type === 'PICTURE')
      .map((item) => ({
        caption: item.caption || '',
        previewUrl: item.previewImageUrl || '',
        fullUrl: item.fullImageUrl || item.previewImageUrl || '',
      })),
    topAttributes: (topAttributes?.attributes || []).map((item) => ({
      label: item.label || '',
      value: item.text || '',
      highlighted: Boolean(item.highlighted),
    })),
    textSections: textSections.map((section) => ({
      title: section.title || '',
      text: section.text || '',
    })),
    attributeGroups,
    priceInfo: {
      title: priceInfo?.title || '',
      items: (priceInfo?.attributes || []).map((item) => ({
        label: item.label || '',
        value: item.text || '',
      })),
      range: priceInfo?.priceBar || null,
    },
    agent: agentInfo ? {
      company: agentInfo.company || '',
      name: agentInfo.name || '',
      logoUrl: agentInfo.logoUrl?.replace('%WIDTH%x%HEIGHT%%3E', '320x160') || '',
      portraitUrl: agentInfo.portraitUrl?.replace('%WIDTH%x%HEIGHT%%3E', '480x480') || '',
      address: agentInfo.address || '',
      profileUrl: agentInfo.agentProfileUrl || '',
      websiteUrl: agentInfo.references?.find((item) => item?.label?.toLowerCase().includes('homepage'))?.url || '',
      verifiedBy: Array.isArray(agentInfo.verifiedBy) ? agentInfo.verifiedBy : [],
    } : null,
    contact: contact ? {
      mailAvailable: contact.mailButtonState === 'active',
      callAvailable: contact.callButtonState === 'active',
      messengerLabel: contact.messengerButtonLabel || '',
      phoneNumbers: contact.phoneNumbers || [],
    } : null,
    objectInfo: objectInfo?.text || '',
    rawSections: sections,
  }
}
