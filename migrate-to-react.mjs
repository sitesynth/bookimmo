#!/usr/bin/env node
/**
 * migrate-to-react.mjs
 * Universal Framer-export → React+Vite+Tailwind migration script.
 *
 * Features:
 * - Detects structure (langs, pages, collections, i18n)
 * - Extracts inline styles and converts to Tailwind classes
 * - Parses <style> tags and generates .module.css per component
 * - Maps Framer classnames to their CSS definitions
 * - Generates complete React app with Tailwind + Directus integration
 *
 * Usage:
 *   node migrate-to-react.mjs [--out ./react-app] [--directus https://cms.example.com]
 */

import fs   from 'node:fs/promises'
import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const outDir       = argVal(args, '--out')       ?? './react-app'
const directusBase = argVal(args, '--directus')  ?? 'https://cms.example.com'
const srcDir       = process.cwd()

function argVal(arr, flag) {
  const i = arr.indexOf(flag)
  return i !== -1 ? arr[i + 1] : undefined
}

// ─── CSS/Tailwind conversion ──────────────────────────────────────────────────

/**
 * Parse inline style="..." into object
 * "color: red; font-size: 16px;" → { color: 'red', fontSize: '16px' }
 */
function parseInlineStyle(styleStr) {
  if (!styleStr) return {}
  const styles = {}
  styleStr.split(';').forEach(decl => {
    const [prop, val] = decl.split(':').map(s => s.trim())
    if (prop && val) {
      // Convert CSS property to camelCase
      const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      styles[camelProp] = val
    }
  })
  return styles
}

/**
 * Convert CSS property+value to Tailwind class(es)
 * Returns string like "text-red-600 text-lg" or empty if no match
 */
function cssToTailwind(prop, value) {
  const classes = []

  // Color conversions (simplified; extend as needed)
  const colorMap = {
    'black': 'black', 'white': 'white', 'red': 'red-600', 'blue': 'blue-600',
    'green': 'green-600', 'gray': 'gray-600', 'yellow': 'yellow-500',
    'transparent': 'transparent',
    '#000': 'black', '#fff': 'white', '#ffffff': 'white',
    'rgba(0,0,0': 'black', 'rgba(255,255,255': 'white'
  }

  const sizeMap = {
    '12px': 'text-sm', '14px': 'text-sm', '16px': 'text-base',
    '18px': 'text-lg', '20px': 'text-xl', '24px': 'text-2xl',
    '32px': 'text-4xl', '36px': 'text-5xl', '48px': 'text-6xl'
  }

  const weightMap = {
    '400': 'font-normal', '500': 'font-medium', '600': 'font-semibold',
    '700': 'font-bold', '800': 'font-extrabold', 'bold': 'font-bold',
    'normal': 'font-normal'
  }

  // Text properties
  if (prop === 'color' || prop === 'textColor') {
    for (const [k, v] of Object.entries(colorMap)) {
      if (value.includes(k)) { classes.push(`text-${v}`); break }
    }
  }
  if (prop === 'fontSize') {
    for (const [k, v] of Object.entries(sizeMap)) {
      if (value === k || value.includes(k)) { classes.push(v); break }
    }
  }
  if (prop === 'fontWeight') {
    for (const [k, v] of Object.entries(weightMap)) {
      if (value === k || value.includes(k)) { classes.push(v); break }
    }
  }

  // Display properties
  if (prop === 'display') {
    if (value === 'none') classes.push('hidden')
    if (value === 'flex') classes.push('flex')
    if (value === 'grid') classes.push('grid')
    if (value === 'inline-block') classes.push('inline-block')
    if (value === 'block') classes.push('block')
  }

  // Positioning
  if (prop === 'position') {
    if (value === 'absolute') classes.push('absolute')
    if (value === 'relative') classes.push('relative')
    if (value === 'fixed') classes.push('fixed')
  }

  // Spacing (rough conversion)
  const spacingMap = {
    '8px': 'px-2 py-2', '12px': 'px-3 py-3', '16px': 'px-4 py-4',
    '24px': 'px-6 py-6', '32px': 'px-8 py-8'
  }
  if (prop === 'padding') {
    for (const [k, v] of Object.entries(spacingMap)) {
      if (value === k) { classes.push(v); break }
    }
  }

  // Borders
  if (prop === 'borderRadius') {
    if (value === '4px') classes.push('rounded')
    if (value === '8px') classes.push('rounded-lg')
    if (value === '12px') classes.push('rounded-xl')
    if (value === '16px') classes.push('rounded-2xl')
  }

  // Opacity
  if (prop === 'opacity') {
    const num = parseFloat(value)
    if (num < 0.3) classes.push('opacity-25')
    if (num >= 0.3 && num < 0.6) classes.push('opacity-50')
    if (num >= 0.6 && num < 0.9) classes.push('opacity-75')
    if (num >= 0.9) classes.push('opacity-100')
  }

  return classes.join(' ')
}

