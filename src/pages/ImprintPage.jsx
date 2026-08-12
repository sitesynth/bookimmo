import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function ImprintPage() {
  const { pathname } = useLocation()
  const isGerman = pathname.startsWith('/de')

  return (
    <main style={{ minHeight: '100vh', background: '#fffaf5', color: '#191a20', fontFamily: '"Lexend", sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px 96px' }}>
        <Link to={isGerman ? '/de' : '/en'} style={{ color: '#191a20', textDecoration: 'none', fontWeight: 600 }}>
          BookImmo
        </Link>
        <p style={{ marginTop: 72, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.52)' }}>
          {isGerman ? 'Anbieterkennzeichnung' : 'Legal information'}
        </p>
        <h1 style={{ margin: '14px 0 28px', fontSize: 'clamp(42px, 7vw, 76px)', lineHeight: 1.02 }}>
          {isGerman ? 'Impressum' : 'Imprint'}
        </h1>
        <div style={{ maxWidth: 720, fontSize: 17, lineHeight: 1.7, color: 'rgba(25,26,32,0.72)' }}>
          <h2 style={{ color: '#191a20', fontSize: 26 }}>{isGerman ? 'Angaben zum Anbieter' : 'Provider information'}</h2>
          <p>
            <strong>Digihub OÜ</strong><br />
            Tartu mnt 65<br />
            10115 Tallinn<br />
            Estonia
          </p>
          <p>
            {isGerman ? 'Registrierungscode' : 'Registry code'}: 14274043<br />
            {isGerman ? 'Vertretungsberechtigtes Vorstandsmitglied' : 'Board member'}: Mikhail Aprosin
          </p>
          <p>
            E-Mail: <a href="mailto:hello@book.immo" style={{ color: 'inherit' }}>hello@book.immo</a><br />
            {isGerman ? 'Umsatzsteuer-Identifikationsnummer: nicht vorhanden' : 'VAT identification number: not registered'}
          </p>
          <h2 style={{ marginTop: 48, color: '#191a20', fontSize: 26 }}>{isGerman ? 'Verantwortlich für den Inhalt' : 'Responsible for content'}</h2>
          <p>Digihub OÜ, represented by Mikhail Aprosin.</p>
          <p style={{ marginTop: 56, fontSize: 14, color: 'rgba(25,26,32,0.56)' }}>
            {isGerman
              ? 'Bitte beachten Sie: Diese Anbieterkennzeichnung ersetzt keine individuelle Rechtsberatung. Angaben sollten vor dem produktiven Start rechtlich geprüft werden.'
              : 'This information is provided for transparency and should be reviewed by qualified counsel before production launch.'}
          </p>
        </div>
      </div>
    </main>
  )
}
