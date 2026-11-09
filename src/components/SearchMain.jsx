import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites.js'
import { useApplications } from '../hooks/useApplications.js'
import { useIs24Locations } from '../hooks/useIs24Locations.js'
import { useIs24Search } from '../hooks/useIs24Search.js'
import { useProfile } from '../hooks/useProfile.js'
import { useSavedSearches } from '../hooks/useSavedSearches.js'
import { buildListingDetailHref } from '../lib/listingRouting.js'
import AuthGateModal from './AuthGateModal.jsx'
import Is24MapView from './maps/Is24MapView.jsx'

const COPY = {
  en: {
    eyebrow: 'Find a home', heading: 'Where are you moving?',
    sub: 'Search by city, district or street, see every home on the map and apply in a click.',
    placeholder: 'City, district or street', searchNow: 'Search', saveSearch: 'Save search',
    members: 'Members', promoTitle: 'Apply to any home in one click.',
    promoText: 'The club writes to the agency for you. First month free, no card needed.', join: 'Join the club',
    yourProfile: 'Your profile', profileDone: 'Complete. The club can apply for you.',
    profileTodo: 'Complete it so the club can apply for you.', completeProfile: 'Complete profile',
    refine: 'Refine', filters: 'Filters', searchText: 'Keyword', keywordPlaceholder: 'Street, district, keyword',
    rooms: 'Rooms', any: 'Any', budget: 'Budget', anyBudget: 'Any budget', reset: 'Reset filters',
    upTo: (n) => `Up to €${n.toLocaleString('en-US')}`, over: 'Over €4,000',
    savedEyebrow: 'Saved searches', savedTitle: 'My searches',
    savedEmpty: 'Save the current filters to reuse this search later.',
    loadSearch: 'Load search', currentSearch: 'Current search', deleteSaved: 'Delete saved search',
    homes: 'Homes', found: (n, m) => `${n} found · ${m} on the map`,
    loading: 'Loading homes…', error: 'Could not load homes right now. Please try again in a moment.',
    empty: 'No homes match this search yet. Try a nearby area or a wider budget. Moving somewhere we do not cover? Tell us at hello@book.immo and we will add it.',
    showMore: (n, m) => `Show more (${n} of ${m})`, loadingShort: 'Loading…',
    map: 'Map', mapEmpty: 'Homes appear here as pins. Some listings have no exact address and show in the list only.',
    openOriginal: 'Open original listing',
    locationOnRequest: 'Location on request', priceOnRequest: 'Price on request', recently: 'Recently published',
    details: 'Details', apply: 'Apply', favAdd: 'Save to favorites', favRemove: 'Remove from favorites',
    mySearch: 'My search', selectedAreas: 'Selected areas', roomsLabel: (n) => `${n}+ rooms`,
    anyRooms: 'Any rooms', anyRoomCount: 'Any room count', flexible: 'Flexible budget',
    nSearchUpdated: (l) => `Search updated for ${l}.`, searchUpdated: 'Search query updated.',
    errSave: 'Could not save this search.', guestSearch: 'Search saved on this device. Sign in to keep it everywhere.',
    serverSaveFailed: 'Server save failed, so this search was stored locally.', savedOk: 'Search saved.',
    loaded: (n) => `Loaded saved search: ${n}`, errRemove: 'Could not remove saved search.',
    serverDeleteFailed: 'Server delete failed, local copy was removed.', removedOk: 'Saved search removed.',
    errFav: 'Could not update favorites.', guestFav: 'Saved on this device. Sign in to keep your favorites everywhere.',
    favRemoved: 'Removed from favorites.', favSaved: 'Saved to favorites.',
    errDraft: 'Could not create application draft.', signInApply: 'Sign in to continue your application.',
    draftOk: 'Application draft created. Opening the application wizard.',
  },
  de: {
    eyebrow: 'Wohnung finden', heading: 'Wohin ziehen Sie?',
    sub: 'Suchen Sie nach Stadt, Stadtteil oder Straße, sehen Sie alle Wohnungen auf der Karte und bewerben Sie sich mit einem Klick.',
    placeholder: 'Stadt, Stadtteil oder Straße', searchNow: 'Suchen', saveSearch: 'Suche speichern',
    members: 'Mitglieder', promoTitle: 'Bewerben Sie sich mit einem Klick.',
    promoText: 'Der Club schreibt die Agentur für Sie an. Erster Monat gratis, ohne Karte.', join: 'Club beitreten',
    yourProfile: 'Ihr Profil', profileDone: 'Vollständig. Der Club kann sich für Sie bewerben.',
    profileTodo: 'Vervollständigen Sie es, damit sich der Club für Sie bewerben kann.', completeProfile: 'Profil vervollständigen',
    refine: 'Verfeinern', filters: 'Filter', searchText: 'Stichwort', keywordPlaceholder: 'Straße, Stadtteil, Stichwort',
    rooms: 'Zimmer', any: 'Alle', budget: 'Budget', anyBudget: 'Beliebig', reset: 'Filter zurücksetzen',
    upTo: (n) => `Bis €${n.toLocaleString('de-DE')}`, over: 'Über €4.000',
    savedEyebrow: 'Gespeicherte Suchen', savedTitle: 'Meine Suchen',
    savedEmpty: 'Speichern Sie die aktuellen Filter, um diese Suche später wiederzuverwenden.',
    loadSearch: 'Suche laden', currentSearch: 'Aktuelle Suche', deleteSaved: 'Gespeicherte Suche löschen',
    homes: 'Wohnungen', found: (n, m) => `${n} gefunden · ${m} auf der Karte`,
    loading: 'Wohnungen werden geladen…', error: 'Die Angebote konnten nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.',
    empty: 'Für diese Suche gibt es noch keine Treffer. Probieren Sie ein Nachbargebiet oder ein höheres Budget. Ihre Stadt fehlt? Schreiben Sie uns an hello@book.immo.',
    showMore: (n, m) => `Mehr anzeigen (${n} von ${m})`, loadingShort: 'Lädt…',
    map: 'Karte', mapEmpty: 'Wohnungen erscheinen hier als Pins. Manche Angebote haben keine genaue Adresse und stehen nur in der Liste.',
    openOriginal: 'Originalanzeige öffnen',
    locationOnRequest: 'Lage auf Anfrage', priceOnRequest: 'Preis auf Anfrage', recently: 'Kürzlich veröffentlicht',
    details: 'Details', apply: 'Bewerben', favAdd: 'Zu Favoriten hinzufügen', favRemove: 'Aus Favoriten entfernen',
    mySearch: 'Meine Suche', selectedAreas: 'Gewählte Gebiete', roomsLabel: (n) => `${n}+ Zimmer`,
    anyRooms: 'Alle Zimmer', anyRoomCount: 'Beliebige Zimmerzahl', flexible: 'Flexibles Budget',
    nSearchUpdated: (l) => `Suche aktualisiert für ${l}.`, searchUpdated: 'Suchanfrage aktualisiert.',
    errSave: 'Die Suche konnte nicht gespeichert werden.', guestSearch: 'Suche auf diesem Gerät gespeichert. Melden Sie sich an, um sie überall zu behalten.',
    serverSaveFailed: 'Speichern auf dem Server fehlgeschlagen, die Suche wurde lokal gespeichert.', savedOk: 'Suche gespeichert.',
    loaded: (n) => `Gespeicherte Suche geladen: ${n}`, errRemove: 'Die gespeicherte Suche konnte nicht entfernt werden.',
    serverDeleteFailed: 'Löschen auf dem Server fehlgeschlagen, die lokale Kopie wurde entfernt.', removedOk: 'Gespeicherte Suche entfernt.',
    errFav: 'Favoriten konnten nicht aktualisiert werden.', guestFav: 'Auf diesem Gerät gespeichert. Melden Sie sich an, um Ihre Favoriten überall zu behalten.',
    favRemoved: 'Aus Favoriten entfernt.', favSaved: 'Zu Favoriten hinzugefügt.',
    errDraft: 'Der Bewerbungsentwurf konnte nicht erstellt werden.', signInApply: 'Melden Sie sich an, um Ihre Bewerbung fortzusetzen.',
    draftOk: 'Bewerbungsentwurf erstellt. Der Assistent wird geöffnet.',
  },
}

