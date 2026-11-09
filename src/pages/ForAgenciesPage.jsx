import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import Section0 from '../components/Section0.jsx'
import ClubFooter from '../components/ClubFooter.jsx'
import Variant1 from '../components/Variant1.jsx'

// Partner page for agencies. Same Framer presets as the homepage so type and colours match.

const ORANGE_VAR = "var(--token-5c28b080-63a4-416d-b638-2f3867ab529e, rgb(255, 102, 37))"
const ORANGE = 'rgb(255,102,37)'
const INK = 'rgb(25,26,32)'
const SOFT = 'rgba(25,26,32,0.62)'
const BORDER = '1px solid rgba(25,26,32,0.08)'
const CREAM = 'rgb(255,248,244)'
const FONT = '"Lexend", sans-serif'

const section = { width: '100%', alignSelf: 'stretch', padding: 'clamp(48px, 6vw, 72px) clamp(20px, 4vw, 40px)', boxSizing: 'border-box' }
const inner = { maxWidth: 1100, margin: '0 auto' }
const card = { borderRadius: 18, border: BORDER, backgroundColor: '#fff', padding: 'clamp(20px, 3vw, 28px)' }

function Button({ href, children, tone = 'dark' }) {
  const palette = {
    orange: { bg: ORANGE, color: '#fff', shadow: '0 10px 24px rgba(255,102,37,0.28)' },
    dark: { bg: INK, color: 'rgb(245,245,245)', shadow: 'none' },
    light: { bg: 'rgb(245,245,245)', color: INK, shadow: 'none' },
  }[tone]
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        padding: '0 26px',
        borderRadius: 14,
        backgroundColor: palette.bg,
        color: palette.color,
        boxShadow: palette.shadow,
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  )
}

function Label({ children, center = false, color = ORANGE }) {
  return (
    <p className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, color, textAlign: center ? 'center' : 'left' }}>
      {children}
    </p>
  )
}

