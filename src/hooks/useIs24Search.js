import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const loadedBaseKeyRef = useRef('')

  const filterKey = useMemo(() => JSON.stringify(filters), [filters])
  // Same search without the page number: a higher page of the same search is appended.
  const baseKey = useMemo(() => JSON.stringify({ ...filters, page: 1 }), [filters])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const query = buildQuery(filters)
    const appending = Number(filters.page || 1) > 1 && loadedBaseKeyRef.current === baseKey
    if (appending) setLoadingMore(true)
    else setLoading(true)
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
        const incoming = Array.isArray(json.listings) ? json.listings : []
        loadedBaseKeyRef.current = baseKey
        setResult((previous) => ({
          listings: appending
            ? [...previous.listings, ...incoming.filter((item) => !previous.listings.some((known) => String(known.id) === String(item.id)))]
            : incoming,
          mapListings: Array.isArray(json.mapListings) ? json.mapListings : [],
          selectedLocations: Array.isArray(json.selectedLocations) ? json.selectedLocations : [],
          center: json.center || null,
          totalResults: Number(json.totalResults || 0),
          numberOfPages: Number(json.numberOfPages || 1),
          pageNumber: Number(json.pageNumber || 1),
        }))
        setLoading(false)
        setLoadingMore(false)
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setError(err)
        setLoading(false)
        setLoadingMore(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [filterKey])

  return { ...result, loading, loadingMore, error }
}