/**
 * Extract <style> tags from HTML, build className → CSS map
 */
function extractStylesheets(html) {
  const styleMap = new Map() // className → CSS rules
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g
  let match
  while ((match = styleRe.exec(html)) !== null) {
    const css = match[1]
    // Parse CSS rules: .className { ... }
    const ruleRe = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g
    let ruleMatch
    while ((ruleMatch = ruleRe.exec(css)) !== null) {
      const className = ruleMatch[1]
      const cssRules = ruleMatch[2]
      styleMap.set(className, cssRules)
    }
  }
  return styleMap
}

/**
 * Extract CSS for a specific data-framer-name section
 * Collects all inline styles, relevant CSS classes, pseudo-selectors
 */
function extractSectionStyles(html, sectionName, styleMap) {
  const sectionHtml = extractElementByDataName(html, sectionName)
  if (!sectionHtml) return {}

  const styles = {}

  // 1. Collect all inline styles from elements in this section
  const inlineRe = /style="([^"]*)"/g
  let m
  while ((m = inlineRe.exec(sectionHtml)) !== null) {
    const inlineStyles = parseInlineStyle(m[1])
    Object.assign(styles, inlineStyles)
  }

  // 2. Collect CSS for all framer-* classes in this section
  const classRe = /class="([^"]*)"/g
  const classes = new Set()
  while ((m = classRe.exec(sectionHtml)) !== null) {
    m[1].split(/\s+/).forEach(c => {
      if (c.startsWith('framer-')) classes.add(c)
    })
  }

  // 3. Look up CSS rules for these classes
  const cssRules = {}
  for (const cls of classes) {
    if (styleMap.has(cls)) {
      cssRules[`.${cls}`] = styleMap.get(cls)
    }
  }

  return { inlineStyles: styles, cssRules, framerClasses: [...classes] }
}

/**
 * Extract HTML element containing data-framer-name="sectionName"
 */
function extractElementByDataName(html, sectionName) {
  const regex = new RegExp(
    `<[^>]*data-framer-name="${sectionName}"[^>]*>([\\s\\S]*?)(?=<[^>]+data-framer-name|$)`,
    'i'
  )
  const m = html.match(regex)
  return m ? m[0] : null
}

/**
 * Generate module.css from extracted styles
 */
function generateModuleCSS(sectionName, styles) {
  const lines = [`/* Auto-generated from Framer export: ${sectionName} */\n`]

  if (styles.cssRules && Object.keys(styles.cssRules).length > 0) {
    lines.push('/* Framer classname rules */\n')
    for (const [selector, rules] of Object.entries(styles.cssRules)) {
      lines.push(`${selector} {\n  ${rules.replace(/;\s*/g, ';\n  ')}\n}\n`)
    }
  }

  if (styles.inlineStyles && Object.keys(styles.inlineStyles).length > 0) {
    lines.push('/* Inline styles */\n')
    const props = []
    for (const [prop, val] of Object.entries(styles.inlineStyles)) {
      // Convert camelCase back to kebab-case
      const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      props.push(`  ${cssProp}: ${val};`)
    }
    lines.push(`.root {\n${props.join('\n')}\n}\n`)
  }

  return lines.join('')
}

/**
 * Generate Tailwind classes from inline styles
 */
function inlineStylesToTailwind(inlineStyles) {
  const classes = []
  for (const [prop, val] of Object.entries(inlineStyles)) {
    const tw = cssToTailwind(prop, val)
    if (tw) classes.push(tw)
  }
  return classes.join(' ')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function write(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
  console.log('  write', path.relative(srcDir, filePath))
}

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.copyFile(src, dest)
}

async function readIfExists(p) {
  try { return await fs.readFile(p, 'utf8') } catch { return null }
}

// ─── 1. Detect languages ─────────────────────────────────────────────────────
async function detectLangs() {
  const LANG_RE = /^[a-z]{2}$/
  const entries = await fs.readdir(srcDir, { withFileTypes: true })
  const langs = entries
    .filter(e => e.isDirectory() && LANG_RE.test(e.name))
    .filter(e => existsSync(path.join(srcDir, e.name, 'index.html')))
    .map(e => e.name)
  return langs.length ? langs : ['en']
}

