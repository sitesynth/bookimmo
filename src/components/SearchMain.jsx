import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites.js'
import { useApplications } from '../hooks/useApplications.js'
import { useIs24Locations } from '../hooks/useIs24Locations.js'
import { useIs24Search } from '../hooks/useIs24Search.js'
import { useProfile } from '../hooks/useProfile.js'
import { useSavedSearches } from '../hooks/useSavedSearches.js'
import { buildListingDetailHref } from '../lib/listingRouting.js'
import AuthGateModal from './AuthGateModal.jsx'
import Is24MapView from './maps/Is24MapView.jsx'

const BEDROOM_OPTIONS = [
  { label: 'Any', min: '', max: '' },
  { label: '2+', min: '2', max: '' },
  { label: '3+', min: '3', max: '' },
  { label: '4+', min: '4', max: '' },
]

const PRICE_OPTIONS = [
  { label: 'Any budget', min: null, max: null },
  { label: 'Up to €1,500', min: null, max: 1500 },
  { label: '€1,500 - €2,500', min: 1500, max: 2500 },
  { label: '€2,500 - €4,000', min: 2500, max: 4000 },
  { label: 'Over €4,000', min: 4000, max: null },
]

const DEFAULT_GEOCODES = []
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function sanitizeSavedSearchFilters(filters) {
  return {
    text: filters.text || '',
    geocodes: Array.isArray(filters.geocodes) && filters.geocodes.length ? filters.geocodes : [...DEFAULT_GEOCODES],
    roomsMin: filters.roomsMin || '3',
    roomsMax: filters.roomsMax || '',
    priceMin: filters.priceMin ?? null,
    priceMax: filters.priceMax ?? null,
    priceLabel: filters.priceLabel || '',
    page: 1,
  }
}

function buildSearchLabel(filters, selectedLocations = []) {
  const locationLabel = selectedLocations[0]?.label
    || (filters.text ? filters.text.trim() : '')
    || 'Germany search'
  const roomsLabel = filters.roomsMin ? `${filters.roomsMin}+ rooms` : 'Any rooms'
  const budgetLabel = filters.priceLabel || 'Flexible budget'
  return `${locationLabel} · ${roomsLabel}`
    .replace(/\s+/g, ' ')
    .trim() || budgetLabel
}

function buildSearchSummary(filters, selectedLocations = []) {
  const locationLabel = selectedLocations.length
    ? selectedLocations.map((item) => item.label).slice(0, 2).join(', ')
    : (filters.text || 'Selected Germany areas')
  const roomsLabel = filters.roomsMin ? `${filters.roomsMin}+ rooms` : 'Any room count'
  const budgetLabel = filters.priceLabel || 'Any budget'
  return `${locationLabel} · ${roomsLabel} · ${budgetLabel}`
}

function buildWorkspaceHeading(filters, selectedLocations = []) {
  if (selectedLocations.length) {
    return selectedLocations.map((item) => item.label).slice(0, 2).join(' + ')
  }

  if (filters.text?.trim()) {
    return filters.text.trim()
  }

  return 'Start your Germany search'
}

function buildListingPreviewBadges(property) {
  return [
    property.roomsLabel,
    property.areaLabel,
    property.district || property.postcode,
    property.source ? property.source.toUpperCase() : null,
  ].filter(Boolean)
}

function findMatchingLocationOption(query, options = [], fallbackOptions = []) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return null

  return [...options, ...fallbackOptions].find((item) => {
    const label = String(item?.label || '').toLowerCase()
    const id = String(item?.id || '').toLowerCase()
    return label === normalized || label.includes(normalized) || id === normalized
  }) || null
}

