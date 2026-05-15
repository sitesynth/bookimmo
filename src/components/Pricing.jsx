import React, { useState, useEffect } from 'react'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

const STEPS = [
  {
    label: 'Matching',
    billing: '/ month',
    sub: 'Monthly subscription',
    price: '€49',
    features: [
      'Criteria profile setup (budget, type, zone)',
      'Real-time monitoring of all listing sources',
      'Instant match notifications',
      'Shortlist of best-fit properties',
      'Market comparison report',
    ],
    delivery: 'Ongoing — cancel anytime',
  },
  {
    label: 'Appointment',
    billing: 'per visit',
    sub: 'One-time, per booking',
    price: '€29',
    features: [
      'Automatic appointment request on your behalf',
      'Confirmation & calendar invite sent to you',
      'Priority access before public listings',
      'Rescheduling handled if visit falls through',
      'Agent contact details provided',
    ],
    delivery: 'Within 1 – 3 days',
  },
  {
    label: 'Success Fee',
    billing: 'on signing',
    sub: 'Only if you sign a lease',
    price: '€129',
    features: [
      'Paid only when your lease is signed',
      'Document checklist & signing guidance',
      'Liaison with landlord or notary',
      'Final walkthrough coordination',
      'Move-in confirmation support',
    ],
    delivery: 'Due on contract signature',
  },
]

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="8" fill="rgba(255,102,37,0.12)" />
    <path d="M5 8l2 2 4-4" stroke="rgb(255,102,37)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const DetailPanel = ({ step, selected }) => (
  <>
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'rgb(255,102,37)', margin: '0 0 4px',
      }}>
        Step {selected + 1} of 3
      </p>
      <p style={{
        fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 24,
        fontWeight: 600, color: 'rgb(25,26,32)', margin: 0, lineHeight: 1.2,
      }}>
        {step.label}
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1, marginBottom: 24 }}>
      {step.features.map((f, j) => (
        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {CHECK}
          <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgb(25,26,32)', lineHeight: 1.4 }}>
            {f}
          </span>
        </div>
      ))}
    </div>

    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 16, borderTop: '1px solid rgba(25,26,32,0.08)', marginBottom: 16,
    }}>
      <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.5)' }}>Timeline</span>
      <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, color: 'rgb(25,26,32)' }}>
        {step.delivery}
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: '"Lexend", sans-serif', fontSize: 11, color: 'rgba(25,26,32,0.45)',
          margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          This installment
        </p>
        <p style={{
          fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 28,
          fontWeight: 600, color: 'rgb(25,26,32)', margin: 0, lineHeight: 1,
        }}>
          {step.price}
        </p>
      </div>
      <a href="./sign-up" style={{
        padding: '13px 24px', borderRadius: 10, border: 'none',
        backgroundColor: 'rgb(255,102,37)', color: 'white',
        fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block',
      }}>
        Get started
      </a>
    </div>
  </>
)

export default function Pricing() {
  const [selected, setSelected] = useState(0)
  const isMobile = useIsMobile()
  const step = STEPS[selected]

  const heading = (
    <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 48 }}>
      <h2 style={{
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: isMobile ? 30 : 40,
        fontWeight: 500, color: 'rgb(255,102,37)',
        margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-2px',
      }}>
        Pay as you progress
      </h2>
      <p style={{
        fontFamily: '"Lexend", sans-serif', fontSize: isMobile ? 14 : 16,
        fontWeight: 400, color: 'rgb(25,26,32)', margin: 0,
      }}>
        Three stages. Three installments. Only pay for what you've used.
      </p>
    </div>
  )

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <section id="pricing" data-framer-appear-id="pricing-section" style={{
        width: '100%', backgroundColor: 'rgb(245,245,245)',
        padding: '60px 20px', boxSizing: 'border-box',
      }}>
        {heading}

        {/* Horizontal step tabs */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16,
          backgroundColor: 'white', borderRadius: 14,
          border: '1px solid rgba(25,26,32,0.08)', overflow: 'hidden',
        }}>
          {STEPS.map((s, i) => {
            const active = selected === i
            return (
              <button key={i} onClick={() => setSelected(i)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 8px',
                minHeight: 96,
                background: active ? 'rgb(25,26,32)' : 'none',
                border: 'none',
                borderRight: i < STEPS.length - 1 ? '1px solid rgba(25,26,32,0.08)' : 'none',
                cursor: 'pointer', transition: 'background 0.2s',
              }}>
                {/* top: number + label */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'rgb(255,102,37)',
                  }}>
                    {`0${i + 1}`}
                  </span>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif', fontSize: 11, fontWeight: 600,
                    color: active ? 'white' : 'rgb(25,26,32)',
                    textAlign: 'center', lineHeight: 1.3,
                  }}>
                    {s.label}
                  </span>
                </div>
                {/* bottom: price always pinned */}
                <span style={{
                  fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 17, fontWeight: 600,
                  color: active ? 'rgba(255,255,255,0.9)' : 'rgb(25,26,32)',
                  marginTop: 6,
                }}>
                  {s.price}
                </span>
              </button>
            )
          })}
        </div>

        {/* Detail card */}
        <div style={{
          backgroundColor: 'white', borderRadius: 16,
          border: '1px solid rgba(25,26,32,0.08)',
          padding: '24px 20px', display: 'flex', flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          <DetailPanel step={step} selected={selected} />
        </div>
      </section>
    )
  }

  /* ── DESKTOP ── */
  return (
    <section id="pricing" data-framer-appear-id="pricing-section" style={{
      width: '100%', backgroundColor: 'rgb(245,245,245)',
      padding: '80px 40px', boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {heading}

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

          {/* Left panel */}
          <div style={{
            width: 280, flexShrink: 0, backgroundColor: 'white',
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(25,26,32,0.08)',
            display: 'flex', flexDirection: 'column',
          }}>
            {STEPS.map((s, i) => {
              const active = selected === i
              return (
                <button key={i} onClick={() => setSelected(i)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-start', gap: 4, padding: '22px 24px',
                  background: active ? 'rgb(25,26,32)' : 'none', border: 'none',
                  borderBottom: i < STEPS.length - 1 ? '1px solid rgba(25,26,32,0.08)' : 'none',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
                }}>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgb(255,102,37)',
                  }}>
                    {`0${i + 1}`}
                  </span>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 600,
                    color: active ? 'white' : 'rgb(25,26,32)',
                  }}>
                    {s.label}
                  </span>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif', fontSize: 11,
                    color: active ? 'rgba(255,255,255,0.45)' : 'rgba(25,26,32,0.4)',
                  }}>
                    {s.sub}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                    <span style={{
                      fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 22,
                      fontWeight: 600, color: active ? 'white' : 'rgb(25,26,32)',
                    }}>
                      {s.price}
                    </span>
                    <span style={{
                      fontFamily: '"Lexend", sans-serif', fontSize: 11,
                      color: active ? 'rgba(255,255,255,0.45)' : 'rgba(25,26,32,0.4)',
                    }}>
                      {s.billing}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right panel */}
          <div style={{
            flex: 1, backgroundColor: 'white', borderRadius: 16,
            border: '1px solid rgba(25,26,32,0.08)',
            padding: '32px 28px', display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
          }}>
            <DetailPanel step={step} selected={selected} />
          </div>

        </div>
      </div>
    </section>
  )
}
