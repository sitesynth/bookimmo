/**
 * generate-assets.mjs — renders OG image, apple-touch-icon and favicon PNGs
 * for book.immo using a headless Chrome instance.
 *
 *   node scripts/generate-assets.mjs
 *
 * Outputs:
 *   public/og-image.png          1200×630  (Open Graph / Twitter card)
 *   public/apple-touch-icon.png   180×180  (iOS home screen)
 *   public/favicon-32x32.png       32×32  (browser tab fallback)
 *
 * Requires Chrome at one of the standard macOS/Linux paths, OR a running
 * Chrome with --remote-debugging-port=9222 (uses that automatically).
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
]
const executablePath = CHROME_PATHS.find(p => existsSync(p))
if (!executablePath) {
  console.error('Chrome not found. Install Chrome or add its path to CHROME_PATHS.')
  process.exit(1)
}

const OG_TEMPLATE = 'file://' + path.join(__dirname, 'og-template.html')

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
})

// ── OG image: 1200×630 ───────────────────────────────────────────────────────
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  await page.goto(OG_TEMPLATE, { waitUntil: 'networkidle0', timeout: 30000 })
  // Extra wait for Google Fonts
  await new Promise(r => setTimeout(r, 1500))
  const out = path.join(PROJECT_ROOT, 'public', 'og-image.png')
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  console.log('✓  public/og-image.png  (1200×630 @2x)')
  await page.close()
}

// ── Apple touch icon: 180×180 ────────────────────────────────────────────────
// Render just the logo icon portion of the OG template, cropped to a square.
{
  const page = await browser.newPage()
  await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 2 })
  // Inline an apple-touch-icon sized page: centered house icon on orange bg
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>*{margin:0;padding:0;box-sizing:border-box}
  html,body{width:180px;height:180px;overflow:hidden;background:#fff8f0;display:flex;align-items:center;justify-content:center}
  svg{width:130px;height:113px}
  </style></head><body>
  <svg viewBox="0 0 28.5 25" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ati-lg0" x1="14.1" y1="3.2" x2="14.1" y2="27.1" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffb800"/><stop offset="1" stop-color="#ff8c00"/>
      </linearGradient>
      <linearGradient id="ati-lg1" x1="7" y1="3.2" x2="7" y2="27.1" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffb800"/><stop offset="1" stop-color="#ff8c00"/>
      </linearGradient>
    </defs>
    <path d="M27.8,16.9c0,1.7-.5,3.7-1.2,5.5h0l-6-3.5v-3.4c0-.9-.7-1.5-1.5-1.5s-1.5.7-1.5,1.5v1.5l-8.3-4.9c-.2-.1-.5-.2-.8-.2h0c-.3,0-.6,0-.9.3L.5,16.3C.8,9,6.8,3.2,14.1,3.2s13.7,6.1,13.7,13.7Z" fill="url(#ati-lg0)"/>
    <path d="M2.8,24.6c-.9-1.4-1.6-2.9-1.9-4.5l7.6-4.7,4.7,2.8-10.4,6.5h0Z" fill="url(#ati-lg1)"/>
  </svg>
  </body></html>`
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  const out = path.join(PROJECT_ROOT, 'public', 'apple-touch-icon.png')
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 180, height: 180 } })
  console.log('✓  public/apple-touch-icon.png  (180×180)')
  await page.close()
}

// ── Favicon PNG: 32×32 ───────────────────────────────────────────────────────
{
  const page = await browser.newPage()
  await page.setViewport({ width: 32, height: 32, deviceScaleFactor: 4 })
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>*{margin:0;padding:0;box-sizing:border-box}
  html,body{width:32px;height:32px;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center}
  svg{width:28px;height:24px}
  </style></head><body>
  <svg viewBox="0 0 28.5 25" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fv-lg0" x1="14.1" y1="3.2" x2="14.1" y2="27.1" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffb800"/><stop offset="1" stop-color="#ff8c00"/>
      </linearGradient>
      <linearGradient id="fv-lg1" x1="7" y1="3.2" x2="7" y2="27.1" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffb800"/><stop offset="1" stop-color="#ff8c00"/>
      </linearGradient>
    </defs>
    <path d="M27.8,16.9c0,1.7-.5,3.7-1.2,5.5h0l-6-3.5v-3.4c0-.9-.7-1.5-1.5-1.5s-1.5.7-1.5,1.5v1.5l-8.3-4.9c-.2-.1-.5-.2-.8-.2h0c-.3,0-.6,0-.9.3L.5,16.3C.8,9,6.8,3.2,14.1,3.2s13.7,6.1,13.7,13.7Z" fill="url(#fv-lg0)"/>
    <path d="M2.8,24.6c-.9-1.4-1.6-2.9-1.9-4.5l7.6-4.7,4.7,2.8-10.4,6.5h0Z" fill="url(#fv-lg1)"/>
  </svg>
  </body></html>`
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  const out = path.join(PROJECT_ROOT, 'public', 'favicon-32x32.png')
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 32, height: 32 } })
  console.log('✓  public/favicon-32x32.png  (32×32)')
  await page.close()
}

await browser.close()
console.log('\nAll assets generated → public/')
