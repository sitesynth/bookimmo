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
          <header style={{ padding: '8px 4px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 'clamp(26px, 3vw, 34px)', lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.02em', color: 'rgb(25,26,32)' }}>
                  {title}
                </h1>
                {subtitle ? (
                  <p style={{ margin: '10px 0 0', fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.6, color: 'rgba(25,26,32,0.62)', maxWidth: 680 }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {isAuthenticated && !loading ? (
                <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.5)' }}>
                  {user?.email || 'Signed in'}
                </p>
              ) : null}
            </div>
          </header>

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
