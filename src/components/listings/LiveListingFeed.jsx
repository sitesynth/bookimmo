import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useIs24Search } from '../../hooks/useIs24Search.js'
import { useLatestListings } from '../../hooks/useLatestListings.js'
import { useProfile } from '../../hooks/useProfile.js'
import { buildListingDetailHref } from '../../lib/listingRouting.js'

const FALLBACK_GEOCODES = [
  '0200000005056',
  '0200000006057',
  '0200000006058',
  '0200000006059',
  '0200000005048',
  '1276003001046',
]

const LOCATION_HINTS = [
  { id: '0200000005056', label: 'Hamburg · Rothenbaum', match: ['rothenbaum', 'hamburg'] },
  { id: '0200000006057', label: 'Hamburg · Harvestehude', match: ['harvestehude', 'hamburg'] },
  { id: '0200000006058', label: 'Hamburg · Winterhude', match: ['winterhude', 'hamburg'] },
  { id: '0200000006059', label: 'Hamburg · Eppendorf', match: ['eppendorf', 'hamburg'] },
  { id: '0200000005048', label: 'Hamburg · Uhlenhorst', match: ['uhlenhorst', 'hamburg'] },
  { id: '1276003001046', label: 'Berlin · Mitte', match: ['berlin', 'mitte'] },
]

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'en'
}

function parseSeedGeocodes(profile) {
  const haystack = [
    profile?.currentCity,
    profile?.currentAddress,
    profile?.preferredDistricts,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!haystack.trim()) return []

  return LOCATION_HINTS
    .filter((item) => item.match.some((token) => haystack.includes(token)))
    .map((item) => item.id)
}

