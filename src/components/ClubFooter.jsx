import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import LanguageToggle from './LanguageToggle.jsx'
import BookImmoLogo from './BookImmoLogo.jsx'

const FONT = '"Lexend", sans-serif'
const INK = 'rgb(25,26,32)'
const ORANGE = 'rgb(255,102,37)'

const link = { fontFamily: FONT, fontSize: 14, color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }
const label = { margin: '0 0 6px', fontFamily: FONT, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'en'
}

export default function ClubFooter() {
  const { pathname } = useLocation()
  const lang = readLang(pathname)
  const isGerman = lang === 'de'
  const home = `/${lang}`

  return (
    <footer style={{ width: '100%', alignSelf: 'stretch', boxSizing: 'border-box', backgroundColor: INK, color: '#fff', padding: 'clamp(48px, 6vw, 72px) clamp(20px, 4vw, 40px) 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="club-foot-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 'clamp(24px, 4vw, 48px)' }}>
          <div>
            <Link to={home} aria-label="BookImmo" style={{ display: 'inline-block', lineHeight: 0 }}>
              <BookImmoLogo height={30} wordColor="#FFFFFF" />
            </Link>
            <p style={{ margin: '14px 0 0', maxWidth: 280, fontFamily: FONT, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
              The housing club for expats. We find it, we apply, you move in.
            </p>
            <p style={{ margin: '18px 0 0', fontFamily: FONT, fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)' }}>
              Digihub OÜ<br />Tartu mnt 65, 10115 Tallinn, Estonia<br />
              <a href="mailto:hello@book.immo" style={{ color: '#fff', textDecoration: 'none' }}>hello@book.immo</a>
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={label}>Club</p>
            <a href={`${home}#how-it-works`} style={link}>How it works</a>
            <a href={`${home}#membership`} style={link}>Membership</a>
            <Link to={`/${lang}/search`} style={link}>Live search</Link>
            <Link to={`/${lang}/for-agencies`} style={link}>For agencies</Link>
          </nav>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={label}>Account</p>
            <Link to={`/${lang}/sign-up`} style={link}>Join the club</Link>
            <Link to={`/${lang}/log-in`} style={link}>Log in</Link>
            <Link to={`/${lang}/agent-sign-up`} style={link}>Become a partner</Link>
            <Link to={`/${lang}/agent-log-in`} style={link}>Agency log in</Link>
          </nav>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={label}>Legal</p>
            <Link to={`/${lang}/imprint`} style={link}>{isGerman ? 'Impressum' : 'Imprint'}</Link>
            <Link to={`/${lang}/privacy-policy`} style={link}>{isGerman ? 'Datenschutz' : 'Privacy policy'}</Link>
            <Link to={`/${lang}/terms-of-service`} style={link}>{isGerman ? 'AGB' : 'Terms of service'}</Link>
          </nav>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: 44, paddingTop: 22 }}>
          <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>© 2026 book.immo. All rights reserved.</p>
          <LanguageToggle />
        </div>
      </div>
      <style>{`
        @media (max-width: 809px) {
          .club-foot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .club-foot-grid > div:first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </footer>
  )
}
