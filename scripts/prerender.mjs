/**
 * prerender.mjs — static HTML snapshot for SEO-critical marketing routes
 *
 * Run AFTER `vite build`:
 *   node scripts/prerender.mjs
 *
 * Or use the combined script:
 *   npm run build:ssg
 *
 * How it works:
 *   1. Starts a Vite preview server serving dist/
 *   2. Visits each marketing route with headless Chrome
 *   3. Saves the rendered HTML to dist/<route>/index.html
 *
 * Vercel will serve these static files directly (static files take priority
 * over the catch-all rewrite in vercel.json), giving crawlers full HTML.
 * For routes without a prerendered file, the SPA rewrite kicks in as usual.
 */
import puppeteer from 'puppeteer'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = 4175

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `vite build` first')
  process.exit(1)
}

// ── Static file server for dist/ ─────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.avif': 'image/avif',
  '.woff2':'font/woff2',
}

const server = createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0]
  // Treat /foo/bar as /foo/bar/index.html
  let filePath = path.join(DIST, urlPath)
  if (!existsSync(filePath) || (await import('node:fs')).statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, urlPath, 'index.html')
  }
  if (!existsSync(filePath)) {
    // SPA fallback
    filePath = path.join(DIST, 'index.html')
  }
  const ext = path.extname(filePath)
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  res.end(await readFile(filePath))
})

await new Promise(resolve => server.listen(PORT, resolve))
console.log(`▶  preview server on http://localhost:${PORT}`)

// ── Routes to prerender ───────────────────────────────────────────────────────
// Only static marketing pages. Auth, dashboard, and dynamic detail pages
// are intentionally excluded (they need client-side data anyway).

const ROUTES = [
  '/en', '/de', '/fr', '/nl', '/it',
  '/en/agent', '/de/agent', '/fr/agent', '/nl/agent', '/it/agent',
  '/en/privacy-policy', '/de/privacy-policy',
  '/en/terms-of-service', '/de/terms-of-service',
]

// ── Puppeteer ─────────────────────────────────────────────────────────────────

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
})

let ok = 0, fail = 0

for (const route of ROUTES) {
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })
    // Give React + i18n a moment to fully render
    await new Promise(r => setTimeout(r, 600))

    const html = await page.content()
    const segments = route.slice(1).split('/').filter(Boolean) // '/en' → ['en']
    const outDir = path.join(DIST, ...segments)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8')
    console.log(`✓  dist${route}/index.html`)
    ok++
    await page.close()
  } catch (err) {
    console.warn(`✗  ${route}: ${err.message}`)
    fail++
  }
}

await browser.close()
server.close()

console.log(`\nPrerender done — ${ok} succeeded, ${fail} failed`)
if (fail > 0) process.exit(1)