function dedupeListings(listings = []) {
  const seen = new Set()

  return listings.filter((item) => {
    const key = `${item?.source || 'unknown'}:${item?.id || item?.slug || item?.title || ''}`
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function prioritizeListingsByAddress(listings = []) {
  const seenAddresses = new Set()
  const distinct = []
  const repeated = []

  listings.forEach((item) => {
    const address = [item?.address, item?.postcode, item?.district]
      .filter(Boolean)
      .join(' ')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()

    if (!address || !seenAddresses.has(address)) {
      if (address) seenAddresses.add(address)
      distinct.push(item)
    } else {
      repeated.push(item)
    }
  })

  return [...distinct, ...repeated]
}

function tokenizeSoftMatch(text) {
  return String(text || '')
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)
}

function matchesSoftSeed(listing, tokens = []) {
  if (!tokens.length) return true

  const haystack = [
    listing?.title,
    listing?.address,
    listing?.district,
    listing?.postcode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return tokens.every((token) => haystack.includes(token))
}

function buildMeta(listing) {
  return [
    listing?.priceLabel || 'Price on request',
    listing?.roomsLabel,
    listing?.areaLabel,
    listing?.district || listing?.postcode || '',
  ].filter(Boolean)
}

function isRecentlyImported(listing) {
  if (!listing?.importedAt) return false
  const imported = new Date(listing.importedAt).getTime()
  if (!Number.isFinite(imported)) return false
  return (Date.now() - imported) <= 7 * 24 * 60 * 60 * 1000
}

function RailCard({ listing, lang, compact = false }) {
  const meta = buildMeta(listing)
  const isNew = isRecentlyImported(listing)

  return (
    <article
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: 0,
        minWidth: 0,
        borderRadius: compact ? 22 : 28,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.94)',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: compact ? '0 16px 42px rgba(25,26,32,0.08)' : '0 24px 60px rgba(25,26,32,0.1)',
      }}
    >
      <Link
        to={buildListingDetailHref(lang, listing)}
        style={{
          color: 'inherit',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          minHeight: 0,
          flex: 1,
        }}
      >
        <div style={{ position: 'relative', aspectRatio: compact ? '1.14 / 1' : '1.3 / 1', backgroundColor: 'rgb(244,239,231)' }}>
          {listing?.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing?.title || 'Listing'}
              loading="lazy"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 14,
              color: 'rgba(25,26,32,0.52)',
            }}>
              Live listing
            </div>
          )}

          <div style={{
            position: 'absolute',
            inset: 'auto 16px 16px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 12,
          }}>
            <span style={{
              display: 'inline-flex',
              padding: '8px 12px',
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: 'rgb(25,26,32)',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {(listing?.source || 'listing').toUpperCase()}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {isNew ? (
                <span style={{
                  display: 'inline-flex',
                  padding: '8px 12px',
                  borderRadius: 999,
                  backgroundColor: 'rgb(255,102,37)',
                  color: 'rgb(245,245,245)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  New
                </span>
              ) : null}
              {listing?.published ? (
                <span style={{
                  display: 'inline-flex',
                  padding: '8px 12px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(25,26,32,0.78)',
                  color: 'rgb(245,245,245)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 12,
                }}>
                  {listing.published}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{
          padding: compact ? 18 : 22,
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          rowGap: compact ? 10 : 12,
          flex: 1,
          minHeight: compact ? 260 : 320,
          height: 'auto',
        }}>
          <div>
            <h3 style={{
              fontFamily: '"Lexend", sans-serif',
              fontSize: compact ? 17 : 24,
              lineHeight: compact ? 1.18 : 1.15,
              color: 'rgb(25,26,32)',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: compact ? 3 : 4,
              overflow: 'hidden',
            }}>
              {listing?.title || 'Untitled listing'}
            </h3>
            <p style={{
              marginTop: 8,
              fontFamily: '"Lexend", sans-serif',
              fontSize: compact ? 13 : 14,
              lineHeight: 1.55,
              color: 'rgba(25,26,32,0.62)',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: compact ? 2 : 3,
              overflow: 'hidden',
            }}>
              {listing?.address || 'Germany'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 8 }}>
            {meta.map((item) => (
              <span
                key={`${listing?.id}-${item}`}
                style={{
                  padding: compact ? '8px 11px' : '9px 12px',
                  borderRadius: 999,
                  backgroundColor: 'rgb(248,246,241)',
                  color: 'rgb(25,26,32)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: compact ? 12 : 13,
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: compact ? 'wrap' : 'nowrap',
            alignSelf: 'end',
          }}>
            <div style={{
              fontFamily: '"Lexend", sans-serif',
              fontSize: compact ? 18 : 26,
              fontWeight: 700,
              color: 'rgb(25,26,32)',
              flexShrink: 0,
            }}>
              {listing?.priceLabel || 'View details'}
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: compact ? '10px 14px' : '12px 16px',
              borderRadius: 16,
              backgroundColor: 'rgb(25,26,32)',
              color: 'rgb(245,245,245)',
              fontFamily: '"Lexend", sans-serif',
              fontSize: compact ? 12 : 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              View property
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default function LiveListingFeed({
  title,
  eyebrow,
  description,
  limit = 4,
  skip = 0,
  prioritizeDistinctAddresses = false,
  compact = false,
  useProfileSeed = false,
  geocodes = null,
  ctaLabel = 'Open search',
  ctaHref = null,
  sourceMode = 'live-search',
}) {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const { profile } = useProfile()

  const effectiveGeocodes = useMemo(() => {
    if (Array.isArray(geocodes) && geocodes.length) return geocodes
    if (useProfileSeed) {
      const seeded = parseSeedGeocodes(profile)
      if (seeded.length) return seeded
    }
    return FALLBACK_GEOCODES
  }, [geocodes, profile, useProfileSeed])

  const seededText = useMemo(() => {
    if (!useProfileSeed) return ''
    return [
      profile?.currentCity,
      profile?.preferredDistricts,
    ].filter(Boolean).join(' ')
  }, [profile, useProfileSeed])

  const seededTokens = useMemo(() => tokenizeSoftMatch(seededText), [seededText])

  const latestListings = useLatestListings({
    limit: sourceMode === 'database-cache' ? Math.max(limit * 4, 12) : limit,
  })

  const liveSearch = useIs24Search({
    geocodes: effectiveGeocodes,
    page: 1,
  })

  const loading = sourceMode === 'database-cache' ? latestListings.loading : liveSearch.loading
  const error = sourceMode === 'database-cache' ? latestListings.error : liveSearch.error
  const selectedLocations = sourceMode === 'database-cache' ? [] : liveSearch.selectedLocations
  const sourceListings = sourceMode === 'database-cache' ? latestListings.items : liveSearch.listings

  const filteredSourceListings = useMemo(() => {
    if (sourceMode !== 'database-cache') return sourceListings
    if (!seededTokens.length) return sourceListings

    const matched = sourceListings.filter((item) => matchesSoftSeed(item, seededTokens))
    return matched.length ? matched : sourceListings
  }, [seededTokens, sourceListings, sourceMode])

  const cards = useMemo(() => (
    (prioritizeDistinctAddresses
      ? prioritizeListingsByAddress(dedupeListings(filteredSourceListings))
      : dedupeListings(filteredSourceListings))
      .filter((item) => item?.id && item?.source)
      .sort((left, right) => {
        const leftImported = new Date(left?.importedAt || 0).getTime()
        const rightImported = new Date(right?.importedAt || 0).getTime()
        return rightImported - leftImported
      })
      .slice(skip, skip + limit)
  ), [filteredSourceListings, limit, prioritizeDistinctAddresses, skip])

  const totalResults = sourceMode === 'database-cache' ? filteredSourceListings.length : liveSearch.totalResults

  const resolvedHref = ctaHref || `/${lang}/search?geocodes=${encodeURIComponent(effectiveGeocodes.join(','))}`
  const locationSummary = selectedLocations.length
    ? selectedLocations.map((item) => item.label).slice(0, 3).join(' · ')
    : 'Germany'

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ maxWidth: 760 }}>
          {eyebrow ? (
            <p style={{
              fontFamily: '"Lexend", sans-serif',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(25,26,32,0.5)',
            }}>
              {eyebrow}
            </p>
          ) : null}

          <h2 style={{
            marginTop: eyebrow ? 10 : 0,
            fontFamily: '"Lexend", sans-serif',
            fontSize: compact ? 38 : 44,
            lineHeight: 1.03,
            color: 'rgb(25,26,32)',
          }}>
            {title}
          </h2>

          <p style={{
            marginTop: 12,
            fontFamily: '"Lexend", sans-serif',
            fontSize: 16,
            lineHeight: 1.65,
            color: 'rgba(25,26,32,0.66)',
          }}>
            {description}
          </p>
        </div>

        <Link
          to={resolvedHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 18px',
            borderRadius: 16,
            textDecoration: 'none',
            backgroundColor: 'rgb(25,26,32)',
            color: 'rgb(245,245,245)',
            fontFamily: '"Lexend", sans-serif',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {ctaLabel}
        </Link>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <span style={{
          padding: '10px 14px',
          borderRadius: 999,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          color: 'rgb(25,26,32)',
        }}>
          {loading ? 'Loading properties…' : 'Verified listings'}
        </span>
        <span style={{
          padding: '10px 14px',
          borderRadius: 999,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          color: 'rgb(25,26,32)',
        }}>
          {loading ? 'Checking locations…' : sourceMode === 'database-cache' ? 'Across Germany' : locationSummary}
        </span>
        <span style={{
          padding: '10px 14px',
          borderRadius: 999,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          color: 'rgb(25,26,32)',
        }}>
          {loading ? 'Updating listings…' : sourceMode === 'database-cache' ? 'Updated regularly' : 'Live availability'}
        </span>
      </div>

      {error ? (
        <div style={{
          padding: '18px 20px',
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(25,26,32,0.08)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 14,
          color: 'rgba(25,26,32,0.74)',
        }}>
          {sourceMode === 'database-cache'
            ? 'Latest database listings are temporarily unavailable. The section will recover automatically when `/api/listings/latest` responds again.'
            : 'Live provider feed is temporarily unavailable. The section will recover automatically when `/api/is24/search` responds again.'}
        </div>
      ) : null}

      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(260px, 1fr))' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gridAutoRows: 'max-content',
        alignItems: 'stretch',
        gap: 18,
      }}>
        {cards.map((listing) => (
          <RailCard
            key={`${listing.source}-${listing.id}`}
            listing={listing}
            lang={lang}
            compact={compact}
          />
        ))}
      </div>

      {!loading && !cards.length && !error ? (
        <div style={{
          padding: '18px 20px',
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(25,26,32,0.08)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 14,
          color: 'rgba(25,26,32,0.74)',
        }}>
          {sourceMode === 'database-cache' && seededTokens.length
            ? 'No exact profile-area match was found in the latest cache yet. We can broaden the search workspace or enrich the location profile next.'
            : 'No live listings matched the current location seed yet. Open search to broaden the area or use a different geocode.'}
        </div>
      ) : null}
    </section>
  )
}
