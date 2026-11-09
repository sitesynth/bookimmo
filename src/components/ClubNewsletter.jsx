import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import FramerForm from './FramerForm.jsx'

const FONT = '"Lexend", sans-serif'
const INK = 'rgb(25,26,32)'
const ORANGE = 'rgb(255,102,37)'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'en'
}

export default function ClubNewsletter() {
  const { pathname } = useLocation()
  const lang = readLang(pathname)

  return (
    <section id="newsletter" style={{ width: '100%', alignSelf: 'stretch', boxSizing: 'border-box', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 4vw, 40px)' }}>
      <div
        className="club-news"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          borderRadius: 24,
          backgroundColor: 'rgb(255,248,244)',
          padding: 'clamp(28px, 5vw, 56px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(24px, 4vw, 56px)',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ margin: 0, fontFamily: FONT, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: ORANGE }}>
            Club news
          </p>
          <h3 style={{ margin: '12px 0 0', fontFamily: FONT, fontSize: 'clamp(26px, 3.2vw, 36px)', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', color: INK }}>
            Be first to hear what is next.
          </h3>
          <p style={{ margin: '12px 0 0', fontFamily: FONT, fontSize: 16, lineHeight: 1.55, color: 'rgba(25,26,32,0.64)' }}>
            New agencies, new places and club updates. One short email, no spam.
          </p>
        </div>

        <div>
          <FramerForm
            tableName="newsletter_leads"
            className="club-news-form"
            style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}
          >
            <input
              type="email"
              required
              name="Email"
              placeholder="Your email address"
              style={{
                flex: '1 1 0',
                minWidth: 0,
                height: 56,
                padding: '0 18px',
                borderRadius: 14,
                border: '1px solid rgba(25,26,32,0.12)',
                backgroundColor: '#fff',
                fontFamily: FONT,
                fontSize: 16,
                color: INK,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                height: 56,
                padding: '0 28px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: ORANGE,
                color: '#fff',
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 600,
                flexShrink: 0,
                boxShadow: '0 10px 24px rgba(255,102,37,0.26)',
              }}
            >
              Subscribe
            </button>
          </FramerForm>
          <p style={{ margin: '12px 0 0', fontFamily: FONT, fontSize: 13, lineHeight: 1.5, color: 'rgba(25,26,32,0.5)' }}>
            By subscribing you agree to our{' '}
            <Link to={`/${lang}/privacy-policy`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>privacy policy</Link>.
          </p>
        </div>
      </div>
      <style>{`
        @media (max-width: 809px) {
          .club-news { grid-template-columns: minmax(0, 1fr) !important; }
          .club-news-form { flex-direction: column; }
          .club-news-form input, .club-news-form button { width: 100%; flex: none !important; height: 56px !important; box-sizing: border-box; }
        }
      `}</style>
    </section>
  )
}
