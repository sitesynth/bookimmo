#!/usr/bin/env node
/**
 * generate-components.mjs
 * Reads computed-styles.json (produced by extract-computed.mjs) and auto-generates
 * one React JSX file per top-level Framer section, SvgSprites.jsx, and HomePage.jsx.
 *
 * Works for ANY Framer template — no hardcoded section names.
 * HTML→JSX conversion ported from migrate-v2.mjs (strips Framer garbage,
 * fixes attributes, removes animation initial states).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const DATA  = JSON.parse(await fs.readFile('react-app/src/computed-styles.json', 'utf-8'))
const OUT   = path.resolve('react-app/src/components')
const PAGES = path.resolve('react-app/src/pages')
const ASSETS_DIR = path.resolve('react-app/public/assets/videos')

// ── download Framer video assets locally ─────────────────────────────────────

/** Collect all framerusercontent video URLs from all page data, download, rewrite */
async function downloadVideoAssets(allDataSources) {
  const videoUrls = new Set()
  const videoRe = /https:\/\/framerusercontent\.com\/assets\/[A-Za-z0-9_-]+\.mp4/g
  for (const src of allDataSources) {
    const str = JSON.stringify(src)
    let m
    while ((m = videoRe.exec(str)) !== null) videoUrls.add(m[0])
  }
  if (videoUrls.size === 0) return {}
  await fs.mkdir(ASSETS_DIR, { recursive: true })
  const urlMap = {}
  for (const url of videoUrls) {
    const filename = url.split('/').pop()
    const localPath = path.join(ASSETS_DIR, filename)
    const publicUrl = `/assets/videos/${filename}`
    try {
      await fs.access(localPath)
      console.log(`  video already downloaded: ${filename}`)
    } catch {
      console.log(`  downloading video: ${filename}`)
      try {
        execSync(`curl -sL -o "${localPath}" "${url}"`, { timeout: 60000 })
      } catch (e) {
        console.error(`  WARN: failed to download ${url}:`, e.message)
        continue
      }
    }
    urlMap[url] = publicUrl
  }
  return urlMap
}

// Collect all data sources (homepage + per-page JSONs)
const SRC_DIR_EARLY = path.resolve('react-app/src')
const perPageFilesEarly = (await fs.readdir(SRC_DIR_EARLY)).filter(f => f.startsWith('computed-styles-') && f.endsWith('.json'))
const allDataSources = [DATA]
for (const file of perPageFilesEarly) {
  try { allDataSources.push(JSON.parse(await fs.readFile(path.join(SRC_DIR_EARLY, file), 'utf-8'))) } catch {}
}
const VIDEO_URL_MAP = await downloadVideoAssets(allDataSources)

// ── htmlToJsx (ported from migrate-v2.mjs) ────────────────────────────────────

function parseStyleStr(css) {
  const obj = {}
  if (!css) return obj
  let key = '', val = '', inVal = false, paren = 0, quote = null
  for (let i = 0; i <= css.length; i++) {
    const c = i < css.length ? css[i] : ';'
    if (!inVal) {
      if (c === ':') inVal = true
      else key += c
    } else if (quote) {
      val += c
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") {
      quote = c; val += c
    } else if (c === '(') {
      paren++; val += c
    } else if (c === ')') {
      paren--; val += c
    } else if (c === ';' && paren === 0) {
      const k = key.trim(); const v = val.trim()
      if (k && v) {
        const jk = k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
        obj[jk] = v
      }
      key = ''; val = ''; inVal = false
    } else {
      val += c
    }
  }
  return obj
}