// ─── 2. Parse HTML → sections via data-framer-name ───────────────────────────
function extractSections(html) {
  const sections = new Map()
  const sectionRe = /data-framer-name="([^"]+)"/g
  let m
  while ((m = sectionRe.exec(html)) !== null) {
    const name = m[1]
    if (sections.has(name)) continue
    const before = html.slice(Math.max(0, m.index - 200), m.index)
    const tagMatch = before.match(/<([A-Za-z][A-Za-z0-9]*)(?:\s[^>]*)?\s*$/)
    const tag = tagMatch ? tagMatch[1] : 'div'
    const afterAttr = html.slice(m.index, m.index + 300)
    const classMatch = afterAttr.match(/class="([^"]*)"/)
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(c => /^framer-/.test(c)) : []
    sections.set(name, { tag, framerClasses: classes })
  }
  return [...sections.entries()].map(([name, meta]) => ({ name, ...meta }))
}

// ─── 3. Detect pages ────────────────────────────────────────────────────────
async function detectPages(langs) {
  const pages = new Set(['home'])
  for (const lang of langs) {
    const pagesDir = path.join(srcDir, lang, 'pages')
    const rootPagesDir = path.join(srcDir, 'pages')
    for (const dir of [pagesDir, rootPagesDir]) {
      try {
        const files = await fs.readdir(dir)
        files.filter(f => f.endsWith('.html')).forEach(f => pages.add(path.basename(f, '.html')))
      } catch { }
    }
  }
  return [...pages]
}

// ─── 4. Detect collections ──────────────────────────────────────────────────
async function detectCollections() {
  const bridgeSrc = await readIfExists(path.join(srcDir, 'public', 'directus-bridge.js'))
  if (!bridgeSrc) return []
  const collections = new Set()
  const re = /\/items\/([a-zA-Z_]+)/g
  let m
  while ((m = re.exec(bridgeSrc)) !== null) collections.add(m[1])
  return [...collections]
}

// ─── 5. Detect i18n ─────────────────────────────────────────────────────────
async function detectI18nFiles() {
  const i18nDir = path.join(srcDir, 'public', 'i18n')
  try {
    const files = await fs.readdir(i18nDir)
    return files.filter(f => f.endsWith('.json')).map(f => ({
      lang: path.basename(f, '.json'),
      src: path.join(i18nDir, f)
    }))
  } catch { return [] }
}

// ─── 6. Detect env ──────────────────────────────────────────────────────────
async function detectEnv() {
  const bridge = await readIfExists(path.join(srcDir, 'public', 'directus-bridge.js'))
  const env = { DIRECTUS_BASE: directusBase, DIRECTUS_TOKEN: '' }
  if (bridge) {
    const baseM = bridge.match(/["']https?:\/\/[^"']+["']/)
    if (baseM) env.DIRECTUS_BASE = baseM[0].replace(/['"]/g, '')
    const tokenM = bridge.match(/[a-f0-9]{40,}/)
    if (tokenM) env.DIRECTUS_TOKEN = tokenM[0]
  }
  return env
}

// ─── Generators ──────────────────────────────────────────────────────────────

function componentName(raw) {
  return raw.replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1)).join('')
}

function genPackageJson(projectName) {
  return JSON.stringify({
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      react: '^18.3.0',
      'react-dom': '^18.3.0',
      'react-router-dom': '^6.26.0',
      'react-i18next': '^15.0.0',
      'i18next': '^23.0.0',
      '@directus/sdk': '^17.0.0'
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.0',
      vite: '^5.4.0',
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      'autoprefixer': '^10.4.0'
    }
  }, null, 2)
}

function genViteConfig() {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
})
`
}

function genTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
}

function genPostCSSConfig() {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
}

function genIndexCss() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`
}

function genIndexHtml(projectName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
}

function genMainJsx() {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config.js'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
`
}

function genAppJsx(langs, pages) {
  const defaultLang = langs[0] ?? 'en'
  const routes = pages.map(p =>
    p === 'home'
      ? `        <Route index element={<HomePage />} />`
      : `        <Route path="${p}" element={<${componentName(p)}Page />} />`
  ).join('\n')

  const pageImports = pages.map(p =>
    p === 'home'
      ? `import HomePage from './pages/HomePage.jsx'`
      : `import ${componentName(p)}Page from './pages/${componentName(p)}Page.jsx'`
  ).join('\n')

  const langRoutes = langs.map(lang => `
      <Route path="/${lang}" element={<LangWrapper lang="${lang}" />}>
${routes}
      </Route>`).join('')

  return `import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
${pageImports}

function LangWrapper({ lang }) {
  const { i18n } = useTranslation()
  useEffect(() => { i18n.changeLanguage(lang) }, [lang, i18n])
  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/${defaultLang}" replace />} />
${langRoutes}
      <Route path="*" element={<Navigate to="/${defaultLang}" replace />} />
    </Routes>
  )
}
`
}

function genI18nConfig(langs) {
  const imports = langs.map(l => `import ${l} from './${l}.json'`).join('\n')
  const resources = langs.map(l => `  ${l}: { translation: ${l} }`).join(',\n')
  return `import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
