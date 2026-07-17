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
    const query = buildQuery(params)
    setLoading(true)
    setError(null)

    fetch(`/api/listings/latest${query ? `?${query}` : ''}`)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return
        setItems(Array.isArray(json.items) ? json.items : [])
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
  }, [queryKey])

  return { items, loading, error }
}
