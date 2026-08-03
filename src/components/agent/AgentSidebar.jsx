import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

export default function AgentSidebar({ isAuthenticated, userEmail, onSignOut }) {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const navItems = [
    { to: `/${lang}/agent-workspace`, label: 'Agent desk', shortLabel: 'AD' },
    { to: `/${lang}/agent-workspace?view=inbox`, label: 'Inbox', shortLabel: 'IN' },
    { to: `/${lang}/agent-workspace?view=accounts`, label: 'Accounts', shortLabel: 'AC' },
  ]

  return (
    <aside style={{
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
    }}>
      <div>
        <img src="/email-logo.png" alt="Bookimmo" style={{ display: 'block', width: 170, maxWidth: '100%', height: 'auto' }} />
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.58)' }}>
          Agent workspace
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      <div style={{
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingTop: 12,
        borderTop: '1px solid rgba(25,26,32,0.08)',
      }}>
        {isAuthenticated ? (
          <>
            <div>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)' }}>
                Signed in as
              </p>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, color: 'rgb(25,26,32)' }}>
                {userEmail || 'Agent'}
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
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.68)' }}>
            Agent access requires an assigned Bookimmo account.
          </p>
        )}
      </div>
    </aside>
  )
}