function SearchWorkspaceCard({ children, style }) {
  return (
    <section
      style={{
        padding: 24,
        borderRadius: 16,
        backgroundColor: 'white',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 1px 0 rgba(25,26,32,0.04)',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid rgb(25,26,32)' : '1px solid rgba(25,26,32,0.12)',
        borderRadius: 999,
        padding: '10px 14px',
        backgroundColor: active ? 'rgb(25,26,32)' : 'white',
        color: active ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
        fontFamily: '"Lexend", sans-serif',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function WorkspaceStat({ label, value, accent = 'rgb(248,246,241)' }) {
  return (
    <div style={{ padding: 16, borderRadius: 20, backgroundColor: accent }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)' }}>{label}</p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 24, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 4 }}>
        {value}
      </p>
    </div>
  )
}

function normalizePropertyForApplication(property) {
  return {
    id: property.id,
    title: property.title,
    price: property.price,
    address: property.address,
    source: property.source,
    url: property.url,
  }
}

function SavedSearchCard({ item, active, onApply, onDelete }) {
  return (
    <article
      style={{
        padding: 16,
        borderRadius: 22,
        border: active ? '1px solid rgb(25,26,32)' : '1px solid rgba(25,26,32,0.08)',
        backgroundColor: active ? 'rgba(25,26,32,0.04)' : 'rgb(248,246,241)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 700, color: 'rgb(25,26,32)' }}>
            {item.name}
          </p>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.58)', marginTop: 4, lineHeight: 1.5 }}>
            {item.summary}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'rgba(25,26,32,0.5)',
            cursor: 'pointer',
            fontFamily: '"Lexend", sans-serif',
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Delete saved search"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={() => onApply(item)}
        style={{
          border: 'none',
          borderRadius: 14,
          padding: '11px 14px',
          backgroundColor: active ? 'rgb(25,26,32)' : 'white',
          color: active ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {active ? 'Current search' : 'Load search'}
      </button>
    </article>
  )
}

function ListingCard({
  property,
  onApply,
  onFavorite,
  isFavorite,
  favoriteBusy,
  onPreview,
  compact = false,
  lang,
  active = false,
}) {
  const badges = buildListingPreviewBadges(property)

  return (
    <article
      onMouseEnter={() => onPreview(property)}
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        gap: compact ? 16 : 0,
        flexShrink: 0,
        minHeight: compact ? 150 : 0,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'white',
        border: active ? '1px solid rgb(25,26,32)' : '1px solid rgba(25,26,32,0.08)',
        boxShadow: active ? '0 24px 64px rgba(25,26,32,0.12)' : (compact ? 'none' : '0 18px 48px rgba(25,26,32,0.06)'),
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        transform: active ? 'translateY(-2px)' : 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          minWidth: compact ? 150 : 'auto',
          width: compact ? 150 : '100%',
          flexShrink: 0,
          aspectRatio: compact ? '1 / 1' : '1.6 / 1',
          minHeight: compact ? 150 : 220,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)',
        }}
      >
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)' }} />
        )}
      </div>

      <div style={{ padding: compact ? '14px 14px 14px 0' : 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: compact ? 17 : 22, fontWeight: 600, lineHeight: 1.2, color: 'rgb(25,26,32)' }}>
              {property.title}
            </h3>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.54)', marginTop: 8 }}>
              {property.address || 'Location on request'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFavorite(property)}
            disabled={favoriteBusy}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              border: 'none',
              backgroundColor: 'rgba(248,246,241,1)',
              color: isFavorite ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
              fontSize: 18,
              cursor: favoriteBusy ? 'default' : 'pointer',
              flexShrink: 0,
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {badges.map((badge) => (
            <span
              key={badge}
              style={{
                borderRadius: 999,
                padding: '7px 10px',
                backgroundColor: 'rgb(248,246,241)',
                color: 'rgba(25,26,32,0.72)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 12,
              }}
            >
              {badge}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 'auto', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: compact ? 18 : 24, fontWeight: 700, color: 'rgb(25,26,32)' }}>
              {property.priceLabel || 'Price on request'}
            </p>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', marginTop: 4 }}>
              {property.published || 'Recently published'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onPreview(property)}
              style={{
                border: '1px solid rgba(25,26,32,0.12)',
                borderRadius: 14,
                padding: '11px 14px',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Preview
            </button>
            <a
              href={buildListingDetailHref(lang, property)}
              style={{
                textDecoration: 'none',
                borderRadius: 14,
                padding: '11px 14px',
                border: '1px solid rgba(25,26,32,0.12)',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Details
            </a>
            <button
              type="button"
              onClick={() => onApply(property)}
              style={{
                border: 'none',
                borderRadius: 14,
                padding: '11px 14px',
                backgroundColor: 'rgb(25,26,32)',
                color: 'rgb(245,245,245)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function SearchMain() {
  const location = useLocation()
  const navigate = useNavigate()
  const lang = readLang(location.pathname)
  const query = new URLSearchParams(location.search)

  const [gateOpen, setGateOpen] = useState(false)
  const [guestHref, setGuestHref] = useState(`/${lang}/search`)
  const [uiNotice, setUiNotice] = useState('')
  const [favoriteBusyId, setFavoriteBusyId] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [activeSavedSearchId, setActiveSavedSearchId] = useState('')
  const [profileSeeded, setProfileSeeded] = useState(false)
  const [filters, setFilters] = useState(() => ({
    text: query.get('q') || '',
    geocodes: query.get('geocodes') ? query.get('geocodes').split(',').filter(Boolean) : [...DEFAULT_GEOCODES],
    roomsMin: query.get('roomsMin') || '3',
    roomsMax: query.get('roomsMax') || '',
    priceMin: query.get('priceMin') ? Number(query.get('priceMin')) : null,
    priceMax: query.get('priceMax') ? Number(query.get('priceMax')) : null,
    priceLabel: '',
    page: 1,
  }))

  const { items: locationSuggestions, seeds: locationSeeds, loading: locationsLoading } = useIs24Locations(locationQuery)
  const { listings, mapListings, selectedLocations, center, totalResults, loading, error } = useIs24Search(filters)
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites()
  const { createDraftApplication, applicationCount, draftCount } = useApplications()
  const { profile, completionPercent, loading: profileLoading } = useProfile()
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches()
  const [selectedListing, setSelectedListing] = useState(null)
  const [geocodedPoints, setGeocodedPoints] = useState({})

  useEffect(() => {
    if (profileLoading || profileSeeded) return

    const hasManualFilters = filters.text || filters.priceMin || filters.priceMax
    if (hasManualFilters) {
      setProfileSeeded(true)
      return
    }

    const nextText = [profile.currentCity, profile.preferredDistricts]
      .filter(Boolean)
      .join(', ')
      .trim()

    setFilters((current) => ({
      ...current,
      text: nextText || current.text,
      priceMax: profile.maxBudget ? Number(profile.maxBudget) : current.priceMax,
      priceLabel: profile.maxBudget ? `Up to €${Number(profile.maxBudget).toLocaleString('en-US')}` : current.priceLabel,
      page: 1,
    }))
    setLocationQuery(nextText || '')
    setProfileSeeded(true)
  }, [filters.priceMax, filters.priceMin, filters.text, profile, profileLoading, profileSeeded])

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN) return undefined

    const candidates = listings
      .filter((listing) => !Number.isFinite(listing.lat) || !Number.isFinite(listing.lon))
      .filter((listing) => !mapListings.some((point) => String(point.id) === String(listing.id) && Number.isFinite(point.lat) && Number.isFinite(point.lon)))
      .filter((listing) => listing.address)
      .filter((listing) => !geocodedPoints[listing.id])
      .slice(0, 12)

    if (!candidates.length) return undefined

    let cancelled = false

    async function geocodeMissingListings() {
      const nextEntries = await Promise.all(
        candidates.map(async (listing) => {
          if (geocodedPoints[listing.id]) {
            return [listing.id, geocodedPoints[listing.id]]
          }

          try {
            const params = new URLSearchParams({
              access_token: MAPBOX_ACCESS_TOKEN,
              limit: '1',
              language: 'de,en',
              country: 'de',
              autocomplete: 'false',
            })

            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(listing.address)}.json?${params.toString()}`,
            )

            if (!response.ok) return null
            const payload = await response.json()
            const feature = payload?.features?.[0]
            const lon = feature?.center?.[0]
            const lat = feature?.center?.[1]
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

            return [listing.id, { lat, lon }]
          } catch {
            return null
          }
        }),
      )

      if (cancelled) return

      const resolved = Object.fromEntries(nextEntries.filter(Boolean))
      if (Object.keys(resolved).length) {
        setGeocodedPoints((current) => ({ ...current, ...resolved }))
      }
    }

    geocodeMissingListings()
    return () => {
      cancelled = true
    }
  }, [geocodedPoints, listings, mapListings])

  const providerMapPoints = useMemo(() => (
    new Map(
      mapListings
        .filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lon))
        .map((listing) => [String(listing.id), { lat: listing.lat, lon: listing.lon }]),
    )
  ), [mapListings])

  const enrichedListings = useMemo(
    () => listings.map((listing) => (
      providerMapPoints.get(String(listing.id))
        ? { ...listing, ...providerMapPoints.get(String(listing.id)) }
        : geocodedPoints[listing.id]
          ? { ...listing, ...geocodedPoints[listing.id] }
          : listing
    )),
    [geocodedPoints, listings, providerMapPoints],
  )

  const enrichedMapListings = useMemo(() => {
    const merged = new Map()

    mapListings.forEach((listing) => {
      if (!Number.isFinite(listing.lat) || !Number.isFinite(listing.lon)) return
      merged.set(String(listing.id), listing)
    })

    enrichedListings.forEach((listing) => {
      if (!Number.isFinite(listing.lat) || !Number.isFinite(listing.lon)) return
      merged.set(String(listing.id), listing)
    })

    return Array.from(merged.values())
  }, [enrichedListings, mapListings])

  const activeListing = useMemo(() => {
    const targetId = selectedListing?.id || listings[0]?.id
    if (!targetId) return null
    return enrichedListings.find((listing) => String(listing.id) === String(targetId)) || null
  }, [enrichedListings, listings, selectedListing])

  const summary = useMemo(() => {
    const districts = new Set(enrichedListings.map((property) => property.district).filter(Boolean)).size
    return {
      results: totalResults || enrichedListings.length,
      mapped: enrichedMapListings.length,
      areas: districts || selectedLocations.length || locationSeeds.length,
    }
  }, [enrichedListings, enrichedMapListings.length, locationSeeds.length, selectedLocations.length, totalResults])

  const workspacePrompt = useMemo(() => {
    const moveIn = profile.moveInDate || 'Flexible move-in'
    const city = profile.currentCity || 'No location selected yet'
    const districts = profile.preferredDistricts || 'Any strong district match'
    const budget = profile.maxBudget ? `Budget up to €${Number(profile.maxBudget).toLocaleString('en-US')}` : 'Budget not set yet'
    return {
      city,
      moveIn,
      districts,
      budget,
    }
  }, [profile])

  const workspaceHeading = useMemo(
    () => buildWorkspaceHeading(filters, selectedLocations),
    [filters, selectedLocations],
  )

  const shouldShowLocationSuggestions = locationQuery.trim().length > 0
  const visibleLocationChips = shouldShowLocationSuggestions
    ? locationSuggestions
    : selectedLocations

  function toggleLocation(locationOption) {
    setFilters((current) => {
      const geocodes = current.geocodes.includes(locationOption.id)
        ? current.geocodes.filter((id) => id !== locationOption.id)
        : [...current.geocodes, locationOption.id]

      return {
        ...current,
        geocodes,
        page: 1,
      }
    })
  }

  function setBedroom(option) {
    setFilters((current) => ({
      ...current,
      roomsMin: option.min,
      roomsMax: option.max,
      page: 1,
    }))
  }

  function setPrice(range) {
    setFilters((current) => ({
      ...current,
      priceMin: range.min,
      priceMax: range.max,
      priceLabel: range.label,
      page: 1,
    }))
  }

  function applyPrimarySearch() {
    const nextQuery = locationQuery.trim()
    const matchedLocation = findMatchingLocationOption(nextQuery, locationSuggestions, locationSeeds)

    setFilters((current) => ({
      ...current,
      text: nextQuery,
      geocodes: matchedLocation
        ? Array.from(new Set([...current.geocodes, matchedLocation.id]))
        : current.geocodes,
      page: 1,
    }))

    if (nextQuery || matchedLocation) {
      setUiNotice(matchedLocation
        ? `Search updated for ${matchedLocation.label}.`
        : 'Search query updated.')
    }
  }

  function resetFilters() {
    setFilters({
      text: '',
      geocodes: [...DEFAULT_GEOCODES],
      roomsMin: '3',
      roomsMax: '',
      priceMin: null,
      priceMax: null,
      priceLabel: '',
      page: 1,
    })
    setLocationQuery('')
    setSelectedListing(null)
    setActiveSavedSearchId('')
  }

  async function saveCurrentSearch() {
    const item = {
      name: buildSearchLabel(filters, selectedLocations),
      summary: buildSearchSummary(filters, selectedLocations),
      filters: sanitizeSavedSearchFilters(filters),
    }

    const result = await saveSearch({
      searchId: activeSavedSearchId || undefined,
      name: item.name,
      summary: item.summary,
      filters: item.filters,
    })

    if (!result.ok) {
      setUiNotice(result.error || 'Could not save this search.')
      return
    }

    if (result.item?.id) {
      setActiveSavedSearchId(result.item.id)
    }

    if (result.requiresAuth) {
      setGuestHref(`/${lang}/search`)
      setGateOpen(true)
      setUiNotice('Search saved locally for guest mode. Sign in to sync it across sessions.')
      return
    }

    setUiNotice(result.fallbackLocal ? 'Supabase save failed, so this search was stored locally.' : 'Search workspace saved.')
  }

  function applySavedSearch(item) {
    setFilters(sanitizeSavedSearchFilters(item.filters || {}))
    setSelectedListing(null)
    setActiveSavedSearchId(item.id)
    setUiNotice(`Loaded saved search: ${item.name}`)
  }

  async function deleteSavedSearch(searchId) {
    const result = await deleteSearch(searchId)

    if (activeSavedSearchId === searchId) {
      setActiveSavedSearchId('')
    }

    if (!result.ok) {
      setUiNotice(result.error || 'Could not remove saved search.')
      return
    }

    setUiNotice(result.fallbackLocal ? 'Supabase delete failed, local copy was removed.' : 'Saved search removed.')
  }

  async function handleFavorite(property) {
    setFavoriteBusyId(String(property.id))
    const result = await toggleFavorite(property.id)
    setFavoriteBusyId('')

    if (!result.ok) {
      setUiNotice(result.error || 'Could not update favorites.')
      return
    }

    if (result.requiresAuth) {
      setGuestHref(`/${lang}/search`)
      setGateOpen(true)
      setUiNotice(result.isFavorite ? 'Saved locally for guest mode. Sign in to sync favorites.' : 'Removed from guest favorites.')
      return
    }

    setUiNotice(result.isFavorite ? 'Saved to favorites.' : 'Removed from favorites.')
  }

  async function handleApply(property) {
    const result = await createDraftApplication({ property: normalizePropertyForApplication(property) })

    if (!result.ok) {
      setUiNotice(result.error || 'Could not create application draft.')
      return
    }

    if (result.requiresAuth) {
      setGuestHref(`/${lang}/search`)
      setGateOpen(true)
      setUiNotice('Draft stored for guest mode. Sign in to continue your application.')
      return
    }

    setUiNotice('Application draft created. Opening the application wizard.')
    setTimeout(() => navigate(`/${lang}/applications?application=${encodeURIComponent(result.id || '')}`), 500)
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SearchWorkspaceCard
          style={{
            padding: 24,
            backgroundColor: 'rgb(255, 248, 244)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)', gap: 20, alignItems: 'stretch' }}>
            <div>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Search overview
              </p>
              <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 30, lineHeight: 1.04, color: 'rgb(25,26,32)', marginTop: 8, maxWidth: 740 }}>
                {workspaceHeading}
              </h2>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.7, color: 'rgba(25,26,32,0.68)', marginTop: 14, maxWidth: 760 }}>
                Live provider search with synchronized map, saved searches, favorites and application drafts.
              </p>

              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 22,
                  backgroundColor: 'white',
                  border: '1px solid rgba(25,26,32,0.08)',
                  boxShadow: '0 12px 28px rgba(25,26,32,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      flex: '1 1 420px',
                      minWidth: 280,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0 14px',
                      height: 56,
                      borderRadius: 18,
                      border: '1px solid rgba(25,26,32,0.1)',
                      backgroundColor: 'rgb(248,246,241)',
                    }}
                  >
                    <span style={{ fontSize: 17, color: 'rgba(25,26,32,0.56)' }}>⌕</span>
                    <input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          applyPrimarySearch()
                        }
                      }}
                      placeholder="Search by city, district, street or IS24 geocode"
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontFamily: '"Lexend", sans-serif',
                        fontSize: 15,
                        color: 'rgb(25,26,32)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={applyPrimarySearch}
                    style={{
                      height: 56,
                      border: 'none',
                      borderRadius: 18,
                      padding: '0 18px',
                      backgroundColor: 'rgb(25,26,32)',
                      color: 'rgb(245,245,245)',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Search now
                  </button>

                  <button
                    type="button"
                    onClick={saveCurrentSearch}
                    style={{
                      height: 56,
                      border: '1px solid rgba(25,26,32,0.1)',
                      borderRadius: 18,
                      padding: '0 18px',
                      backgroundColor: 'white',
                      color: 'rgb(25,26,32)',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save search
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {visibleLocationChips.map((item) => (
                    <FilterChip key={item.id} active={filters.geocodes.includes(item.id)} onClick={() => toggleLocation(item)}>
                      {item.label}
                    </FilterChip>
                  ))}
                </div>

                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', lineHeight: 1.5 }}>
                  Start with a city, district, street or provider geocode here. Detailed room, budget and keyword refinement stays in the filter panel below.
                </p>
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ borderRadius: 999, padding: '10px 14px', backgroundColor: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                  {summary.results} results
                </span>
                <span style={{ borderRadius: 999, padding: '10px 14px', backgroundColor: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                  {summary.mapped} mapped
                </span>
                <span style={{ borderRadius: 999, padding: '10px 14px', backgroundColor: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                  {workspacePrompt.city}
                </span>
                <span style={{ borderRadius: 999, padding: '10px 14px', backgroundColor: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                  {workspacePrompt.budget}
                </span>
                <span style={{ borderRadius: 999, padding: '10px 14px', backgroundColor: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                  {workspacePrompt.moveIn}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, alignContent: 'start' }}>
              <WorkspaceStat label="Live results" value={summary.results} />
              <WorkspaceStat label="Mapped pins" value={summary.mapped} />
              <WorkspaceStat label="Saved searches" value={savedSearches.length} />
              <WorkspaceStat label="Draft apps" value={draftCount || applicationCount} accent="rgba(25,26,32,0.06)" />
              <div style={{ gridColumn: '1 / -1', padding: 18, borderRadius: 22, backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)' }}>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, opacity: 0.68, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Profile readiness
                </p>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 30, fontWeight: 700, marginTop: 8 }}>
                  {completionPercent}%
                </p>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, opacity: 0.76, marginTop: 8 }}>
                  Profile data is already used to prefill the search context and future applications.
                </p>
              </div>
            </div>
          </div>
        </SearchWorkspaceCard>

        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SearchWorkspaceCard style={{ position: 'sticky', top: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Search controls
                  </p>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', marginTop: 8 }}>
                    Advanced filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={saveCurrentSearch}
                  style={{
                    border: 'none',
                    borderRadius: 14,
                    padding: '11px 14px',
                    backgroundColor: 'rgb(25,26,32)',
                    color: 'rgb(245,245,245)',
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save search
                </button>
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginBottom: 8 }}>Search text</p>
                  <input
                    value={filters.text}
                    onChange={(event) => setFilters((current) => ({ ...current, text: event.target.value, page: 1 }))}
                    placeholder="Street, district, keyword"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1px solid rgba(25,26,32,0.12)',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginBottom: 8 }}>Rooms</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {BEDROOM_OPTIONS.map((option) => (
                      <FilterChip
                        key={option.label}
                        active={filters.roomsMin === option.min && filters.roomsMax === option.max}
                        onClick={() => setBedroom(option)}
                      >
                        {option.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginBottom: 8 }}>Budget</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRICE_OPTIONS.map((option) => (
                      <FilterChip
                        key={option.label}
                        active={filters.priceLabel === option.label || (!filters.priceLabel && option.label === 'Any budget')}
                        onClick={() => setPrice(option)}
                      >
                        {option.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    border: '1px solid rgba(25,26,32,0.12)',
                    borderRadius: 18,
                    padding: '14px 16px',
                    backgroundColor: 'rgb(248,246,241)',
                    color: 'rgb(25,26,32)',
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset filters
                </button>
              </div>
            </SearchWorkspaceCard>

            <SearchWorkspaceCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Saved searches
                  </p>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', marginTop: 8 }}>
                    Saved presets
                  </h3>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedSearches.length ? savedSearches.map((item) => (
                  <SavedSearchCard
                    key={item.id}
                    item={item}
                    active={item.id === activeSavedSearchId}
                    onApply={applySavedSearch}
                    onDelete={deleteSavedSearch}
                  />
                )) : (
                  <div style={{ borderRadius: 22, padding: 18, backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.7, color: 'rgba(25,26,32,0.62)' }}>
                    Save the current filters to reuse this search across sessions.
                  </div>
                )}
              </div>
            </SearchWorkspaceCard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SearchWorkspaceCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Search results
                  </p>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 26, color: 'rgb(25,26,32)', marginTop: 8 }}>
                    Map and list
                  </h3>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 760 }}>
                    Pins, cards, favorites and application drafts all reference the same live listing data.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 12, minWidth: 'min(100%, 360px)', flex: '1 1 360px' }}>
                  <WorkspaceStat label="Results" value={summary.results} />
                  <WorkspaceStat label="On map" value={summary.mapped} />
                  <WorkspaceStat label="Areas" value={summary.areas} />
                </div>
              </div>
            </SearchWorkspaceCard>

            <SearchWorkspaceCard style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.12fr) minmax(360px, 0.88fr)', alignItems: 'start' }}>
                <div style={{ padding: 24, borderRight: '1px solid rgba(25,26,32,0.08)', display: 'flex', flexDirection: 'column', minHeight: 0, alignSelf: 'start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Listing feed
                      </p>
                      <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', marginTop: 8 }}>
                        Live Germany results
                      </h3>
                    </div>
                    {uiNotice ? (
                      <div
                        style={{
                          maxWidth: 420,
                          padding: '12px 14px',
                          borderRadius: 14,
                          backgroundColor: 'rgb(248,246,241)',
                          color: 'rgb(25,26,32)',
                          fontFamily: '"Lexend", sans-serif',
                          fontSize: 13,
                        }}
                      >
                        {uiNotice}
                      </div>
                    ) : null}
                  </div>

                  <div style={{
                    overflowY: enrichedListings.length > 2 ? 'auto' : 'visible',
                    overflowX: 'visible',
                    maxHeight: enrichedListings.length > 2 ? 'calc(100vh - 280px)' : 'none',
                    paddingRight: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}>
                    {loading ? (
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.54)', padding: '20px 0' }}>
                        Loading live listings…
                      </p>
                    ) : error ? (
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.54)', padding: '20px 0' }}>
                        Could not load provider results right now.
                      </p>
                    ) : listings.length === 0 ? (
                      <div style={{ borderRadius: 24, padding: 20, backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', color: 'rgba(25,26,32,0.62)', lineHeight: 1.65 }}>
                        No properties match the current filters. Try broadening the location or budget range.
                      </div>
                    ) : (
                      enrichedListings.map((property) => (
                        <ListingCard
                          key={property.id}
                          property={property}
                          onApply={handleApply}
                          onFavorite={handleFavorite}
                          isFavorite={isFavorite(property.id)}
                          favoriteBusy={favoriteBusyId === String(property.id)}
                          onPreview={setSelectedListing}
                          lang={lang}
                          active={String(property.id) === String(activeListing?.id)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, position: 'sticky', top: 24, alignSelf: 'start' }}>
                  <div style={{ padding: 24, borderBottom: '1px solid rgba(25,26,32,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Map selection
                        </p>
                        <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', marginTop: 8 }}>
                          {activeListing ? activeListing.title : 'Choose a pin or result'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {selectedLocations.map((locationOption) => (
                          <span key={locationOption.id} style={{ borderRadius: 999, padding: '9px 12px', backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', fontSize: 12 }}>
                            {locationOption.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.65, color: 'rgba(25,26,32,0.62)', marginTop: 12 }}>
                      {activeListing ? activeListing.address : 'Select a pin or a listing card to preview the active property here.'}
                    </p>
                  </div>

                  <div style={{ padding: 20, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Is24MapView
                      listings={enrichedMapListings}
                      center={center}
                      activeId={activeListing?.id}
                      onSelect={setSelectedListing}
                      onHover={setSelectedListing}
                    />

                    {activeListing ? (
                      <ListingCard
                        property={activeListing}
                        onApply={handleApply}
                        onFavorite={handleFavorite}
                        isFavorite={isFavorite(activeListing.id)}
                        favoriteBusy={favoriteBusyId === String(activeListing.id)}
                        onPreview={setSelectedListing}
                        compact
                        lang={lang}
                        active
                      />
                    ) : (
                      <div style={{ borderRadius: 24, padding: 20, backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', color: 'rgba(25,26,32,0.62)', lineHeight: 1.65 }}>
                        Listings with coordinates appear here as pins. Listings without coordinates stay available in the feed.
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)' }}>
                        {locationsLoading ? 'Updating location suggestions…' : 'Location suggestions are based on the project geocode layer plus manual geocode entry.'}
                      </p>
                      <a
                        href={activeListing?.url || 'https://www.immobilienscout24.de/'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: 'none',
                          borderRadius: 14,
                          padding: '11px 14px',
                          backgroundColor: 'rgb(248,246,241)',
                          color: 'rgb(25,26,32)',
                          fontFamily: '"Lexend", sans-serif',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Open on provider
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </SearchWorkspaceCard>
          </div>
        </div>
      </div>

      {gateOpen ? (
        <AuthGateModal guestHref={guestHref} onClose={() => setGateOpen(false)} />
      ) : null}
    </>
  )
}
