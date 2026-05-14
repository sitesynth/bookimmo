export default async function handler(req, res) {
  const { path = '', query = '' } = req.query
  if (!path.startsWith('/')) return res.status(400).json({ error: 'Invalid path' })

  const DIRECTUS_URL   = process.env.VITE_DIRECTUS_URL   || 'https://cms.book.immo'
  const DIRECTUS_TOKEN = process.env.VITE_DIRECTUS_TOKEN || 'b837708aafa22fc40d6e86123329aa268f1065c4b582a1a75080b92e2406d3d0'

  const isAsset = path.startsWith('/assets/')
  const upstream = `${DIRECTUS_URL}${path}${query ? '?' + query : ''}`
  const headers  = {}
  if (DIRECTUS_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`

  try {
    const response = await fetch(upstream, { headers })
    const contentType = response.headers.get('content-type') || (isAsset ? 'application/octet-stream' : 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', contentType)
    if (isAsset) res.setHeader('Cache-Control', 'public, max-age=86400')
    res.status(response.status)
    const buf = Buffer.from(await response.arrayBuffer())
    res.end(buf)
  } catch (err) {
    res.status(502).json({ error: 'Upstream error', detail: String(err) })
  }
}
