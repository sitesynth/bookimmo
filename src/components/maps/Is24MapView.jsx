import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

const FALLBACK_CENTER = { lon: 10.4515, lat: 51.1657, zoom: 5.6 }
const MAPBOX_STYLE = import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/light-v11'
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

const SOURCE_ID = 'bookimmo-listings'
const ACTIVE_SOURCE_ID = 'bookimmo-active-listing'
const CLUSTERS_LAYER_ID = 'bookimmo-clusters'
const CLUSTER_COUNT_LAYER_ID = 'bookimmo-cluster-count'
const POINT_LAYER_ID = 'bookimmo-points'
const POINT_LABEL_LAYER_ID = 'bookimmo-point-labels'
const ACTIVE_LAYER_ID = 'bookimmo-active-point'
const ACTIVE_LABEL_LAYER_ID = 'bookimmo-active-label'

function formatMarkerLabel(listing) {
  const priceLabel = listing?.priceLabel?.trim()
  if (!priceLabel) return 'View'

  const compact = priceLabel
    .replace(/\s+/g, ' ')
    .replace(/\s(?:warm|cold|kaltmiete|warmmiete|rent|price).*$/i, '')
    .trim()

  return compact.length > 14 ? `${compact.slice(0, 13)}…` : compact
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function toFeature(listing) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [listing.lon, listing.lat],
    },
    properties: {
      id: String(listing.id),
      title: listing.title || 'Listing',
      address: listing.address || '',
      priceLabel: listing.priceLabel || '',
      priceShort: formatMarkerLabel(listing),
      imageUrl: listing.imageUrl || '',
      source: listing.source || '',
      url: listing.url || '',
    },
  }
}

function toFeatureCollection(listings) {
  return {
    type: 'FeatureCollection',
    features: listings.map(toFeature),
  }
}

