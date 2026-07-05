import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import { useFavorites } from '../../hooks/useFavorites.js'
import { usePropertiesByIds } from '../../hooks/usePropertiesByIds.js'

const STOCK_IMGS = [
  '/assets/images/YB8HvCRaMzDFv3gr1oraLARMV10.jpg',
  '/assets/images/uJIxALexex0qutxW0BGT1e8RZU.jpg',
  '/assets/images/6tsHyqe0lsOpKgANd4B3r8lEwak.jpg',
  '/assets/images/gRIsS7b7H7QhFCmWRl88B6uVZMQ.jpg',
  '/assets/images/bmKq0zjCmV9aMdk4qbciIhZPU.jpg',
]

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function propertyImage(property, index) {
  return property.cover_image
    ? `/api/directus?path=/assets/${property.cover_image}&query=${encodeURIComponent('width=900&quality=80')}`
    : STOCK_IMGS[index % STOCK_IMGS.length]
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function EmptyCard({ lang, isAuthenticated }) {
  return (
    <section style={{
      padding: 28,
      borderRadius: 28,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
      boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
    }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Favorites
      </p>
      <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 30, color: 'rgb(25,26,32)', marginTop: 8 }}>
        {isAuthenticated ? 'No saved properties yet' : 'Guest favorites are still empty'}
      </h2>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 760 }}>
        Save interesting homes from search and they will appear here for comparison. Guests can test the flow locally, and signed-in users can keep favorites synced in Supabase.
      </p>
      <Link
        to={`/${lang}/search`}
        style={{
          display: 'inline-flex',
          marginTop: 18,
          textDecoration: 'none',
          borderRadius: 14,
          padding: '11px 14px',
          backgroundColor: 'rgb(25,26,32)',
          color: 'rgb(245,245,245)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Open search
      </Link>
    </section>
  )
}

export default function FavoritesShell() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const { isAuthenticated } = useAuthUser()
  const { favoriteIds, favoriteCount, toggleFavorite, loading: favoritesLoading } = useFavorites()
  const { properties, loading: propertiesLoading } = usePropertiesByIds(favoriteIds)

  if (!favoriteIds.length && !favoritesLoading) {
    return <EmptyCard lang={lang} isAuthenticated={isAuthenticated} />
  }

  return (
    <>
      <section style={{
        padding: 26,
        borderRadius: 28,
        backgroundColor: 'white',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
      }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Saved shortlist
        </p>
        <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 28, color: 'rgb(25,26,32)', marginTop: 8 }}>
          {favoriteCount} saved {favoriteCount === 1 ? 'property' : 'properties'}
        </h2>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 760 }}>
          Keep this shortlist tight: compare price, district and apartment type here, then move the strongest options into application drafts.
        </p>
      </section>

      {favoritesLoading || propertiesLoading ? (
        <section style={{
          padding: 24,
          borderRadius: 24,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
        }}>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.64)' }}>
            Loading saved properties…
          </p>
        </section>
      ) : (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {properties.map((property, index) => {
            const detailHref = `/${lang}/Property-Details/${property.slug || slugify(property.title)}`

            return (
              <article
                key={property.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  border: '1px solid rgba(25,26,32,0.08)',
                  boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
                }}
              >
                <div style={{ position: 'relative', paddingTop: '66%' }}>
                  <img
                    src={propertyImage(property, index)}
                    alt={property.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
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
                      {property.address || property.city_slug || 'Location on request'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.72)' }}>
                    <span>{property.bedrooms || property.rooms || 0} rooms</span>
                    <span>{property.area_m2 ? `${property.area_m2} m²` : 'Area on request'}</span>
                    <span>{property.property_category || 'Property'}</span>
                  </div>

                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 24, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 'auto' }}>
                    € {property.price ? Number(property.price).toLocaleString() : '—'}
                  </p>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link
                      to={detailHref}
                      style={{
                        textDecoration: 'none',
                        borderRadius: 14,
                        padding: '11px 14px',
                        border: '1px solid rgba(25,26,32,0.12)',
                        color: 'rgb(25,26,32)',
                        fontFamily: '"Lexend", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      View details
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(property.id)}
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
                      Remove
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
