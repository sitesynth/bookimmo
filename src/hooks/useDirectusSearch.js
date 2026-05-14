import { useState, useEffect, useMemo } from 'react'
import { client, readItems } from '../api/directus.js'

function buildFilter(filters) {
  const filter = { status: { _eq: 'published' } }
  if (filters.category?.length)  filter.property_category = { _in: filters.category }
  if (filters.location?.length)  filter.city_slug = { _in: filters.location }
  if (filters.type?.length)      filter.listing_type = { _in: filters.type }
  if (filters.featured)          filter.is_featured = { _eq: true }
  if (filters.bedrooms?.length)  filter.bedrooms = { _in: filters.bedrooms.map(Number) }
  if (filters.priceMin)          filter.price = { ...filter.price, _gte: filters.priceMin }
  if (filters.priceMax)          filter.price = { ...filter.price, _lte: filters.priceMax }
  return filter
}

export function useDirectusSearch(filters = {}) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    client.request(readItems('properties', {
      fields: ['id','title','slug','price','bedrooms','bathrooms','area_m2','city_slug','address','listing_type','property_category','is_featured','short_description','description','status'],
      filter: buildFilter(filters),
      sort: ['-is_featured'],
      limit: 50,
    }))
      .then(res => { if (!cancelled) { setProperties(res ?? []); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err); setLoading(false) } })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  return { properties, loading, error }
}