${imports}

i18n.use(initReactI18next).init({
  resources: {
${resources}
  },
  lng: '${langs[0] ?? 'en'}',
  fallbackLng: '${langs[0] ?? 'en'}',
  interpolation: { escapeValue: false }
})

export default i18n
`
}

function genDirectusClient(env) {
  return `import { createDirectus, rest, authentication, readItems } from '@directus/sdk'

const DIRECTUS_URL  = import.meta.env.VITE_DIRECTUS_URL  ?? '${env.DIRECTUS_BASE}'
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN ?? '${env.DIRECTUS_TOKEN}'

const client = createDirectus(DIRECTUS_URL)
  .with(authentication())
  .with(rest())

if (DIRECTUS_TOKEN) {
  client.setToken(DIRECTUS_TOKEN)
}

export { client, readItems }
`
}

function genUseDirectus(collections) {
  const hookExamples = collections.map(col => `
// const { data: ${col} } = useDirectus('${col}', {
//   filter: { status: { _eq: 'published' } },
//   sort: ['-date_created'],
//   limit: 24,
// })`).join('')

  return `import { useState, useEffect } from 'react'
import { client, readItems } from '../api/directus.js'
${hookExamples ? '\n// Example usage:' + hookExamples : ''}

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
`
}

function genSection(section, tailwindClasses = '', moduleCSS = '') {
  const cName = componentName(section.name)
  const classes = section.framerClasses.join(' ')
  const imports = moduleCSS ? `import styles from './${cName}.module.css'\n` : ''
  const className = tailwindClasses || (moduleCSS ? 'styles.root' : `'${cName.toLowerCase()}'`)

  return `import React from 'react'
${imports}
// Framer classes: ${classes || 'none'}
// Original name: "${section.name}"
// TODO: implement this section

export default function ${cName}() {
  return (
    <section className={${className}} data-section="${section.name}">
      {/* TODO: render content for "${section.name}" */}
    </section>
  )
}
`
}

function genPage(pageName, sections, collections) {
  const cName = componentName(pageName)
  const isHome = pageName === 'home'

  const collectionHooks = isHome && collections.length
    ? collections.map(col =>
        `  const { data: ${col}, loading: ${col}Loading } = useDirectus('${col}', {\n    filter: { status: { _eq: 'published' } },\n    limit: 24,\n  })`
      ).join('\n')
    : ''

  const sectionImports = sections.slice(0, 8).map(s =>
    `import ${componentName(s.name)} from '../components/${componentName(s.name)}.jsx'`
  ).join('\n')

  const sectionUsage = sections.slice(0, 8).map(s =>
    `      <${componentName(s.name)} />`
  ).join('\n')

  return `import React from 'react'
import { useTranslation } from 'react-i18next'
${isHome && collections.length ? "import { useDirectus } from '../hooks/useDirectus.js'" : ''}
${sectionImports}

export default function ${cName}Page() {
  const { t } = useTranslation()
${collectionHooks}

  return (
    <main>
${sectionUsage || '      {/* TODO: add sections */}'}
    </main>
  )
}
`
}

function genEnvFile(env) {
  return `# Directus CMS connection
VITE_DIRECTUS_URL=${env.DIRECTUS_BASE}
VITE_DIRECTUS_TOKEN=${env.DIRECTUS_TOKEN}
`
}

