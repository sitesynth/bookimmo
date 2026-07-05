import { useEffect, useMemo, useState } from 'react'

export function useIs24Locations(query = '') {
  const [items, setItems] = useState([])
  const [seeds, setSeeds] = useState([])
  const [loading, setLoading] = useState(false)

  const normalizedQuery = useMemo(() => String(query || '').trim(), [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`/api/is24/locations${normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : ''}`)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return
        setItems(Array.isArray(json.items) ? json.items : [])
        setSeeds(Array.isArray(json.seeds) ? json.seeds : [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
        setSeeds([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [normalizedQuery])

  return { items, seeds, loading }
}
