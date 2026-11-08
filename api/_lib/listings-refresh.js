import { fetchIs24Listings, getLocationSeeds } from './is24.js'
import { fetchImmoweltListings } from './immowelt.js'
import { upsertListingsCache } from './listings-cache.js'

export async function refreshListingsCache(limit = 24) {
  const normalizedLimit = Math.max(12, Math.min(Number(limit) || 24, 48))
  const geocodes = getLocationSeeds().filter((item) => item.kind !== 'city').map((item) => item.id).slice(0, 6)
  const results = await Promise.allSettled([
    fetchIs24Listings({ geocodes, page: 1 }),
    fetchImmoweltListings({ geocodes, page: 1 }),
  ])

  const is24 = results[0]
  const immowelt = results[1]
  const listings = [
    ...(is24.status === 'fulfilled' ? is24.value.listings : []),
    ...(immowelt.status === 'fulfilled' ? immowelt.value.listings : []),
  ].slice(0, normalizedLimit)

  const imported = listings.length ? await upsertListingsCache(listings) : 0

  return {
    imported,
    providers: {
      is24: is24.status === 'fulfilled' ? is24.value.listings.length : 0,
      immowelt: immowelt.status === 'fulfilled' ? immowelt.value.listings.length : 0,
    },
    errors: results
      .map((result, index) => result.status === 'rejected'
        ? { provider: index === 0 ? 'is24' : 'immowelt', message: String(result.reason) }
        : null)
      .filter(Boolean),
  }
}