function genReadme(langs, pages, collections, sections) {
  return `# React App (migrated from Framer)

## Stack
- React 18 + Vite 5
- Tailwind CSS v3 (auto-converted from Framer inline styles)
- React Router v6 (lang-prefixed routes: ${langs.map(l => `/${l}`).join(', ')})
- react-i18next (translations)
- @directus/sdk (data source)

## Detected from Framer export
- **Languages**: ${langs.join(', ')}
- **Pages**: ${pages.join(', ')}
- **Collections**: ${collections.length ? collections.join(', ') : 'none'}
- **Sections**: ${sections.length} components generated

## Getting started
\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## CSS Strategy
- Each component has a \`.module.css\` with original Framer CSS + converted Tailwind
- Inline styles auto-converted to Tailwind classes where possible
- Reference \`.module.css\` for positioning, shadows, gradients not in Tailwind
- Gradually replace \`.module.css\` with pure Tailwind as you refine

## Structure
\`\`\`
src/
  api/directus.js         – Directus client
  hooks/useDirectus.js    – data hook
  i18n/                   – translations
  components/             – one per Framer section
    ComponentName.jsx
    ComponentName.module.css
  pages/                  – HomePage, BlogPage, etc.
  App.jsx                 – routing
  main.jsx
tailwind.config.js
postcss.config.js
\`\`\`
`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Analysing Framer export at:', srcDir)

  const langs       = await detectLangs()
  const pages       = await detectPages(langs)
  const collections = await detectCollections()
  const i18nFiles   = await detectI18nFiles()
  const env         = await detectEnv()

  // Read HTML
  const htmlSrc = await readIfExists(path.join(srcDir, langs[0], 'index.html'))
             ?? await readIfExists(path.join(srcDir, 'index.html'))
             ?? ''

  // Extract sections + styles
  const sections = extractSections(htmlSrc)
  const styleMap = extractStylesheets(htmlSrc)
  const sectionStyles = new Map()
  for (const section of sections) {
    const styles = extractSectionStyles(htmlSrc, section.name, styleMap)
    sectionStyles.set(section.name, styles)
  }

  console.log(`  langs: ${langs.join(', ')}`)
  console.log(`  pages: ${pages.join(', ')}`)
  console.log(`  collections: ${collections.join(', ') || 'none'}`)
  console.log(`  sections: ${sections.length}`)
  console.log(`  i18n files: ${i18nFiles.length}`)
  console.log(`  extracted CSS rules for styling`)
  console.log()

  const out = path.resolve(srcDir, outDir)
  const projectName = path.basename(out)
  console.log('📦 Generating React+Tailwind app at:', out)

  // Config files
  await write(path.join(out, 'package.json'),       genPackageJson(projectName))
  await write(path.join(out, 'vite.config.js'),     genViteConfig())
  await write(path.join(out, 'tailwind.config.js'), genTailwindConfig())
  await write(path.join(out, 'postcss.config.js'),  genPostCSSConfig())
  await write(path.join(out, 'index.html'),         genIndexHtml(projectName))
  await write(path.join(out, '.env.example'),       genEnvFile(env))
  await write(path.join(out, 'README.md'),          genReadme(langs, pages, collections, sections))

  // App structure
  await write(path.join(out, 'src', 'index.css'),   genIndexCss())
  await write(path.join(out, 'src', 'main.jsx'),    genMainJsx())
  await write(path.join(out, 'src', 'App.jsx'),     genAppJsx(langs, pages))

  // API + hooks
  await write(path.join(out, 'src', 'api', 'directus.js'),      genDirectusClient(env))
  await write(path.join(out, 'src', 'hooks', 'useDirectus.js'), genUseDirectus(collections))

  // i18n
  await write(path.join(out, 'src', 'i18n', 'config.js'), genI18nConfig(langs))
  for (const { lang, src } of i18nFiles) {
    await copyFile(src, path.join(out, 'src', 'i18n', `${lang}.json`))
  }

  // Components + CSS modules
  for (const section of sections) {
    const cName = componentName(section.name)
    const styles = sectionStyles.get(section.name)
    const tailwindClasses = inlineStylesToTailwind(styles.inlineStyles || {})
    const moduleCSS = generateModuleCSS(section.name, styles)

    await write(
      path.join(out, 'src', 'components', `${cName}.jsx`),
      genSection(section, tailwindClasses, moduleCSS ? 'true' : '')
    )

    if (moduleCSS) {
      await write(
        path.join(out, 'src', 'components', `${cName}.module.css`),
        moduleCSS
      )
    }
  }

  // Pages
  for (const page of pages) {
    const cName = componentName(page)
    const pageSections = page === 'home' ? sections.slice(0, 8) : []
    const pageCols = page === 'home' ? collections : []
    await write(
      path.join(out, 'src', 'pages', `${cName}Page.jsx`),
      genPage(page, pageSections, pageCols)
    )
  }

  console.log()
  console.log('✅ Done!')
  console.log()
  console.log('Next steps:')
  console.log(`  cd ${outDir}`)
  console.log('  npm install')
  console.log('  cp .env.example .env')
  console.log('  npm run dev')
}

main().catch(e => { console.error(e); process.exit(1) })
