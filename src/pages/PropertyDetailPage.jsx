import React, { useLayoutEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import { useListingDetail } from '../hooks/useListingDetail.js'
import { useApplications } from '../hooks/useApplications.js'
import { buildListingDetailHref, parseListingDetailSlug } from '../lib/listingRouting.js'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function Card({ children, style }) {
  return (
    <section
      style={{
        padding: 24,
        borderRadius: 28,
        backgroundColor: 'white',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function StatChip({ label, value }) {
  return (
    <div style={{ padding: 16, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)' }}>{label}</p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 18, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 6 }}>{value || '—'}</p>
    </div>
  )
}

export default function PropertyDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const lang = readLang(location.pathname)
  const parsed = useMemo(() => parseListingDetailSlug(slug), [slug])
  const { property, loading, error } = useListingDetail(parsed)
  const { createDraftApplication } = useApplications()

  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverflowY: html.style.overflowY,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverflowY: body.style.overflowY,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      rootOverflow: root?.style.overflow || '',
      rootOverflowY: root?.style.overflowY || '',
      rootHeight: root?.style.height || '',
      rootMinHeight: root?.style.minHeight || '',
    }

    html.style.overflow = 'visible'
    html.style.overflowY = 'auto'
    html.style.height = 'auto'

    body.style.overflow = 'visible'
    body.style.overflowY = 'auto'
    body.style.height = 'auto'
    body.style.minHeight = '100vh'

    if (root) {
      root.style.overflow = 'visible'
      root.style.overflowY = 'visible'
      root.style.height = 'auto'
      root.style.minHeight = '100vh'
    }

    return () => {
      html.style.overflow = previous.htmlOverflow
      html.style.overflowY = previous.htmlOverflowY
      html.style.height = previous.htmlHeight

      body.style.overflow = previous.bodyOverflow
      body.style.overflowY = previous.bodyOverflowY
      body.style.height = previous.bodyHeight
      body.style.minHeight = previous.bodyMinHeight

      if (root) {
        root.style.overflow = previous.rootOverflow
        root.style.overflowY = previous.rootOverflowY
        root.style.height = previous.rootHeight
        root.style.minHeight = previous.rootMinHeight
      }
    }
  }, [])

  async function handleApply() {
    if (!property) return
    const result = await createDraftApplication({
      property: {
        id: property.id,
        title: property.title,
        source: property.source,
        slug: property.slug,
        address: property.address,
        url: property.sourceUrl,
      },
    })

    if (result?.ok) {
      window.location.href = `/${lang}/applications?application=${encodeURIComponent(result.id || '')}`
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', color: 'rgba(25,26,32,0.6)' }}>Loading listing…</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 56, fontWeight: 700, color: 'rgba(25,26,32,0.14)' }}>404</p>
        <p style={{ fontFamily: '"Lexend", sans-serif', color: 'rgba(25,26,32,0.64)' }}>Listing not found.</p>
        <Link
          to={`/${lang}/search`}
          style={{ textDecoration: 'none', borderRadius: 14, padding: '12px 16px', backgroundColor: 'rgb(25,26,32)', color: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600 }}
        >
          Back to search
        </Link>
      </div>
    )
  }

  const gallery = property.gallery?.length ? property.gallery : [{ previewUrl: '', fullUrl: '', caption: property.title }]
  const hero = gallery[0]
  const topAttributes = property.topAttributes || []
  const agent = property.agent

  return (
    <div style={{ minHeight: '100vh', width: 'auto', overflow: 'visible' }}>
      <style>
        {`
          html,
          body,
          #root {
            min-height: 100vh;
            height: auto;
            overflow: visible !important;
            overflow-y: auto !important;
          }
        `}
      </style>
      <SvgSprites />
      <CabinetLayout
        title={property.title}
        subtitle={`Unified listing detail view for ${property.source || 'bookimmo'} sources. This route is provider-aware, so we can plug in the other monitored feeds without replacing the page.`}
      >
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative', paddingTop: '66%', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%)' }}>
                {hero.previewUrl || hero.fullUrl ? (
                  <img
                    src={hero.fullUrl || hero.previewUrl}
                    alt={hero.caption || property.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                {gallery.slice(1, 4).map((item, index) => (
                  <div key={`${item.fullUrl}-${index}`} style={{ position: 'relative', paddingTop: '78%', borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgb(248,246,241)' }}>
                    {item.previewUrl || item.fullUrl ? (
                      <img
                        src={item.previewUrl || item.fullUrl}
                        alt={item.caption || `Gallery ${index + 2}`}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ borderRadius: 999, padding: '8px 12px', backgroundColor: 'rgb(248,246,241)', fontFamily: '"Lexend", sans-serif', fontSize: 12 }}>
                  Source: {property.source}
                </span>
                {property.publicationState ? (
                  <span style={{ borderRadius: 999, padding: '8px 12px', backgroundColor: 'rgba(39,174,96,0.10)', fontFamily: '"Lexend", sans-serif', fontSize: 12 }}>
                    {property.publicationState}
                  </span>
                ) : null}
              </div>

              <div>
                <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 32, lineHeight: 1.1, color: 'rgb(25,26,32)' }}>{property.title}</h2>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6, color: 'rgba(25,26,32,0.62)', marginTop: 10 }}>
                  {property.address || 'Address hidden by provider'}
                </p>
                {property.objectInfo ? (
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.46)', marginTop: 10 }}>{property.objectInfo}</p>
                ) : null}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {topAttributes.map((item) => (
                  <StatChip key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleApply}
                  style={{ border: 'none', borderRadius: 14, padding: '12px 16px', backgroundColor: 'rgb(25,26,32)', color: 'white', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Start application
                </button>
                <Link
                  to={`/${lang}/search`}
                  style={{ textDecoration: 'none', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(25,26,32,0.12)', color: 'rgb(25,26,32)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600 }}
                >
                  Back to search
                </Link>
                {property.sourceUrl ? (
                  <a
                    href={property.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', borderRadius: 14, padding: '12px 16px', backgroundColor: 'rgb(248,246,241)', color: 'rgb(25,26,32)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600 }}
                  >
                    Open original source
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</p>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {property.textSections?.map((section) => (
                <div key={section.title || section.text.slice(0, 20)}>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 18, color: 'rgb(25,26,32)' }}>{section.title}</h3>
                  <p style={{ whiteSpace: 'pre-line', fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.75, color: 'rgba(25,26,32,0.74)', marginTop: 10 }}>
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Details</p>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {property.attributeGroups?.map((group) => (
                <div key={group.title}>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 18, color: 'rgb(25,26,32)' }}>{group.title}</h3>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    {group.items.map((item, index) => (
                      <div key={`${group.title}-${item.label}-${index}`} style={{ padding: 14, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)' }}>{item.label}</p>
                        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgb(25,26,32)', marginTop: 6 }}>{item.text || 'Available'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {property.priceInfo ? (
            <Card>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price context</p>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {property.priceInfo.items.map((item) => (
                  <StatChip key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location & contact</p>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)' }}>Address</p>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6, color: 'rgb(25,26,32)', marginTop: 6 }}>
                  {property.address || 'Address hidden by provider'}
                </p>
                {property.lat && property.lon ? (
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.46)', marginTop: 8 }}>
                    {property.lat}, {property.lon}
                  </p>
                ) : null}
              </div>

              {agent ? (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                  {agent.portraitUrl || agent.logoUrl ? (
                    <img src={agent.portraitUrl || agent.logoUrl} alt={agent.name || agent.company} style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', flexShrink: 0 }} />
                  ) : null}
                  <div>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 16, fontWeight: 600, color: 'rgb(25,26,32)' }}>{agent.name || agent.company}</p>
                    {agent.company && agent.company !== agent.name ? (
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.56)', marginTop: 4 }}>{agent.company}</p>
                    ) : null}
                    {agent.address ? (
                      <p style={{ whiteSpace: 'pre-line', fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)', marginTop: 8 }}>{agent.address}</p>
                    ) : null}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                      {agent.websiteUrl ? <a href={agent.websiteUrl} target="_blank" rel="noreferrer" style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgb(25,26,32)' }}>Website</a> : null}
                      {agent.profileUrl ? <a href={agent.profileUrl} target="_blank" rel="noreferrer" style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgb(25,26,32)' }}>Provider profile</a> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {property.contact ? (
                <div style={{ padding: 16, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)' }}>Contact availability</p>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgb(25,26,32)', marginTop: 6 }}>
                    Mail: {property.contact.mailAvailable ? 'available' : 'not available'} · Call: {property.contact.callAvailable ? 'available' : 'not available'}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {property.source === 'is24' ? (
          <Card>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Routing model</p>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.7, color: 'rgba(25,26,32,0.72)', marginTop: 12 }}>
              This page now opens external listings through provider-aware slugs like <code>{buildListingDetailHref(lang, property).replace(`/${lang}/Property-Details/`, '')}</code>. The same shell can later render the other monitored sources with their own adapters instead of cloning the page per provider.
            </p>
          </Card>
        ) : null}
      </CabinetLayout>
    </div>
  )
}