/** Percent-encode SVG inside data:image/svg+xml URLs so they work reliably via React style prop */
function encodeSvgDataUrls(value) {
  const prefix = "url('data:image/svg+xml,"
  const idx = value.indexOf(prefix)
  if (idx === -1) return value
  // Find matching closing ')
  const svgStart = idx + prefix.length
  const svgEnd = value.lastIndexOf("')")
  if (svgEnd <= svgStart) return value
  const svgRaw = value.slice(svgStart, svgEnd)
  const encoded = svgRaw
    .replace(/%/g, '%25')
    .replace(/"/g, '%22')
    .replace(/'/g, '%27')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
  return value.slice(0, idx) + `url("data:image/svg+xml,${encoded}")` + value.slice(svgEnd + 2)
}

function styleObjToJsx(obj) {
  const entries = Object.entries(obj)
  if (!entries.length) return '{}'
  return `{${entries.map(([k, v]) => {
    const val = (k === 'backgroundImage' && v.includes('data:image/svg+xml')) ? encodeSvgDataUrls(v) : v
    return `${/^--/.test(k) ? `'${k}'` : k}: ${JSON.stringify(val)}`
  }).join(', ')}}`
}

const JSX_ATTR = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex',
  srcset: 'srcSet', autocomplete: 'autoComplete', autocapitalize: 'autoCapitalize',
  autocorrect: 'autoCorrect', autofocus: 'autoFocus', autoplay: 'autoPlay',
  playsinline: 'playsInline', spellcheck: 'spellCheck', contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin', viewbox: 'viewBox', 'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity', 'stroke-miterlimit': 'strokeMiterlimit',
  'fill-rule': 'fillRule', 'fill-opacity': 'fillOpacity',
  'clip-path': 'clipPath', 'clip-rule': 'clipRule',
  'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity',
  'text-anchor': 'textAnchor', 'text-decoration': 'textDecoration',
  'font-family': 'fontFamily', 'font-size': 'fontSize', 'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing', 'word-spacing': 'wordSpacing',
  'dominant-baseline': 'dominantBaseline', 'alignment-baseline': 'alignmentBaseline',
  'shape-rendering': 'shapeRendering', 'color-interpolation': 'colorInterpolation',
  'image-rendering': 'imageRendering', 'pointer-events': 'pointerEvents',
  xmlns: 'xmlns', 'xml:lang': 'xmlLang', 'xml:space': 'xmlSpace',
  'xlink:href': 'href',  // SVG xlink:href → just href in React
}

// HTML boolean attributes — empty-string value means "true" in JSX
const HTML_BOOLEAN_ATTRS = new Set([
  'muted', 'loop', 'autoplay', 'playsinline', 'controls', 'disabled',
  'checked', 'readonly', 'required', 'hidden', 'novalidate', 'allowfullscreen',
  'async', 'defer', 'reversed', 'selected', 'multiple', 'open', 'default',
  'nomodule', 'formnovalidate', 'disablepictureinpicture', 'disableremoteplayback',
])
const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])
const FRAMER_CSS_PROPS = new Set(['cornerShape', 'cornerRadius', 'framerBorderWidth'])
// Keep data-framer-appear-id (scroll animations) and data-border (used for ::after borders);
// strip everything else framer-specific
const FRAMER_ATTRS_RE = /^(data-framer-(?!appear-id|ticker)|data-highlight$|data-styles-preset$)/

function readAttr(src, i) {
  while (i < src.length && /\s/.test(src[i])) i++
  if (i >= src.length || src[i] === '>' || (src[i] === '/' && src[i + 1] === '>')) return null
  let name = ''
  while (i < src.length && !/[\s=/>]/.test(src[i])) name += src[i++]
  if (!name) return { name: '', value: null, end: i + 1 }
  while (i < src.length && src[i] === ' ') i++
  if (src[i] !== '=') return { name, value: null, end: i }
  i++
  while (i < src.length && src[i] === ' ') i++
  const q = src[i]
  if (q === '"' || q === "'") {
    i++
    let value = ''
    while (i < src.length && src[i] !== q) value += src[i++]
    i++
    return { name, value, end: i }
  }
  let value = ''
  while (i < src.length && !/[\s>]/.test(src[i])) value += src[i++]
  return { name, value, end: i }
}

