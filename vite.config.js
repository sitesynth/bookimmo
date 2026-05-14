import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const FRAMER_ROOT = path.resolve(import.meta.dirname, '..')

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, import.meta.dirname, '')
const DIRECTUS_URL = env.VITE_DIRECTUS_URL || 'https://cms.book.immo'
const DIRECTUS_TOKEN = env.VITE_DIRECTUS_TOKEN || ''

return {
  plugins: [
    react(),

    // ── Dev: serve /_local/** from parent bookimmo folder ──────────────────
    {
      name: 'serve-framer-static',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''

          if (url.startsWith('/_local/')) {
            const filePath = path.join(FRAMER_ROOT, url.split('?')[0].slice(1))
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase()
              const mime = {
                '.js': 'application/javascript', '.mjs': 'application/javascript',
                '.css': 'text/css', '.json': 'application/json',
                '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.webp': 'image/webp', '.svg': 'image/svg+xml',
                '.woff2': 'font/woff2', '.woff': 'font/woff',
              }[ext] ?? 'application/octet-stream'
              res.setHeader('Content-Type', mime)
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
              res.end(fs.readFileSync(filePath))
              return
            }
          }

          if (url.startsWith('/public/')) {
            const filePath = path.join(FRAMER_ROOT, url.split('?')[0].slice(1))
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase()
              res.setHeader('Content-Type', ext === '.json' ? 'application/json' : 'application/octet-stream')
              res.end(fs.readFileSync(filePath))
              return
            }
          }

          next()
        })
      },
    },

    // ── Build: bundle Framer fonts for production (Vercel) ─────────────────
    // Dev uses /_local/ from the parent folder (not included in git).
    // Production build:
    //   1. Copies _local/static/assets/ (Framer custom fonts) → public/_local/static/assets/
    //   2. Rewrites CSS: /_local/fonts.gstatic.com/ → https://fonts.gstatic.com/
    {
      name: 'bundle-framer-fonts',
      async buildStart() {
        const srcAssets = path.join(FRAMER_ROOT, '_local', 'static', 'assets')
        const dstAssets = path.join(import.meta.dirname, 'public', '_local', 'static', 'assets')

        if (fs.existsSync(srcAssets)) {
          await fsp.mkdir(dstAssets, { recursive: true })
          const files = await fsp.readdir(srcAssets)
          for (const f of files) {
            const dst = path.join(dstAssets, f)
            if (!fs.existsSync(dst)) {
              await fsp.copyFile(path.join(srcAssets, f), dst)
            }
          }
          console.log(`[bundle-framer-fonts] Copied ${files.length} assets → public/_local/static/assets/`)
        }
      },
      // Replace /_local/fonts.gstatic.com/ → CDN in the built CSS
      transform(code, id) {
        if (id.endsWith('framer-styles.css') || id.endsWith('.css')) {
          return code.replace(/\/_local\/fonts\.gstatic\.com\//g, 'https://fonts.gstatic.com/')
        }
      },
    },

    // ── Dev: proxy /api/directus → cms.book.immo (mirrors Vercel function) ──
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
            const buf = Buffer.from(await response.arrayBuffer())
            res.end(buf)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Proxy error', detail: String(err) }))
          }
        })
      },
    },
  ],
  server: { port: 3001 },
}
})