function getCopy(lang) {
  return COPY[lang] || COPY.en
}

function getBedroomOptions(t) {
  return [
    { label: t.any, min: '', max: '' },
    { label: '2+', min: '2', max: '' },
    { label: '3+', min: '3', max: '' },
    { label: '4+', min: '4', max: '' },
  ]
}

function getPriceOptions(t) {
  return [
    { label: t.anyBudget, min: null, max: null },
    { label: t.upTo(1500), min: null, max: 1500 },
    { label: `€${(1500).toLocaleString('en-US')} - €${(2500).toLocaleString('en-US')}`, min: 1500, max: 2500 },
    { label: `€${(2500).toLocaleString('en-US')} - €${(4000).toLocaleString('en-US')}`, min: 2500, max: 4000 },
    { label: t.over, min: 4000, max: null },
  ]
}

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

function buildSearchLabel(filters, selectedLocations = [], t) {
  const locationLabel = selectedLocations[0]?.label
    || (filters.text ? filters.text.trim() : '')
    || t.mySearch
  const roomsLabel = filters.roomsMin ? t.roomsLabel(filters.roomsMin) : t.anyRooms
  const budgetLabel = filters.priceLabel || t.flexible
  return `${locationLabel} · ${roomsLabel}`
    .replace(/\s+/g, ' ')
    .trim() || budgetLabel
}

