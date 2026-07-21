import { useEffect, useMemo, useState } from 'react'

function buildQuery(params = {}) {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', String(params.limit))
  if (params.text) query.set('text', String(params.text).trim())
  return query.toString()
}

export function useLatestListings(params = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const queryKey = useMemo(() => JSON.stringify(params), [params])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const query = buildQuery(params)
    setLoading(true)
    setError(null)

    fetch(`/api/listings/latest${query ? `?${query}` : ''}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(json?.error || 'latest_listings_failed')
        }
        return json
      })
      .then((json) => {
        if (cancelled) return
        setItems(Array.isArray(json.items) ? json.items : [])
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
  }, [queryKey])

  return { items, loading, error }
}