function transformAttrs(rawAttrs, tagLower) {
  const parts = []
  const hasAppearId = rawAttrs.includes('data-framer-appear-id')
  let i = 0
  while (i < rawAttrs.length) {
    while (i < rawAttrs.length && /\s/.test(rawAttrs[i])) i++
    if (i >= rawAttrs.length) break
    const attr = readAttr(rawAttrs, i)
    if (!attr) break
    i = attr.end
    const { name, value } = attr
    if (!name) continue
    if (FRAMER_ATTRS_RE.test(name)) continue
    const jsxName = JSX_ATTR[name] ?? name
    // Boolean HTML attrs: muted="" / loop="" → muted / loop (JSX boolean true)
    if (value !== null && value === '' && HTML_BOOLEAN_ATTRS.has(name.toLowerCase())) {
      parts.push(jsxName)
      continue
    }
    if (value === null) {
      if (name === 'alt') { parts.push('alt=""'); continue }
      if (jsxName === 'value' && (tagLower === 'input' || tagLower === 'textarea')) {
        parts.push('defaultValue=""'); continue
      }
      parts.push(jsxName)
      continue
    }
    if (name === 'style') {
      const decoded = value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      const obj = parseStyleStr(decoded)
      if (parseFloat(obj.opacity ?? '1') < 0.01) delete obj.opacity
      if (obj.transform && /translateY|translateX|scale\(0/.test(obj.transform)) delete obj.transform
      if (hasAppearId) { delete obj.opacity; delete obj.transform }
      if (obj.visibility === 'hidden') obj.visibility = 'visible'
      delete obj.willChange
      for (const k of FRAMER_CSS_PROPS) delete obj[k]
      parts.push(`style={${styleObjToJsx(obj)}}`)
      continue
    }
    if (jsxName === 'tabIndex' && /^-?\d+$/.test(value)) { parts.push(`tabIndex={${value}}`); continue }
    if (jsxName === 'value' && (tagLower === 'input' || tagLower === 'textarea')) {
      parts.push(`defaultValue="${value}"`); continue
    }
    // Fix video tags: Framer's SSR doesn't include autoplay (JS adds it client-side)
    if (tagLower === 'video' && name === 'preload' && value === 'none') {
      parts.push('preload="auto"')
      continue
    }
    parts.push(`${jsxName}="${value}"`)
  }
  // Video tags from Framer SSR lack autoplay — add it
  if (tagLower === 'video' && !rawAttrs.includes('autoplay') && !rawAttrs.includes('autoPlay')) {
    parts.push('autoPlay')
  }
  // React doesn't apply `muted` prop correctly on initial render (known bug).
  // Use a ref callback to set muted + trigger play programmatically.
  if (tagLower === 'video') {
    parts.push('ref={el => { if (el) { el.muted = true; el.play?.().catch(() => {}) } }}')
  }
  return parts.length ? ' ' + parts.join(' ') : ''
}

// ── Framer vertical ticker/marquee animation ────────────────────────────────
// Framer's ticker renders as: <div overflow:hidden> > <ul flex-direction:column> > <li>*N
// The scroll animation is JS-only (not in SSR). We detect this pattern,
// duplicate <li> items for seamless loop, and tag <ul> for CSS animation.
function addTickerAnimation(html) {
  // Find <ul> elements with flex-direction:column containing 2+ <li> items
  return html.replace(/<ul\b([^>]*)>([\s\S]*?)<\/ul>/g, (ulMatch, ulAttrs, ulInner) => {
    if (!/flex-direction:\s*column/.test(ulAttrs)) return ulMatch
    // Extract all <li> — they may contain nested tags, so match by depth
    const liItems = []
    const liRe = /<li\b[^>]*>/g
    let m
    while ((m = liRe.exec(ulInner)) !== null) {
      const liStart = m.index
      // Find matching </li> by counting depth
      let depth = 1, pos = m.index + m[0].length
      while (pos < ulInner.length && depth > 0) {
        if (ulInner.startsWith('<li', pos) && /^<li[\s>]/.test(ulInner.slice(pos))) depth++
        else if (ulInner.startsWith('</li>', pos)) { depth--; if (depth === 0) break }
        pos++
      }
      liItems.push(ulInner.slice(liStart, pos + 5))
    }
    if (liItems.length < 2) return ulMatch
    // Duplicate items for seamless loop + add ticker data attribute
    const duplicated = liItems.join('') + liItems.join('')
    return `<ul${ulAttrs} data-framer-ticker="vertical">${duplicated}</ul>`
  })
}

// Remove "Template by XXX" credit elements and framer.com/marketplace links from HTML
function stripFramerCredits(html) {
  // Remove elements with data-framer-name="Template by ..."
  let out = html.replace(/<div[^>]*data-framer-name="Template by[^"]*"[^>]*>[\s\S]*?<\/div>/g, '')
  // Remove <a> links to framer.com/marketplace (creator profiles, template pages)
  out = out.replace(/<a[^>]*href="https?:\/\/(?:www\.)?framer\.com\/marketplace\/[^"]*"[^>]*>[\s\S]*?<\/a>/g, '')
  return out
}

function htmlToJsx(html) {
  if (!html) return ''
  // Rewrite framerusercontent video URLs to local paths
  let processed = addTickerAnimation(stripFramerCredits(html))
  for (const [remoteUrl, localUrl] of Object.entries(VIDEO_URL_MAP)) {
    processed = processed.replaceAll(remoteUrl, localUrl)
  }
  const result = []
  let i = 0
  while (i < processed.length) {
    if (processed[i] !== '<') { result.push(processed[i++]); continue }
    if (processed.startsWith('<!--', i)) {
      const end = processed.indexOf('-->', i + 4)
      i = end === -1 ? processed.length : end + 3
      continue
    }
    if (processed[i + 1] === '/') {
      const end = processed.indexOf('>', i + 2)
      if (end === -1) { result.push(processed[i++]); continue }
      const tagName = processed.slice(i + 2, end).trim().toLowerCase()
      if (!VOID_TAGS.has(tagName)) result.push(processed.slice(i, end + 1))
      i = end + 1
      continue
    }
    let j = i + 1
    let tagName = ''
    while (j < processed.length && /[A-Za-z0-9:.-]/.test(processed[j])) tagName += processed[j++]
    if (!tagName) { result.push(processed[i++]); continue }
    let rawAttrs = '', selfClose = false
    while (j < processed.length) {
      const c = processed[j]
      if (c === '>') { j++; break }
      if (c === '/' && processed[j + 1] === '>') { selfClose = true; j += 2; break }
      if (c === '"' || c === "'") {
        const q = c; rawAttrs += c; j++
        while (j < processed.length && processed[j] !== q) rawAttrs += processed[j++]
        if (j < processed.length) rawAttrs += processed[j++]
      } else { rawAttrs += c; j++ }
    }
    i = j
    const attrs = transformAttrs(rawAttrs, tagName.toLowerCase())
    const isVoid = VOID_TAGS.has(tagName.toLowerCase())
    result.push(`<${tagName}${attrs}${(isVoid || selfClose) ? ' />' : '>'}`)
  }
  return result.join('')
}

// ── appear animation injection ────────────────────────────────────────────────

// Map: data-framer-name → appear-id from CDP data.
// Used to inject data-framer-appear-id on card-level elements so CSS
// IntersectionObserver can stagger them independently of the section wrapper.
const APPEAR_MAP = {}
for (const [name, el] of Object.entries(DATA)) {
  if (!name.startsWith('_') && el.appearId) APPEAR_MAP[name] = el.appearId
}
let _autoAppearIdx = 0

// Card/item-level element pattern — these get CSS appear animation injected
const CARD_NAME_RE = /^(Variant \d|Testimonial|Metric|Perk|Feature|Step|Review|Card|Item)/i

// Inject data-framer-appear-id into raw HTML before htmlToJsx processes it.
// Skips elements that already have the attribute in the same tag.
function injectAppearIds(html) {
  return html.replace(/data-framer-name="([^"]+)"/g, (match, name, offset) => {
    // Look back to the opening < of this tag and check for existing appear-id
    const tagStart = html.lastIndexOf('<', offset)
    if (tagStart >= 0 && html.slice(tagStart, offset).includes('data-framer-appear-id')) {
      return match // already has one, skip
    }
    const computed = APPEAR_MAP[name]
    if (computed) return `data-framer-appear-id="${computed}" ${match}`
    if (CARD_NAME_RE.test(name)) return `data-framer-appear-id="appear-${++_autoAppearIdx}" ${match}`
    return match
  })
}

