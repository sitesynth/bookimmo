import React, { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export default function Is24MapView({ listings = [], center, activeId, onSelect }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function ensureMap() {
      if (!mapElementRef.current || mapRef.current || typeof window === 'undefined') return

      const L = await import('leaflet')
      if (!mounted || !mapElementRef.current) return

      const map = L.map(mapElementRef.current, {
        zoomControl: false,
        attributionControl: true,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      mapRef.current = { map, L }
      layerRef.current = L.layerGroup().addTo(map)
    }

    ensureMap()

    return () => {
      mounted = false
      if (mapRef.current?.map) {
        mapRef.current.map.remove()
        mapRef.current = null
      }
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return

    const { map, L } = mapRef.current
    layerRef.current.clearLayers()

    const points = listings.filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lon))

    points.forEach((listing) => {
      const marker = L.circleMarker([listing.lat, listing.lon], {
        radius: String(listing.id) === String(activeId) ? 10 : 8,
        weight: 2,
        color: String(listing.id) === String(activeId) ? '#191a20' : '#ffffff',
        fillColor: String(listing.id) === String(activeId) ? '#f97316' : '#191a20',
        fillOpacity: 0.92,
      })

      marker.on('click', () => onSelect?.(listing))
      marker.bindTooltip(
        `<strong>${listing.priceLabel || 'Price on request'}</strong><br/>${listing.title}`,
        { direction: 'top', offset: [0, -8] },
      )
      marker.addTo(layerRef.current)
    })

    if (points.length) {
      const bounds = L.latLngBounds(points.map((listing) => [listing.lat, listing.lon]))
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: points.length === 1 ? 14 : 13 })
      return
    }

    const fallback = center && Number.isFinite(center.lat) && Number.isFinite(center.lon)
      ? [center.lat, center.lon]
      : [53.5511, 9.9937]
    map.setView(fallback, center?.zoom || 11)
  }, [activeId, center, listings, onSelect])

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
