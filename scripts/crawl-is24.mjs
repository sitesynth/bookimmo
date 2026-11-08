// Full crawl of ImmoScout24 rentals for the launch cities into listings_cache.
// Usage: node scripts/crawl-is24.mjs [--fresh] [city ...]   (default: full crawl of all cities)
// --fresh: only the newest FRESH_PAGES pages per city, no deactivation (run every ~10 min).
import { fetchIs24Listings } from '../api/_lib/is24.js'
import { deactivateUnseenListings, upsertCrawledListings } from '../api/_lib/listings-cache.js'

const CITIES = [
  { city: 'Berlin', geocode: '1276003001' },
  { city: 'Hamburg', geocode: '1276006001' },
  { city: 'München', geocode: '1276002059' },
  { city: 'Köln', geocode: '1276010028' },
  { city: 'Frankfurt am Main', geocode: '1276007004' },
]

const PAGE_DELAY_MS = Number(process.env.CRAWL_PAGE_DELAY_MS || 2500)
const MAX_PAGES = 120
const FRESH_PAGES = 3
const SORT_NEWEST = '-firstactivation'
const FRESH = process.argv.includes('--fresh')
// Only hide unseen listings if the crawl covered most of what the provider reported.
const MIN_COVERAGE = 0.85

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPageWithRetry(geocode, page) {
  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchIs24Listings({ geocodes: [geocode], page, sorting: SORT_NEWEST })
    } catch (error) {
      if (attempt === maxAttempts) throw error
      // 429 = provider rate limit: wait it out (1, 2, 3, 4 min); other errors retry quickly.
      const rateLimited = /\b429\b/.test(String(error))
      const waitMs = rateLimited ? 60000 * attempt : 5000 * attempt
      console.warn(`page ${page} attempt ${attempt} failed (${rateLimited ? 'rate limit' : 'error'}), waiting ${Math.round(waitMs / 1000)}s`)
      await sleep(waitMs)
    }
  }
  return null
}

async function crawlCity({ city, geocode }) {
  const startedAt = new Date()
  let totalResults = 0
  let numberOfPages = 1
  let seen = 0
  let complete = true

  const lastPage = () => Math.min(numberOfPages, FRESH ? FRESH_PAGES : MAX_PAGES)
  for (let page = 1; page <= lastPage(); page += 1) {
    let result
    try {
      result = await fetchPageWithRetry(geocode, page)
    } catch (error) {
      console.error(`[${city}] page ${page} failed: ${String(error).slice(0, 160)}`)
      complete = false
      break
    }

    if (page === 1) {
      totalResults = result.totalResults || 0
      numberOfPages = result.numberOfPages || 1
    }
    if (!result.listings.length) break

    await upsertCrawledListings(result.listings, { city, rankOffset: seen })
    seen += result.listings.length
    await sleep(PAGE_DELAY_MS)
  }

  const coverage = totalResults ? seen / totalResults : 0
  let deactivated = 0
  if (!FRESH && complete && coverage >= MIN_COVERAGE) {
    deactivated = await deactivateUnseenListings({ source: 'is24', city, crawlStartedAt: startedAt })
  }

  console.log(`[${city}] ${FRESH ? 'fresh ' : ''}seen ${seen}/${totalResults} (${Math.round(coverage * 100)}%), deactivated ${deactivated}${complete ? '' : ', INCOMPLETE'}`)
  return { city, seen, totalResults, deactivated, complete }
}

const requested = process.argv.slice(2).filter((value) => !value.startsWith('--')).map((value) => value.toLowerCase())
const targets = requested.length
  ? CITIES.filter((item) => requested.includes(item.city.toLowerCase()))
  : CITIES

const summary = []
for (const target of targets) {
  summary.push(await crawlCity(target))
}

console.log(JSON.stringify(summary))
process.exit(summary.every((item) => item.complete) ? 0 : 1)