function Hero() {
  const chips = ['Free listing', 'No contract', 'No exclusivity']
  return (
    <section className="ag-hero" style={{ ...section, paddingTop: 'clamp(124px, 14vw, 156px)', paddingBottom: 'clamp(40px, 6vw, 64px)', textAlign: 'center' }}>
      <div style={{ ...inner, maxWidth: 820 }}>
        <Label center>For agencies</Label>
        <h1 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center', marginTop: 16 }}>
          Verified tenants. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>Pay only for a signed lease.</span>
        </h1>
        <p style={{ margin: '20px auto 0', maxWidth: 560, fontFamily: FONT, fontSize: 'clamp(17px, 2vw, 19px)', lineHeight: 1.55, color: SOFT, textWrap: 'balance' }}>
          Two or three verified candidates per flat. We share only in the leases we close.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
          {chips.map((chip) => (
            <span key={chip} style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: INK, padding: '7px 14px', borderRadius: 999, backgroundColor: CREAM, border: '1px solid rgba(255,102,37,0.18)' }}>
              {chip}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
          <Button href="./agent-sign-up" tone="orange">Become a partner</Button>
          <Button href="mailto:hello@book.immo" tone="light">hello@book.immo</Button>
        </div>
      </div>
    </section>
  )
}

const COMPARE = [
  ['When you pay', 'Upfront: a subscription or a fee per listing', 'Only after a lease is signed with a candidate we introduced'],
  ['How much', 'A fixed monthly amount, often above €1,000 for a mid-sized agency', 'A share of the commission, agreed in writing first'],
  ['If there is no deal', 'You pay anyway', '€0'],
  ['What you get', 'Reach and a flood of unfiltered enquiries', 'Two or three verified candidates per flat'],
  ['Listing your flats', 'Paid', 'Free'],
  ['Commitment', 'Usually a 12-month contract', 'None, stop whenever you like'],
  ['Exclusivity', 'No', 'Not required: your flats stay on the portals'],
]

function Comparison() {
  return (
    <section style={{ ...section, backgroundColor: CREAM }}>
      <div style={inner}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center' }}>
            A portal sells reach. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>We sell the tenant.</span>
          </h2>
          <p style={{ margin: '14px auto 0', maxWidth: 520, fontFamily: FONT, fontSize: 17, lineHeight: 1.55, color: SOFT, textWrap: 'balance' }}>
            We do not replace the portals. We add a channel that costs nothing until it works.
          </p>
        </div>
        <div style={{ borderRadius: 18, border: BORDER, overflow: 'hidden', backgroundColor: '#fff' }}>
          <div className="ag-row ag-head" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', backgroundColor: INK }}>
            {['', 'Listing portal', 'book.immo'].map((label, index) => (
              <p key={index} className="framer-text framer-styles-preset-91ry8n" style={{ margin: 0, padding: '14px 20px', color: index === 2 ? ORANGE : 'rgb(245,245,245)' }}>{label || 'Compare'}</p>
            ))}
          </div>
          {COMPARE.map(([label, portal, club], index) => (
            <div key={label} className="ag-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', borderTop: index ? BORDER : 'none' }}>
              <p className="framer-text framer-styles-preset-ia5eoh ag-task" style={{ margin: 0, padding: '18px 20px', fontWeight: 600 }}>{label}</p>
              <p className="framer-text framer-styles-preset-ia5eoh ag-cell" data-label="Listing portal" style={{ margin: 0, padding: '18px 20px', color: SOFT }}>{portal}</p>
              <p className="framer-text framer-styles-preset-ia5eoh ag-cell ag-cell-win" data-label="book.immo" style={{ margin: 0, padding: '18px 20px', backgroundColor: CREAM }}>{club}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: '14px 0 0', fontFamily: FONT, fontSize: 13, lineHeight: 1.5, color: SOFT, textAlign: 'center' }}>
          Portal figures are our estimate from public data, not an official price list.
        </p>
      </div>
      <style>{`
        @media (max-width: 809px) {
          .ag-head { display: none !important; }
          .ag-row { grid-template-columns: minmax(0, 1fr) !important; padding: 18px 18px 16px; gap: 10px; }
          .ag-task { padding: 0 !important; font-size: 17px !important; }
          .ag-cell { padding: 0 !important; background: transparent !important; }
          .ag-cell::before {
            content: attr(data-label);
            display: block;
            margin-bottom: 4px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(25,26,32,0.45);
          }
          .ag-cell-win { padding: 12px 14px !important; background: rgb(255,248,244) !important; border-radius: 12px; }
          .ag-cell-win::before { color: rgb(255,102,37); }
        }
      `}</style>
    </section>
  )
}

const STEPS = [
  ['01', 'Written agreement first', 'Commission share, data protection and the right to stop, signed before the first candidate.'],
  ['02', 'You share the flat', 'Through our API, a file or e-mail. It stays on the portals; club members see it first.'],
  ['03', 'Two or three verified candidates', 'Each with a complete document pack and confirmed viewing slots. No raw enquiries.'],
  ['04', 'Viewing and contract stay with you', 'You run them exactly as today. We keep the candidate informed and on time.'],
  ['05', 'We invoice after you are paid', 'Only after the lease is signed and the owner has paid your commission.'],
]

function Steps() {
  return (
    <section style={section}>
      <div style={inner}>
        <div style={{ marginBottom: 36 }}>
          <Label>How it works</Label>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ marginTop: 14 }}>
            Five steps, <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>no surprises.</span>
          </h2>
        </div>
        <div className="ag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {STEPS.map(([n, title, text]) => (
            <div key={n} style={card}>
              <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', color: ORANGE }}>{n}</p>
              <p style={{ margin: '12px 0 0', fontFamily: FONT, fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: INK }}>{title}</p>
              <p style={{ margin: '8px 0 0', fontFamily: FONT, fontSize: 14.5, lineHeight: 1.55, color: SOFT }}>{text}</p>
            </div>
          ))}
          <div style={{ ...card, backgroundColor: INK, border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ORANGE }}>Why it is fair</p>
            <p style={{ margin: '12px 0 0', fontFamily: FONT, fontSize: 17, fontWeight: 500, lineHeight: 1.45, color: 'rgb(245,245,245)' }}>
              You keep most of the commission and carry no risk. No prepayment, no subscription, no volume commitment.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1000px) { .ag-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
        @media (max-width: 640px) { .ag-grid { grid-template-columns: minmax(0, 1fr) !important; } }
      `}</style>
    </section>
  )
}

const PACK = [
  ['Identity', 'Passport or ID, residence status where relevant'],
  ['Income', 'Pay slips or contract, checked against the rent'],
  ['Credit', 'Schufa or an equivalent report from the home country'],
  ['Profile', 'Household, move-in date, pets, smoking, employer'],
  ['Letter', 'A short introduction in your language, written for this flat'],
  ['Viewing', 'Confirmed slots within the next days'],
]

function Pack() {
  return (
    <section style={{ ...section, backgroundColor: CREAM }}>
      <div className="ag-two" style={{ ...inner, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'clamp(28px, 5vw, 56px)', alignItems: 'center' }}>
        <div>
          <Label>A verified candidate</Label>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ marginTop: 14 }}>
            The pack you chase for a week, <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>complete on day one.</span>
          </h2>
          <p style={{ margin: '18px 0 0', fontFamily: FONT, fontSize: 17, lineHeight: 1.55, color: SOFT }}>
            Every member is checked by the club before applying anywhere. You get the full pack with the first message, shared with the candidate&apos;s consent.
          </p>
        </div>
        <div style={card}>
          {PACK.map(([label, value], index) => (
            <div key={label} className="ag-pack-row" style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 16, borderTop: index ? BORDER : 'none', paddingTop: index ? 14 : 0, marginTop: index ? 14 : 0 }}>
              <span style={{ fontFamily: FONT, fontSize: 14.5, fontWeight: 600, color: INK }}>{label}</span>
              <span style={{ fontFamily: FONT, fontSize: 14.5, lineHeight: 1.5, color: SOFT }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 809px) {
          .ag-two { grid-template-columns: minmax(0, 1fr) !important; }
          .ag-pack-row { grid-template-columns: minmax(0, 1fr) !important; gap: 2px !important; }
        }
      `}</style>
    </section>
  )
}

