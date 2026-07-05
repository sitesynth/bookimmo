import { useEffect, useState } from 'react'

function useDirectusProperty(slug) {
  const [state, setState] = useState({ property: null, loading: true, error: null })

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    const query = `filter[slug][_eq]=${encodeURIComponent(slug)}&fields=*&limit=1`

    setState({ property: null, loading: true, error: null })
    fetch(`/api/directus?path=/items/properties&query=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return
        setState({ property: json.data?.[0] || null, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ property: null, loading: false, error })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}

function normalizeDirectusProperty(property) {
  if (!property) return null

  const gallery = []
  if (property.cover_image) {
    gallery.push({
      caption: property.title || '',
      previewUrl: `/api/directus?path=/assets/${property.cover_image}&query=${encodeURIComponent('width=900&quality=80')}`,
      fullUrl: `/api/directus?path=/assets/${property.cover_image}&query=${encodeURIComponent('width=1600&quality=80')}`,
    })
  }

  return {
    source: 'directus',
    id: String(property.id),
    slug: property.slug || '',
    title: property.title || 'Property',
    sourceUrl: '',
    addressLine1: property.address || '',
    addressLine2: property.city_slug || '',
    address: [property.address, property.city_slug].filter(Boolean).join(', '),
    lat: null,
    lon: null,
    gallery,
    topAttributes: [
      { label: 'Price', value: property.price ? `€ ${Number(property.price).toLocaleString()}` : 'Price on request' },
      { label: 'Rooms', value: String(property.rooms || property.bedrooms || '—') },
      { label: 'Area', value: property.area_m2 ? `${property.area_m2} m²` : '—' },
    ],
    textSections: [
      { title: 'Description', text: property.description || property.short_description || '' },
    ],
    attributeGroups: [
      {
        title: 'Details',
        items: [
          { label: 'Type', text: property.property_category || property.listing_type || 'Property' },
          { label: 'Bedrooms', text: String(property.bedrooms || property.rooms || '—') },
          { label: 'Bathrooms', text: String(property.bathrooms || '—') },
          { label: 'Area', text: property.area_m2 ? `${property.area_m2} m²` : '—' },
        ],
      },
    ],
    priceInfo: null,
    agent: null,
    contact: null,
    objectInfo: property.property_id ? `Property ID: ${property.property_id}` : `Property ID: ${property.id}`,
  }
}

export function useListingDetail({ provider, externalId, slug }) {
  const directusState = useDirectusProperty(provider ? '' : slug)
  const [externalState, setExternalState] = useState({ property: null, loading: false, error: null })

  useEffect(() => {
    if (!provider || !externalId) return
    let cancelled = false
    setExternalState({ property: null, loading: true, error: null })

    fetch(`/api/listing-detail?source=${encodeURIComponent(provider)}&id=${encodeURIComponent(externalId)}`)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return
        setExternalState({ property: json, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setExternalState({ property: null, loading: false, error })
      })

    return () => {
      cancelled = true
    }
  }, [externalId, provider])

  if (provider) {
    return externalState
  }

  return {
    property: normalizeDirectusProperty(directusState.property),
    loading: directusState.loading,
    error: directusState.error,
  }
}
