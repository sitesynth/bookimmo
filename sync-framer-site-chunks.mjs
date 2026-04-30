import fs from 'node:fs/promises'
import path from 'node:path'

const siteId = '7i7OT8rEND0rWXuY5IMijW'
const baseUrl = `https://static/sites/${siteId}/`
const dir = `/Users/miguelaprossine/bookimmo/public/_local/static/sites/${siteId}`

const refs = new Set()
const seen = new Set()
let downloaded = 0

function addRef(ref) {
  if (!ref) return
  const clean = ref.split('?')[0]
  if (!clean) return
  if (!/\.(mjs|js|json)$/i.test(clean)) return
  refs.add(clean)
}

function extractRefs(text) {
  const patterns = [
    new RegExp(`\\./([A-Za-z0-9._/-]+\\.(?:mjs|js|json))`, 'g'),
    new RegExp(`/_local/framerusercontent\\.com/sites/${siteId}/([A-Za-z0-9._/-]+\\.(?:mjs|js|json))`, 'g'),
    new RegExp(`https://framerusercontent\\.com/sites/${siteId}/([A-Za-z0-9._/-]+\\.(?:mjs|js|json))`, 'g'),
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(text)) !== null) addRef(m[1])
  }
}

async function fetchAndStore(ref) {
  const url = new URL(ref, baseUrl).toString()
  const out = path.join(dir, ref)
  await fs.mkdir(path.dirname(out), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) return false
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(out, buf)
  downloaded += 1
  return true
}

async function readTextIfPossible(p) {
  try {
    return await fs.readFile(p, 'utf8')
  } catch {
    return null
  }
}

async function main() {
  const initial = await fs.readdir(dir)
  for (const name of initial) {
    if (/\.(mjs|js|json)$/i.test(name)) refs.add(name)
  }

  while (true) {
    const next = [...refs].find((r) => !seen.has(r))
    if (!next) break
    seen.add(next)

    const out = path.join(dir, next)
    const ok = await fetchAndStore(next)
    if (!ok) continue

    const text = await readTextIfPossible(out)
    if (text) extractRefs(text)
  }

  const files = await fs.readdir(dir)
  console.log(`Tracked refs: ${refs.size}`)
  console.log(`Processed refs: ${seen.size}`)
  console.log(`Downloaded/updated: ${downloaded}`)
  console.log(`Top-level files now: ${files.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