// ── helpers ───────────────────────────────────────────────────────────────────

function toComponentName(raw) {
  let name = raw
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join('') || 'Section'
  // JS identifiers can't start with a digit — prefix with underscore
  if (/^\d/.test(name)) name = '_' + name
  return name
}

async function write(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf-8')
  console.log('  write', path.relative(path.resolve('.'), filePath))
}

// ── main ──────────────────────────────────────────────────────────────────────

// Top-level sections: have outerHTML + isTopLevel flag, sorted by y-position
const sections = Object.entries(DATA)
  .filter(([k, d]) => !k.startsWith('_') && d.isTopLevel && d.outerHTML)
  .sort((a, b) => (a[1].rect?.y ?? 0) - (b[1].rect?.y ?? 0))

if (sections.length === 0) {
  console.error('No top-level sections with outerHTML found in computed-styles.json.')
  console.error('Re-run extract-computed.mjs first to capture the updated data.')
  process.exit(1)
}

// SvgSprites.jsx — merge SVG sprites from ALL pages (homepage + per-page JSONs)
// Each Framer page has its OWN #svg-templates div with unique SVG IDs.
// We merge all of them into a single SvgSprites component so any page can
// reference any SVG sprite via <use href="#svgID">.
{
  const allSvgIds = new Set()
  const allSvgElements = []

  function collectSprites(spritesHtml) {
    if (!spritesHtml) return
    const svgOpenRe = /<svg\b[^>]*\bid="([^"]+)"[^>]*>/g
    let sm
    while ((sm = svgOpenRe.exec(spritesHtml)) !== null) {
      const svgId = sm[1]
      if (svgId === 'svg-templates' || allSvgIds.has(svgId)) continue
      // Find matching </svg> by counting depth
      let depth = 1, pos = sm.index + sm[0].length
      while (pos < spritesHtml.length && depth > 0) {
        if (spritesHtml.startsWith('<svg', pos)) depth++
        else if (spritesHtml.startsWith('</svg>', pos)) { depth--; if (depth === 0) break }
        pos++
      }
      allSvgIds.add(svgId)
      allSvgElements.push(spritesHtml.slice(sm.index, pos + 6))
    }
  }

  // Prefer pre-merged sprites from the extractor
  if (DATA._allSvgSprites) {
    collectSprites(DATA._allSvgSprites)
  } else {
    // Fallback: collect from homepage + all per-page JSONs
    collectSprites(DATA._svgSprites)
    const SRC_DIR = path.resolve('react-app/src')
    const perPageFiles = (await fs.readdir(SRC_DIR)).filter(f => f.startsWith('computed-styles-') && f.endsWith('.json'))
    for (const file of perPageFiles) {
      try {
        const pd = JSON.parse(await fs.readFile(path.join(SRC_DIR, file), 'utf-8'))
        collectSprites(pd._svgSprites)
      } catch {}
    }
  }

  if (allSvgElements.length > 0) {
    const mergedHtml = `<div id="svg-templates" style="position: absolute; overflow: hidden; bottom: 0; left: 0; width: 0; height: 0; z-index: 0; contain: strict;" aria-hidden="true">\n${allSvgElements.join('\n')}\n</div>`
    const jsx = htmlToJsx(mergedHtml)
    await write(
      path.join(OUT, 'SvgSprites.jsx'),
      `import React from 'react'\n\nexport default function SvgSprites() {\n  return (\n    ${jsx}\n  )\n}\n`,
    )
    console.log(`  Merged ${allSvgElements.length} unique SVG sprites into SvgSprites.jsx`)
  } else if (DATA._svgSprites) {
    // Absolute fallback: use homepage sprites as-is
    const jsx = htmlToJsx(DATA._svgSprites)
    await write(
      path.join(OUT, 'SvgSprites.jsx'),
      `import React from 'react'\n\nexport default function SvgSprites() {\n  return (\n    ${jsx}\n  )\n}\n`,
    )
  }
}

