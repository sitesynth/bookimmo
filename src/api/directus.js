import { createDirectus, rest, authentication, readItems } from '@directus/sdk'

const DIRECTUS_URL  = import.meta.env.VITE_DIRECTUS_URL  ?? 'https://cms.book.immo'
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN ?? 'b837708aafa22fc40d6e86123329aa268f1065c4b582a1a75080b92e2406d3d0'

const client = createDirectus(DIRECTUS_URL)
  .with(authentication())
  .with(rest())

if (DIRECTUS_TOKEN) {
  client.setToken(DIRECTUS_TOKEN)
}

// directusAsset(id, { width: 600, quality: 80 }) → '/api/directus?path=/assets/{id}&query=width%3D600...'
export function directusAsset(id, params = {}) {
  if (!id) return ''
  const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
  return `/api/directus?path=/assets/${id}${query ? '&query=' + encodeURIComponent(query) : ''}`
}

export { client, readItems }
