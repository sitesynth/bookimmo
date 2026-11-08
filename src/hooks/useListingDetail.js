import { useEffect, useState } from 'react'

export function useListingDetail({ provider, externalId }) {
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

  if (!provider) {
    return { property: null, loading: false, error: null }
  }

  return externalState
}
