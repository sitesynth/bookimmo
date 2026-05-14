import { useState, useEffect, useMemo } from 'react'

function buildQuery(filters) {
  const parts = [
    'fields=id,title,slug,price,bedrooms,bathrooms,area_m2,city_slug,address,listing_type,property_category,is_featured,short_description,description,status',
    'filter[status][_eq]=published',
    'limit=50',
    'sort[]=-is_featured',
  ]
  if (filters.text)              parts.push(`search=${encodeURIComponent(filters.text)}`)
  if (filters.category?.length)  filters.category.forEach(v => parts.push(`filter[property_category][_in]=${encodeURIComponent(v)}`))
  if (filters.location?.length)  filters.location.forEach(v => parts.push(`filter[city_slug][_in]=${encodeURIComponent(v)}`))
  if (filters.type?.length)      filters.type.forEach(v => parts.push(`filter[listing_type][_in]=${encodeURIComponent(v)}`))
  if (filters.featured)          parts.push('filter[is_featured][_eq]=true')
  if (filters.bedrooms?.length)  filters.bedrooms.forEach(v => parts.push(`filter[bedrooms][_in]=${v}`))
  if (filters.priceMin)          parts.push(`filter[price][_gte]=${filters.priceMin}`)
  if (filters.priceMax)          parts.push(`filter[price][_lte]=${filters.priceMax}`)
  return parts.join('&')
}

export function useDirectusSearch(filters = {}) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    let cancelled = false
    const query = buildQuery(filters)
    const url = `/api/directus?path=/items/properties&query=${encodeURIComponent(query)}`

    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(json => { if (!cancelled) { setProperties(json.data || []); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  }, [filterKey])

  return { properties, loading, error }
}
