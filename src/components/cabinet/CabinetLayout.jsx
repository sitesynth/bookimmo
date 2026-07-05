import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuthUser } from '../../hooks/useAuthUser.js'
import CabinetSidebar from './CabinetSidebar.jsx'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

export default function CabinetLayout({ title, subtitle, children, aside = null }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, isAuthenticated } = useAuthUser()
  const lang = readLang(location.pathname)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate(`/${lang}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fffdf8 0%, #f2ede4 100%)',
      padding: '24px',
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
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.72 }}>
                  Bookimmo workspace
                </p>
                <h1 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 32, lineHeight: 1.05, marginTop: 10 }}>
                  {title}
                </h1>
                {subtitle ? (
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.6, opacity: 0.76, maxWidth: 680, marginTop: 12 }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div style={{
                minWidth: 220,
                padding: '16px 18px',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, opacity: 0.68 }}>
                  Session
                </p>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                  {loading ? 'Checking account…' : isAuthenticated ? (user?.email || 'Signed in') : 'Guest mode'}
                </p>
              </div>
            </div>
          </section>

          <div style={{
            display: 'grid',
            gridTemplateColumns: aside ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}>
            <div style={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
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
