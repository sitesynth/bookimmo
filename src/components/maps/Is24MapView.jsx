import React, { useEffect, useMemo, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

const FALLBACK_CENTER = { lon: 10.4515, lat: 51.1657, zoom: 5.6 }
const MAPBOX_STYLE = import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/light-v11'
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

function formatMarkerLabel(listing) {
  const priceLabel = listing?.priceLabel?.trim()
  if (!priceLabel) return 'View'

  const compact = priceLabel
    .replace(/\s+/g, ' ')
    .replace(/\s(?:warm|cold|kaltmiete|warmmiete|rent|price).*$/i, '')
    .trim()

  return compact.length > 14 ? `${compact.slice(0, 13)}…` : compact
}

function createMarkerElement(listing, isActive, onSelect) {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('aria-label', listing.title || 'Listing marker')
  button.textContent = formatMarkerLabel(listing)
  button.onclick = () => onSelect?.(listing)

  Object.assign(button.style, {
    border: isActive ? '2px solid #191a20' : '1px solid rgba(25,26,32,0.12)',
    borderRadius: '999px',
    background: isActive ? '#ff6625' : '#ffffff',
    color: isActive ? '#ffffff' : '#191a20',
    boxShadow: isActive
      ? '0 14px 32px rgba(255,102,37,0.32)'
      : '0 8px 24px rgba(25,26,32,0.12)',
    padding: '8px 12px',
    fontFamily: '"Lexend", sans-serif',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '1',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  return button
}

export default function Is24MapView({ listings = [], center, activeId, onSelect }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  const validPoints = useMemo(
    () => listings.filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lon)),
    [listings],
  )

  useEffect(() => {
    let mounted = true

    async function ensureMap() {
      if (!MAPBOX_ACCESS_TOKEN || !mapElementRef.current || mapRef.current || typeof window === 'undefined') return

      const mapboxglModule = await import('mapbox-gl')
      const mapboxgl = mapboxglModule.default
      if (!mounted || !mapElementRef.current) return

      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

      const map = new mapboxgl.Map({
        container: mapElementRef.current,
        style: MAPBOX_STYLE,
        center: [FALLBACK_CENTER.lon, FALLBACK_CENTER.lat],
        zoom: FALLBACK_CENTER.zoom,
        attributionControl: true,
        pitchWithRotate: false,
        dragRotate: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
      map.touchZoomRotate.disableRotation()

      mapRef.current = { map, mapboxgl }
    }

    ensureMap()

    return () => {
      mounted = false
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (mapRef.current?.map) {
        mapRef.current.map.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    const { map, mapboxgl } = mapRef.current
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    validPoints.forEach((listing) => {
      const marker = new mapboxgl.Marker({
        element: createMarkerElement(listing, String(listing.id) === String(activeId), onSelect),
        anchor: 'bottom',
      })
        .setLngLat([listing.lon, listing.lat])
        .addTo(map)

      markersRef.current.push(marker)
    })

    if (validPoints.length) {
      const bounds = new mapboxgl.LngLatBounds()
      validPoints.forEach((listing) => bounds.extend([listing.lon, listing.lat]))
      map.fitBounds(bounds, {
        padding: { top: 36, right: 36, bottom: 36, left: 36 },
        maxZoom: validPoints.length === 1 ? 13.5 : 12.8,
        duration: 0,
      })
      return
    }

    const fallback = center && Number.isFinite(center.lat) && Number.isFinite(center.lon)
      ? [center.lon, center.lat]
      : [FALLBACK_CENTER.lon, FALLBACK_CENTER.lat]

    map.jumpTo({
      center: fallback,
      zoom: center?.zoom || FALLBACK_CENTER.zoom,
    })
  }, [activeId, center, onSelect, validPoints])

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div
        style={{
          height: 420,
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)',
          border: '1px solid rgba(25,26,32,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: '"Lexend", sans-serif',
          color: 'rgba(25,26,32,0.72)',
          lineHeight: 1.6,
        }}
      >
        Add `VITE_MAPBOX_ACCESS_TOKEN` to enable the production map layer.
      </div>
    )
  }

  return (
    <div
      ref={mapElementRef}
      style={{
        height: 420,
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)',
      }}
    />
  )
}
