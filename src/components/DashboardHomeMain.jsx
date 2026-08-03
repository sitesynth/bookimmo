import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import CabinetLayout from './cabinet/CabinetLayout.jsx'
import LiveListingFeed from './listings/LiveListingFeed.jsx'
import { useAuthUser } from '../hooks/useAuthUser.js'
import { useProfile } from '../hooks/useProfile.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useApplications } from '../hooks/useApplications.js'
import { useSavedSearches } from '../hooks/useSavedSearches.js'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'en'
}

function StatCard({ label, value, accent = 'rgb(248,246,241)', hint }) {
  return (
    <div style={{
      padding: 22,
      borderRadius: 24,
      backgroundColor: accent,
      border: '1px solid rgba(25,26,32,0.08)',
    }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)' }}>
        {label}
      </p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 34, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 8 }}>
        {value}
      </p>
      {hint ? (
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.55, color: 'rgba(25,26,32,0.62)', marginTop: 10 }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function ActionCard({ title, body, to, cta }) {
  return (
    <article style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 24,
      borderRadius: 24,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
      boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
    }}>
      <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 22, color: 'rgb(25,26,32)' }}>
        {title}
      </h3>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.65, color: 'rgba(25,26,32,0.66)', marginTop: 12 }}>
        {body}
      </p>
      <Link
        to={to}
        style={{
          display: 'inline-flex',
          marginTop: 'auto',
          alignSelf: 'flex-start',
          padding: '12px 16px',
          borderRadius: 16,
          textDecoration: 'none',
          backgroundColor: 'rgb(25,26,32)',
          color: 'rgb(245,245,245)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {cta}
      </Link>
    </article>
  )
}

export default function DashboardHomeMain() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const { user, isAuthenticated } = useAuthUser()
  const { completionPercent, profile } = useProfile()
  const { favoriteCount } = useFavorites()
  const { applicationCount, draftCount } = useApplications()
  const { savedSearches = [] } = useSavedSearches()
  const firstName = profile?.firstName?.trim() || user?.email?.split('@')[0] || 'there'

  return (
    <CabinetLayout
      title={isAuthenticated ? `Welcome back, ${firstName}` : 'Your Bookimmo workspace'}
      subtitle="Dashboard-home now shows live listing inventory and real cabinet state instead of demo property cards with dead routes."
    >
      <section style={{
        padding: 28,
        borderRadius: 28,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.96) 100%)',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 24px 60px rgba(25,26,32,0.08)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>
        <div>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.5)' }}>
            Dashboard Home
          </p>
          <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 48, lineHeight: 1.02, color: 'rgb(25,26,32)', marginTop: 10 }}>
            Real listings now drive this workspace.
          </h2>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 16, lineHeight: 1.65, color: 'rgba(25,26,32,0.66)', marginTop: 14, maxWidth: 760 }}>
            We removed the placeholder showcase cards. New objects in this area come from the live provider layer, and every card below links into the working Bookimmo property detail route.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
            <Link
              to={`/${lang}/search`}
              style={{
                display: 'inline-flex',
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
              Open live search
            </Link>
            <Link
              to={`/${lang}/account`}
              style={{
                display: 'inline-flex',
                padding: '14px 18px',
                borderRadius: 16,
                textDecoration: 'none',
                border: '1px solid rgba(25,26,32,0.12)',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Improve profile match
            </Link>
          </div>
        </div>

        <div style={{
          padding: 22,
          borderRadius: 24,
          backgroundColor: 'rgb(25,26,32)',
          color: 'rgb(245,245,245)',
        }}>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>
            Profile Readiness
          </p>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 56, fontWeight: 700, marginTop: 10 }}>
            {completionPercent}%
          </p>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, opacity: 0.82, marginTop: 10 }}>
            Matching improves as soon as your city, preferred districts, budget and dossier fields are filled in.
          </p>
        </div>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <StatCard label="Saved searches" value={String(savedSearches.length)} hint="These are now user-specific and survive across sessions." />
        <StatCard label="Favorites" value={String(favoriteCount)} hint="Shortlisted properties from live search." />
        <StatCard label="Applications" value={String(applicationCount)} hint={`${draftCount} draft flow${draftCount === 1 ? '' : 's'} in progress.`} />
        <StatCard label="Current focus" value={profile?.currentCity?.trim() || 'Germany'} accent="rgb(244,239,231)" hint="Used as a signal for location seeding when available." />
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        <ActionCard
          title="Refine search coverage"
          body="Open the map workspace to expand to new geocodes, save sharper presets and move strong matches into favorites or application drafts."
          to={`/${lang}/search`}
          cta="Go to search"
        />
        <ActionCard
          title="Finish your dossier"
          body="Profile completion now matters directly because the dashboard feed can use your city and district preferences as its starting context."
          to={`/${lang}/account`}
          cta="Open profile"
        />
        <ActionCard
          title="Continue applications"
          body="Every apply action should land in the cabinet flow, so this page stays the bridge between discovery and submission."
          to={`/${lang}/applications`}
          cta="Open applications"
        />
      </section>

      <section style={{
        padding: 28,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 24px 60px rgba(25,26,32,0.06)',
      }}>
        <LiveListingFeed
          eyebrow="Latest Matching Listings"
          title="Live cards for dashboard-home."
          description="This feed replaces the old mocked showcase with the newest imported listings from the database cache. If your profile already contains Hamburg or Berlin hints, we use them as a soft filter on top of the cache."
          limit={3}
          compact
          useProfileSeed
          ctaLabel="Open full search workspace"
          sourceMode="database-cache"
        />
      </section>
    </CabinetLayout>
  )
}
