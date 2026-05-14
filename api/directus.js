export default async function handler(req, res) {
  const { path = '', query = '' } = req.query
  if (!path.startsWith('/')) return res.status(400).json({ error: 'Invalid path' })

  const DIRECTUS_URL   = process.env.VITE_DIRECTUS_URL   || 'https://cms.book.immo'
  const DIRECTUS_TOKEN = process.env.VITE_DIRECTUS_TOKEN || 'b837708aafa22fc40d6e86123329aa268f1065c4b582a1a75080b92e2406d3d0'

  const upstream = `${DIRECTUS_URL}${path}${query ? '?' + query : ''}`
  const headers  = { Accept: 'application/json' }
  if (DIRECTUS_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`

  try {
    const response = await fetch(upstream, { headers })
    const data = await response.json()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(response.status).json(data)
  } catch (err) {
    res.status(502).json({ error: 'Upstream error', detail: String(err) })
  }
}
