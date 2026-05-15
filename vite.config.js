import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://cms.book.immo'
  const DIRECTUS_TOKEN = env.VITE_DIRECTUS_TOKEN || ''

  return {
    plugins: [
      react(),

      // Dev: proxy /api/directus → cms.book.immo
      {
        name: 'directus-dev-proxy',
        configureServer(server) {
          server.middlewares.use('/api/directus', async (req, res) => {
            try {
              const url = new URL(req.url ?? '/', 'http://localhost')
              const apiPath = url.searchParams.get('path') || ''
              const query = url.searchParams.get('query') || ''
              if (!apiPath.startsWith('/')) {
                res.statusCode = 400
                return res.end(JSON.stringify({ error: 'Invalid path' }))
              }
              const upstream = `${DIRECTUS_URL}${apiPath}${query ? '?' + query : ''}`
              const isAsset = apiPath.startsWith('/assets/')
              const headers = isAsset ? {} : { Accept: 'application/json' }
              if (DIRECTUS_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`
              const response = await fetch(upstream, { headers })
              const contentType = response.headers.get('content-type') || (isAsset ? 'application/octet-stream' : 'application/json')
              res.setHeader('Content-Type', contentType)
              res.setHeader('Access-Control-Allow-Origin', '*')
              if (isAsset) res.setHeader('Cache-Control', 'public, max-age=86400')
              res.statusCode = response.status
              res.end(Buffer.from(await response.arrayBuffer()))
            } catch (err) {
              res.statusCode = 502
              res.end(JSON.stringify({ error: 'Proxy error', detail: String(err) }))
            }
          })
        },
      },
    ],
    server: { port: 3000 },
  }
})
