import { useState, useEffect } from 'react'
import { client, readItems } from '../api/directus.js'

// Example usage:
// const { data: agents } = useDirectus('agents', {
//   filter: { status: { _eq: 'published' } },
//   sort: ['-date_created'],
//   limit: 24,
// })
// const { data: properties } = useDirectus('properties', {
//   filter: { status: { _eq: 'published' } },
//   sort: ['-date_created'],
//   limit: 24,
// })
// const { data: blog_posts } = useDirectus('blog_posts', {
//   filter: { status: { _eq: 'published' } },
//   sort: ['-date_created'],
//   limit: 24,
// })
// const { data: leads } = useDirectus('leads', {
//   filter: { status: { _eq: 'published' } },
//   sort: ['-date_created'],
//   limit: 24,
// })

export function useDirectus(collection, query = {}) {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    client.request(readItems(collection, query))
      .then(res => { if (!cancelled) setData(res ?? []) })
      .catch(err => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, JSON.stringify(query)])

  return { data, loading, error }
}