// One component per top-level section — rendered as-is without extra wrappers.
// Framer pages use precise flex/grid layouts where each section is a direct child
// of the root container. Adding wrapper divs (like motion.div) breaks those layouts.
// Scroll animations are handled by useFramerAppear (IntersectionObserver on
// data-framer-appear-id elements) — no motion wrapper needed.
// Filter out Framer marketplace promo blocks ("Get Template for $XX") — universal for all templates
// Match only the "Get Template for $XX" promo overlay, not pages that merely link to Framer
const FRAMER_PROMO_RE = /Get Template/

const componentNames = []
for (const [name, data] of sections) {
  if (FRAMER_PROMO_RE.test(data.outerHTML ?? '')) {
    console.log(`  skip section "${name}" — Framer marketplace promo`)
    continue
  }
  const compName = toComponentName(name)
  componentNames.push(compName)
  const jsx = htmlToJsx(injectAppearIds(data.outerHTML))
  await write(
    path.join(OUT, `${compName}.jsx`),
`import React from 'react'

export default function ${compName}() {
  return (
    <>
      ${jsx}
    </>
  )
}
`,
  )
}

// HomePage.jsx — auto-imports every generated section in y-order
const rootClass = DATA._rootClass ?? ''
const hasSvg    = !!DATA._svgSprites