function buildPopupHtml(listing) {
  return `
    <div style="min-width:236px;max-width:280px;padding:0;font-family:Lexend,sans-serif;overflow:hidden;border-radius:16px">
      ${listing.imageUrl ? `<div style="height:120px;background:#f4eee5"><img src="${escapeHtml(listing.imageUrl)}" alt="${escapeHtml(listing.title || 'Listing')}" style="display:block;width:100%;height:100%;object-fit:cover" /></div>` : ''}
      <div style="padding:${listing.imageUrl ? '12px 12px 2px' : '4px 4px 0'}">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div style="font-size:12px;color:rgba(25,26,32,0.54);margin-bottom:6px">${escapeHtml(listing.priceLabel || 'Price on request')}</div>
          ${listing.source ? `<div style="font-size:11px;color:#ff6625;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(String(listing.source))}</div>` : ''}
        </div>
        <div style="font-size:14px;font-weight:700;line-height:1.35;color:#191a20">${escapeHtml(listing.title || 'Listing')}</div>
        ${listing.address ? `<div style="font-size:12px;line-height:1.5;color:rgba(25,26,32,0.62);margin-top:6px">${escapeHtml(listing.address)}</div>` : ''}
      </div>
    </div>
  `
}

function buildBounds(mapboxgl, listings) {
  const bounds = new mapboxgl.LngLatBounds()
  listings.forEach((listing) => bounds.extend([listing.lon, listing.lat]))
  return bounds
}

export default function Is24MapView({ listings = [], center, activeId, onSelect, onHover }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const fittedRef = useRef(false)
  const pointsByIdRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const onHoverRef = useRef(onHover)
  const lastListingKeyRef = useRef('')
  const [mapError, setMapError] = useState('')

  const validPoints = useMemo(
    () => listings.filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lon)),
    [listings],
  )

  const pointsById = useMemo(
    () => new Map(validPoints.map((listing) => [String(listing.id), listing])),
    [validPoints],
  )

  useEffect(() => {
    pointsByIdRef.current = pointsById
    onSelectRef.current = onSelect
    onHoverRef.current = onHover
  }, [onHover, onSelect, pointsById])

  useEffect(() => {
    let mounted = true

    async function ensureMap() {
      if (!MAPBOX_ACCESS_TOKEN || !mapElementRef.current || mapRef.current || typeof window === 'undefined') return

      try {
        const mapboxglModule = await import('mapbox-gl')
        const mapboxgl = mapboxglModule.default
        if (!mounted || !mapElementRef.current) return

        if (typeof mapboxgl.supported === 'function' && !mapboxgl.supported()) {
          throw new Error('webgl_not_supported')
        }

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

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          maxWidth: '280px',
        })

        map.on('load', () => {
          if (!mounted) return

          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: toFeatureCollection([]),
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 44,
          })

          map.addSource(ACTIVE_SOURCE_ID, {
            type: 'geojson',
            data: toFeatureCollection([]),
          })

        map.addLayer({
          id: CLUSTERS_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#191a20',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              22,
              25,
              28,
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff8f4',
          },
        })

        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        map.addLayer({
          id: POINT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#ffffff',
            'circle-radius': 20,
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(25,26,32,0.10)',
            'circle-opacity': 0.98,
          },
        })

        map.addLayer({
          id: POINT_LABEL_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['get', 'priceShort'],
            'text-size': 11,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#191a20',
          },
        })

        map.addLayer({
          id: ACTIVE_LAYER_ID,
          type: 'circle',
          source: ACTIVE_SOURCE_ID,
          paint: {
            'circle-color': '#ff6625',
            'circle-radius': 23,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#191a20',
            'circle-opacity': 1,
          },
        })

        map.addLayer({
          id: ACTIVE_LABEL_LAYER_ID,
          type: 'symbol',
          source: ACTIVE_SOURCE_ID,
          layout: {
            'text-field': ['get', 'priceShort'],
            'text-size': 11,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        map.on('click', CLUSTERS_LAYER_ID, async (event) => {
          const feature = event.features?.[0]
          if (!feature) return

          const clusterId = feature.properties?.cluster_id
          const source = map.getSource(SOURCE_ID)
          if (!source || typeof source.getClusterExpansionZoom !== 'function') return

          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error) return
            map.easeTo({
              center: feature.geometry.coordinates,
              zoom,
              duration: 600,
            })
          })
        })

        map.on('click', POINT_LAYER_ID, (event) => {
          const feature = event.features?.[0]
          const id = feature?.properties?.id
          if (!id) return
          const listing = pointsByIdRef.current.get(String(id))
          if (listing) onSelectRef.current?.(listing)
        })

        map.on('mouseenter', CLUSTERS_LAYER_ID, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', CLUSTERS_LAYER_ID, () => {
          map.getCanvas().style.cursor = ''
        })
        map.on('mouseenter', POINT_LAYER_ID, (event) => {
          map.getCanvas().style.cursor = 'pointer'
          const feature = event.features?.[0]
          const id = feature?.properties?.id
          if (!id) return
          const listing = pointsByIdRef.current.get(String(id))
          if (!listing) return
          onHoverRef.current?.(listing)

          popup
            .setLngLat([listing.lon, listing.lat])
            .setHTML(buildPopupHtml(listing))
            .addTo(map)
        })
          map.on('mouseleave', POINT_LAYER_ID, () => {
            map.getCanvas().style.cursor = ''
            popup.remove()
          })
        })

        mapRef.current = { map, mapboxgl }
        popupRef.current = popup
        setMapError('')
      } catch (error) {
        if (!mounted) return
        setMapError(error?.message === 'webgl_not_supported'
          ? 'This browser cannot initialize WebGL, so the interactive map is unavailable here.'
          : 'The interactive map could not start on this device right now.')
      }
    }

    ensureMap()

    return () => {
      mounted = false
      popupRef.current?.remove()
      popupRef.current = null

      if (mapRef.current?.map) {
        mapRef.current.map.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current?.map) return
    const { map } = mapRef.current

    const syncMapData = () => {
      const source = map.getSource(SOURCE_ID)
      if (source) {
        source.setData(toFeatureCollection(validPoints))
      }

      const activeSource = map.getSource(ACTIVE_SOURCE_ID)
      const activeListing = activeId ? pointsById.get(String(activeId)) : null
      if (activeSource) {
        activeSource.setData(activeListing ? toFeatureCollection([activeListing]) : toFeatureCollection([]))
      }

      const listingKey = validPoints.map((listing) => String(listing.id)).join('|')

      if (validPoints.length && listingKey !== lastListingKeyRef.current) {
        const bounds = new mapRef.current.mapboxgl.LngLatBounds()
        validPoints.forEach((listing) => bounds.extend([listing.lon, listing.lat]))
        map.fitBounds(bounds, {
          padding: { top: 36, right: 36, bottom: 36, left: 36 },
          maxZoom: validPoints.length === 1 ? 13.5 : 12.8,
          duration: fittedRef.current ? 550 : 0,
        })
        fittedRef.current = true
        lastListingKeyRef.current = listingKey
        return
      }

      const fallback = center && Number.isFinite(center.lat) && Number.isFinite(center.lon)
        ? [center.lon, center.lat]
        : [FALLBACK_CENTER.lon, FALLBACK_CENTER.lat]

      if (!validPoints.length) {
        map.easeTo({
          center: fallback,
          zoom: center?.zoom || FALLBACK_CENTER.zoom,
          duration: fittedRef.current ? 550 : 0,
        })
      }
    }

    if (!map.isStyleLoaded()) {
      map.once('load', syncMapData)
      return undefined
    }

    syncMapData()
    return undefined
  }, [activeId, center, pointsById, validPoints])

  useEffect(() => {
    if (!mapRef.current?.map || !activeId) return
    const activeListing = pointsById.get(String(activeId))
    if (!activeListing) return

    const { map } = mapRef.current
    const bounds = map.getBounds()
    const coords = [activeListing.lon, activeListing.lat]
    const isVisible = bounds?.contains(coords)

    if (!isVisible) {
      map.easeTo({
        center: coords,
        duration: 500,
        zoom: Math.max(map.getZoom(), 11.5),
      })
    }
  }, [activeId, pointsById])

  const fallbackListings = useMemo(
    () => validPoints.slice(0, 5),
    [validPoints],
  )

  function fitToResults() {
    if (!mapRef.current?.map || !validPoints.length) return
    const { map, mapboxgl } = mapRef.current
    const bounds = buildBounds(mapboxgl, validPoints)
    map.fitBounds(bounds, {
      padding: { top: 64, right: 36, bottom: 36, left: 36 },
      maxZoom: validPoints.length === 1 ? 13.5 : 12.8,
      duration: 550,
    })
  }

  function focusSelected() {
    if (!mapRef.current?.map || !activeId) return
    const activeListing = pointsById.get(String(activeId))
    if (!activeListing) return

    mapRef.current.map.easeTo({
      center: [activeListing.lon, activeListing.lat],
      zoom: Math.max(mapRef.current.map.getZoom(), 12.5),
      duration: 500,
    })
  }

  function resetToGermany() {
    if (!mapRef.current?.map) return
    mapRef.current.map.easeTo({
      center: [FALLBACK_CENTER.lon, FALLBACK_CENTER.lat],
      zoom: FALLBACK_CENTER.zoom,
      duration: 650,
    })
  }

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

  if (mapError) {
    return (
      <div
        style={{
          height: 420,
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)',
          border: '1px solid rgba(25,26,32,0.08)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ borderRadius: 999, padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.92)', fontFamily: '"Lexend", sans-serif', fontSize: 12, fontWeight: 600 }}>
            Map unavailable
          </span>
          <span style={{ borderRadius: 999, padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.72)', fontFamily: '"Lexend", sans-serif', fontSize: 12 }}>
            {validPoints.length} pinned results
          </span>
        </div>

        <div style={{ fontFamily: '"Lexend", sans-serif', color: 'rgb(25,26,32)' }}>
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>
            {mapError}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(25,26,32,0.62)', marginTop: 8 }}>
            Search results are still available below, and you can continue through the active listing card or provider detail page.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {fallbackListings.map((listing) => (
            <button
              key={listing.id}
              type="button"
              onClick={() => onSelect?.(listing)}
              style={{
                border: '1px solid rgba(25,26,32,0.08)',
                borderRadius: 18,
                padding: '12px 14px',
                backgroundColor: String(listing.id) === String(activeId) ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.82)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 600, color: 'rgb(25,26,32)', lineHeight: 1.4 }}>
                {listing.title}
              </div>
              <div style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.62)', marginTop: 4, lineHeight: 1.5 }}>
                {listing.address || 'Location on request'}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 420,
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 2,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          pointerEvents: 'none',
        }}
      >
        {[
          { label: 'Results', onClick: fitToResults, disabled: !validPoints.length },
          { label: 'Selected', onClick: focusSelected, disabled: !activeId || !pointsById.get(String(activeId)) },
          { label: 'Germany', onClick: resetToGermany, disabled: false },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              pointerEvents: 'auto',
              border: '1px solid rgba(25,26,32,0.10)',
              borderRadius: 999,
              padding: '9px 12px',
              backgroundColor: action.disabled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.96)',
              color: action.disabled ? 'rgba(25,26,32,0.35)' : 'rgb(25,26,32)',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '0 10px 24px rgba(25,26,32,0.08)',
              cursor: action.disabled ? 'default' : 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,248,244,0.26) 0%, rgba(255,248,244,0) 16%, rgba(255,248,244,0) 84%, rgba(25,26,32,0.03) 100%)',
          zIndex: 1,
        }}
      />

      <div
        ref={mapElementRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
    </div>
  )
}