const FAQ = [
  ['Do we have to give you exclusivity?', 'No. Your flats stay on every portal you use today. We only ask to see them early so members can apply first.'],
  ['Who runs the viewing and the contract?', 'You do, exactly as now. We prepare the candidate, confirm the slot and keep them on time.'],
  ['When do you invoice?', 'After the lease is signed and the owner has paid your commission. Never before.'],
  ['What about data protection?', 'Members consent to sharing their pack with the agency they apply to. We sign a data processing agreement with every partner.'],
  ['Can we stop?', 'At any time, with no notice period or penalty. Candidates already in a process are finished properly.'],
  ['How do we send you flats?', 'Through our API, a file export from your CRM or by e-mail. We set it up with you in a short call.'],
]

function Questions() {
  const [open, setOpen] = useState(0)
  return (
    <section style={section}>
      <div style={{ ...inner, maxWidth: 820 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center' }}>Questions agencies ask</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ.map(([q, a], index) => {
            const active = open === index
            return (
              <div key={q} style={{ backgroundColor: '#fff', borderRadius: 14, border: active ? '1px solid rgba(255,102,37,0.3)' : BORDER, overflow: 'hidden' }}>
                <button type="button" onClick={() => setOpen(active ? -1 : index)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: active ? ORANGE : INK }}>{q}</span>
                  <span style={{ fontFamily: FONT, fontSize: 22, color: ORANGE, lineHeight: 1, flexShrink: 0 }}>{active ? '−' : '+'}</span>
                </button>
                {active ? <p style={{ margin: 0, padding: '0 22px 20px', fontFamily: FONT, fontSize: 15, lineHeight: 1.6, color: SOFT }}>{a}</p> : null}
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
      <div style={{ ...inner, maxWidth: 720 }}>
        <h2 className="framer-text framer-styles-preset-utqn72" style={{ '--framer-text-alignment': 'center', '--framer-text-color': 'rgb(245,245,245)' }}>
          Give us one flat. <span className="framer-text" style={{ '--framer-text-color': ORANGE_VAR }}>See the candidates.</span>
        </h2>
        <p style={{ margin: '16px auto 0', maxWidth: 460, fontFamily: FONT, fontSize: 17, lineHeight: 1.55, color: 'rgba(245,245,245,0.72)', textWrap: 'balance' }}>
          A twenty-minute call is enough to agree the terms and connect your first listing.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <Button href="./agent-sign-up" tone="orange">Become a partner</Button>
          <Button href="mailto:hello@book.immo" tone="light">hello@book.immo</Button>
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
      <ClubFooter />
      <Variant1 />
    </div>
  )
}