// Nav is NOT included separately — each page's SSR sections already contain their
// own navigation bar. Adding a shared Nav.jsx creates duplicates and breaks flex layouts.
const allComponents = componentNames
const imports = [
  ...(hasSvg  ? ["import SvgSprites from '../components/SvgSprites.jsx'"] : []),
  ...componentNames.map(n => `import ${n} from '../components/${n}.jsx'`),
].join('\n')
const usage = allComponents.map(n => `      <${n} />`).join('\n')

await write(
  path.join(PAGES, 'HomePage.jsx'),
  `import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
${imports}

export default function HomePage() {
  useFramerAppear()
  return (
    <div${rootClass ? ` className="${rootClass}"` : ''} style={{minHeight:'100vh',width:'auto'}}>
${hasSvg ? '      <SvgSprites />\n' : ''}${usage}
    </div>
  )
}
`,
)

console.log(`\nDone. Generated ${componentNames.length} components + HomePage.jsx`)
console.log('Sections (in order):', componentNames.join(', '))

// ── Per-page JSON files → extra page components ──────────────────────────────
// Reads computed-styles-{slug}.json files produced by extract-computed.mjs
// and generates one React page file per discovered page.

const SRC = path.resolve('react-app/src')
const pageFiles = (await fs.readdir(SRC)).filter(f => f.startsWith('computed-styles-') && f.endsWith('.json'))

