import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BookImmoLogo from '../BookImmoLogo.jsx'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

const ICONS = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  applications: <><path d="M6 3.5h8l4 4V20a.5.5 0 01-.5.5h-11A.5.5 0 016 20V3.5z" /><path d="M14 3.5V8h4M9 12.5h6M9 16h6" /></>,
  favorites: <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0112 7.6 4.2 4.2 0 0119.5 10c0 5.4-7.5 10-7.5 10z" />,
  profile: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.6-3.7 3.7-5.8 7.5-5.8s6.9 2.1 7.5 5.8" /></>,
}

const COPY = {
  en: { tag: 'Client cabinet', dashboard: 'Dashboard', search: 'Search', applications: 'Applications', favorites: 'Favorites', profile: 'Profile',
    signedAs: 'Signed in as', signOut: 'Sign out', hint: 'Sign in to save favorites, complete your profile and track applications.', logIn: 'Log in', signUp: 'Sign up' },
  de: { tag: 'Kundenbereich', dashboard: 'Übersicht', search: 'Suche', applications: 'Bewerbungen', favorites: 'Favoriten', profile: 'Profil',
    signedAs: 'Angemeldet als', signOut: 'Abmelden', hint: 'Melden Sie sich an, um Favoriten zu speichern, Ihr Profil zu vervollständigen und Bewerbungen zu verfolgen.', logIn: 'Anmelden', signUp: 'Registrieren' },
}

const WRAP = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  minWidth: 240,
  maxWidth: 240,
  padding: 20,
  borderRadius: 24,
  background: 'linear-gradient(180deg, #ffffff 0%, #f5f1ea 100%)',
  border: '1px solid rgba(25,26,32,0.08)',
  boxShadow: '0 24px 60px rgba(25,26,32,0.08)',
}

const BRAND = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 0,
  paddingTop: 4,
  paddingBottom: 18,
  borderBottom: '1px solid rgba(25,26,32,0.08)',
}

const NAV = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const FOOT = {
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  paddingTop: 12,
  borderTop: '1px solid rgba(25,26,32,0.08)',
}

export default function CabinetSidebar({ isAuthenticated, userEmail, onSignOut }) {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const t = COPY[lang] || COPY.en
  const navItems = [
    { to: `/${lang}/dashboard-home`, label: t.dashboard, icon: 'dashboard' },
    { to: `/${lang}/search`, label: t.search, icon: 'search' },
    { to: `/${lang}/applications`, label: t.applications, icon: 'applications' },
    { to: `/${lang}/Bookmark`, label: t.favorites, icon: 'favorites' },
    { to: `/${lang}/account`, label: t.profile, icon: 'profile' },
  ]

  return (
    <aside className="cab-side" style={WRAP}>
      <style>{`
        @media (max-width: 900px) {
          .cab-side { min-width: 0 !important; max-width: none !important; width: 100%; box-sizing: border-box; padding: 12px 14px !important; gap: 10px !important; border-radius: 16px !important; }
          .cab-side .cab-brand { padding-bottom: 10px !important; }
          .cab-side .cab-nav { flex-direction: row !important; overflow-x: auto; gap: 4px !important; scrollbar-width: none; }
          .cab-side .cab-nav a { flex: 0 0 auto; padding: 10px 12px !important; }
          .cab-side .cab-foot { flex-direction: row !important; align-items: center; padding-top: 10px !important; }
          .cab-side .cab-foot-hint { display: none; }
          .cab-side .cab-foot > div { flex: 1; }
        }
      `}</style>
      <div className="cab-brand" style={BRAND}>
        <Link to={`/${lang}`} aria-label="BookImmo" style={{ display: 'inline-block', lineHeight: 0 }}>
          <BookImmoLogo height={28} />
        </Link>
      </div>

      <nav className="cab-nav" style={NAV}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              background: isActive ? 'rgb(25,26,32)' : 'transparent',
              color: isActive ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
              transition: 'background-color 0.2s ease, color 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: isActive ? 'rgb(255,102,37)' : 'rgba(25,26,32,0.55)' }}>
                  {ICONS[item.icon]}
                </svg>
                <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 500 }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="cab-foot" style={FOOT}>
        {isAuthenticated ? (
          <>
            <div>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)' }}>
                {t.signedAs}
              </p>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, color: 'rgb(25,26,32)' }}>
                {userEmail || 'User'}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                border: '1px solid rgba(25,26,32,0.12)',
                borderRadius: 4,
                padding: '10px 12px',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.signOut}
            </button>
          </>
        ) : (
          <>
            <p className="cab-foot-hint" style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.68)' }}>
              {t.hint}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <NavLink
                to={`/${lang}/log-in`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  borderRadius: 4,
                  padding: '10px 12px',
                  backgroundColor: 'rgb(25,26,32)',
                  color: 'rgb(245,245,245)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {t.logIn}
              </NavLink>
              <NavLink
                to={`/${lang}/sign-up`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  borderRadius: 4,
                  padding: '10px 12px',
                  border: '1px solid rgba(25,26,32,0.12)',
                  backgroundColor: 'white',
                  color: 'rgb(25,26,32)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {t.signUp}
              </NavLink>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
