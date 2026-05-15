import React, { useState } from 'react'

const STEPS = [
  {
    label: 'Search',
    sub: 'We find your match',
    price: '€49',
    features: [
      'Criteria profile setup (budget, type, zone)',
      'Real-time monitoring of all listing sources',
      'Instant match notifications',
      'Shortlist of best-fit properties',
      'Market comparison report',
    ],
    delivery: '24 – 48 h',
  },
  {
    label: 'Viewing Booking',
    sub: 'We secure your slot',
    price: '€79',
    features: [
      'Automatic slot request on your behalf',
      'Confirmation & calendar invite sent to you',
      'Priority access before public listings',
      'Rescheduling handled if needed',
      'Agent contact details provided',
    ],
    delivery: '1 – 3 days',
  },
  {
    label: 'Result',
    sub: 'We close the deal',
    price: '€129',
    features: [
      'Offer strategy & negotiation support',
      'Document checklist & guidance',
      'Liaison with notary or landlord',
      'Final walkthrough coordination',
      'Move-in confirmation',
    ],
    delivery: '1 – 2 weeks',
  },
]

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="8" fill="rgba(255,102,37,0.12)" />
    <path d="M5 8l2 2 4-4" stroke="rgb(255,102,37)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Pricing() {
  const [selected, setSelected] = useState(0)

  const step = STEPS[selected]
  const total = STEPS.slice(0, selected + 1).reduce((sum, s) => sum + parseInt(s.price.replace('€', '')), 0)

  return (
    <section id="pricing" style={{
      width: '100%',
      backgroundColor: 'rgb(245,245,245)',
      padding: '80px 40px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontSize: 40,
            fontWeight: 500,
            color: 'rgb(255,102,37)',
            margin: '0 0 12px',
            lineHeight: 1.2,
            letterSpacing: '-1px',
          }}>
            Pay as you progress
          </h2>
          <p style={{
            fontFamily: '"Lexend", sans-serif',
            fontSize: 16,
            fontWeight: 400,
            color: 'rgb(25,26,32)',
            margin: 0,
          }}>
            Three stages. Three installments. Only pay for what you've used.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

          {/* Left panel — step selector */}
          <div style={{
            width: 280,
            flexShrink: 0,
            backgroundColor: 'white',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(25,26,32,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {STEPS.map((s, i) => {
              const active = selected === i
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '22px 24px',
                    background: active ? 'rgb(25,26,32)' : 'none',
                    border: 'none',
                    borderBottom: i < STEPS.length - 1 ? '1px solid rgba(25,26,32,0.08)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: active ? 'rgb(255,102,37)' : 'rgb(255,102,37)',
                    }}>
                      {`0${i + 1}`}
                    </span>
                    <span style={{
                      fontFamily: '"Bricolage Grotesque", sans-serif',
                      fontSize: 20,
                      fontWeight: 600,
                      color: active ? 'white' : 'rgb(25,26,32)',
                    }}>
                      {s.price}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: active ? 'white' : 'rgb(25,26,32)',
                  }}>
                    {s.label}
                  </span>
                  <span style={{
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 12,
                    color: active ? 'rgba(255,255,255,0.5)' : 'rgba(25,26,32,0.45)',
                  }}>
                    {s.sub}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right panel — step details */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 16,
            border: '1px solid rgba(25,26,32,0.08)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgb(255,102,37)',
                margin: '0 0 4px',
              }}>
                Step {selected + 1} of 3
              </p>
              <p style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: 26,
                fontWeight: 600,
                color: 'rgb(25,26,32)',
                margin: 0,
                lineHeight: 1.2,
              }}>
                {step.label}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, marginBottom: 28 }}>
              {step.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {CHECK}
                  <span style={{
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 14,
                    color: 'rgb(25,26,32)',
                    lineHeight: 1.4,
                  }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 20,
              borderTop: '1px solid rgba(25,26,32,0.08)',
              marginBottom: 20,
            }}>
              <span style={{
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                color: 'rgba(25,26,32,0.5)',
              }}>
                Timeline
              </span>
              <span style={{
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgb(25,26,32)',
              }}>
                {step.delivery}
              </span>
            </div>

            {/* Total + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 12,
                  color: 'rgba(25,26,32,0.45)',
                  margin: '0 0 2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  This installment
                </p>
                <p style={{
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontSize: 28,
                  fontWeight: 600,
                  color: 'rgb(25,26,32)',
                  margin: 0,
                  lineHeight: 1,
                }}>
                  {step.price}
                </p>
              </div>
              <a href="./sign-up" style={{
                padding: '14px 28px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'rgb(255,102,37)',
                color: 'white',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                Get started
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
