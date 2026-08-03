import { query } from './db.js'

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function deriveCityHint(row = {}) {
  const address = String(row.address || '')
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  const cityFromAddress = parts.length >= 3 ? parts[2] : ''
  return {
    districtSlug: slugify(row.district || ''),
    citySlug: slugify(cityFromAddress || row.postcode || ''),
  }
}

export async function pickAssignedAgent({ providerSource = '', providerExposeId = '', propertyId = '' }) {
  const resolvedSource = String(providerSource || '').trim().toLowerCase()
  const resolvedExternalId = String(providerExposeId || propertyId || '').trim()
  if (!resolvedExternalId) return null

  const listingResult = await query(
    `SELECT source, external_id, address, postcode, district
     FROM public.listings_cache
     WHERE (
       $1 <> '' AND lower(source) = $1 AND external_id = $2
     ) OR (
       $1 = '' AND external_id = $2
     )
     ORDER BY imported_at DESC
     LIMIT 1`,
    [resolvedSource, resolvedExternalId],
  )

  const listing = listingResult.rows[0] || {}
  const { districtSlug, citySlug } = deriveCityHint(listing)

  const candidates = await query(
    `SELECT ap.user_id,
            ap.id AS agent_id,
            ap.display_name,
            ap.base_city,
            cov.city_slug,
            cov.district_slug,
            cov.priority,
            COUNT(a.id)::int AS assigned_count
     FROM public.agent_profiles ap
     LEFT JOIN public.agent_city_coverage cov
       ON cov.agent_id = ap.id
      AND cov.active = TRUE
     LEFT JOIN public.applications a
       ON a.assigned_agent_id = ap.user_id
      AND a.status <> 'archived'
      AND a.stage NOT IN ('accepted', 'rejected')
     WHERE ap.is_active = TRUE
       AND (
         EXISTS (
           SELECT 1
           FROM public.agent_provider_accounts apa
           WHERE apa.agent_id = ap.id
             AND apa.is_active = TRUE
             AND (
               lower(apa.provider_source) = $1
               OR $1 = ''
             )
         )
         OR $1 = 'agency_crm'
         OR $1 = 'exclusive'
       )
     GROUP BY ap.user_id, ap.id, ap.display_name, ap.base_city, cov.city_slug, cov.district_slug, cov.priority`,
    [resolvedSource],
  )

  const scored = candidates.rows
    .map((row) => {
      const coverageCity = slugify(row.city_slug || row.base_city || '')
      const coverageDistrict = slugify(row.district_slug || '')

      let coverageScore = 9999
      if (districtSlug && coverageDistrict && districtSlug === coverageDistrict) coverageScore = 0
      else if (citySlug && coverageCity && citySlug === coverageCity) coverageScore = 1
      else if (!districtSlug && !citySlug) coverageScore = 10
      else if (!coverageDistrict && !coverageCity) coverageScore = 50

      return {
        userId: row.user_id,
        agentId: row.agent_id,
        displayName: row.display_name,
        coverageScore,
        priority: Number(row.priority || 100),
        assignedCount: Number(row.assigned_count || 0),
      }
    })
    .filter((row) => row.coverageScore < 9999)
    .sort((a, b) => (
      a.coverageScore - b.coverageScore
      || a.priority - b.priority
      || a.assignedCount - b.assignedCount
      || String(a.displayName || '').localeCompare(String(b.displayName || ''))
    ))

  return scored[0] || null
}
