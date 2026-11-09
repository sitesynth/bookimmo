import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFavorites } from '../../hooks/useFavorites.js'
import { usePropertiesByIds } from '../../hooks/usePropertiesByIds.js'
import { buildListingDetailHref } from '../../lib/listingRouting.js'

const COPY = {
  en: {
    count: (n) => `${n} saved ${n === 1 ? 'home' : 'homes'}`,
    emptyTitle: 'No favorites yet', emptyText: 'Tap the star on a home in search and it will wait for you here.',
    openSearch: 'Open search', loading: 'Loading favorites…',
    location: 'Location on request', rooms: (n) => `${n} rooms`, roomsOnRequest: 'Rooms on request',
    areaOnRequest: 'Area on request', property: 'Home', priceOnRequest: 'Price on request',
    details: 'Details', remove: 'Remove',
  },
  de: {
    count: (n) => `${n} ${n === 1 ? 'gespeicherte Wohnung' : 'gespeicherte Wohnungen'}`,
    emptyTitle: 'Noch keine Favoriten', emptyText: 'Tippen Sie in der Suche auf den Stern bei einer Wohnung, dann wartet sie hier auf Sie.',
    openSearch: 'Zur Suche', loading: 'Favoriten werden geladen…',
    location: 'Lage auf Anfrage', rooms: (n) => `${n} Zimmer`, roomsOnRequest: 'Zimmer auf Anfrage',
    areaOnRequest: 'Fläche auf Anfrage', property: 'Wohnung', priceOnRequest: 'Preis auf Anfrage',
    details: 'Details', remove: 'Entfernen',
  },
}

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function EmptyCard({ lang, t }) {
  return (
    <section style={{
      padding: 32,
      borderRadius: 16,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
    }}>
      <h2 style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 24, fontWeight: 600, color: 'rgb(25,26,32)' }}>
        {t.emptyTitle}
      </h2>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 10, maxWidth: 520 }}>
        {t.emptyText}
      </p>
      <Link
        to={`/${lang}/search`}
        className="btn-shine"
        style={{
          display: 'inline-flex',
          marginTop: 18,
          textDecoration: 'none',
          borderRadius: 4,
          padding: '12px 20px',
          backgroundColor: 'rgb(255,102,37)',
          color: '#fff',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {t.openSearch}
      </Link>
    </section>
  )
}

export default function FavoritesShell() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const t = COPY[lang] || COPY.en
  const { favoriteIds, favoriteCount, toggleFavorite, loading: favoritesLoading } = useFavorites()
  const { properties, loading: propertiesLoading } = usePropertiesByIds(favoriteIds)

  if (!favoriteIds.length && !favoritesLoading) {
    return <EmptyCard lang={lang} t={t} />
  }

  return (
    <>
      <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 15, color: 'rgba(25,26,32,0.64)' }}>
        {t.count(favoriteCount)}
      </p>

      {favoritesLoading || propertiesLoading ? (
        <section style={{
          padding: 24,
          borderRadius: 16,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
        }}>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.64)' }}>
            {t.loading}
          </p>
        </section>
      ) : (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {properties.map((property) => {
            const detailHref = buildListingDetailHref(lang, property)

            return (
              <article
                key={property.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  border: '1px solid rgba(25,26,32,0.08)',
                }}
              >
                <div style={{ position: 'relative', paddingTop: '66%' }}>
                  {property.imageUrl ? (
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)' }} />
                  )}
                </div>

                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div>
                    <Link
                      to={detailHref}
                      style={{ textDecoration: 'none', color: 'rgb(25,26,32)', fontFamily: '"Lexend", sans-serif', fontSize: 21, fontWeight: 600, lineHeight: 1.2 }}
                    >
                      {property.title}
                    </Link>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.54)', marginTop: 8 }}>
                      {property.address || property.district || property.postcode || t.location}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.72)' }}>
                    <span>{property.roomsLabel || (property.rooms ? t.rooms(property.rooms) : t.roomsOnRequest)}</span>
                    <span>{property.areaLabel || (property.areaSqm ? `${property.areaSqm} m²` : t.areaOnRequest)}</span>
                    <span>{property.listingType || t.property}</span>
                  </div>

                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 24, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 'auto' }}>
                    {property.priceLabel || (property.price ? `€ ${Number(property.price).toLocaleString()}` : t.priceOnRequest)}
                  </p>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link
                      to={detailHref}
                      className="btn-shine on-light"
                      style={{
                        textDecoration: 'none',
                        borderRadius: 4,
                        padding: '11px 14px',
                        border: '1px solid rgba(25,26,32,0.12)',
                        color: 'rgb(25,26,32)',
                        fontFamily: '"Lexend", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {t.details}
                    </Link>
                    <button
                      type="button"
                      className="btn-shine on-light"
                      onClick={() => toggleFavorite(property.id)}
                      style={{
                        border: '1px solid rgba(25,26,32,0.12)',
                        borderRadius: 4,
                        padding: '11px 14px',
                        backgroundColor: 'white',
                        color: 'rgb(25,26,32)',
                        fontFamily: '"Lexend", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </>
  )
}
