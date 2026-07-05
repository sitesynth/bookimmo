import { useEffect, useMemo, useState } from 'react'

function buildQuery(propertyIds) {
  const parts = [
    'fields=id,title,slug,price,bedrooms,bathrooms,area_m2,city_slug,address,listing_type,property_category,is_featured,short_description,description,status,cover_image',
    'filter[status][_eq]=published',
    `filter[id][_in]=${propertyIds.map((id) => encodeURIComponent(id)).join(',')}`,
    `limit=${propertyIds.length}`,
  ]

  return parts.join('&')
}

export function usePropertiesByIds(propertyIds = []) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const idsKey = useMemo(() => JSON.stringify(propertyIds.map(String)), [propertyIds])

  useEffect(() => {
    const normalizedIds = propertyIds.map(String).filter(Boolean)

    if (!normalizedIds.length) {
      setProperties([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    const query = buildQuery(normalizedIds)
    const url = `/api/directus?path=/items/properties&query=${encodeURIComponent(query)}`

    setLoading(true)
    setError(null)

    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return

        const byId = new Map((json.data || []).map((property) => [String(property.id), property]))
        const ordered = normalizedIds.map((id) => byId.get(id)).filter(Boolean)
        setProperties(ordered)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return { properties, loading, error }
}
