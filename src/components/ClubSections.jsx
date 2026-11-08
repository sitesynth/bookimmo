import React from 'react'

// Club content blocks that had no counterpart in the Framer template.
// Typography reuses the Framer presets so headings and copy match the rest of the page.

const ORANGE_VAR = "var(--token-5c28b080-63a4-416d-b638-2f3867ab529e, rgb(255, 102, 37))"
const INK = 'rgb(25,26,32)'
const BORDER = '1px solid rgba(25,26,32,0.08)'

const section = { width: '100%', padding: '80px 40px', boxSizing: 'border-box' }
const inner = { maxWidth: 1200, margin: '0 auto' }

function Button({ href, children, light = false }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 16px',
        borderRadius: 4,
        backgroundColor: light ? 'rgb(245,245,245)' : INK,
        color: light ? INK : 'rgb(245,245,245)',
        fontFamily: '"Lexend", sans-serif',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  )
}

const COMPARISON = [
  ['Find agencies and listings', 'Several portals and agency sites, different in every city', 'Partner agencies and all major portals in one place'],
  ['Write in the local language', 'You need the language or a translator', 'The AI writes each letter in the agency\'s language'],
  ['Collect the right documents', 'Unclear what is needed, and it differs per agency', 'One pack, checked once, valid for every club agency'],
  ['Apply', 'About an hour per flat', 'Minutes, automatically, for every matching flat'],
  ['Follow the conversation', 'E-mail, portal messengers, phone', 'One inbox with statuses'],
  ['See a flat before the crowd', 'Only what is already on the portals', 'Partner exclusives before they go public'],
]

function Comparison() {
  return (
    <section style={section}>
      <div style={inner}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center' }}>
            On your own. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>Or in the club.</span>
          </h2>
          <p className="framer-text framer-styles-preset-14npl34" style={{ '--framer-text-alignment': 'center', marginTop: 16 }}>
            Portals collect ads. The club does the work.
          </p>
        </div>
        <div style={{ borderRadius: 16, border: BORDER, overflow: 'hidden', backgroundColor: '#fff' }}>
          <div className="club-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', backgroundColor: INK }}>
            {['Task', 'On your own', 'In the club'].map((label) => (
              <p key={label} className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, padding: '14px 20px', color: 'rgb(245,245,245)' }}>{label}</p>
            ))}
          </div>
          {COMPARISON.map(([task, alone, club], index) => (
            <div key={task} className="club-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', borderTop: index ? BORDER : 'none' }}>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ margin: 0, padding: '18px 20px', fontWeight: 600 }}>{task}</p>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ margin: 0, padding: '18px 20px', color: 'rgba(25,26,32,0.62)' }}>{alone}</p>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ margin: 0, padding: '18px 20px', backgroundColor: 'rgb(255,248,244)' }}>{club}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 809px) { .club-row { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </section>
  )
}

const MEMBERSHIP_ROWS = [
  ['Month 1', 'Free, starts after verification'],
  ['Then', 'Flat monthly membership, cancel any time'],
  ['Success fee', 'None. Nothing depends on signing'],
  ['Ends', 'Automatically when you sign a lease'],
]

function Membership() {
  return (
    <section id="membership" style={{ ...section, backgroundColor: 'rgb(255,248,244)' }}>
      <div className="club-two" style={{ ...inner, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 48, alignItems: 'center' }}>
        <div>
          <h2 className="framer-text framer-styles-preset-utqn72">
            Free for the first month. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>No success fee, ever.</span>
          </h2>
          <p className="framer-text framer-styles-preset-14npl34" style={{ marginTop: 20 }}>
            Your free month starts once your documents are verified, no card required. After that the club runs on a flat monthly membership that ends the day you sign a lease. We never take a cut of your rent or a fee for finding you a flat.
          </p>
          <div style={{ marginTop: 28 }}>
            <Button href="./sign-up">Start verification</Button>
          </div>
        </div>
        <div style={{ borderRadius: 16, border: BORDER, backgroundColor: '#fff', padding: 28 }}>
          <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, color: 'rgb(255,102,37)' }}>Founding members</p>
          <p className="framer-text framer-styles-preset-14npl34" style={{ marginTop: 12, fontWeight: 500 }}>
            The first 25 verified members in each city lock in the founding price for as long as they stay.
          </p>
          {MEMBERSHIP_ROWS.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: BORDER, marginTop: 16, paddingTop: 16 }}>
              <span className="framer-text framer-styles-preset-ia5eoh" style={{ color: 'rgba(25,26,32,0.55)' }}>{label}</span>
              <span className="framer-text framer-styles-preset-ia5eoh" style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 809px) { .club-two { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </section>
  )
}

const AGENCY_POINTS = [
  ['Listing', 'Free. Your flats stay on the portals too, we ask for no exclusivity.'],
  ['You pay', 'Only after a lease is signed with a candidate we brought, and only after the owner has paid your commission.'],
  ['You receive', 'Two or three verified candidates per flat with a complete document pack, not a hundred raw enquiries.'],
  ['Commitment', 'No contract, no minimum volume. Stop whenever you like.'],
]

function Agencies() {
  const light = { '--framer-text-color': 'rgb(245,245,245)' }
  return (
    <section id="agencies" style={{ ...section, backgroundColor: INK }}>
      <div className="club-two" style={{ ...inner, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 48, alignItems: 'start' }}>
        <div>
          <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: '0 0 16px', color: 'rgb(255,102,37)' }}>For agencies</p>
          <h2 className="framer-text framer-styles-preset-utqn72" style={light}>
            Pay only when a lease is signed.
          </h2>
          <p className="framer-text framer-styles-preset-14npl34" style={{ ...light, marginTop: 20, opacity: 0.78 }}>
            Portals charge you every month whether a flat rents or not. The club brings you verified tenants and shares only in the deals it actually closes. Viewings and contracts stay with you, as always.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button href="./agent-sign-up" light>Become a partner agency</Button>
            <Button href="./for-agencies">How partnership works</Button>
            <a href="mailto:hello@book.immo" className="framer-text framer-styles-preset-ia5eoh" style={{ ...light, alignSelf: 'center', textDecoration: 'underline', textUnderlineOffset: 4 }}>hello@book.immo</a>
          </div>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', padding: 28 }}>
          {AGENCY_POINTS.map(([label, value], index) => (
            <div key={label} style={{ borderTop: index ? '1px solid rgba(255,255,255,0.12)' : 'none', paddingTop: index ? 18 : 0, marginTop: index ? 18 : 0 }}>
              <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, color: 'rgba(245,245,245,0.56)' }}>{label}</p>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ ...light, marginTop: 8 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ClubSections() {
  return (
    <>
      <Comparison />
      <Membership />
      <Agencies />
    </>
  )
}