function buildSearchSummary(filters, selectedLocations = [], t) {
  const locationLabel = selectedLocations.length
    ? selectedLocations.map((item) => item.label).slice(0, 2).join(', ')
    : (filters.text || t.selectedAreas)
  const roomsLabel = filters.roomsMin ? t.roomsLabel(filters.roomsMin) : t.anyRoomCount
  const budgetLabel = filters.priceLabel || t.anyBudget
  return `${locationLabel} · ${roomsLabel} · ${budgetLabel}`
}

function buildWorkspaceHeading(filters, selectedLocations = [], t) {
  if (selectedLocations.length) {
    return selectedLocations.map((item) => item.label).slice(0, 2).join(' + ')
  }

  if (filters.text?.trim()) {
    return filters.text.trim()
  }

  return t.heading
}

function formatPublished(value, lang) {
  const match = /^Updated (\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return value
  const [, y, m, d] = match
  return lang === 'de' ? `Aktualisiert ${d}.${m}.${y}` : `Updated ${d}/${m}/${y}`
}

function buildListingPreviewBadges(property) {
  return [
    property.roomsLabel,
    property.areaLabel,
    property.district || property.postcode,
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

function normalizePropertyForApplication(property) {
  return {
    id: property.id,
    title: property.title,
    price: property.price,
    address: property.address,
    source: property.source,
    url: property.url,
    externalId: property.externalId || property.id,
  }
}

function SavedSearchCard({ item, active, onApply, onDelete, t }) {
  return (
    <article
      style={{
        padding: 16,
        borderRadius: 12,
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
          aria-label={t.deleteSaved}
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={() => onApply(item)}
        style={{
          border: 'none',
          borderRadius: 4,
          padding: '11px 14px',
          backgroundColor: active ? 'rgb(25,26,32)' : 'white',
          color: active ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {active ? t.currentSearch : t.loadSearch}
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
  t,
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
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
        border: active ? '1px solid rgba(255,102,37,0.55)' : '1px solid rgba(25,26,32,0.08)',
        boxShadow: active ? '0 0 0 3px rgba(255,102,37,0.10)' : 'none',
        transition: 'box-shadow 160ms ease, border-color 160ms ease',
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
              {property.address || t.locationOnRequest}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFavorite(property)}
            disabled={favoriteBusy}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'rgba(248,246,241,1)',
              color: isFavorite ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
              fontSize: 18,
              cursor: favoriteBusy ? 'default' : 'pointer',
              flexShrink: 0,
            }}
            aria-label={isFavorite ? t.favRemove : t.favAdd}
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
              {property.priceLabel || t.priceOnRequest}
            </p>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', marginTop: 4 }}>
              {formatPublished(property.published, lang) || t.recently}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a className="btn-shine on-light"
              href={buildListingDetailHref(lang, property)}
              style={{
                textDecoration: 'none',
                borderRadius: 4,
                padding: '11px 14px',
                border: '1px solid rgba(25,26,32,0.12)',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {t.details}
            </a>
            <button className="btn-shine"
              type="button"
              onClick={() => onApply(property)}
              style={{
                border: 'none',
                borderRadius: 4,
                padding: '11px 18px',
                backgroundColor: 'rgb(255,102,37)',
                color: '#fff',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.apply}
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
  const t = getCopy(lang)
  const BEDROOM_OPTIONS = getBedroomOptions(t)
  const PRICE_OPTIONS = getPriceOptions(t)
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
  const { listings, mapListings, selectedLocations, center, totalResults, numberOfPages, pageNumber, loading, loadingMore, error } = useIs24Search(filters)
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
      priceLabel: profile.maxBudget ? t.upTo(Number(profile.maxBudget)) : current.priceLabel,
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


  const workspaceHeading = useMemo(
    () => buildWorkspaceHeading(filters, selectedLocations, t),
    [filters, selectedLocations, t],
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
      setUiNotice(matchedLocation ? t.nSearchUpdated(matchedLocation.label) : t.searchUpdated)
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
      name: buildSearchLabel(filters, selectedLocations, t),
      summary: buildSearchSummary(filters, selectedLocations, t),
      filters: sanitizeSavedSearchFilters(filters),
    }

    const result = await saveSearch({
      searchId: activeSavedSearchId || undefined,
      name: item.name,
      summary: item.summary,
      filters: item.filters,
    })

    if (!result.ok) {
      setUiNotice(result.error || t.errSave)
      return
    }

    if (result.item?.id) {
      setActiveSavedSearchId(result.item.id)
    }

    if (result.requiresAuth) {
      setGuestHref(`/${lang}/search`)
      setGateOpen(true)
      setUiNotice(t.guestSearch)
      return
    }

    setUiNotice(result.fallbackLocal ? t.serverSaveFailed : t.savedOk)
  }

  function applySavedSearch(item) {
    setFilters(sanitizeSavedSearchFilters(item.filters || {}))
    setSelectedListing(null)
    setActiveSavedSearchId(item.id)
    setUiNotice(t.loaded(item.name))
  }

  async function deleteSavedSearch(searchId) {
    const result = await deleteSearch(searchId)

    if (activeSavedSearchId === searchId) {
      setActiveSavedSearchId('')
    }

    if (!result.ok) {
      setUiNotice(result.error || t.errRemove)
      return
    }

    setUiNotice(result.fallbackLocal ? t.serverDeleteFailed : t.removedOk)
  }

  async function handleFavorite(property) {
    setFavoriteBusyId(String(property.id))
    const result = await toggleFavorite(property.id)
    setFavoriteBusyId('')

    if (!result.ok) {
      setUiNotice(result.error || t.errFav)
      return
    }

    if (result.requiresAuth) {
      setGuestHref(`/${lang}/search`)
      setGateOpen(true)
      setUiNotice(result.isFavorite ? t.guestFav : t.favRemoved)
      return
    }

    setUiNotice(result.isFavorite ? t.favSaved : t.favRemoved)
  }

  async function handleApply(property) {
    const result = await createDraftApplication({ property: normalizePropertyForApplication(property) })

    if (!result.ok) {
      setUiNotice(result.error || t.errDraft)
      return
    }

    if (result.requiresAuth) {
      setGuestHref(`/${lang}/search`)
      setGateOpen(true)
      setUiNotice(t.signInApply)
      return
    }

    setUiNotice(t.draftOk)
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
        <style>{`
          @media (max-width: 1100px) {
            .sm-top, .sm-main, .sm-split { grid-template-columns: minmax(0, 1fr) !important; }
          }
        `}</style>
          <div className="sm-top" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(260px, 0.7fr)', gap: 20, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  height: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'center',
                  padding: 20,
                  borderRadius: 12,
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
                      flex: '1 1 260px',
                      minWidth: 200,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0 14px',
                      height: 56,
                      borderRadius: 8,
                      border: '2px solid rgb(25,26,32)',
                      backgroundColor: '#fff',
                    }}
                  >
                    <span style={{ fontSize: 18, color: 'rgb(255,102,37)' }}>⌕</span>
                    <input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          applyPrimarySearch()
                        }
                      }}
                      placeholder={t.placeholder}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontFamily: '"Lexend", sans-serif',
                        fontSize: 16,
                        fontWeight: 500,
                        color: 'rgb(25,26,32)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button className="btn-shine"
                    type="button"
                    onClick={applyPrimarySearch}
                    style={{
                      height: 56,
                      border: 'none',
                      borderRadius: 4,
                      padding: '0 26px',
                      backgroundColor: 'rgb(255,102,37)',
                      color: '#fff',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.searchNow}
                  </button>

                  <button className="btn-shine on-light"
                    type="button"
                    onClick={saveCurrentSearch}
                    style={{
                      height: 56,
                      border: '1px solid rgba(25,26,32,0.1)',
                      borderRadius: 4,
                      padding: '0 18px',
                      backgroundColor: 'white',
                      color: 'rgb(25,26,32)',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.saveSearch}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {visibleLocationChips.map((item) => (
                    <FilterChip key={item.id} active={filters.geocodes.includes(item.id)} onClick={() => toggleLocation(item)}>
                      {item.label}
                    </FilterChip>
                  ))}
                </div>

              </div>


            </div>

            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1, padding: 24, borderRadius: 12, backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                {isAuthenticated ? (
                  <>
                    <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t.yourProfile}
                    </p>
                    <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>
                      {completionPercent}%
                    </p>
                    <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.55, opacity: 0.78 }}>
                      {completionPercent >= 100 ? t.profileDone : t.profileTodo}
                    </p>
                    {completionPercent < 100 ? (
                      <Link to={`/${lang}/account`} className="btn-shine" style={{ alignSelf: 'flex-start', marginTop: 4, display: 'inline-flex', alignItems: 'center', padding: '12px 18px', borderRadius: 4, backgroundColor: 'rgb(255,102,37)', color: '#fff', textDecoration: 'none', fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 600 }}>
                        {t.completeProfile}
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t.members}
                    </p>
                    <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                      {t.promoTitle}
                    </p>
                    <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.55, opacity: 0.78 }}>
                      {t.promoText}
                    </p>
                    <Link to={`/${lang}/sign-up`} className="btn-shine" style={{ alignSelf: 'flex-start', marginTop: 4, display: 'inline-flex', alignItems: 'center', padding: '12px 18px', borderRadius: 4, backgroundColor: 'rgb(255,102,37)', color: '#fff', textDecoration: 'none', fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 600 }}>
                      {t.join}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </SearchWorkspaceCard>

        <div className="sm-main" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SearchWorkspaceCard style={{ position: 'sticky', top: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t.refine}
                  </p>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', marginTop: 8 }}>
                    {t.filters}
                  </h3>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginBottom: 8 }}>{t.searchText}</p>
                  <input
                    value={filters.text}
                    onChange={(event) => setFilters((current) => ({ ...current, text: event.target.value, page: 1 }))}
                    placeholder={t.keywordPlaceholder}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(25,26,32,0.12)',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginBottom: 8 }}>{t.rooms}</p>
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
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginBottom: 8 }}>{t.budget}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRICE_OPTIONS.map((option) => (
                      <FilterChip
                        key={option.label}
                        active={filters.priceLabel === option.label || (!filters.priceLabel && option.label === t.anyBudget)}
                        onClick={() => setPrice(option)}
                      >
                        {option.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                <button className="btn-shine on-light"
                  type="button"
                  onClick={resetFilters}
                  style={{
                    border: '1px solid rgba(25,26,32,0.12)',
                    borderRadius: 4,
                    padding: '14px 16px',
                    backgroundColor: 'rgb(248,246,241)',
                    color: 'rgb(25,26,32)',
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.reset}
                </button>
              </div>
            </SearchWorkspaceCard>

            <SearchWorkspaceCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t.savedEyebrow}
                  </p>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', marginTop: 8 }}>
                    {t.savedTitle}
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
                    t={t}
                  />
                )) : (
                  <div style={{ borderRadius: 12, padding: 18, backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.7, color: 'rgba(25,26,32,0.62)' }}>
                    {t.savedEmpty}
                  </div>
                )}
              </div>
            </SearchWorkspaceCard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="sm-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.12fr) minmax(360px, 0.88fr)', gap: 20, alignItems: 'start' }}>
              <SearchWorkspaceCard style={{ padding: 24, minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, alignSelf: 'start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                      <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', margin: 0 }}>
                        {t.homes}
                      </h3>
                      <p style={{ margin: '6px 0 0', fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.6)' }}>
                        {t.found(summary.results, summary.mapped)}
                      </p>
                    </div>
                    {uiNotice ? (
                      <div
                        style={{
                          maxWidth: 420,
                          padding: '12px 14px',
                          borderRadius: 8,
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}>
                    {loading ? (
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.54)', padding: '20px 0' }}>
                        {t.loading}
                      </p>
                    ) : error ? (
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.54)', padding: '20px 0' }}>
                        {t.error}
                      </p>
                    ) : listings.length === 0 ? (
                      <div style={{ borderRadius: 12, padding: 20, backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', color: 'rgba(25,26,32,0.62)', lineHeight: 1.65 }}>
                        {t.empty}
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
                          t={t}
                          active={String(property.id) === String(activeListing?.id)}
                        />
                      ))
                    )}
                    {!loading && !error && pageNumber < numberOfPages ? (
                      <button className="btn-shine on-light"
                        type="button"
                        disabled={loadingMore}
                        onClick={() => setFilters((current) => ({ ...current, page: pageNumber + 1 }))}
                        style={{
                          alignSelf: 'center',
                          border: 'none',
                          borderRadius: 4,
                          padding: '12px 22px',
                          backgroundColor: 'rgb(248,246,241)',
                          color: 'rgb(25,26,32)',
                          fontFamily: '"Lexend", sans-serif',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: loadingMore ? 'default' : 'pointer',
                        }}
                      >
                        {loadingMore ? t.loadingShort : t.showMore(listings.length, totalResults)}
                      </button>
                    ) : null}
                  </div>
                </div>
              </SearchWorkspaceCard>

              <SearchWorkspaceCard style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, position: 'sticky', top: 24, alignSelf: 'start' }}>
                  <div style={{ padding: 24, borderBottom: '1px solid rgba(25,26,32,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)', margin: 0 }}>
                        {t.map}
                      </h3>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {selectedLocations.map((locationOption) => (
                          <span key={locationOption.id} style={{ borderRadius: 999, padding: '9px 12px', backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', fontSize: 12 }}>
                            {locationOption.label}
                          </span>
                        ))}
                      </div>
                    </div>

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
                        t={t}
                        active
                      />
                    ) : (
                      <div style={{ borderRadius: 12, padding: 20, backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', color: 'rgba(25,26,32,0.62)', lineHeight: 1.65 }}>
                        {t.mapEmpty}
                      </div>
                    )}

                    {activeListing?.url ? (
                      <a className="btn-shine on-light"
                        href={activeListing.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          alignSelf: 'flex-start',
                          textDecoration: 'none',
                          borderRadius: 4,
                          padding: '11px 14px',
                          backgroundColor: 'rgb(248,246,241)',
                          color: 'rgb(25,26,32)',
                          fontFamily: '"Lexend", sans-serif',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {t.openOriginal}
                      </a>
                    ) : null}
                  </div>
                </div>
              </SearchWorkspaceCard>
            </div>
          </div>
        </div>
      </div>

      {gateOpen ? (
        <AuthGateModal guestHref={guestHref} onClose={() => setGateOpen(false)} />
      ) : null}
    </>
  )
}
