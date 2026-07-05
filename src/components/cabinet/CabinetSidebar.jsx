import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
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
  alignItems: 'center',
  gap: 12,
}

const MARK = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: 'linear-gradient(135deg, rgb(255,184,0) 0%, rgb(255,102,37) 100%)',
  color: 'white',
  fontFamily: '"Lexend", sans-serif',
  fontSize: 13,
  fontWeight: 700,
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 10px 24px rgba(255,102,37,0.24)',
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
  const navItems = [
    { to: `/${lang}/dashboard-home`, label: 'Dashboard', shortLabel: 'DB' },
    { to: `/${lang}/search`, label: 'Search', shortLabel: 'SE' },
    { to: `/${lang}/applications`, label: 'Applications', shortLabel: 'AP' },
    { to: `/${lang}/Bookmark`, label: 'Favorites', shortLabel: 'FV' },
    { to: `/${lang}/account`, label: 'Profile', shortLabel: 'PR' },
  ]

  return (
    <aside style={WRAP}>
      <div style={BRAND}>
        <div style={MARK}>BI</div>
        <div>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 18, fontWeight: 700, color: 'rgb(25,26,32)' }}>
            Bookimmo
          </p>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.58)' }}>
            Client cabinet
          </p>
        </div>
      </div>

      <nav style={NAV}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 16,
              textDecoration: 'none',
              background: isActive ? 'rgb(25,26,32)' : 'transparent',
              color: isActive ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
              transition: 'background-color 0.2s ease, color 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(25,26,32,0.06)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {item.shortLabel}
                </div>
                <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 500 }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={FOOT}>
        {isAuthenticated ? (
          <>
            <div>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)' }}>
                Signed in as
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
                borderRadius: 14,
                padding: '10px 12px',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.68)' }}>
              Sign in to save favorites, complete your profile and track applications.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <NavLink
                to={`/${lang}/log-in`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: '10px 12px',
                  backgroundColor: 'rgb(25,26,32)',
                  color: 'rgb(245,245,245)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Log in
              </NavLink>
              <NavLink
                to={`/${lang}/sign-up`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: '10px 12px',
                  border: '1px solid rgba(25,26,32,0.12)',
                  backgroundColor: 'white',
                  color: 'rgb(25,26,32)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Sign up
              </NavLink>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
