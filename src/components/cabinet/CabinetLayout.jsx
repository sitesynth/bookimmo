import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import CabinetSidebar from './CabinetSidebar.jsx'
import { apiRequest } from '../../lib/api.js'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

export default function CabinetLayout({ title, subtitle, children, aside = null }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, isAuthenticated } = useAuthUser()
  const lang = readLang(location.pathname)

  async function handleSignOut() {
    await apiRequest('/api/auth/logout', { method: 'POST' })
    window.dispatchEvent(new Event('bookimmo-auth-changed'))
    navigate(`/${lang}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fffdf8 0%, #f2ede4 100%)',
      padding: '24px',
      overflow: 'visible',
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        <CabinetSidebar
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />

        <main style={{
          flex: '1 1 840px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minHeight: 'auto',
          overflow: 'visible',
        }}>
          <section style={{
            padding: '28px 30px',
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgb(25,26,32) 0%, rgb(48,50,61) 100%)',
            color: 'rgb(245,245,245)',
            boxShadow: '0 28px 80px rgba(25,26,32,0.22)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5 }}>
                  Bookimmo
                </p>
                <h1 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.12, marginTop: 8, fontWeight: 600 }}>
                  {title}
                </h1>
                {subtitle ? (
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.6, opacity: 0.76, maxWidth: 680, marginTop: 12 }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {isAuthenticated && !loading ? (
                <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 13, opacity: 0.6 }}>
                  {user?.email || 'Signed in'}
                </p>
              ) : null}
            </div>
          </section>

          <div style={{
            display: 'grid',
            gridTemplateColumns: aside ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start',
            overflow: 'visible',
          }}>
            <div style={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              overflow: 'visible',
            }}>
              {children}
            </div>

            {aside ? (
              <div style={{ minWidth: 0 }}>
                {aside}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
