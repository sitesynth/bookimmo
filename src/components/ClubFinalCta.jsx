import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const FONT = '"Lexend", sans-serif'
const INK = 'rgb(25,26,32)'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'en'
}

// Closing call to action: replaces the old e-mail newsletter band.
export default function ClubFinalCta() {
  const { pathname } = useLocation()
  const lang = readLang(pathname)

  return (
    <section style={{ width: '100%', alignSelf: 'stretch', boxSizing: 'border-box', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 4vw, 40px)' }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          borderRadius: 28,
          padding: 'clamp(32px, 6vw, 72px) clamp(24px, 5vw, 64px)',
          textAlign: 'center',
          color: '#fff',
          background: 'linear-gradient(135deg, rgb(255,122,58) 0%, rgb(255,102,37) 45%, rgb(232,84,22) 100%)',
          boxShadow: '0 28px 60px rgba(255,102,37,0.24)',
        }}
      >
        <h3 style={{ margin: 0, fontFamily: FONT, fontSize: 'clamp(30px, 4.6vw, 52px)', fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.025em', textWrap: 'balance' }}>
          Moving soon? Let the club do the hunting.
        </h3>
        <p style={{ margin: '16px auto 0', maxWidth: 480, fontFamily: FONT, fontSize: 'clamp(16px, 1.8vw, 18px)', lineHeight: 1.5, color: 'rgba(255,255,255,0.86)', textWrap: 'balance' }}>
          Join in a minute. First month free, no card needed.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
          <Link
            to={`/${lang}/sign-up`}
            className="btn-shine on-light"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 54, padding: '0 30px', borderRadius: 4, backgroundColor: '#fff', color: INK, fontFamily: FONT, fontSize: 16, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 24px rgba(25,26,32,0.18)' }}
          >
            Join the club
          </Link>
          <Link
            to={`/${lang}/search`}
            className="btn-shine"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 54, padding: '0 28px', borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.7)', color: '#fff', fontFamily: FONT, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}
          >
            Browse live listings
          </Link>
        </div>
      </div>
    </section>
  )
}