for (const file of pageFiles) {
  const pageData  = JSON.parse(await fs.readFile(path.join(SRC, file), 'utf-8'))
  const slug      = pageData._pageSlug ?? file.replace('computed-styles-','').replace('.json','')
  const rootCls   = pageData._rootClass ?? ''

  // Generate one section component per top-level section
  const pageSections = Object.entries(pageData)
    .filter(([k]) => !k.startsWith('_'))
    .filter(([, v]) => v.outerHTML && v.isTopLevel)

  if (!pageSections.length) {
    // sections from this page weren't marked isTopLevel — use all non-_ keys with outerHTML
    const all = Object.entries(pageData).filter(([k, v]) => !k.startsWith('_') && v.outerHTML)
    pageSections.push(...all)
  }

  if (!pageSections.length) {
    console.log(`  skip ${file} — no sections found`)
    continue
  }

  const pageCompNames = []
  for (const [name, data] of pageSections) {
    if (FRAMER_PROMO_RE.test(data.outerHTML ?? '')) {
      console.log(`  skip section "${name}" in ${slug} — Framer marketplace promo`)
      continue
    }
    const compName = `${toComponentName(slug)}${toComponentName(name)}`
    pageCompNames.push(compName)
    const jsx = htmlToJsx(injectAppearIds(data.outerHTML))
    await write(
      path.join(OUT, `${compName}.jsx`),
`import React from 'react'

export default function ${compName}() {
  return (
    <>
      ${jsx}
    </>
  )
}
`,
    )
  }

  // Page file name: e.g. slug "Property-Details-cozy-condo" → "PropertyDetailsCozyCondo"
  const pageFileName = toComponentName(slug)
  // Always include SvgSprites — we merge sprites from all pages
  // No separate Nav — each page's SSR sections already include navigation
  const pageImports = [
    "import SvgSprites from '../components/SvgSprites.jsx'",
    ...pageCompNames.map(n => `import ${n} from '../components/${n}.jsx'`),
  ].join('\n')
  const pageUsage = pageCompNames.map(n => `      <${n} />`).join('\n')

  await write(
    path.join(PAGES, `${pageFileName}Page.jsx`),
`import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
${pageImports}

export default function ${pageFileName}Page() {
  useFramerAppear()
  return (
    <div${rootCls ? ` className="${rootCls}"` : ''} style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
${pageUsage}
    </div>
  )
}
`,
  )
  console.log(`  Generated ${pageFileName}Page.jsx (${pageCompNames.length} sections from ${file})`)
}

// ── Cleanup: delete orphaned component files from skipped sections ────────────
// Collect all generated component filenames, then remove any .jsx in components/
// that was generated by a previous run but no longer matches any current section.
{
  const allGenerated = new Set()
  // Add homepage components
  for (const name of componentNames) allGenerated.add(`${name}.jsx`)
  allGenerated.add('SvgSprites.jsx')
  // Add per-page components (already written above) — scan existing files for pattern
  const existing = await fs.readdir(OUT)
  const generatedByPages = new Set()
  for (const file of pageFiles) {
    const pd = JSON.parse(await fs.readFile(path.join(SRC, file), 'utf-8'))
    const slug = pd._pageSlug ?? file.replace('computed-styles-','').replace('.json','')
    const secs = Object.entries(pd).filter(([k, v]) => !k.startsWith('_') && v.outerHTML)
    for (const [name] of secs) {
      if (FRAMER_PROMO_RE.test(pd[name]?.outerHTML ?? '')) continue
      generatedByPages.add(`${toComponentName(slug)}${toComponentName(name)}.jsx`)
    }
  }
  for (const f of generatedByPages) allGenerated.add(f)

  let cleaned = 0
  for (const file of existing) {
    if (!file.endsWith('.jsx')) continue
    if (allGenerated.has(file)) continue
    // Safety: only delete files that look auto-generated (no manual edits marker)
    const content = await fs.readFile(path.join(OUT, file), 'utf-8')
    if (content.includes('// manual') || content.includes('/* manual */')) continue
    await fs.unlink(path.join(OUT, file))
    console.log(`  cleanup: deleted orphaned ${file}`)
    cleaned++
  }
  if (cleaned) console.log(`  Cleaned up ${cleaned} orphaned component files`)
}
