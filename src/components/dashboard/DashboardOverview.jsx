import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import { useProfile } from '../../hooks/useProfile.js'
import { useFavorites } from '../../hooks/useFavorites.js'
import { useApplications } from '../../hooks/useApplications.js'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{
      padding: 22,
      borderRadius: 24,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
      boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
    }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 34, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 8 }}>
        {value}
      </p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginTop: 10 }}>
        {hint}
      </p>
    </div>
  )
}

function ActionCard({ title, body, to, cta }) {
  return (
    <div style={{
      padding: 22,
      borderRadius: 24,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
      boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
    }}>
      <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 20, color: 'rgb(25,26,32)' }}>
        {title}
      </h3>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)', marginTop: 10 }}>
        {body}
      </p>
      <Link
        to={to}
        style={{
          display: 'inline-flex',
          marginTop: 16,
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
        {cta}
      </Link>
    </div>
  )
}

export default function DashboardOverview() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const { user, isAuthenticated } = useAuthUser()
  const { completionPercent, loading: profileLoading } = useProfile()
  const { favoriteCount, loading: favoritesLoading } = useFavorites()
  const { applicationCount, draftCount, loading: applicationsLoading } = useApplications()
  const name = user?.email?.split('@')[0] || 'there'

  return (
    <>
      <section style={{
        padding: 26,
        borderRadius: 28,
        backgroundColor: 'white',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
      }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Overview
        </p>
        <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 28, color: 'rgb(25,26,32)', marginTop: 8 }}>
          {isAuthenticated ? `Welcome back, ${name}` : 'Start building your tenant profile'}
        </h2>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 760 }}>
          The cabinet now reads profile completion, favorites and application drafts from the working frontend state. This gives us a real base for the client flow instead of static placeholders.
        </p>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <StatCard
          label="Profile"
          value={profileLoading ? '…' : `${completionPercent}%`}
          hint="Completion score is calculated from the renter profile fields already stored in Supabase."
        />
        <StatCard
          label="Applications"
          value={applicationsLoading ? '…' : String(applicationCount)}
          hint={applicationsLoading ? 'Loading your request pipeline.' : `${draftCount} draft ${draftCount === 1 ? 'request' : 'requests'} waiting for the next step.`}
        />
        <StatCard
          label="Favorites"
          value={favoritesLoading ? '…' : String(favoriteCount)}
          hint="Saved properties from search now feed directly into the cabinet shortlist."
        />
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        <ActionCard
          title="Complete your profile"
          body="Strengthen the renter dossier with personal details, move-in timing and budget so each application draft is easier to convert."
          to={`/${lang}/account`}
          cta="Open profile"
        />
        <ActionCard
          title="Review application drafts"
          body="Each Apply action from search now lands in the cabinet. Use this page to return to listings and prepare the next submission flow."
          to={`/${lang}/applications`}
          cta="Open applications"
        />
        <ActionCard
          title="Curate favorites"
          body="Use the shortlist as a decision layer between discovery and application, then keep only the strongest matches."
          to={`/${lang}/Bookmark`}
          cta="Open favorites"
        />
      </section>
    </>
  )
}
