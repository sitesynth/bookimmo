import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import Section0 from '../components/Section0.jsx'
import Footer from '../components/Footer.jsx'
import Variant1 from '../components/Variant1.jsx'

// Partner page for agencies. Same Framer presets as the homepage so type and colours match.

const ORANGE_VAR = "var(--token-5c28b080-63a4-416d-b638-2f3867ab529e, rgb(255, 102, 37))"
const ORANGE = 'rgb(255,102,37)'
const INK = 'rgb(25,26,32)'
const SOFT = 'rgba(25,26,32,0.62)'
const BORDER = '1px solid rgba(25,26,32,0.08)'
const CREAM = 'rgb(255,248,244)'

const section = { width: '100%', padding: '80px 40px', boxSizing: 'border-box' }
const inner = { maxWidth: 1200, margin: '0 auto' }
const card = { borderRadius: 16, border: BORDER, backgroundColor: '#fff', padding: 28 }

function Button({ href, children, light = false, orange = false }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 18px',
        borderRadius: 4,
        backgroundColor: orange ? ORANGE : light ? 'rgb(245,245,245)' : INK,
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

function Label({ children, color = ORANGE }) {
  return <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, color }}>{children}</p>
}

function Hero() {
  return (
    <section className="ag-hero" style={{ ...section, padding: '150px 40px 72px', textAlign: 'center' }}>
      <div style={{ ...inner, maxWidth: 880 }}>
        <Label>For agencies</Label>
        <h1 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center', marginTop: 16 }}>
          Verified tenants. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>Pay only for a signed lease.</span>
        </h1>
        <p className="framer-text framer-styles-preset-14npl34" style={{ '--framer-text-alignment': 'center', marginTop: 20 }}>
          Portals charge you upfront whether a flat rents or not. The club brings you two or three verified candidates per flat and shares only in the deals it actually closes. Listing is free, there is no contract and we do not ask for exclusivity.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
          <Button href="./agent-sign-up" orange>Become a partner</Button>
          <Button href="mailto:hello@book.immo" light>hello@book.immo</Button>
        </div>
      </div>
      <style>{`@media (max-width: 809px) { .ag-hero { padding: 130px 24px 56px !important; } }`}</style>
    </section>
  )
}

const COMPARE = [
  ['When you pay', 'Upfront: a monthly subscription or a fee per listing', 'Only after a lease is signed with a candidate we introduced'],
  ['How much', 'A fixed monthly amount, on average above €1,000 per month for a mid-sized agency', 'A share of the commission, agreed in writing before the first candidate'],
  ['If there is no deal', 'You pay anyway', '€0'],
  ['What you get', 'Reach, and a flood of unfiltered enquiries', 'Two or three verified candidates per flat'],
  ['Listing your flats', 'Paid', 'Free'],
  ['Commitment', 'Usually a 12-month contract', 'None. Stop whenever you like'],
  ['Exclusivity', 'No', 'Not required: your flats stay on the portals'],
]

