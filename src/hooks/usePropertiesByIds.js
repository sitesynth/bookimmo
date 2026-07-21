import { useEffect, useMemo, useState } from 'react'

function buildQuery(propertyIds) {
  return new URLSearchParams({
    ids: propertyIds.map((id) => String(id)).join(','),
  }).toString()
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
    const url = `/api/listings/by-ids?${query}`

    setLoading(true)
    setError(null)

    fetch(url)
      .then(async (response) => {
        const json = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(json?.error || 'listing_lookup_failed')
        }
        return json
      })
      .then((json) => {
        if (cancelled) return

        const byId = new Map((json.items || []).map((property) => [String(property.id), property]))
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
