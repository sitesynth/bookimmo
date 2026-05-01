import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const FRAMER_ROOT = path.resolve(import.meta.dirname, '..')
const LANGS = new Set(['de', 'en', 'fr', 'it', 'nl'])

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-framer-static',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''

          // Serve /:lang and /:lang/index.html from parent bookimmo folder
          const langMatch = url.match(/^\/(de|en|fr|it|nl)(\/index\.html)?$/)
          if (langMatch && LANGS.has(langMatch[1])) {
            const filePath = path.join(FRAMER_ROOT, langMatch[1], 'index.html')
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.end(fs.readFileSync(filePath))
              return
            }
          }

          // Serve /_local/** from parent bookimmo folder
          if (url.startsWith('/_local/')) {
            const filePath = path.join(FRAMER_ROOT, url.split('?')[0].slice(1))
            if (fs.existsSync(filePath)) {
              const ext = path.extname(filePath).toLowerCase()
              const mime = {
                '.js': 'application/javascript',
                '.mjs': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.woff2': 'font/woff2',
                '.woff': 'font/woff',
              }[ext] ?? 'application/octet-stream'
              res.setHeader('Content-Type', mime)
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
              res.end(fs.readFileSync(filePath))
              return
            }
          }

          // Serve /public/** from parent bookimmo/public folder
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
      }
    }
  ],
  server: { port: 3000 }
})