function Comparison() {
  return (
    <section style={{ ...section, backgroundColor: CREAM }}>
      <div style={inner}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center' }}>
            A portal sells reach. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>We sell the tenant.</span>
          </h2>
          <p className="framer-text framer-styles-preset-14npl34" style={{ '--framer-text-alignment': 'center', marginTop: 16 }}>
            We do not replace the portals. We add a channel that costs nothing until it works.
          </p>
        </div>
        <div style={{ borderRadius: 16, border: BORDER, overflow: 'hidden', backgroundColor: '#fff' }}>
          <div className="ag-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', backgroundColor: INK }}>
            {['', 'Listing portal', 'book.immo'].map((label, index) => (
              <p key={index} className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, padding: '14px 20px', color: index === 2 ? ORANGE : 'rgb(245,245,245)' }}>{label || 'Compare'}</p>
            ))}
          </div>
          {COMPARE.map(([label, portal, club], index) => (
            <div key={label} className="ag-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', borderTop: index ? BORDER : 'none' }}>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ margin: 0, padding: '18px 20px', fontWeight: 600 }}>{label}</p>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ margin: 0, padding: '18px 20px', color: SOFT }}>{portal}</p>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ margin: 0, padding: '18px 20px', backgroundColor: CREAM }}>{club}</p>
            </div>
          ))}
        </div>
        <p className="framer-text framer-styles-preset-ia5eoh" style={{ marginTop: 14, color: SOFT }}>
          Portal figures are our estimate from public data, not an official price list.
        </p>
      </div>
      <style>{`@media (max-width: 809px) { .ag-row { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </section>
  )
}

const STEPS = [
  ['01', 'A written agreement first', 'Before you see a single candidate we sign a short partnership agreement: the commission share, data protection, and the right to stop at any time.'],
  ['02', 'You share the flat', 'Send us a flat the way you prefer: through our API, as a file, or simply by e-mail. It stays on the portals as usual. Club members see it first.'],
  ['03', 'We bring two or three verified candidates', 'Each comes with a complete document pack, a letter in your language and confirmed availability for viewings. No raw enquiries.'],
  ['04', 'Viewing and contract stay with you', 'You run the viewing and the contract exactly as you do today. We keep the candidate informed and on time.'],
  ['05', 'We invoice after you were paid', 'Our share is invoiced only after the lease is signed and the owner has paid your commission. If there is no deal, there is nothing to pay.'],
]

function Steps() {
  return (
    <section style={section}>
      <div style={inner}>
        <div style={{ marginBottom: 40, maxWidth: 760 }}>
          <Label>How it works in practice</Label>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ marginTop: 16 }}>
            Five steps, <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>no surprises.</span>
          </h2>
        </div>
        <div className="ag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
          {STEPS.map(([n, title, text]) => (
            <div key={n} style={card}>
              <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, color: ORANGE }}>{n}</p>
              <p className="framer-text framer-styles-preset-14npl34" style={{ marginTop: 10, fontWeight: 500 }}>{title}</p>
              <p className="framer-text framer-styles-preset-ia5eoh" style={{ marginTop: 10, color: SOFT }}>{text}</p>
            </div>
          ))}
          <div style={{ ...card, backgroundColor: INK, border: 'none' }}>
            <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, color: ORANGE }}>Why it is fair</p>
            <p className="framer-text framer-styles-preset-14npl34" style={{ '--framer-text-color': 'rgb(245,245,245)', marginTop: 10 }}>
              You keep most of the commission and carry no risk: no prepayment, no subscription, no volume commitment. We earn only when you do.
            </p>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 1000px) { .ag-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } } @media (max-width: 640px) { .ag-grid { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </section>
  )
}

const PACK = [
  ['Identity', 'Passport or ID card, residence status where relevant'],
  ['Income', 'Pay slips or contract, income checked against the rent'],
  ['Credit', 'Schufa or an equivalent report from the home country'],
  ['Self-disclosure', 'Household, move-in date, pets, smoking, employer'],
  ['Letter', 'A short introduction in your language, written for this flat'],
  ['Availability', 'Confirmed slots for a viewing within the next days'],
]

function Pack() {
  return (
    <section style={{ ...section, backgroundColor: CREAM }}>
      <div className="ag-two" style={{ ...inner, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 48, alignItems: 'center' }}>
        <div>
          <Label>What a verified candidate means</Label>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ marginTop: 16 }}>
            The pack you usually chase for a week, <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>complete on day one.</span>
          </h2>
          <p className="framer-text framer-styles-preset-14npl34" style={{ marginTop: 20 }}>
            Every member is checked by the club before they can apply anywhere. You receive the full pack with the first message, with the candidate&apos;s consent to share it with you.
          </p>
        </div>
        <div style={card}>
          {PACK.map(([label, value], index) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, borderTop: index ? BORDER : 'none', paddingTop: index ? 14 : 0, marginTop: index ? 14 : 0 }}>
              <span className="framer-text framer-styles-preset-ia5eoh" style={{ fontWeight: 600 }}>{label}</span>
              <span className="framer-text framer-styles-preset-ia5eoh" style={{ color: SOFT }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 809px) { .ag-two { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </section>
  )
}

const FAQ = [
  ['Do we have to give you exclusivity?', 'No. Your flats stay on every portal you use today. We only ask to see them early so members can apply before the crowd.'],
  ['Who runs the viewing and the contract?', 'You do, exactly as now. We prepare the candidate, confirm the slot and keep them on time.'],
  ['When do you invoice?', 'After the lease is signed and after the owner has paid your commission. Never before.'],
  ['What about data protection?', 'Members consent to sharing their pack with the agency they apply to. We sign a data processing agreement with every partner on request.'],
  ['Can we stop?', 'At any time, without notice periods or penalties. Candidates already in a process are finished properly.'],
  ['How do we send you flats?', 'Through our API, as a file export from your CRM, or by e-mail. We set it up with you in a short call.'],
]

function Questions() {
  const [open, setOpen] = React.useState(0)
  return (
    <section style={section}>
      <div style={{ ...inner, maxWidth: 860 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center' }}>Questions agencies ask</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ.map(([q, a], index) => {
            const active = open === index
            return (
              <div key={q} style={{ backgroundColor: '#fff', borderRadius: 12, border: active ? '1px solid rgba(255,102,37,0.3)' : BORDER, overflow: 'hidden' }}>
                <button type="button" onClick={() => setOpen(active ? -1 : index)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16, padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 600, color: active ? ORANGE : INK }}>{q}</span>
                  <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 20, color: ORANGE, lineHeight: 1 }}>{active ? '−' : '+'}</span>
                </button>
                {active ? <p style={{ margin: 0, padding: '0 24px 20px', fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.7, color: SOFT }}>{a}</p> : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section style={{ ...section, backgroundColor: INK, textAlign: 'center' }}>
      <div style={{ ...inner, maxWidth: 760 }}>
        <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center', '--framer-text-color': 'rgb(245,245,245)' }}>
          Give us one flat. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>See the candidates.</span>
        </h2>
        <p className="framer-text framer-styles-preset-14npl34" style={{ '--framer-text-alignment': 'center', '--framer-text-color': 'rgba(245,245,245,0.75)', marginTop: 18 }}>
          A twenty-minute call is enough to agree the terms and connect your first listing.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
          <Button href="./agent-sign-up" orange>Become a partner</Button>
          <Button href="mailto:hello@book.immo" light>hello@book.immo</Button>
        </div>
      </div>
    </section>
  )
}

export default function ForAgenciesPage() {
  useFramerAppear()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div
      className="framer-f8vvx framer-HOibb framer-77SxD framer-Sscx1 framer-YPkpu framer-43ZH4 framer-KnW9u framer-rEghC framer-72rtr7"
      style={{ minHeight: '100vh', width: 'auto' }}
    >
      <SvgSprites />
      <Section0 />
      <Hero />
      <Comparison />
      <Steps />
      <Pack />
      <Questions />
      <Closing />
      <Footer />
      <Variant1 />
    </div>
  )
}
