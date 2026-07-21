import { useEffect, useMemo, useState } from 'react'

function buildQuery(filters) {
  const params = new URLSearchParams()
  if (filters.text) params.set('text', filters.text)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.roomsMin) params.set('roomsMin', String(filters.roomsMin))
  if (filters.roomsMax) params.set('roomsMax', String(filters.roomsMax))
  if (filters.priceMin) params.set('priceMin', String(filters.priceMin))
  if (filters.priceMax) params.set('priceMax', String(filters.priceMax))

  const geocodes = Array.isArray(filters.geocodes) ? filters.geocodes.filter(Boolean) : []
  if (geocodes.length) params.set('geocodes', geocodes.join(','))

  return params.toString()
}

export function useIs24Search(filters = {}) {
  const [result, setResult] = useState({
    listings: [],
    mapListings: [],
    selectedLocations: [],
    center: null,
    totalResults: 0,
    numberOfPages: 1,
    pageNumber: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const query = buildQuery(filters)
    setLoading(true)
    setError(null)

    fetch(`/api/is24/search${query ? `?${query}` : ''}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(json?.error || 'is24_search_failed')
        }
        return json
      })
      .then((json) => {
        if (cancelled) return
        setResult({
          listings: Array.isArray(json.listings) ? json.listings : [],
          mapListings: Array.isArray(json.mapListings) ? json.mapListings : [],
          selectedLocations: Array.isArray(json.selectedLocations) ? json.selectedLocations : [],
          center: json.center || null,
          totalResults: Number(json.totalResults || 0),
          numberOfPages: Number(json.numberOfPages || 1),
          pageNumber: Number(json.pageNumber || 1),
        })
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setError(err)
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [filterKey])

  return { ...result, loading, error }
}
