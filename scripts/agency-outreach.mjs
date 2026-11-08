// Build an outreach list of agencies that list expensive rentals in our crawled cities.
// Groups active IS24 listings by agency logo, fetches one expose per group for the
// company name and contacts, and writes CSV, JSON and Markdown rankings.
// Usage: node scripts/agency-outreach.mjs [--min-price 2500] [--out ./out]
import fs from 'node:fs'
import path from 'node:path'
import { query } from '../api/_lib/db.js'
import { fetchIs24Expose } from '../api/_lib/is24.js'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const MIN_PRICE = Number(argValue('--min-price', 2500))
const OUT_DIR = argValue('--out', './out')
const DELAY_MS = 2500

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchExposeWithRetry(id) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await fetchIs24Expose(id)
    } catch (error) {
      const text = String(error)
      if (/\b(404|410)\b/.test(text)) return null
      if (attempt === 5) {
        console.warn(`expose ${id} failed: ${text.slice(0, 120)}`)
        return null
      }
      const rateLimited = /\b429\b/.test(text)
      await sleep(rateLimited ? 60000 * attempt : 5000 * attempt)
    }
  }
  return null
}

function normalizeCompany(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

const { rows } = await query(
  `SELECT city, external_id, price, district, source_url,
          raw_payload->>'realtorLogoUrl' AS logo
   FROM public.listings_cache
   WHERE is_active AND source = 'is24' AND price >= $1
     AND city IS NOT NULL
     AND COALESCE(raw_payload->>'isPrivate', 'false') = 'false'
   ORDER BY city, price DESC`,
  [MIN_PRICE],
)

const groups = new Map()
for (const row of rows) {
  const key = row.logo ? `logo:${row.logo}` : `id:${row.external_id}`
  if (!groups.has(key)) groups.set(key, { key, sample: row.external_id, listings: [] })
  groups.get(key).listings.push(row)
}

console.log(`${rows.length} listings >= ${MIN_PRICE} from agencies, ${groups.size} groups to resolve`)

const agencies = new Map()
let done = 0
for (const group of groups.values()) {
  const expose = await fetchExposeWithRetry(group.sample)
  done += 1
  const agent = expose?.agent || null
  const company = normalizeCompany(agent?.company) || normalizeCompany(agent?.name) || `Unknown (${group.key.slice(0, 24)})`
  const entry = agencies.get(company) || {
    company,
    contactName: agent?.name || '',
    address: agent?.address || '',
    website: agent?.websiteUrl || '',
    profileUrl: agent?.profileUrl || '',
    phones: new Set(),
    cities: {},
    districts: {},
    prices: [],
    sampleUrls: [],
  }
  for (const phone of expose?.contact?.phoneNumbers || []) {
    const value = typeof phone === 'string' ? phone : phone?.number || phone?.value || ''
    if (value) entry.phones.add(value)
  }
  for (const listing of group.listings) {
    entry.cities[listing.city] = (entry.cities[listing.city] || 0) + 1
    if (listing.district) entry.districts[listing.district] = (entry.districts[listing.district] || 0) + 1
    if (listing.price) entry.prices.push(Number(listing.price))
    if (entry.sampleUrls.length < 3 && listing.source_url) entry.sampleUrls.push(listing.source_url)
  }
  agencies.set(company, entry)
  if (done % 25 === 0) console.log(`resolved ${done}/${groups.size}`)
  await sleep(DELAY_MS)
}

const result = [...agencies.values()].map((entry) => ({
  company: entry.company,
  contactName: entry.contactName,
  address: entry.address,
  website: entry.website,
  profileUrl: entry.profileUrl,
  phones: [...entry.phones],
  listings: Object.values(entry.cities).reduce((sum, value) => sum + value, 0),
  cities: entry.cities,
  topDistricts: Object.entries(entry.districts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => `${name} (${count})`),
  priceMin: entry.prices.length ? Math.min(...entry.prices) : null,
  priceMax: entry.prices.length ? Math.max(...entry.prices) : null,
  sampleUrls: entry.sampleUrls,
})).sort((a, b) => b.listings - a.listings)

fs.mkdirSync(OUT_DIR, { recursive: true })
const stamp = new Date().toISOString().slice(0, 10)
const base = path.join(OUT_DIR, `agency-outreach-${stamp}`)

fs.writeFileSync(`${base}.json`, JSON.stringify(result, null, 2))

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
const csvHeader = ['company', 'listings_over_min', 'cities', 'top_districts', 'price_min', 'price_max', 'phones', 'website', 'address', 'contact_name', 'is24_profile', 'sample_urls']
const csvLines = [csvHeader.join(',')]
for (const item of result) {
  csvLines.push([
    item.company,
    item.listings,
    Object.entries(item.cities).map(([city, count]) => `${city}: ${count}`).join('; '),
    item.topDistricts.join('; '),
    item.priceMin,
    item.priceMax,
    item.phones.join('; '),
    item.website,
    item.address,
    item.contactName,
    item.profileUrl,
    item.sampleUrls.join(' '),
  ].map(csvEscape).join(','))
}
fs.writeFileSync(`${base}.csv`, csvLines.join('\n'))

const cities = [...new Set(rows.map((row) => row.city))]
const md = [`# Agencies with rentals from €${MIN_PRICE} (IS24, ${stamp})`, '', `${rows.length} active listings, ${result.length} agencies.`, '']
for (const city of cities) {
  const ranked = result.filter((item) => item.cities[city]).sort((a, b) => b.cities[city] - a.cities[city]).slice(0, 25)
  md.push(`## ${city}`, '', '| # | Agency | Listings | Districts | Price range | Phone | Website |', '|---|---|---|---|---|---|---|')
  ranked.forEach((item, index) => {
    const range = item.priceMin ? `€${item.priceMin.toLocaleString('de-DE')} to €${item.priceMax.toLocaleString('de-DE')}` : ''
    md.push(`| ${index + 1} | ${item.company} | ${item.cities[city]} | ${item.topDistricts.join(', ')} | ${range} | ${item.phones[0] || ''} | ${item.website || ''} |`)
  })
  md.push('')
}
fs.writeFileSync(`${base}.md`, md.join('\n'))

console.log(`written ${base}.{csv,json,md}`)
process.exit(0)
